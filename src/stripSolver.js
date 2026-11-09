import { PLATES, WIDTHS, config, notchRect, workRect } from "./config.js"

const ROTATIONS = [0, 90]

// Plate and feeder coordinates are exact to 0.01mm, so a hundredth of a
// millimetre is a safe match tolerance.
function key(x, y) {
  return `${Math.round(x * 100)},${Math.round(y * 100)}`
}

export function rotateLocal(x, y, rot) {
  if (rot === 90) return [-y, x]
  if (rot === 180) return [-x, -y]
  if (rot === 270) return [y, -x]
  return [x, y]
}

export function rectsOverlap(a, b) {
  return a.x0 < b.x1 && a.x1 > b.x0 && a.y0 < b.y1 && a.y1 > b.y0
}

function rectContains(outer, inner) {
  return inner.x0 >= outer.x0 && inner.y0 >= outer.y0 && inner.x1 <= outer.x1 && inner.y1 <= outer.y1
}

// Measured holes on the staging plate, then the same staggered lattice on
// the build plates above it. Each plate keeps a 15mm margin, so a row that
// lands on a plate edge is left out. The camera cutout is already missing
// from the measured set.
export function buildPlateHoles(geometry) {
  const holes = geometry.plate.holes.map(([x, y]) => [x, y])
  const { pitch, xMin, xMax, yMax } = geometry.plate.lattice
  const edges = new Set([0, ...PLATES.map((plate) => plate.y + plate.height)])
  const top = PLATES[PLATES.length - 1].y + PLATES[PLATES.length - 1].height
  for (let y = yMax + pitch; y < top; y += pitch) {
    if (edges.has(y)) continue
    for (let x = xMin; x <= xMax; x += pitch) {
      if ((x + y) % (pitch * 2) === 0) holes.push([x, y])
    }
  }
  return holes
}

function placementBox(feeder, rot, tx, ty) {
  const { x0, y0, x1, y1 } = feeder.outline
  const corners = [
    [x0, y0],
    [x1, y0],
    [x1, y1],
    [x0, y1],
  ].map(([x, y]) => {
    const [rx, ry] = rotateLocal(x, y, rot)
    return [rx + tx, ry + ty]
  })
  const xs = corners.map((c) => c[0])
  const ys = corners.map((c) => c[1])
  return { x0: Math.min(...xs), y0: Math.min(...ys), x1: Math.max(...xs), y1: Math.max(...ys) }
}

export function countScrews(feeder, rot, tx, ty, holeSet) {
  let screws = 0
  for (const [x, y] of feeder.holes) {
    const [rx, ry] = rotateLocal(x, y, rot)
    if (holeSet.has(key(rx + tx, ry + ty))) screws += 1
  }
  return screws
}

function footprintArea(feeder) {
  const { x0, y0, x1, y1 } = feeder.outline
  return (x1 - x0) * (y1 - y0)
}

function insideFree(box, work, notch, blocked) {
  if (!rectContains(work, box)) return false
  if (rectsOverlap(box, notch)) return false
  return !blocked.some((rect) => rectsOverlap(box, rect))
}

// Every rigid pose where a feeder hole center lands on a plate hole.
// 32mm slots are stored as both end centers, so the two alignments 4.5mm
// apart both show up here.
export function feederCandidates(feeder, holes, holeSet, work, notch, blocked, minScrews) {
  const found = []
  for (const rot of ROTATIONS) {
    const local = feeder.holes.map(([x, y]) => rotateLocal(x, y, rot))
    const seen = new Set()
    for (const [hx, hy] of local) {
      for (const [px, py] of holes) {
        const tx = px - hx
        const ty = py - hy
        const id = `${Math.round(tx * 100)}:${Math.round(ty * 100)}`
        if (seen.has(id)) continue
        seen.add(id)
        const screws = countScrews(feeder, rot, tx, ty, holeSet)
        if (screws < minScrews) continue
        const box = placementBox(feeder, rot, tx, ty)
        if (!insideFree(box, work, notch, blocked)) continue
        found.push({ rot, tx, ty, screws, ...box })
      }
    }
  }
  // Upright (tape running front to back) comes before a 90° pose, then
// low and to the left so the pack starts at the front of the plate.
found.sort((a, b) => a.rot - b.rot || a.y0 - b.y0 || a.x0 - b.x0)
  return found
}

function expand(rect, margin) {
  if (!rect || margin === 0) return rect
  return {
    x0: rect.x0 - margin,
    y0: rect.y0 - margin,
    x1: rect.x1 + margin,
    y1: rect.y1 + margin,
  }
}

export function solveStrips(leftover, pcbRect, geometry, options = config, existing = []) {
  const area = options.workArea
  const holes = buildPlateHoles(geometry, area)
  const holeSet = new Set(holes.map(([x, y]) => key(x, y)))
  const work = workRect(area)
  const notch = notchRect(area)
  const blocked = pcbRect ? [expand(pcbRect, options.pcbMargin)] : []
  const minScrews = options.minScrews

  const feeders = {}
  const candidates = {}
  const remaining = {}
  for (const width of WIDTHS) {
    feeders[width] = geometry.feeders[String(width)]
    remaining[width] = whole(leftover?.[width] ?? leftover?.[String(width)])
    candidates[width] = feederCandidates(
      feeders[width],
      holes,
      holeSet,
      work,
      notch,
      blocked,
      minScrews
    )
  }

  // Keep feeders already on the plate. Drop extras from the end when a
  // width needs fewer, and never slide the ones that stay.
  const placed = []
  for (const placement of existing) {
    const feeder = feeders[placement.width]
    if (!feeder || remaining[placement.width] <= 0) continue
    placed.push(placement)
    remaining[placement.width] = Math.max(0, remaining[placement.width] - feeder.lanes)
  }

  const areaOf = {}
  for (const width of WIDTHS) areaOf[width] = footprintArea(feeders[width])

  while (true) {
    const open = WIDTHS.filter((width) => remaining[width] > 0)
    if (open.length === 0) break
    open.sort((a, b) => {
      const score = (width) => Math.min(feeders[width].lanes, remaining[width]) / areaOf[width]
      return score(b) - score(a) || a - b
    })

    let didPlace = false
    for (const width of open) {
      const spot = candidates[width].find((candidate) =>
        placed.every((other) => !rectsOverlap(other, candidate))
      )
      if (!spot) continue
      placed.push({
        width,
        lanes: feeders[width].lanes,
        rot: spot.rot,
        tx: spot.tx,
        ty: spot.ty,
        screws: spot.screws,
        x0: spot.x0,
        y0: spot.y0,
        x1: spot.x1,
        y1: spot.y1,
      })
      remaining[width] = Math.max(0, remaining[width] - feeders[width].lanes)
      didPlace = true
      break
    }
    if (!didPlace) break
  }

  return { placements: placed, unallocated: remaining }
}

// Valid poses for one feeder, ignoring itself. Rotation stays put, so an
// upright feeder keeps running front to back while it is dragged.
export function stripSpots(placement, others, pcbRect, geometry, options = config) {
  const feeder = geometry.feeders[String(placement.width)]
  const area = options.workArea
  const holes = buildPlateHoles(geometry, area)
  const holeSet = new Set(holes.map(([x, y]) => key(x, y)))
  const blocked = others.map((other) => ({ x0: other.x0, y0: other.y0, x1: other.x1, y1: other.y1 }))
  if (pcbRect) blocked.push(expand(pcbRect, options.pcbMargin))
  return feederCandidates(
    feeder,
    holes,
    holeSet,
    workRect(area),
    notchRect(area),
    blocked,
    options.minScrews
  ).filter((spot) => spot.rot === placement.rot)
}

export function nearestStrip(placement, spots, point) {
  if (!spots.length) return placement
  let best = spots[0]
  let bestDistance = Infinity
  for (const spot of spots) {
    const dx = (spot.x0 + spot.x1) / 2 - point.x
    const dy = (spot.y0 + spot.y1) / 2 - point.y
    const distance = dx * dx + dy * dy
    if (distance < bestDistance) {
      best = spot
      bestDistance = distance
    }
  }
  return {
    ...placement,
    rot: best.rot,
    tx: best.tx,
    ty: best.ty,
    screws: best.screws,
    x0: best.x0,
    y0: best.y0,
    x1: best.x1,
    y1: best.y1,
  }
}

export function snapStrip(placement, point, others, pcbRect, geometry, options = config) {
  return nearestStrip(placement, stripSpots(placement, others, pcbRect, geometry, options), point)
}

function whole(value) {
  const n = Math.floor(Number(value))
  return Number.isFinite(n) && n > 0 ? n : 0
}
