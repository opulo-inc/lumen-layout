// All five-packs cost the same, so the cheapest order is the one with the
// fewest packs. A variety pack is used when it covers a mix of 16mm and 24mm
// feeders in fewer packs than buying those widths on their own.

function packsFor(needed, each) {
  if (needed <= 0) return 0
  return Math.ceil(needed / each)
}

function better(score, best) {
  for (let i = 0; i < score.length; i++) {
    if (score[i] !== best[i]) return score[i] < best[i]
  }
  return false
}

export function planWidePacks(sixteen, twentyFour, variety = { sixteen: 3, twentyFour: 2 }, packSize = 5) {
  const vMax = Math.max(packsFor(sixteen, variety.sixteen), packsFor(twentyFour, variety.twentyFour))
  let best = null
  for (let v = 0; v <= vMax; v++) {
    const p16 = packsFor(sixteen - variety.sixteen * v, packSize)
    const p24 = packsFor(twentyFour - variety.twentyFour * v, packSize)
    const got16 = variety.sixteen * v + packSize * p16
    const got24 = variety.twentyFour * v + packSize * p24
    const packs = v + p16 + p24
    const spare16 = got16 - sixteen
    const spare24 = got24 - twentyFour
    const unwanted = (sixteen === 0 ? spare16 : 0) + (twentyFour === 0 ? spare24 : 0)
    const score = [packs, unwanted, spare16 + spare24, -v]
    if (!best || better(score, best.score)) best = { variety: v, sixteen: p16, twentyFour: p24, score }
  }
  return { variety: best.variety, sixteen: best.sixteen, twentyFour: best.twentyFour }
}

export function productUrl(item) {
  if (!item?.handle || !item.variant) return null
  return `https://www.opulo.io/products/${item.handle}?variant=${item.variant}`
}
