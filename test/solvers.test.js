import { describe, expect, it } from "vitest"
import geometry from "../src/geometry.json"
import { config } from "../src/config.js"
import { solvePowered } from "../src/poweredSolver.js"
import {
  buildPlateHoles,
  countScrews,
  feederCandidates,
  rectsOverlap,
  snapStrip,
  solveStrips,
} from "../src/stripSolver.js"

function job(partial) {
  const input = {}
  for (const width of [8, 12, 16, 24, 32]) {
    input[width] = { total: 0, priority: 0, ...partial[width] }
  }
  return input
}

describe("powered feeders", () => {
  it("never lets a 16mm or 24mm feeder straddle the two rails", () => {
    const result = solvePowered(job({ 16: { total: 40, priority: 40 }, 24: { total: 40, priority: 10 } }))
    for (let i = 0; i < result.slots.length; i++) {
      const slot = result.slots[i]
      if (!slot || slot.role !== "primary") continue
      if (slot.width !== 16 && slot.width !== 24) continue
      expect(i % 25).not.toBe(24)
      expect(result.slots[i + 1]).toMatchObject({ width: slot.width, role: "secondary" })
      expect(Math.floor(i / 25)).toBe(Math.floor((i + 1) / 25))
    }
    expect(result.slots[24]).toBeNull()
    expect(result.slots[49]).toBeNull()
  })

  it("fills priority parts before non-priority parts", () => {
    const result = solvePowered(
      job({ 8: { total: 60, priority: 0 }, 24: { total: 10, priority: 10 } })
    )
    expect(result.powered[24]).toBe(10)
    expect(result.powered[8]).toBe(30)
    expect(result.leftover[8]).toBe(30)
    expect(result.leftover[24]).toBe(0)
    // Front rail is slots 25-49, and it fills before the back rail.
    const front = result.slots.slice(25, 45).every((slot) => slot && slot.width === 24)
    expect(front).toBe(true)
    expect(result.slots.slice(0, 25).every((slot) => slot && slot.width === 8)).toBe(true)
  })

  it("fills the front rail before the back rail", () => {
    const result = solvePowered(job({ 8: { total: 10, priority: 0 } }))
    expect(result.slots.slice(25, 35).every((slot) => slot && slot.width === 8)).toBe(true)
    expect(result.slots.slice(0, 25).every((slot) => slot === null)).toBe(true)
  })

  it("sends 32mm tape and anything that does not fit to strips", () => {
    const result = solvePowered(job({ 8: { total: 3, priority: 3 }, 32: { total: 4, priority: 4 } }))
    expect(result.powered[8]).toBe(3)
    expect(result.slots.some((slot) => slot && slot.width === 32)).toBe(false)
    expect(result.leftover[32]).toBe(4)
    expect(result.leftover[8]).toBe(0)
  })
})

describe("plates", () => {
  const holes = buildPlateHoles(geometry)
  const has = (x, y) => holes.some(([hx, hy]) => hx === x && hy === y)

  it("centers the working area on the 600mm plates", () => {
    expect(config.workArea.x).toBe(105)
    expect(config.workArea.x + config.workArea.width / 2).toBe(300)
  })

  it("continues the hole grid onto both build plates and skips the seams", () => {
    expect(has(15, 135)).toBe(true)
    expect(has(15, 255)).toBe(true)
    expect(has(30, 120)).toBe(false)
    expect(has(15, 195)).toBe(false)
    expect(has(30, 270)).toBe(false)
  })
})

describe("strip feeders", () => {
  const holes = buildPlateHoles(geometry)
  const holeSet = new Set(holes.map(([x, y]) => `${Math.round(x * 100)},${Math.round(y * 100)}`))

  function missesCamera(box) {
    const cam = geometry.plate.camera
    const nearestX = Math.max(box.x0, Math.min(cam.x, box.x1))
    const nearestY = Math.max(box.y0, Math.min(cam.y, box.y1))
    return Math.hypot(nearestX - cam.x, nearestY - cam.y) > cam.r
  }

  it("keeps the working area and strip feeders clear of the camera", () => {
    const cam = geometry.plate.camera
    expect(config.workArea.y + config.workArea.notchHeight).toBeGreaterThan(cam.y + cam.r)
    const result = solveStrips({ 8: 20, 12: 8, 16: 4, 32: 4 }, null, geometry, config)
    expect(result.placements.length).toBeGreaterThan(0)
    for (const placement of result.placements) expect(missesCamera(placement)).toBe(true)
    const dragged = snapStrip(
      result.placements[0],
      { x: cam.x, y: cam.y },
      result.placements.slice(1),
      null,
      geometry,
      config
    )
    expect(missesCamera(dragged)).toBe(true)
  })

  it("only places feeders that screw down to the plate and do not overlap", () => {
    const result = solveStrips(
      { 8: 6, 12: 3, 16: 2, 24: 2, 32: 2 },
      null,
      geometry,
      config
    )
    expect(result.placements.length).toBeGreaterThan(0)
    for (const placement of result.placements) {
      const feeder = geometry.feeders[String(placement.width)]
      const screws = countScrews(feeder, placement.rot, placement.tx, placement.ty, holeSet)
      expect(screws).toBeGreaterThanOrEqual(config.minScrews)
      expect(placement.rot).toBe(0)
    }
    for (let i = 0; i < result.placements.length; i++) {
      for (let j = i + 1; j < result.placements.length; j++) {
        expect(rectsOverlap(result.placements[i], result.placements[j])).toBe(false)
      }
    }
    const used = {}
    for (const placement of result.placements) {
      used[placement.width] = (used[placement.width] ?? 0) + placement.lanes
    }
    for (const width of [8, 12, 16, 24, 32]) {
      expect(used[width] + result.unallocated[width]).toBeGreaterThanOrEqual({ 8: 6, 12: 3, 16: 2, 24: 2, 32: 2 }[width])
    }
  })

  it("offers the 32mm feeder both alignments, 4.5mm apart", () => {
    const feeder = geometry.feeders["32"]
    const work = {
      x0: config.workArea.x,
      y0: config.workArea.y,
      x1: config.workArea.x + config.workArea.width,
      y1: config.workArea.y + config.workArea.height,
    }
    const notch = {
      x0: config.workArea.x,
      y0: config.workArea.y,
      x1: config.workArea.x + config.workArea.notchWidth,
      y1: config.workArea.y + config.workArea.notchHeight,
    }
    const candidates = feederCandidates(feeder, holes, holeSet, work, notch, [], 2).filter(
      (candidate) => candidate.rot === 0
    )
    const byRow = new Map()
    for (const candidate of candidates) {
      const row = Math.round(candidate.ty * 100)
      if (!byRow.has(row)) byRow.set(row, [])
      byRow.get(row).push(candidate.tx)
    }
    let foundShift = false
    for (const txs of byRow.values()) {
      const sorted = [...new Set(txs.map((tx) => Math.round(tx * 100)))].sort((a, b) => a - b)
      for (let i = 1; i < sorted.length; i++) {
        if (sorted[i] - sorted[i - 1] === 450) foundShift = true
      }
    }
    expect(foundShift).toBe(true)
  })

  it("keeps placed strip feeders and only appends new ones", () => {
    const first = solveStrips({ 8: 3 }, null, geometry, config)
    const kept = {
      ...first.placements[0],
      x0: first.placements[0].x0 + 60,
      x1: first.placements[0].x1 + 60,
      tx: first.placements[0].tx + 60,
    }
    const more = solveStrips({ 8: 6 }, null, geometry, config, [kept])
    expect(more.placements[0]).toEqual(kept)
    expect(more.placements).toHaveLength(2)
    expect(rectsOverlap(more.placements[0], more.placements[1])).toBe(false)

    const fewer = solveStrips({ 8: 3 }, null, geometry, config, more.placements)
    expect(fewer.placements).toEqual([kept])
  })

  it("snaps a dragged strip onto another upright hole pattern", () => {
    const result = solveStrips({ 8: 4 }, null, geometry, config)
    const [first, second] = result.placements
    const moved = snapStrip(first, { x: first.x0 + 80, y: (first.y0 + first.y1) / 2 }, [second], null, geometry, config)
    expect(moved.rot).toBe(0)
    expect(rectsOverlap(moved, second)).toBe(false)
    const screws = countScrews(geometry.feeders["8"], moved.rot, moved.tx, moved.ty, holeSet)
    expect(screws).toBeGreaterThanOrEqual(config.minScrews)
    expect(moved.x0).not.toBe(first.x0)
  })

  it("places fewer strip feeders when a board occupies the area", () => {
    const demand = { 8: 40, 12: 20, 16: 10, 24: 8, 32: 6 }
    const open = solveStrips(demand, null, geometry, config)
    const board = {
      x0: config.workArea.x + 90,
      y0: config.workArea.y + 40,
      x1: config.workArea.x + 340,
      y1: config.workArea.y + 230,
    }
    const blocked = solveStrips(demand, board, geometry, config)
    expect(open.placements.length).toBeGreaterThan(0)
    expect(blocked.placements.length).toBeLessThan(open.placements.length)
    for (const placement of blocked.placements) {
      expect(rectsOverlap(placement, board)).toBe(false)
    }
  })
})
