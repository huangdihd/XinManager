/*
 * Slim minecraft-data module: only provides 1.21.11 pc data.
 * Any version request falls back to 1.21 data (worker only uses blocks/tints).
 */

const mcDataToNode = require('minecraft-data/lib/loader')
const supportFeature = require('minecraft-data/lib/supportsFeature')
const indexer = require('minecraft-data/lib/indexer.js')

const protocolVersions = {
  pc: require('minecraft-data/minecraft-data/data/pc/common/protocolVersions.json'),
  bedrock: require('minecraft-data/minecraft-data/data/bedrock/common/protocolVersions.json')
}

const versionsByMC = {}
const versionsByMajor = {}
const preNettyByProto = {}
const postNettyByProto = {}

for (const type of ['pc', 'bedrock']) {
  const arr = protocolVersions[type]
  for (let i = 0; i < arr.length; i++) {
    if (!arr[i].dataVersion) arr[i].dataVersion = -i
  }
  versionsByMC[type] = indexer.buildIndexFromArray(arr, 'minecraftVersion')
  versionsByMajor[type] = indexer.buildIndexFromArray(arr.slice().reverse(), 'majorVersion')
  preNettyByProto[type] = indexer.buildIndexFromArrayNonUnique(arr.filter(e => !e.usesNetty), 'version')
  postNettyByProto[type] = indexer.buildIndexFromArrayNonUnique(arr.filter(e => e.usesNetty), 'version')
}

function Version (type, version, majorVersion) {
  const vers = versionsByMC[type]
  for (const k in vers) {
    if (vers[k].minecraftVersion.endsWith('.0')) vers[vers[k].majorVersion] = vers[k]
  }
  this.dataVersion = vers[version]?.dataVersion
  const v1 = this.dataVersion ?? 0
  const raise = o => { throw new RangeError("Version '" + o + "' not found for " + type) }
  this['>='] = o => vers[o] ? v1 >= vers[o].dataVersion : raise(o)
  this['>'] = o => vers[o] ? v1 > vers[o].dataVersion : raise(o)
  this['<'] = o => vers[o] ? v1 < vers[o].dataVersion : raise(o)
  this['<='] = o => vers[o] ? v1 <= vers[o].dataVersion : raise(o)
  this['=='] = o => vers[o] ? v1 === vers[o].dataVersion : raise(o)
  this.type = type
  this.majorVersion = majorVersion
}

const cache = {}

// Only 1.21 data loaded explicitly; fallback for other versions
const data = {
  pc: {
    '1.21': {
      get blocks () { return require('minecraft-data/minecraft-data/data/pc/1.21.11/blocks.json') },
      get blockCollisionShapes () { return require('minecraft-data/minecraft-data/data/pc/1.21.11/blockCollisionShapes.json') },
      get biomes () { return require('minecraft-data/minecraft-data/data/pc/1.21.11/biomes.json') },
      get version () { return require('minecraft-data/minecraft-data/data/pc/1.21.11/version.json') },
      get tints () { return require('minecraft-data/minecraft-data/data/pc/1.21.11/tints.json') }
    }
  },
  bedrock: {}
}

function loadData (type, majorVersion) {
  // Direct hit
  if (data[type] && data[type][majorVersion]) return data[type][majorVersion]
  // Fall back to 1.21 pc data (worker only uses blocks/tints anyway)
  if (type === 'pc') return data.pc['1.21']
  // Bedrock falls back to pc
  return data.pc['1.21']
}

module.exports = function (mcVersion, preNetty) {
  preNetty = preNetty || false
  mcVersion = String(mcVersion).replace('pe_', 'bedrock_')
  const major = toMajor(mcVersion, preNetty)
  if (!major) return null
  const key = major.type + '_' + major.majorVersion + '_' + major.dataVersion
  if (cache[key]) return cache[key]
  const raw = loadData(major.type, major.majorVersion)
  if (!raw) return null
  const out = mcDataToNode(raw)
  out.type = major.type
  out.isNewerOrEqualTo = v => out.version['>='](v)
  out.isOlderThan = v => out.version['<'](v)
  out.version = Object.assign(major, out.version)
  cache[key] = out
  out.supportFeature = supportFeature(out.version, protocolVersions[out.type])
  return out
}

module.exports.Version = Version

function toMajor (mcVersion, preNetty, typeArg) {
  const parts = String(mcVersion).split('_')
  const type = typeArg || (parts.length === 2 ? parts[0] : 'pc')
  const version = parts.length === 2 ? parts[1] : mcVersion
  let major
  if (data[type] && data[type][version]) {
    major = version
  } else if (versionsByMC[type] && versionsByMC[type][version]) {
    major = versionsByMC[type][version].majorVersion
  } else if (preNetty && preNettyByProto[type] && preNettyByProto[type][version]) {
    return toMajor(preNettyByProto[type][version][0].minecraftVersion, preNetty, type)
  } else if (!preNetty && postNettyByProto[type] && postNettyByProto[type][version]) {
    const vs = postNettyByProto[type][version]
    const noSnap = vs.filter(el => !/[a-zA-Z]/g.test(el.minecraftVersion))
    return toMajor(noSnap[0] ? noSnap[0].minecraftVersion : vs[0].minecraftVersion, preNetty, type)
  } else if (versionsByMajor[type] && versionsByMajor[type][version]) {
    major = versionsByMajor[type][version].minecraftVersion
  } else {
    // Absolute fallback: return 1.21.11
    return new Version('pc', '1.21.11', '1.21')
  }
  return new Version(type, version, major)
}

module.exports.supportedVersions = {
  pc: require('minecraft-data/minecraft-data/data/pc/common/versions.json'),
  bedrock: require('minecraft-data/minecraft-data/data/bedrock/common/versions.json')
}
module.exports.versions = protocolVersions
module.exports.versionsByMinecraftVersion = versionsByMC
module.exports.preNettyVersionsByProtocolVersion = preNettyByProto
module.exports.postNettyVersionsByProtocolVersion = postNettyByProto
module.exports.legacy = {
  pc: require('minecraft-data/minecraft-data/data/pc/common/legacy.json'),
  bedrock: require('minecraft-data/minecraft-data/data/bedrock/common/legacy.json')
}
module.exports.schemas = {
  biomes: require('minecraft-data/minecraft-data/schemas/biomes_schema.json'),
  blocks: require('minecraft-data/minecraft-data/schemas/blocks_schema.json'),
  version: require('minecraft-data/minecraft-data/schemas/version_schema.json')
}
