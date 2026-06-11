/*
 * Browser shim for the Node `canvas` package.
 * prismarine-viewer's entities.js only uses createCanvas (player nameplate);
 * everything else (atlas/modelsBuilder) runs in Node during asset generation,
 * never in the browser bundle.
 */
export function createCanvas(width, height) {
  const c = document.createElement('canvas')
  c.width = width
  c.height = height
  return c
}

export function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

export const Canvas = typeof HTMLCanvasElement !== 'undefined' ? HTMLCanvasElement : class {}
export const Image = typeof globalThis !== 'undefined' && globalThis.Image ? globalThis.Image : class {}

export default { createCanvas, loadImage, Canvas, Image }
