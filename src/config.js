// Tape widths the tool knows about, narrowest first. 32mm has no powered feeder.
export const WIDTHS = [8, 12, 16, 24, 32]

// How many rail slots a powered feeder consumes. 16mm and 24mm take two,
// and those two have to sit on the same rail.
export const POWERED_SPAN = { 8: 1, 12: 1, 16: 2, 24: 2 }

export const SLOTS_PER_RAIL = 25
export const RAIL_COUNT = 2

export const FEEDER_COLORS = {
  8: "#3b82f6",
  12: "#14b8a6",
  16: "#eab308",
  24: "#f97316",
  32: "#a855f7",
}

// Plate frame: origin at the bottom-left of the staging plate, +X to the
// right, +Y toward the back of the machine. The staging plate is 600 wide
// and 120 tall. Two build plates, each 600 by 75, are mounted above it, so
// the stack is 270 tall. Holes keep the staging plate's 15mm lattice and
// stay off the edges where the plates meet.
//
// The working area is the L from the layout drawing (390 wide, 270 tall,
// 315 along the bottom). It is centered on the 600mm plates and its bottom
// edge is the bottom of the staging plate. The step is raised just above
// the camera cutout so the outline does not cross it.
export const PLATE_WIDTH = 600
export const PLATES = [
  { id: "staging", y: 0, height: 120 },
  { id: "build", y: 120, height: 75 },
  { id: "build", y: 195, height: 75 },
]

export const config = {
  workArea: {
    x: (PLATE_WIDTH - 390) / 2,
    y: 0,
    width: 390,
    height: 270,
    notchWidth: 75,
    // Camera cutout is centered at y=60 with radius 30, so it tops out at
    // y=90. The step sits 2mm above that.
    notchHeight: 92,
  },
  // Keep-out around a placed board. Strip feeders stay out of this margin.
  pcbMargin: 2,
  // A strip feeder may be placed where at least this many of its holes
  // land on plate holes.
  minScrews: 2,
  rails: {
    x: 50,
    pitch: 20,
    depth: 34,
    gap: 1.4,
    // Bottom edge of each rail bar, in the plate frame.
    frontY: -72,
    backY: 308,
  },
  // Initial camera window, in the plate frame. Height follows the viewport.
  view: {
    x: -30,
    y: -110,
    width: 700,
    height: 490,
  },
  shop: {
    lumenId: "40225822965947",
    cart: "https://index-machines.myshopify.com/cart/",
    stripBase: "https://www.opulo.io/products/lumenpnp-strip-feeder?variant=",
    // Cart permalinks use the variant id. `product` is the admin product id.
    powered: {
      8: { product: "8403010551995", variant: "47762119065787", handle: "8mm-feeder-5-pack" },
      12: { product: "8403010977979", variant: "47762121097403", handle: "12mm-feeder-5-pack" },
      16: { product: "8403011502267", variant: "47762123784379", handle: "16mm-feeder-5-pack" },
      24: { product: "8403011961019", variant: "47762127061179", handle: "24mm-feeder-5-pack" },
    },
    // One variety pack is 3× 16mm and 2× 24mm, at the same price as a five-pack.
    variety: {
      product: "8454896156859",
      variant: "47993651069115",
      handle: "16-24mm-feeder-variety-pack",
      sixteen: 3,
      twentyFour: 2,
    },
    strip: {
      8: "44789644132539",
      12: "44789644198075",
      16: "44789644230843",
      24: "44789644263611",
      32: "44789644296379",
    },
    packSize: 5,
  },
}

export function workRect(area = config.workArea) {
  return { x0: area.x, y0: area.y, x1: area.x + area.width, y1: area.y + area.height }
}

export function notchRect(area = config.workArea) {
  return {
    x0: area.x,
    y0: area.y,
    x1: area.x + area.notchWidth,
    y1: area.y + area.notchHeight,
  }
}
