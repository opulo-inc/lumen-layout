import geometry from "./geometry.json"
import { FEEDER_COLORS, PLATE_WIDTH, PLATES, POWERED_SPAN, SLOTS_PER_RAIL, config } from "./config.js"
import { buildPlateHoles, nearestStrip, rotateLocal, stripSpots } from "./stripSolver.js"
import { boardFootprint, clampBoard } from "./board.js"

const NS = "http://www.w3.org/2000/svg"
const HOLES = buildPlateHoles(geometry)

function el(name, attrs, parent) {
  const node = document.createElementNS(NS, name)
  for (const [key, value] of Object.entries(attrs || {})) {
    if (value !== undefined && value !== null) node.setAttribute(key, String(value))
  }
  if (parent) parent.appendChild(node)
  return node
}

function clear(node) {
  while (node.firstChild) node.removeChild(node.firstChild)
}

function label(parent, x, y, text, size, fill = "#1c1917") {
  const group = el("g", { transform: `translate(${x} ${y}) scale(1 -1)` }, parent)
  const node = el(
    "text",
    {
      "text-anchor": "middle",
      "dominant-baseline": "central",
      "font-family": "Figtree, sans-serif",
      "font-size": size,
      fill,
    },
    group
  )
  node.textContent = text
  return node
}

export function createStage(container, { onBoardChange, onStripChange }) {
  const svg = el("svg", { id: "stage-svg" })
  const world = el("g", { id: "world", transform: "scale(1 -1)" }, svg)
  const bed = el("g", {}, world)
  const plate = el("g", {}, world)
  const area = el("g", {}, world)
  const rails = el("g", {}, world)
  const strips = el("g", {}, world)
  const boardLayer = el("g", { "data-pcb": "1" }, world)
  container.appendChild(svg)

  const scene = { x: config.view.x, y: config.view.y, w: config.view.width, h: config.view.height }
  const view = { x: scene.x, y: scene.y, w: scene.w, h: scene.h }
  let model = { slots: [], placements: [], board: null }
  let drag = null

  function aspect() {
    const ratio = svg.clientWidth / svg.clientHeight
    return ratio > 0 ? ratio : 1.5
  }

  function setViewBox() {
    svg.setAttribute("viewBox", `${view.x} ${-(view.y + view.h)} ${view.w} ${view.h}`)
  }

  // Keep the viewBox the same shape as the svg element so circles stay round.
  function matchAspect() {
    const ratio = aspect()
    if (!ratio) return
    view.h = view.w / ratio
  }

  function fit() {
    const ratio = aspect()
    if (!ratio) {
      view.x = scene.x
      view.y = scene.y
      view.w = scene.w
      view.h = scene.h
      setViewBox()
      return
    }
    const sceneAspect = scene.w / scene.h
    if (ratio > sceneAspect) {
      view.h = scene.h
      view.w = scene.h * ratio
      view.x = scene.x - (view.w - scene.w) / 2
      view.y = scene.y
    } else {
      view.w = scene.w
      view.h = scene.w / ratio
      view.x = scene.x
      view.y = scene.y - (view.h - scene.h) / 2
    }
    setViewBox()
  }

  function clientToWorld(event) {
    const point = svg.createSVGPoint()
    point.x = event.clientX
    point.y = event.clientY
    const mapped = point.matrixTransform(world.getScreenCTM().inverse())
    return { x: mapped.x, y: mapped.y }
  }

  function drawStatic() {
    const { rails: rail, workArea } = config
    const minX = Math.min(-8, rail.x - 28)
    const maxX = Math.max(PLATE_WIDTH, rail.x + SLOTS_PER_RAIL * rail.pitch) + 28
    const minY = rail.frontY - 18
    const maxY = rail.backY + rail.depth + 22

    el("rect", {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
      rx: 8,
      fill: "#f4f1ea",
    }, bed)

    for (const part of PLATES) {
      el("rect", {
        x: 0,
        y: part.y,
        width: PLATE_WIDTH,
        height: part.height,
        fill: part.id === "staging" ? "#cfc6b8" : "#ddd6cb",
        stroke: "#b7afa3",
        "stroke-width": 0.6,
      }, plate)
      label(plate, 36, part.y + part.height / 2, part.id, 5.5, "#6b645c")
    }

    for (const [x, y] of HOLES) {
      el("circle", { cx: x, cy: y, r: 1.15, fill: "#7c746a" }, plate)
    }

    const a = workArea
    const points = [
      [a.x + a.notchWidth, a.y],
      [a.x + a.width, a.y],
      [a.x + a.width, a.y + a.height],
      [a.x, a.y + a.height],
      [a.x, a.y + a.notchHeight],
      [a.x + a.notchWidth, a.y + a.notchHeight],
    ]
      .map((point) => point.join(","))
      .join(" ")
    el("polygon", {
      points,
      fill: "#fbf8f2",
      "fill-opacity": 0.78,
      stroke: "#1c1917",
      "stroke-width": 0.8,
    }, area)

    const camera = geometry.plate.camera
    el("circle", {
      cx: camera.x,
      cy: camera.y,
      r: camera.r,
      fill: "#1c1917",
      "fill-opacity": 0.12,
      stroke: "#c2410c",
      "stroke-width": 0.7,
      "stroke-dasharray": "2.2 1.4",
    }, area)
    label(area, camera.x, camera.y, "camera", 6, "#9a3412")
  }

  function drawRails() {
    clear(rails)
    const rail = config.rails
    const barWidth = SLOTS_PER_RAIL * rail.pitch + 6
    for (const [name, y] of [["Back rail", rail.backY], ["Front rail", rail.frontY]]) {
      el("rect", {
        x: rail.x - 4,
        y,
        width: barWidth,
        height: rail.depth,
        rx: 2,
        fill: "#44403c",
      }, rails)
      label(rails, rail.x - 22, y + rail.depth / 2, name.replace(" rail", ""), 6, "#44403c")
    }

    const slots = model.slots ?? []
    for (let index = 0; index < SLOTS_PER_RAIL * 2; index++) {
      const slot = slots[index]
      if (slot?.role === "secondary") continue
      const span = slot?.role === "primary" ? POWERED_SPAN[slot.width] : 1
      const along = index % SLOTS_PER_RAIL
      const y = index < SLOTS_PER_RAIL ? rail.backY : rail.frontY
      const x = rail.x + along * rail.pitch + rail.gap / 2
      const width = span * rail.pitch - rail.gap
      el("rect", {
        x,
        y: y + 3.5,
        width,
        height: rail.depth - 7,
        rx: 1,
        fill: slot ? FEEDER_COLORS[slot.width] : "#a8a29e",
      }, rails)
      if (slot) label(rails, x + width / 2, y + rail.depth / 2, String(slot.width), 6, "#1c1917")
    }
  }

  function drawStrips() {
    clear(strips)
    for (const [index, placement] of (model.placements ?? []).entries()) {
      const width = placement.x1 - placement.x0
      const height = placement.y1 - placement.y0
      const group = el("g", { "data-strip": index, cursor: "grab" }, strips)
      el("rect", {
        x: placement.x0,
        y: placement.y0,
        width,
        height,
        fill: FEEDER_COLORS[placement.width],
        "fill-opacity": 0.9,
        stroke: "#1c1917",
        "stroke-width": 0.45,
      }, group)
      const feeder = geometry.feeders[String(placement.width)]
      for (const [x, y] of feeder.holes) {
        const [rx, ry] = rotateLocal(x, y, placement.rot)
        el("circle", {
          cx: rx + placement.tx,
          cy: ry + placement.ty,
          r: 1.35,
          fill: "#fff",
          stroke: "#1c1917",
          "stroke-width": 0.35,
          "pointer-events": "none",
        }, group)
      }
      label(
        group,
        placement.x0 + width / 2,
        placement.y0 + height / 2,
        `${placement.width}`,
        Math.min(width, height) > 30 ? 9 : 6
      )
    }
  }

  function drawBoard() {
    clear(boardLayer)
    const board = model.board
    if (!board) return
    const cx = board.x + board.width / 2
    const cy = board.y + board.height / 2
    const turned = el("g", {
      transform: `translate(${cx} ${cy}) rotate(${board.rot}) translate(${-cx} ${-cy})`,
    }, boardLayer)
    el("rect", {
      x: board.x,
      y: board.y,
      width: board.width,
      height: board.height,
      fill: "transparent",
      stroke: "none",
    }, turned)
    // The Gerber render is y-down. Flip it inside its own box so it stays
    // upright in the y-up machine group and follows the board in Y.
    const upright = el("g", {
      transform: `translate(0 ${2 * board.y + board.height}) scale(1 -1)`,
    }, turned)
    const [vx, vy, vw, vh] = board.viewBox
    const nested = el("svg", {
      x: board.x,
      y: board.y,
      width: board.width,
      height: board.height,
      viewBox: `${vx} ${vy} ${vw} ${vh}`,
      preserveAspectRatio: "none",
    }, upright)
    nested.innerHTML = board.markup
  }

  function render(next) {
    model = {
      slots: next.slots,
      placements: next.placements ?? [],
      board: next.board ?? null,
    }
    drawRails()
    drawStrips()
    drawBoard()
  }

  svg.addEventListener("pointerdown", (event) => {
    if (event.button !== 0) return
    const onStrip = event.target.closest?.("[data-strip]")
    const onBoard = event.target.closest?.("[data-pcb]")
    if (onStrip) {
      const index = Number(onStrip.getAttribute("data-strip"))
      const placement = model.placements[index]
      const world = clientToWorld(event)
      const others = model.placements.filter((_, i) => i !== index)
      const footprint = model.board ? boardFootprint(model.board) : null
      drag = {
        type: "strip",
        index,
        placement,
        spots: stripSpots(placement, others, footprint, geometry),
        ox: world.x - (placement.x0 + placement.x1) / 2,
        oy: world.y - (placement.y0 + placement.y1) / 2,
      }
      svg.classList.add("dragging-board")
    } else if (onBoard && model.board) {
      const world = clientToWorld(event)
      drag = { type: "board", dx: model.board.x - world.x, dy: model.board.y - world.y }
      svg.classList.add("dragging-board")
    } else {
      drag = { type: "pan", x: event.clientX, y: event.clientY, viewX: view.x, viewY: view.y }
      svg.classList.add("dragging")
    }
    svg.setPointerCapture(event.pointerId)
  })

  svg.addEventListener("pointermove", (event) => {
    if (!drag) return
    if (drag.type === "pan") {
      const scale = view.w / svg.clientWidth
      view.x = drag.viewX - (event.clientX - drag.x) * scale
      view.y = drag.viewY + (event.clientY - drag.y) * scale
      setViewBox()
      return
    }
    const world = clientToWorld(event)
    if (drag.type === "strip") {
      model.placements[drag.index] = nearestStrip(
        drag.placement,
        drag.spots,
        { x: world.x - drag.ox, y: world.y - drag.oy }
      )
      drawStrips()
      return
    }
    model.board = clampBoard({ ...model.board, x: world.x + drag.dx, y: world.y + drag.dy })
    drawBoard()
  })

  function endDrag() {
    if (drag?.type === "board") onBoardChange({ ...model.board })
    if (drag?.type === "strip") onStripChange(drag.index, { ...model.placements[drag.index] })
    drag = null
    svg.classList.remove("dragging", "dragging-board")
  }

  svg.addEventListener("pointerup", endDrag)
  svg.addEventListener("pointercancel", endDrag)

  svg.addEventListener("wheel", (event) => {
    event.preventDefault()
    const world = clientToWorld(event)
    const factor = event.deltaY > 0 ? 1.12 : 1 / 1.12
    const nextW = Math.min(2400, Math.max(70, view.w * factor))
    const fx = (world.x - view.x) / view.w
    const fy = (world.y - view.y) / view.h
    view.w = nextW
    matchAspect()
    view.x = world.x - fx * view.w
    view.y = world.y - fy * view.h
    setViewBox()
  }, { passive: false })

  drawStatic()
  requestAnimationFrame(fit)
  const keepAspect = () => {
    const cx = view.x + view.w / 2
    const cy = view.y + view.h / 2
    matchAspect()
    view.x = cx - view.w / 2
    view.y = cy - view.h / 2
    setViewBox()
  }
  window.addEventListener("resize", keepAspect)
  new ResizeObserver(keepAspect).observe(svg)

  return { render, fit }
}
