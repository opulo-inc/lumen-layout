// KiCad's "plot to DXF" export: LINE and CIRCLE entities, units in $INSUNITS.
// Closed loops are the outlines of filled shapes (traces, mask openings, silk).

const TOP = {
  outline: /edge.?cuts/,
  copper: /(?:^|[^a-z])f[._-]cu\./,
  mask: /(?:^|[^a-z])f[._-]mask\./,
  silk: /(?:^|[^a-z])f[._-]silk/,
}

export function dxfRole(name) {
  const base = name.split("/").pop().toLowerCase()
  for (const role of ["outline", "copper", "mask", "silk"]) {
    if (TOP[role].test(base)) return role
  }
  return null
}

function unitsFrom(insunits, measurement) {
  if (insunits === 1) return { units: "in", explicit: true }
  if (insunits === 4) return { units: "mm", explicit: true }
  if (insunits === 5) return { units: "mm", explicit: true, scale: 10 }
  if (insunits === 6) return { units: "mm", explicit: true, scale: 1000 }
  if (measurement === 1) return { units: "mm", explicit: false }
  return { units: "in", explicit: false }
}

export function parseDxf(text) {
  const rows = text.split(/\r?\n/)
  let section = ""
  let expect = null
  let insunits = null
  let measurement = null
  let kind = null
  let rec = null
  const lines = []
  const circles = []

  const flush = () => {
    if (kind === "LINE" && rec && [rec[10], rec[20], rec[11], rec[21]].every(Number.isFinite)) {
      lines.push({ x0: rec[10], y0: rec[20], x1: rec[11], y1: rec[21] })
    } else if (kind === "CIRCLE" && rec && [rec[10], rec[20], rec[40]].every((n) => Number.isFinite(n) && n !== undefined)) {
      if (rec[40] > 0) circles.push({ x: rec[10], y: rec[20], r: rec[40] })
    }
    kind = null
    rec = null
  }

  for (let i = 0; i + 1 < rows.length; i += 2) {
    const code = rows[i].trim()
    const value = rows[i + 1].trim()
    if (expect && code === "70") {
      const n = Number(value)
      if (expect === "ins") insunits = n
      else measurement = n
      expect = null
      continue
    }
    expect = null
    if (code === "0") {
      if (section === "ENTITIES") flush()
      if (section === "ENTITIES" && (value === "LINE" || value === "CIRCLE")) {
        kind = value
        rec = {}
      }
      if (value === "ENDSEC") section = ""
      continue
    }
    if (code === "2" && (value === "HEADER" || value === "ENTITIES")) {
      section = value
      continue
    }
    if (section === "HEADER" && code === "9") {
      if (value === "$INSUNITS") expect = "ins"
      else if (value === "$MEASUREMENT") expect = "meas"
      continue
    }
    if (rec && (code === "10" || code === "20" || code === "11" || code === "21" || code === "40")) {
      rec[code] = Number(value)
    }
  }
  flush()

  const units = unitsFrom(insunits, measurement)
  const scale = units.scale ?? 1
  if (scale !== 1) {
    for (const line of lines) {
      line.x0 *= scale
      line.y0 *= scale
      line.x1 *= scale
      line.y1 *= scale
    }
    for (const circle of circles) {
      circle.x *= scale
      circle.y *= scale
      circle.r *= scale
    }
  }
  return { lines, circles, units: units.units, explicit: units.explicit }
}

// Endpoints match to 0.0001 of a file unit. KiCad writes each shared corner twice.
function chains(lines) {
  const key = (x, y) => `${Math.round(x * 100)},${Math.round(y * 100)}`
  const adj = new Map()
  const add = (k, i) => {
    let list = adj.get(k)
    if (!list) adj.set(k, (list = []))
    list.push(i)
  }
  for (let i = 0; i < lines.length; i++) {
    add(key(lines[i].x0, lines[i].y0), i)
    add(key(lines[i].x1, lines[i].y1), i)
  }
  const used = new Uint8Array(lines.length)
  const out = []
  for (let i = 0; i < lines.length; i++) {
    if (used[i]) continue
    used[i] = 1
    const pts = [
      [lines[i].x0, lines[i].y0],
      [lines[i].x1, lines[i].y1],
    ]
    const start = key(lines[i].x0, lines[i].y0)
    let cur = key(lines[i].x1, lines[i].y1)
    let guard = lines.length
    while (cur !== start && guard-- > 0) {
      const nexts = adj.get(cur)
      let next = -1
      if (nexts) {
        for (let j = 0; j < nexts.length; j++) {
          if (!used[nexts[j]]) {
            next = nexts[j]
            break
          }
        }
      }
      if (next < 0) break
      used[next] = 1
      const line = lines[next]
      const forward = key(line.x0, line.y0) === cur
      const x = forward ? line.x1 : line.x0
      const y = forward ? line.y1 : line.y0
      pts.push([x, y])
      cur = key(x, y)
    }
    out.push(pts)
  }
  return out
}

function fmt(n) {
  return String(Math.round(n * 1e6) / 1e6)
}

function pathData(loops, close) {
  const parts = []
  for (const pts of loops) {
    if (pts.length < 2) continue
    parts.push(`M${fmt(pts[0][0])} ${fmt(-pts[0][1])}`)
    for (let i = 1; i < pts.length; i++) parts.push(`L${fmt(pts[i][0])} ${fmt(-pts[i][1])}`)
    if (close) parts.push("Z")
  }
  return parts.join("")
}

function areaCentroid(pts) {
  let crossSum = 0
  let cx = 0
  let cy = 0
  for (let i = 0; i < pts.length - 1; i++) {
    const cross = pts[i][0] * pts[i + 1][1] - pts[i + 1][0] * pts[i][1]
    crossSum += cross
    cx += (pts[i][0] + pts[i + 1][0]) * cross
    cy += (pts[i][1] + pts[i + 1][1]) * cross
  }
  if (Math.abs(crossSum) < 1e-9) return null
  return { x: cx / (3 * crossSum), y: cy / (3 * crossSum), area: Math.abs(crossSum) / 2 }
}

// KiCad strokes a DXF line as two contours a few hundredths of a millimetre
// apart. Filling both with even-odd cancels the interior, so keep one.
function uniqueLoops(loops) {
  const ranked = []
  for (const pts of loops) {
    const info = areaCentroid(pts)
    if (info && info.area > 0) ranked.push({ pts, ...info })
  }
  ranked.sort((a, b) => b.area - a.area)
  const kept = []
  for (const loop of ranked) {
    const duplicate = kept.some(
      (other) =>
        Math.abs(other.area - loop.area) / other.area < 0.3 &&
        Math.hypot(other.x - loop.x, other.y - loop.y) < 0.15,
    )
    if (!duplicate) kept.push(loop)
  }
  return kept.map((loop) => loop.pts)
}

function splitLoops(lines) {
  const closed = []
  const open = []
  for (const pts of chains(lines)) {
    const a = pts[0]
    const b = pts[pts.length - 1]
    if (Math.abs(a[0] - b[0]) < 1e-2 && Math.abs(a[1] - b[1]) < 1e-2) closed.push(pts)
    else open.push(pts)
  }
  return { filled: pathData(uniqueLoops(closed), true), open: pathData(open, false) }
}

export function scaleLayer(layer, scale) {
  if (scale === 1) return layer
  return {
    ...layer,
    lines: layer.lines.map((line) => ({
      x0: line.x0 * scale,
      y0: line.y0 * scale,
      x1: line.x1 * scale,
      y1: line.y1 * scale,
    })),
    circles: layer.circles.map((circle) => ({
      x: circle.x * scale,
      y: circle.y * scale,
      r: circle.r * scale,
    })),
  }
}

export function boundsOf(lines, circles) {
  let x0 = Infinity
  let y0 = Infinity
  let x1 = -Infinity
  let y1 = -Infinity
  const add = (x, y) => {
    if (x < x0) x0 = x
    if (y < y0) y0 = y
    if (x > x1) x1 = x
    if (y > y1) y1 = y
  }
  for (const line of lines) {
    add(line.x0, line.y0)
    add(line.x1, line.y1)
  }
  for (const circle of circles) {
    add(circle.x - circle.r, circle.y - circle.r)
    add(circle.x + circle.r, circle.y + circle.r)
  }
  if (!(x1 > x0) || !(y1 > y0)) return null
  return [x0, -y1, x1 - x0, y1 - y0]
}

function circlesOf(circles, fill) {
  return circles
    .map((c) => `<circle cx="${fmt(c.x)}" cy="${fmt(-c.y)}" r="${fmt(c.r)}" fill="${fill}"/>`)
    .join("")
}

function gather(layers, role) {
  const lines = []
  const circles = []
  for (const layer of layers) {
    if (layer.role !== role) continue
    lines.push(...layer.lines)
    circles.push(...layer.circles)
  }
  return { lines, circles }
}

// Same picture as the Gerber compose: substrate clipped to the outline,
// gold copper, green mask with openings punched out, light silk, black edge.
export function composeDxf(layers) {
  const outline = gather(layers, "outline")
  const copper = gather(layers, "copper")
  const mask = gather(layers, "mask")
  const silk = gather(layers, "silk")
  const frame = outline.lines.length ? outline : copper.lines.length ? copper : silk
  const viewBox = boundsOf(frame.lines, frame.circles)
  if (!viewBox) throw new Error("These DXF files did not contain a board outline.")

  const [vx, , vw, vh] = viewBox
  // Shift onto a viewBox that starts at the origin and is the same size as
  // the millimetre viewport. Clip paths and masks use that viewport, so a
  // viewBox parked at the DXF origin drops the fills.
  const maxY = -viewBox[1]
  const moved = (geom) => ({
    lines: geom.lines.map((line) => ({
      x0: line.x0 - vx,
      y0: line.y0 - maxY,
      x1: line.x1 - vx,
      y1: line.y1 - maxY,
    })),
    circles: geom.circles.map((circle) => ({
      x: circle.x - vx,
      y: circle.y - maxY,
      r: circle.r,
    })),
  })
  const edge = splitLoops(moved(outline).lines)
  const cu = splitLoops(moved(copper).lines)
  const openings = splitLoops(moved(mask).lines)
  const ink = splitLoops(moved(silk).lines)
  const pads = moved(copper).circles
  const holes = moved(mask).circles
  const stroke = "0.2"
  const origin = [0, 0, vw, vh]
  const edgePath = `<path d="${edge.filled}" clip-rule="evenodd" fill-rule="evenodd"/>`

  let body = ""
  if (edge.filled) {
    body += `<defs><clipPath id="pcb-edge">${edgePath}</clipPath>`
    if (openings.filled || holes.length) {
      body += `<mask id="pcb-mask"><rect x="0" y="0" width="${fmt(vw)}" height="${fmt(vh)}" fill="#fff"/>`
      if (openings.filled) body += `<path d="${openings.filled}" fill="#000" fill-rule="evenodd"/>`
      body += circlesOf(holes, "#000")
      body += `</mask>`
    }
    body += `</defs><g clip-path="url(#pcb-edge)">`
    body += `<path d="${edge.filled}" fill="#163d28" fill-rule="evenodd"/>`
    if (cu.filled) body += `<path d="${cu.filled}" fill="#d4922a" fill-rule="evenodd"/>`
    body += circlesOf(pads, "#d4922a")
    if (openings.filled || holes.length) {
      body += `<g mask="url(#pcb-mask)"><path d="${edge.filled}" fill="#1f7a45" fill-opacity="0.92" fill-rule="evenodd"/></g>`
    }
    if (ink.filled) body += `<path d="${ink.filled}" fill="#f6f1e4" fill-rule="evenodd"/>`
    if (ink.open) body += `<path d="${ink.open}" fill="none" stroke="#f6f1e4" stroke-width="${stroke}" stroke-linejoin="round" stroke-linecap="round"/>`
    body += `</g>`
    body += `<path d="${edge.filled}" fill="none" stroke="#1c1917" stroke-width="${stroke}" stroke-linejoin="round" stroke-linecap="round"/>`
  } else {
    if (cu.filled) body += `<path d="${cu.filled}" fill="#d4922a" fill-rule="evenodd"/>`
    body += circlesOf(pads, "#d4922a")
    if (openings.filled) body += `<path d="${openings.filled}" fill="#1f7a45" fill-rule="evenodd"/>`
    if (ink.filled) body += `<path d="${ink.filled}" fill="#3f3a34" fill-rule="evenodd"/>`
  }

  return {
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${origin.map(fmt).join(" ")}">${body}</svg>`,
    viewBox: origin,
  }
}
