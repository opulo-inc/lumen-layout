import geometry from "./geometry.json"
import { WIDTHS, config } from "./config.js"
import { solvePowered } from "./poweredSolver.js"
import { solveStrips } from "./stripSolver.js"
import { loadBoard } from "./gerber.js"
import { boardFootprint, clampBoard, initialBoardPosition } from "./board.js"
import { createStage } from "./view.js"
import { planWidePacks, productUrl } from "./shop.js"

const state = {
  powered: null,
  strips: null,
  board: null,
}

const stage = createStage(document.getElementById("stage"), {
  onBoardChange(board) {
    state.board = board
    stage.render(viewModel())
  },
  onStripChange(index, placement) {
    if (!state.strips) return
    state.strips.placements[index] = placement
    stage.render(viewModel())
  },
})

function viewModel() {
  return {
    slots: state.powered ? state.powered.slots : [],
    placements: state.strips ? state.strips.placements : [],
    board: state.board,
  }
}

function readInput() {
  const input = {}
  for (const width of WIDTHS) {
    input[width] = {
      total: document.getElementById(`qty-${width}`).value,
      priority: document.getElementById(`prio-${width}`).value,
    }
  }
  return input
}

function refreshStrips() {
  const footprint = state.board ? boardFootprint(state.board) : null
  const existing = state.strips ? state.strips.placements : []
  state.strips = solveStrips(state.powered.leftover, footprint, geometry, config, existing)
  stage.render(viewModel())
  renderBom()
}

function calculate() {
  state.powered = solvePowered(readInput())
  refreshStrips()
}

function link(href, text) {
  if (!href) return text
  return `<a target="_blank" rel="noreferrer" href="${href}">${text}</a>`
}

function packPhrase(count, noun) {
  const plural = noun.endsWith("pack") ? `${noun.slice(0, -4)}packs` : `${noun}s`
  return `${count} ${count === 1 ? noun : plural}`
}

function renderBom() {
  const { powered } = state.powered
  const { shop } = config
  const stripCounts = Object.fromEntries(WIDTHS.map((width) => [width, 0]))
  for (const placement of state.strips.placements) stripCounts[placement.width] += 1

  const wide = planWidePacks(powered[16], powered[24], shop.variety, shop.packSize)
  const five = {
    8: Math.ceil(powered[8] / shop.packSize),
    12: Math.ceil(powered[12] / shop.packSize),
    16: wide.sixteen,
    24: wide.twentyFour,
  }

  const poweredLines = [8, 12, 16, 24]
    .map((width) => {
      const href = productUrl(shop.powered[width])
      return `<p>${link(href, `${width}mm`)}: ${powered[width]} <span class="packs">(${packPhrase(five[width], "five-pack")})</span></p>`
    })
    .join("")
  const varietyLine =
    wide.variety > 0
      ? `<p>${link(productUrl(shop.variety), "16/24 variety pack")}: ${wide.variety} <span class="packs">(${shop.variety.sixteen}× 16mm, ${shop.variety.twentyFour}× 24mm each)</span></p>`
      : ""

  const stripLines = WIDTHS.map((width) => {
    return `<p>${link(shop.stripBase + shop.strip[width], `${width}mm`)}: ${stripCounts[width]}</p>`
  }).join("")

  const cart = [`${shop.lumenId}:1`]
  for (const width of [8, 12]) {
    if (five[width] > 0) cart.push(`${shop.powered[width].variant}:${five[width]}`)
  }
  if (wide.variety > 0) cart.push(`${shop.variety.variant}:${wide.variety}`)
  for (const width of [16, 24]) {
    if (five[width] > 0) cart.push(`${shop.powered[width].variant}:${five[width]}`)
  }
  for (const width of WIDTHS) {
    if (stripCounts[width] > 0) cart.push(`${shop.strip[width]}:${stripCounts[width]}`)
  }

  const missing = WIDTHS.filter((width) => state.strips.unallocated[width] > 0)
  const missingHtml = missing.length
    ? `<div id="unallocated"><h3>Not enough space</h3>${missing
        .map((width) => `<p>${width}mm: ${state.strips.unallocated[width]} left over</p>`)
        .join("")}</div>`
    : ""

  document.getElementById("order").innerHTML = `
    <div id="powered-result">
      <h3>Powered feeders</h3>
      ${poweredLines}
      ${varietyLine}
    </div>
    <div id="strip-result">
      <h3>Strip feeders</h3>
      ${stripLines}
    </div>
    ${missingHtml}
    <a id="cart-link" target="_blank" rel="noreferrer" href="${shop.cart}${cart.join(",")}"><button class="primary" type="button">Add to cart</button></a>
  `
}

function setBoardControls(enabled) {
  document.getElementById("rotate-board").disabled = !enabled
  document.getElementById("clear-board").disabled = !enabled
}

async function loadFiles(files) {
  const status = document.getElementById("gerber-status")
  status.textContent = "Reading Gerbers…"
  try {
    const loaded = await loadBoard(files)
    const doc = new DOMParser().parseFromString(loaded.svg, "image/svg+xml")
    state.board = initialBoardPosition({
      markup: doc.documentElement.innerHTML,
      viewBox: loaded.viewBox,
      width: loaded.width,
      height: loaded.height,
      x: 0,
      y: 0,
      rot: 0,
    })
    const assumed = loaded.assumed
      ? ` · assumed ${loaded.units === "in" ? "inches" : "millimetres"}`
      : ""
    status.textContent = `${loaded.width.toFixed(1)} × ${loaded.height.toFixed(1)} mm${assumed}`
    setBoardControls(true)
    if (state.powered) refreshStrips()
    else stage.render(viewModel())
  } catch (error) {
    status.textContent = error.message || "Could not read those Gerbers."
  }
}

for (const width of WIDTHS) {
  const qty = document.getElementById(`qty-${width}`)
  const prio = document.getElementById(`prio-${width}`)
  const out = document.getElementById(`prio-${width}-out`)
  const sync = () => {
    out.textContent = prio.value
    const max = Number(prio.max) || 0
    const fill = max > 0 ? (Number(prio.value) / max) * 100 : 0
    prio.style.setProperty("--fill", `${fill}%`)
  }
  prio.addEventListener("input", () => {
    sync()
    calculate()
  })
  qty.addEventListener("input", () => {
    const total = Math.max(0, Math.floor(Number(qty.value)) || 0)
    prio.max = String(total)
    if (Number(prio.value) > total) prio.value = String(total)
    sync()
    calculate()
  })
  qty.parentElement.querySelectorAll("button").forEach((button) => {
    button.addEventListener("click", () => {
      const current = Math.max(0, Math.floor(Number(qty.value)) || 0)
      const next = Math.max(0, current + Number(button.dataset.step))
      if (next === current) return
      qty.value = String(next)
      qty.dispatchEvent(new Event("input", { bubbles: true }))
    })
  })
  sync()
}
document.getElementById("fit-view").addEventListener("click", () => stage.fit())
document.getElementById("rotate-board").addEventListener("click", () => {
  if (!state.board) return
  state.board = clampBoard({ ...state.board, rot: (state.board.rot + 90) % 360 })
  stage.render(viewModel())
})
document.getElementById("clear-board").addEventListener("click", () => {
  state.board = null
  document.getElementById("gerber-file").value = ""
  document.getElementById("gerber-status").textContent = ""
  setBoardControls(false)
  if (state.powered) refreshStrips()
  else stage.render(viewModel())
})
document.getElementById("gerber-file").addEventListener("change", (event) => {
  const files = [...event.target.files]
  if (files.length) loadFiles(files)
})

const stageEl = document.getElementById("stage")
stageEl.addEventListener("dragover", (event) => {
  event.preventDefault()
  stageEl.classList.add("dropping")
})
stageEl.addEventListener("dragleave", () => stageEl.classList.remove("dropping"))
stageEl.addEventListener("drop", (event) => {
  event.preventDefault()
  stageEl.classList.remove("dropping")
  const files = [...event.dataTransfer.files]
  if (files.length) loadFiles(files)
})

setBoardControls(false)
calculate()

{
  const divider = document.getElementById("divider")
  let dragging = false
  divider.addEventListener("pointerdown", (event) => {
    dragging = true
    divider.classList.add("dragging")
    divider.setPointerCapture(event.pointerId)
    event.preventDefault()
  })
  divider.addEventListener("pointermove", (event) => {
    if (!dragging) return
    const width = Math.min(640, Math.max(280, event.clientX))
    document.documentElement.style.setProperty("--pw", `${width}px`)
  })
  const stop = (event) => {
    if (!dragging) return
    dragging = false
    divider.classList.remove("dragging")
    divider.releasePointerCapture(event.pointerId)
  }
  divider.addEventListener("pointerup", stop)
  divider.addEventListener("pointercancel", stop)
}
