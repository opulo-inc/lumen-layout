import { describe, expect, it } from "vitest"
import { planWidePacks } from "../src/shop.js"

describe("16mm and 24mm packs", () => {
  it("buys nothing when neither width is needed", () => {
    expect(planWidePacks(0, 0)).toEqual({ variety: 0, sixteen: 0, twentyFour: 0 })
  })

  it("uses a single-width five-pack when the other width is not needed", () => {
    expect(planWidePacks(5, 0)).toEqual({ variety: 0, sixteen: 1, twentyFour: 0 })
    expect(planWidePacks(0, 5)).toEqual({ variety: 0, sixteen: 0, twentyFour: 1 })
  })

  it("uses one variety pack for 3× 16mm and 2× 24mm", () => {
    expect(planWidePacks(3, 2)).toEqual({ variety: 1, sixteen: 0, twentyFour: 0 })
  })

  it("prefers a variety pack over two five-packs for a small mix", () => {
    expect(planWidePacks(1, 1)).toEqual({ variety: 1, sixteen: 0, twentyFour: 0 })
    expect(planWidePacks(4, 2)).toEqual({ variety: 2, sixteen: 0, twentyFour: 0 })
  })

  it("keeps separate five-packs when they cover an even 5 and 5 in fewer packs", () => {
    expect(planWidePacks(5, 5)).toEqual({ variety: 0, sixteen: 1, twentyFour: 1 })
  })

  it("tops up a variety pack with a five-pack for the width that is still short", () => {
    expect(planWidePacks(8, 2)).toEqual({ variety: 1, sixteen: 1, twentyFour: 0 })
    expect(planWidePacks(6, 4)).toEqual({ variety: 2, sixteen: 0, twentyFour: 0 })
  })
})
