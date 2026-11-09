#!/usr/bin/env python3
"""Pull plate holes and strip-feeder outlines out of the STEP files in ref/.

Writes src/geometry.json. Feeder coordinates are in each part's STEP frame:
+X across the lanes, +Y along the tape, origin on the hole grid. Plate
coordinates are the staging-plate frame: origin at the plate's bottom-left,
+X right, +Y toward the back of the machine. Units are millimetres.
"""

import collections
import json
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
REF = os.path.join(ROOT, "ref")
OUT = os.path.join(ROOT, "src", "geometry.json")

# Tape width -> number of lanes, from the feeder models.
LANES = {"8": 3, "12": 3, "16": 2, "24": 1, "32": 1}

# Mounting holes are the ~6mm bores. Larger cylinders are countersinks or the
# camera cutout, and are not screw locations.
MOUNT_RADIUS = (2.5, 3.5)


def load(path):
    text = open(path, errors="ignore").read().replace("\n", "")
    return dict(re.findall(r"#(\d+)\s*=\s*([^;]*);", text))


def point(ents, index):
    match = re.search(
        r"\(\s*([-\d.E+]+)\s*,\s*([-\d.E+]+)\s*,\s*([-\d.E+]+)\s*\)",
        ents[index],
    )
    return tuple(float(v) for v in match.groups())


def vertices(ents):
    pts = []
    for value in ents.values():
        if value.startswith("VERTEX_POINT"):
            pts.append(point(ents, re.findall(r"#(\d+)", value)[0]))
    return pts


def cylinders(ents):
    found = []
    for value in ents.values():
        if not value.startswith("CYLINDRICAL_SURFACE"):
            continue
        radius = float(value.split(",")[-1].strip(" )"))
        axis = ents[re.findall(r"#(\d+)", value)[0]]
        refs = re.findall(r"#(\d+)", axis)
        origin, direction = point(ents, refs[0]), point(ents, refs[1])
        found.append((radius, origin, direction))
    return found


def round2(value):
    return round(value, 2)


def mounting_holes(ents):
    """(x, y) of vertical mounting bores, deduped. Both ends of a slot count."""
    holes = []
    for radius, origin, direction in cylinders(ents):
        if not MOUNT_RADIUS[0] <= radius <= MOUNT_RADIUS[1]:
            continue
        if abs(abs(direction[2]) - 1) > 1e-3:
            continue
        holes.append((round2(origin[0]), round2(origin[1])))
    return sorted(set(holes))


def slots_from_holes(holes):
    """Group hole columns that form one obround slot (32mm feeders).

    A slot is modeled as two cylinders a few millimetres apart. Columns
    closer than 6mm belong to the same slot; everyone else gets a point hole.
    """
    columns = sorted(set(x for x, _ in holes))
    rows = sorted(set(y for _, y in holes))
    groups = []
    for x in columns:
        if groups and x - groups[-1][1] <= 6:
            groups[-1][1] = x
        else:
            groups.append([x, x])
    return [{"x0": a, "x1": b, "rows": rows} for a, b in groups]


def feeder_geometry(width):
    ents = load(os.path.join(REF, f"{width}mm-strip-feeder.step"))
    pts = vertices(ents)
    xs, ys = [p[0] for p in pts], [p[1] for p in pts]
    holes = mounting_holes(ents)
    return {
        "width": int(width),
        "lanes": LANES[width],
        "outline": {
            "x0": round2(min(xs)),
            "y0": round2(min(ys)),
            "x1": round2(max(xs)),
            "y1": round2(max(ys)),
        },
        "holes": [[x, y] for x, y in holes],
        "slots": slots_from_holes(holes),
    }


def plate_geometry():
    ents = load(os.path.join(REF, "staging-plate-offcenter.step"))
    pts = vertices(ents)
    xs, ys = [p[0] for p in pts], [p[1] for p in pts]
    holes = []
    camera = None
    for radius, origin, direction in cylinders(ents):
        if abs(abs(direction[2]) - 1) > 1e-3:
            continue
        if radius >= 20:
            camera = {"x": round2(origin[0]), "y": round2(origin[1]), "r": round2(radius)}
        elif 1 <= radius <= 2:
            holes.append((round2(origin[0]), round2(origin[1])))
    holes = sorted(set(holes))
    return {
        "width": round2(max(xs) - min(xs)),
        "height": round2(max(ys) - min(ys)),
        "camera": camera,
        "holes": [[x, y] for x, y in holes],
        "lattice": lattice_rule(holes),
    }


def lattice_rule(holes):
    """The holes sit on a 15mm lattice with a 15mm stagger.

    A point (x, y) is on the lattice when both are multiples of 15 and
    (x + y) is a multiple of 30. The measured plate is missing holes around
    the camera, so callers should use these measured holes up to the top of
    the plate and generate the lattice above it.
    """
    xs = sorted(set(x for x, _ in holes))
    ys = sorted(set(y for _, y in holes))
    return {
        "pitch": 15,
        "xMin": xs[0],
        "xMax": xs[-1],
        "yMin": ys[0],
        "yMax": ys[-1],
    }


def main():
    feeders = {width: feeder_geometry(width) for width in ("8", "12", "16", "24", "32")}
    geometry = {"units": "mm", "plate": plate_geometry(), "feeders": feeders}
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, "w") as fh:
        json.dump(geometry, fh, indent=2)
        fh.write("\n")
    plate = geometry["plate"]
    print(f"plate holes: {len(plate['holes'])} camera: {plate['camera']}")
    for width, feeder in feeders.items():
        box = feeder["outline"]
        print(
            f"{width}mm lanes={feeder['lanes']} "
            f"outline=({box['x0']},{box['y0']})-({box['x1']},{box['y1']}) "
            f"holes={len(feeder['holes'])} slots={feeder['slots']}"
        )


if __name__ == "__main__":
    main()
