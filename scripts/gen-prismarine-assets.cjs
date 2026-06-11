/*
 * 为 prismarine-viewer 生成指定 Minecraft 版本的材质 atlas + blocksStates。
 * prismarine-viewer 预构建只到 1.21.4，本脚本用 minecraft-assets 为更新版本
 * （默认 1.21.11）生成，输出到 public/prismarine/ 供前端 viewer 加载。
 *
 * 用法: node scripts/gen-prismarine-assets.cjs [version]
 */
const path = require('path')
const fs = require('fs-extra')
const mcAssets = require('minecraft-assets')
const { makeTextureAtlas } = require('prismarine-viewer/viewer/lib/atlas')
const { prepareBlocksStates } = require('prismarine-viewer/viewer/lib/modelsBuilder')

const version = process.argv[2] || '1.21.11'

const texturesDir = path.resolve(__dirname, '../public/prismarine/textures')
const statesDir = path.resolve(__dirname, '../public/prismarine/blocksStates')
fs.mkdirSync(texturesDir, { recursive: true })
fs.mkdirSync(statesDir, { recursive: true })

const assets = mcAssets(version)
if (!assets) {
  console.error(`minecraft-assets has no data for ${version}`)
  process.exit(1)
}

const atlas = makeTextureAtlas(assets)
// canvas 3.x: 用 toBuffer 而非已废弃的 pngStream
fs.writeFileSync(path.resolve(texturesDir, version + '.png'), atlas.canvas.toBuffer('image/png'))

const blocksStates = JSON.stringify(prepareBlocksStates(assets, atlas))
fs.writeFileSync(path.resolve(statesDir, version + '.json'), blocksStates)

console.log(`Generated public/prismarine/textures/${version}.png and blocksStates/${version}.json`)
