import { config, notchRect, workRect } from "./config.js"
import { rectsOverlap } from "./stripSolver.js"

// A board stores its un-rotated bottom-left corner. Rotation is about the
// center, in 90 degree steps, counter-clockwise in the plate frame.
export function boardFootprint(board) {
  const swapped = board.rot % 180 !== 0
  const width = swapped ? board.height : board.width
  const height = swapped ? board.width : board.height
  const cx = board.x + board.width / 2
  const cy = board.y + board.height / 2
  return { x0: cx - width / 2, y0: cy - height / 2, x1: cx + width / 2, y1: cy + height / 2 }
}

function overlapsNotch(board) {
  return rectsOverlap(boardFootprint(board), notchRect())
}

// Snap to 1mm and keep the board inside the L. A board larger than the L
// is left where it is so it can still be inspected.
export function clampBoard(board) {
  const work = workRect()
  const footprint = boardFootprint(board)
  const width = footprint.x1 - footprint.x0
  const height = footprint.y1 - footprint.y0
  const minX = work.x0 + width / 2
  const maxX = work.x1 - width / 2
  const minY = work.y0 + height / 2
  const maxY = work.y1 - height / 2
  if (minX > maxX || minY > maxY) return { ...board }

  let cx = Math.round(board.x + board.width / 2)
  let cy = Math.round(board.y + board.height / 2)
  cx = Math.min(maxX, Math.max(minX, cx))
  cy = Math.min(maxY, Math.max(minY, cy))

  const moved = () => ({
    ...board,
    x: cx - board.width / 2,
    y: cy - board.height / 2,
  })

  let next = moved()
  if (!overlapsNotch(next)) return next

  const notch = notchRect()
  const box = boardFootprint(next)
  const pushRight = notch.x1 - box.x0
  const pushUp = notch.y1 - box.y0
  const fitsRight = cx + pushRight <= maxX + 1e-6
  const fitsUp = cy + pushUp <= maxY + 1e-6
  if (fitsRight && (!fitsUp || pushRight <= pushUp)) cx += pushRight
  else if (fitsUp) cy += pushUp
  else if (fitsRight) cx += pushRight

  cx = Math.round(cx)
  cy = Math.round(cy)
  cx = Math.min(maxX, Math.max(minX, cx))
  cy = Math.min(maxY, Math.max(minY, cy))
  next = moved()
  if (!overlapsNotch(next)) return next

  // The 1mm snap can step back into the notch. Nudge clear of it.
  const again = boardFootprint(next)
  if (cx + (notch.x1 - again.x0) <= maxX) cx += notch.x1 - again.x0
  else cy += notch.y1 - again.y0
  return moved()
}

export function initialBoardPosition(board) {
  const area = config.workArea
  const x = area.x + area.notchWidth + 8
  const y = area.y + 8
  return clampBoard({ ...board, x, y, rot: 0 })
}
