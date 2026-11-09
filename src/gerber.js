import JSZip from "jszip"
import { plot, read, renderFragments } from "@tracespace/core"
import { PLATE_WIDTH, config } from "./config.js"
import { boundsOf, composeDxf, dxfRole, parseDxf, scaleLayer } from "./dxf.js"

const SKIP = /\.(png|jpe?g|pdf|svg|zip|md|csv|json|html?|exe|dmg)$/i
const GERBER =
  /\.(gbr|ger|gtl|gbl|gts|gbs|gto|gbo|gtp|gbp|gko|gml|gm\d+|gd\d+|gg\d+|gp\d+|g\d+|pho|drl|xln|exc|ncd|dri|txt)$/i

function keepName(name) {
  const base = name.split("/").pop()
  if (!base || base.startsWith(".") || name.includes("__MACOSX")) return false
  if (SKIP.test(base)) return false
  // Plain text is usually a readme. Keep it only when the name looks like a drill file.
  if (/\.txt$/i.test(base) && !/drill|excellon|\bnc\b/i.test(base)) return false
  if (/\.dxf$/i.test(base)) return true
  if (GERBER.test(base)) return true
  return /edge.?cuts|f_cu|b_cu|silkscreen|solder|paste/i.test(base)
}

async function filesFromZip(file) {
  const zip = await JSZip.loadAsync(file)
  const out = []
  for (const [name, entry] of Object.entries(zip.files)) {
    if (entry.dir || !keepName(name)) continue
    const blob = await entry.async("blob")
    out.push(new File([blob], name.split("/").pop()))
  }
  return out
}

async function collect(inputs) {
  const files = []
  for (const input of inputs) {
    if (typeof input === "string") {
      if (keepName(input)) files.push(input)
      continue
    }
    if (input.name.toLowerCase().endsWith(".zip")) {
      files.push(...(await filesFromZip(input)))
      continue
    }
    if (keepName(input.name)) files.push(input)
  }
  return files
}

const INCH = 25.4

function hasExplicitUnits(parseTree) {
  return parseTree?.children?.some((node) => node.type === "units") ?? false
}

// The outline is the board. A drill file with no unit command defaults to
// inches, and scaling the outline by that makes a millimetre board enormous.
function unitsOf(plotResult, readResult) {
  const ranked = [...plotResult.layers].sort((a, b) => {
    const rank = (layer) => (layer.type === "outline" ? 0 : layer.type === "drill" ? 2 : 1)
    return rank(a) - rank(b)
  })
  for (const layer of ranked) {
    const tree = plotResult.plotTreesById[layer.id]
    if (!tree?.units) continue
    return {
      units: tree.units,
      explicit: hasExplicitUnits(readResult.parseTreesById[layer.id]),
    }
  }
  return { units: "in", explicit: false }
}

function fitsBed(width, height) {
  const long = Math.max(width, height)
  const short = Math.min(width, height)
  const bedLong = Math.max(config.workArea.width, config.workArea.height)
  const bedShort = Math.min(config.workArea.width, config.workArea.height)
  return short >= 5 && long <= bedLong && short <= bedShort
}

function plausible(width, height) {
  const long = Math.max(width, height)
  const short = Math.min(width, height)
  return short >= 5 && long <= PLATE_WIDTH
}

function toMillimetres(fileWidth, fileHeight, units) {
  const scale = units === "in" ? INCH : 1
  return { units, width: fileWidth * scale, height: fileHeight * scale }
}

// File units are often missing or copied from a drill header. If the size
// that produces cannot be a board for this machine and the other unit can,
// use the other unit.
export function resolveBoardSize(fileWidth, fileHeight, units, explicit) {
  const declared = toMillimetres(fileWidth, fileHeight, units)
  const flipped = toMillimetres(fileWidth, fileHeight, units === "in" ? "mm" : "in")
  const long = Math.max(declared.width, declared.height)
  const override =
    plausible(flipped.width, flipped.height) &&
    ((!explicit && !fitsBed(declared.width, declared.height)) || long > PLATE_WIDTH)
  if (!override) return { ...declared, assumed: false }
  return { ...flipped, assumed: true }
}

// Plot boxes are [minX, minY, maxX, maxY] with Y up. The SVG viewBox is Y down.
function viewBoxOfTree(tree) {
  const box = tree?.size
  if (!box || box.length < 4) return null
  const [x0, y0, x1, y1] = box
  if (!(x1 > x0) || !(y1 > y0)) return null
  return [x0, -y1, x1 - x0, y1 - y0]
}

function paint(markup, color) {
  if (!markup) return ""
  return `<g fill="${color}" stroke="${color}">${markup}</g>`
}

function fillShape(shape, color, opacity) {
  const opacityAttr = opacity ? ` fill-opacity="${opacity}"` : ""
  return shape.replace("<path", `<path fill="${color}"${opacityAttr}`)
}

// Copper, solder mask, and silk from the top side, clipped to the real
// outline when the edge cuts close. The edge-cuts geometry is stroked on
// top so the board is not just its bounding box.
function composeBoard(plotResult) {
  const frag = renderFragments(plotResult)
  const byId = frag.svgFragmentsById
  const join = (ids) => ids.map((id) => byId[id] ?? "").join("")
  const outlineIds = plotResult.layers.filter((layer) => layer.type === "outline").map((layer) => layer.id)
  const outlineTree = outlineIds.map((id) => plotResult.plotTreesById[id]).find((tree) => viewBoxOfTree(tree))
  const viewBox = viewBoxOfTree(outlineTree) ?? frag.boardShapeRenderFragment.viewBox
  const shape = frag.boardShapeRenderFragment.svgFragment
  const { copper, solderMask, silkScreen } = frag.topLayers
  const [vx, vy, vw, vh] = viewBox

  let body = ""
  if (shape) {
    body += `<defs><clipPath id="pcb-edge">${shape}</clipPath>`
    if (join(solderMask)) {
      body += `<mask id="pcb-mask"><rect x="${vx}" y="${vy}" width="${vw}" height="${vh}" fill="#fff"/>`
      body += `${paint(join(solderMask), "#000")}</mask>`
    }
    body += `</defs><g clip-path="url(#pcb-edge)">`
    body += fillShape(shape, "#163d28")
    body += paint(join(copper), "#d4922a")
    if (join(solderMask)) body += `<g mask="url(#pcb-mask)">${fillShape(shape, "#1f7a45", "0.92")}</g>`
    body += paint(join(silkScreen), "#f6f1e4")
    body += `</g>`
  } else {
    body += paint(join(copper), "#d4922a")
    body += paint(join(solderMask), "#1f7a45")
    body += paint(join(silkScreen), "#3f3a34")
  }
  body += `<g fill="none" stroke="#1c1917" stroke-linejoin="round" stroke-linecap="round">${join(outlineIds)}</g>`

  return {
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox.join(" ")}">${body}</svg>`,
    viewBox,
  }
}

function isDxf(file) {
  const name = typeof file === "string" ? file : file.name
  return /\.dxf$/i.test(name)
}

async function readText(file) {
  if (typeof file === "string") {
    const { readFile } = await import("node:fs/promises")
    return readFile(file, "utf8")
  }
  return file.text()
}

// A KiCad fabrication zip is often DXF plots plus Excellon drills. tracespace
// cannot plot DXF, so those files are drawn here and the drills are ignored.
async function loadDxfBoard(files) {
  const layers = []
  for (const file of files) {
    const name = typeof file === "string" ? file.split("/").pop() : file.name
    const role = dxfRole(name)
    if (!role) continue
    layers.push({ name, role, ...parseDxf(await readText(file)) })
  }
  if (layers.length === 0) throw new Error("No board layers found in the DXF files.")
  const outline = layers.find((layer) => layer.role === "outline") ?? layers[0]
  // The stage draws this SVG into a viewport measured in millimetres. Path
  // coordinates have to be millimetres too, or the outline clip lands in the
  // wrong place and the fills disappear.
  const fileBox = boundsOf(outline.lines, outline.circles)
  if (!fileBox) throw new Error("The DXF files parsed, but no board outline came out of them.")
  const size = resolveBoardSize(fileBox[2], fileBox[3], outline.units, outline.explicit)
  const scale = size.width / fileBox[2]
  const { svg, viewBox } = composeDxf(layers.map((layer) => scaleLayer(layer, scale)))
  if (!(size.width > 0) || !(size.height > 0)) {
    throw new Error("The DXF files parsed, but no board outline came out of them.")
  }
  return {
    svg,
    viewBox,
    units: size.units,
    assumed: size.assumed,
    width: size.width,
    height: size.height,
    layers: layers.map((layer) => layer.name),
  }
}

export async function loadBoard(inputs) {
  const files = await collect(inputs)
  if (files.length === 0) {
    throw new Error("No board files found. Upload a .zip of Gerber or DXF layers, or the layer files themselves.")
  }
  if (files.some(isDxf)) return loadDxfBoard(files)

  const readResult = await read(files)
  const plotResult = plot(readResult)
  const { svg, viewBox } = composeBoard(plotResult)
  const { units, explicit } = unitsOf(plotResult, readResult)
  const size = resolveBoardSize(viewBox[2], viewBox[3], units, explicit)
  if (!(size.width > 0) || !(size.height > 0)) {
    throw new Error("The Gerbers parsed, but no board outline came out of them.")
  }

  return {
    svg,
    viewBox,
    units: size.units,
    assumed: size.assumed,
    width: size.width,
    height: size.height,
    layers: readResult.layers.map((layer) => layer.filename),
  }
}
