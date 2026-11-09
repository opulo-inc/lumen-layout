import { readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { describe, expect, it } from "vitest"
import { loadBoard, resolveBoardSize } from "../src/gerber.js"

const dir = fileURLToPath(new URL("./fixtures/", import.meta.url))
const zipPath = fileURLToPath(new URL("../test.zip", import.meta.url))

function dxf(layer, entities, insunits = 1) {
  const body = entities
    .map((e) =>
      e.circle
        ? `0\nCIRCLE\n8\n${layer}\n10\n${e.x}\n20\n${e.y}\n40\n${e.r}\n`
        : `0\nLINE\n8\n${layer}\n10\n${e[0]}\n20\n${e[1]}\n11\n${e[2]}\n21\n${e[3]}\n`,
    )
    .join("")
  return `0\nSECTION\n2\nHEADER\n9\n$INSUNITS\n70\n${insunits}\n0\nENDSEC\n0\nSECTION\n2\nENTITIES\n${body}0\nENDSEC\n0\nEOF\n`
}

function square(x0, y0, x1, y1) {
  return [
    [x0, y0, x1, y0],
    [x1, y0, x1, y1],
    [x1, y1, x0, y1],
    [x0, y1, x0, y0],
  ]
}

function file(name, text) {
  return { name, text: async () => text }
}

describe("gerbers", () => {
  it("renders a top-side board and reports its size in millimetres", async () => {
    const board = await loadBoard([
      dir + "board-Edge_Cuts.gm1",
      dir + "board-F_Cu.gtl",
    ])
    expect(board.units).toBe("mm")
    expect(board.width).toBeCloseTo(30, 0)
    expect(board.height).toBeCloseTo(20, 0)
    expect(board.svg).toContain("<svg")
    expect(board.svg).toContain('d="M0 0L30 0L30 -20L0 -20L0 0"')
    expect(board.svg).toContain('d="M2 -2L28 -2L28 -18L2 -18L2 -2"')
    expect(board.svg).not.toContain("<rect")
    expect(board.viewBox).toHaveLength(4)
    expect(board.layers).toHaveLength(2)
    expect(board.assumed).toBe(false)
  })

  it("draws copper, solder mask, silk, and the edge-cuts outline", async () => {
    const board = await loadBoard([
      dir + "board-Edge_Cuts.gm1",
      dir + "board-F_Cu.gtl",
      dir + "board-F_Mask.gts",
      dir + "board-F_Silkscreen.gto",
    ])
    expect(board.svg).toContain('fill="#d4922a"')
    expect(board.svg).toContain('fill="#1f7a45"')
    expect(board.svg).toContain('fill="#f6f1e4"')
    expect(board.svg).toContain('stroke="#1c1917"')
    expect(board.svg).toContain('d="M0 0L30 0L30 -20L0 -20L0 0"')
    expect(board.layers).toHaveLength(4)
  })

  it("treats a unitless millimetre file as millimetres instead of inches", async () => {
    const board = await loadBoard([dir + "board-nounits-Edge_Cuts.gm1"])
    expect(board.assumed).toBe(true)
    expect(board.units).toBe("mm")
    expect(board.width).toBeCloseTo(30, 0)
    expect(board.height).toBeCloseTo(20, 0)
  })

  it("keeps an explicit inch board in inches", async () => {
    const board = await loadBoard([dir + "board-inch-Edge_Cuts.gm1"])
    expect(board.assumed).toBe(false)
    expect(board.units).toBe("in")
    expect(board.width).toBeCloseTo(50.8, 0)
    expect(board.height).toBeCloseTo(38.1, 0)
  })

  it("renders a KiCad DXF plot in millimetres", async () => {
    const board = await loadBoard([
      file("board-Edge_Cuts.dxf", dxf("Edge.Cuts", square(0, 0, 1, 1))),
      file("board-F_Cu.dxf", dxf("F.Cu", square(0.2, 0.2, 0.8, 0.8))),
      file("board-F_Mask.dxf", dxf("F.Mask", [{ circle: true, x: 0.5, y: 0.5, r: 0.1 }])),
      file("board-F_Silkscreen.dxf", dxf("F.Silkscreen", square(0.1, 0.9, 0.3, 0.95))),
    ])
    expect(board.assumed).toBe(false)
    expect(board.units).toBe("in")
    expect(board.width).toBeCloseTo(25.4, 1)
    expect(board.height).toBeCloseTo(25.4, 1)
    expect(board.svg).toContain("M0 25.4L25.4 25.4L25.4 0L0 0L0 25.4Z")
    expect(board.svg).toContain('fill="#d4922a"')
    expect(board.svg).toContain('fill="#1f7a45"')
    expect(board.svg).toContain('fill="#f6f1e4"')
    expect(board.svg).toContain('stroke="#1c1917"')
    expect(board.layers).toHaveLength(4)
  })

  it("renders the KiCad DXF fabrication zip", async () => {
    const board = await loadBoard([new File([readFileSync(zipPath)], "test.zip")])
    expect(board.assumed).toBe(false)
    expect(board.units).toBe("in")
    expect(board.width).toBeCloseTo(71.6, 0)
    expect(board.height).toBeCloseTo(80.0, 0)
    expect(board.svg).toContain('fill="#d4922a"')
    expect(board.svg).toContain('fill="#1f7a45"')
    expect(board.svg).toContain('fill="#f6f1e4"')
    expect(board.svg).toContain('stroke="#1c1917"')
    expect(board.layers.slice().sort()).toEqual([
      "feeder-mobo-ott-Edge_Cuts.dxf",
      "feeder-mobo-ott-F_Cu.dxf",
      "feeder-mobo-ott-F_Mask.dxf",
      "feeder-mobo-ott-F_Silkscreen.dxf",
    ])
  }, 20000)

  it("flips an explicit inch reading when the board is bigger than the plate", () => {
    const size = resolveBoardSize(100, 80, "in", true)
    expect(size.assumed).toBe(true)
    expect(size.units).toBe("mm")
    expect(size.width).toBeCloseTo(100, 5)
    expect(size.height).toBeCloseTo(80, 5)
  })
})