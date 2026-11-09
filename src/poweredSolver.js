import { POWERED_SPAN, RAIL_COUNT, SLOTS_PER_RAIL, WIDTHS } from "./config.js"

export const SLOT_COUNT = SLOTS_PER_RAIL * RAIL_COUNT

// Powered feeders are filled narrowest-first so a 1-slot feeder is never
// blocked by a 2-slot one that could have gone to strips. Priority parts
// are placed before everything else. 32mm tape has no powered feeder.
const POWERED_ORDER = [8, 12, 16, 24]

function whole(value) {
  const n = Math.floor(Number(value))
  return Number.isFinite(n) && n > 0 ? n : 0
}

export function readCounts(input) {
  const counts = {}
  for (const width of WIDTHS) {
    const entry = input?.[width] ?? input?.[String(width)] ?? {}
    const total = whole(typeof entry === "number" ? entry : entry.total)
    const priority = Math.min(total, whole(entry.priority))
    counts[width] = { total, priority }
  }
  return counts
}

function canPlace(slots, index, span) {
  const rail = Math.floor(index / SLOTS_PER_RAIL)
  if (rail !== Math.floor((index + span - 1) / SLOTS_PER_RAIL)) return false
  for (let i = 0; i < span; i++) {
    if (slots[index + i]) return false
  }
  return true
}

// Front rail (slots 25-49) fills before the back rail (slots 0-24).
const SLOT_ORDER = [
  ...Array.from({ length: SLOTS_PER_RAIL }, (_, i) => SLOTS_PER_RAIL + i),
  ...Array.from({ length: SLOTS_PER_RAIL }, (_, i) => i),
]

// Place as many as will fit. Returns how many were left over.
function place(slots, width, count, powered) {
  const span = POWERED_SPAN[width]
  for (const index of SLOT_ORDER) {
    if (count <= 0) break
    if (!canPlace(slots, index, span)) continue
    slots[index] = { width, role: "primary" }
    if (span === 2) slots[index + 1] = { width, role: "secondary" }
    powered[width] += 1
    count -= 1
  }
  return count
}

export function solvePowered(input) {
  const counts = readCounts(input)
  const slots = Array(SLOT_COUNT).fill(null)
  const powered = { 8: 0, 12: 0, 16: 0, 24: 0 }
  const leftover = {}
  for (const width of WIDTHS) leftover[width] = counts[width].total

  for (const width of POWERED_ORDER) {
    const unmet = place(slots, width, counts[width].priority, powered)
    leftover[width] = counts[width].total - counts[width].priority + unmet
  }
  for (const width of POWERED_ORDER) {
    leftover[width] = place(slots, width, leftover[width], powered)
  }

  return { slots, powered, leftover }
}
