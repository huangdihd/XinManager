/*
 * Custom meshing-worker entry.
 *
 * Wraps prismarine-viewer's worker and adds a `rawColumn` message: the main
 * thread sends the raw [lx, absY, lz, stateId] array and the ChunkColumn is
 * built HERE (the worker already bundles prismarine-chunk + minecraft-data),
 * then forwarded as the normal `chunk` message.
 *
 * This keeps prismarine-chunk/minecraft-data OUT of the main browser bundle.
 * minY / worldHeight are passed per-chunk so different worlds are supported.
 */
const Chunks = require('prismarine-chunk')
const { Vec3 } = require('vec3')

require('prismarine-viewer/viewer/lib/worker.js')

const orig = self.onmessage
let ChunkClass = null
let _minY = -64
let _worldHeight = 384

self.onmessage = (ev) => {
  const d = ev.data
  if (d.type === 'version') {
    ChunkClass = Chunks(d.version)
    orig(ev)
    return
  }
  if (d.type === 'rawColumn') {
    if (!ChunkClass) return
    // Accept dynamic minY/worldHeight from the main thread
    const minY = d.minY != null ? d.minY : _minY
    const worldHeight = d.worldHeight || _worldHeight
    const col = new ChunkClass({ minY, worldHeight })
    const v = new Vec3(0, 0, 0)
    const blocks = d.blocks
    for (let i = 0; i < blocks.length; i++) {
      const b = blocks[i]
      v.x = b[0]; v.y = b[1]; v.z = b[2]
      col.setBlockStateId(v, b[3])
    }
    orig({ data: { type: 'chunk', x: d.x, z: d.z, chunk: col.toJson() } })
    return
  }
  orig(ev)
}
