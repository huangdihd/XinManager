<!--
  -   Copyright (C) 2025 huangdihd
  -
  -   This program is free software: you can redistribute it and/or modify
  -   it under the terms of the GNU General Public License as published by
  -   the Free Software Foundation, either version 3 of the License, or
  -   (at your option) any later version.
  -
  -   This program is distributed in the hope that it will be useful,
  -   but WITHOUT ANY WARRANTY; without even the implied warranty of
  -   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  -   GNU General Public License for more details.
  -
  -   You should have received a copy of the GNU General Public License
  -   along with this program.  If not, see <https://www.gnu.org/licenses/>.
  -->

<template>
  <!-- 注意：client 页面的根元素会丢失 scoped 样式的 data-v 属性，
       所以这里用全局 Tailwind 工具类做尺寸定位，不要依赖 scoped CSS。 -->
  <div ref="rootEl" class="viewer-root relative h-screen w-full overflow-hidden">
    <canvas ref="canvas" class="viewer-canvas" />

    <!-- loading / error overlay -->
    <div class="panel" v-if="!connected">
      <h3>🌍 World Viewer</h3>
      <p>{{ statusText }}</p>
    </div>

    <!-- status bar -->
    <div class="status" v-if="connected">
      <span :style="{ color: statusColor }">{{ statusText }}</span>
      <span style="margin-left: auto">chunks:{{ chunkCount }}</span>
    </div>

    <!-- hotbar overlay -->
    <div class="hotbar-overlay" v-if="connected">
      <div class="hotbar-row">
        <div
          v-for="(slot, idx) in HOTBAR"
          :key="slot"
          class="hotbar-slot"
          :class="{ selected: heldSlot === idx }"
          @click="onSlotClick(slot, $event)"
          @click.right.prevent="onSlotRight(slot)"
        >
          <div class="slot-number">{{ idx + 1 }}</div>
          <div class="slot-item" v-if="inventorySlots[slot]">
            <img
              v-if="!iconFailed.has(inventorySlots[slot].name)"
              class="item-icon"
              :src="iconSrc(inventorySlots[slot].name)"
              :title="inventorySlots[slot].displayName"
              @error="onIconErr($event, inventorySlots[slot].name)"
            />
            <span v-else class="item-name">{{ inventorySlots[slot].displayName }}</span>
            <span class="item-count" v-if="inventorySlots[slot].count > 1">{{ inventorySlots[slot].count }}</span>
          </div>
        </div>
        <button class="expand-btn" @click="invExpanded = !invExpanded" title="展开背包">
          {{ invExpanded ? '▼' : '▲' }}
        </button>
      </div>

      <!-- expanded inventory -->
      <div class="inventory-panel" v-if="invExpanded">
        <div class="inv-grid">
          <div
            v-for="slot in MAIN"
            :key="'inv_' + slot"
            class="inv-slot"
            @click="onSlotClick(slot, $event)"
            @click.right.prevent="onSlotRight(slot)"
          >
            <div class="slot-item" v-if="inventorySlots[slot]">
              <img
                v-if="!iconFailed.has(inventorySlots[slot].name)"
                class="item-icon"
                :src="iconSrc(inventorySlots[slot].name)"
                :title="inventorySlots[slot].displayName"
                @error="onIconErr($event, inventorySlots[slot].name)"
              />
              <span v-else class="item-name">{{ inventorySlots[slot].displayName }}</span>
              <span class="item-count" v-if="inventorySlots[slot].count > 1">{{ inventorySlots[slot].count }}</span>
            </div>
          </div>
        </div>
        <div class="armor-row">
          <div
            v-for="slot in ARMOR"
            :key="'armor_' + slot"
            class="inv-slot armor"
            @click="onSlotClick(slot, $event)"
            @click.right.prevent="onSlotRight(slot)"
          >
            <div class="slot-item" v-if="inventorySlots[slot]">
              <img
                v-if="!iconFailed.has(inventorySlots[slot].name)"
                class="item-icon"
                :src="iconSrc(inventorySlots[slot].name)"
                :title="inventorySlots[slot].displayName"
                @error="onIconErr($event, inventorySlots[slot].name)"
              />
              <span v-else class="item-name">{{ inventorySlots[slot].displayName }}</span>
            </div>
          </div>
          <div class="inv-slot offhand" @click="onSlotClick(45, $event)" @click.right.prevent="onSlotRight(45)">
            <div class="slot-item" v-if="inventorySlots[45]">
              <img
                v-if="!iconFailed.has(inventorySlots[45].name)"
                class="item-icon"
                :src="iconSrc(inventorySlots[45].name)"
                :title="inventorySlots[45].displayName"
                @error="onIconErr($event, inventorySlots[45].name)"
              />
              <span v-else class="item-name">{{ inventorySlots[45].displayName }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- cursor-held item -->
    <div
      class="cursor-item"
      v-if="carriedItem"
      :style="{ left: cursorX + 'px', top: cursorY + 'px' }"
    >
      <img
        v-if="!iconFailed.has(carriedItem.name)"
        class="item-icon"
        :src="iconSrc(carriedItem.name)"
        @error="onIconErr($event, carriedItem.name)"
      />
      <span v-else class="item-name">{{ carriedItem.displayName }}</span>
      <span class="item-count" v-if="carriedItem.count > 1">{{ carriedItem.count }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { getBot } from '~~/api/bot'

// three.js + prismarine-viewer are loaded dynamically inside onMounted so they
// only ever run on the client (this is a .client.vue page).

// Must match the server the bot connects to. Atlas + blocksStates for this
// version are generated into public/prismarine/ by gen-prismarine-assets.cjs.
const MC_VERSION = '1.21.11'

const route = useRoute()
const router = useRouter()
const id = Number(route.params.id)

// ====================================================================
//  Connection state
// ====================================================================
const connected = ref(false)
const statusText = ref('连接中…')
const statusColor = ref('#0f0')
const chunkCount = ref(0)

let ws: WebSocket | null = null
let authToken = ''
let botBaseUrl = ''

// Auto-reconnect: retry while the page is open, stop on unmount.
const RECONNECT_DELAY = 3000
let shouldReconnect = true
let reconnectTimer: number | null = null
let everConnected = false

// ====================================================================
//  Rendering (prismarine-viewer)
// ====================================================================
const rootEl = ref<HTMLDivElement>()
const canvas = ref<HTMLCanvasElement>()
let THREE: any
let Vec3: any
let renderer: any
let viewer: any
let controls: any
let botMarker: any = null
let rafId = 0

// World height: dynamically detected from chunk data.
// Defaults for 1.18+; will be adjusted when data arrives.
let worldMinY = -64
let worldMaxY = 319
let worldHeight = 384  // maxY - minY + 16
let worldInitDone = false

const loadedColumns = new Set<string>()
const entitySizeCache = new Map<number, { w: number; h: number }>()
// Target/current positions for smooth entity interpolation
const entityTargets = new Map<number, { x: number; y: number; z: number; yaw: number }>()
const entityCurrent = new Map<number, { x: number; y: number; z: number; yaw: number }>()

// prismarine-viewer entity model names (from entities.json)
const supportedEntityNames = new Set<string>([
  'armor_stand', 'arrow', 'bat', 'bee', 'blaze', 'boat', 'cat',
  'cave_spider', 'chest_minecart', 'chicken', 'cod',
  'command_block_minecart', 'cow', 'creeper', 'dolphin', 'donkey',
  'dragon_fireball', 'drowned', 'egg', 'elder_guardian',
  'ender_dragon', 'ender_pearl', 'enderman', 'endermite', 'evoker',
  'evoker_fangs', 'experience_bottle', 'experience_orb',
  'eye_of_ender', 'fireball', 'firework_rocket', 'fishing_bobber',
  'fox', 'ghast', 'guardian', 'hoglin', 'hopper_minecart', 'horse',
  'husk', 'iron_golem', 'leash_knot', 'llama', 'llama_spit',
  'magma_cube', 'minecart', 'mooshroom', 'mule', 'ocelot', 'panda',
  'parrot', 'phantom', 'pig', 'piglin', 'piglin_brute', 'pillager',
  'player', 'polar_bear', 'potion', 'pufferfish', 'rabbit',
  'ravager', 'salmon', 'sheep', 'shulker', 'shulker_bullet',
  'silverfish', 'skeleton', 'skeleton_horse', 'slime',
  'small_fireball', 'snow_golem', 'snowball', 'spider', 'squid',
  'stray', 'strider', 'tnt_minecart', 'trident', 'tropical_fish',
  'turtle', 'vex', 'villager', 'vindicator', 'wandering_trader',
  'witch', 'wither', 'wither_skeleton', 'wither_skull', 'wolf',
  'zoglin', 'zombie', 'zombie_horse', 'zombie_villager',
  'zombified_piglin',
])

// ====================================================================
//  Inventory state
// ====================================================================
interface InventoryItem {
  slot: number
  id: number
  name: string
  displayName: string
  count: number
  enchants: { name: string; level: number }[]
}
// inventorySlots is indexed by raw window-0 container slot:
//   0 craft out, 1-4 craft, 5-8 armor, 9-35 main, 36-44 hotbar, 45 offhand
const inventorySlots = ref<(InventoryItem | null)[]>(Array(46).fill(null))
const heldSlot = ref(0)
const invExpanded = ref(false)

// UI groupings -> container slots
const HOTBAR = [36, 37, 38, 39, 40, 41, 42, 43, 44]
const MAIN = Array.from({ length: 27 }, (_, i) => 9 + i)
const ARMOR = [5, 6, 7, 8] // helmet, chestplate, leggings, boots

const carriedItem = ref<InventoryItem | null>(null)
const cursorX = ref(0)
const cursorY = ref(0)

// ---- item icons (fall back items/ -> blocks/ -> text) ----
// Textures are 1.21.8 (closest set to the 1.21.11 server in minecraft-assets).
const ICON_VER = '1.21.8'
const iconFailed = reactive(new Set<string>())
function iconSrc(name: string): string {
  return `/viewer/textures/${ICON_VER}/items/${name}.png`
}
function onIconErr(e: Event, name: string): void {
  const img = e.target as HTMLImageElement
  if (img.dataset.fallback !== 'blocks') {
    img.dataset.fallback = 'blocks'
    img.src = `/viewer/textures/${ICON_VER}/blocks/${name}.png`
  } else {
    iconFailed.add(name) // no texture in either folder -> show text
  }
}

function onMouseMove(e: MouseEvent): void {
  cursorX.value = e.clientX + 8
  cursorY.value = e.clientY + 8
}

function onKeyDown(e: KeyboardEvent): void {
  if ((e.target as HTMLElement)?.tagName === 'INPUT') return

  if (e.key >= '1' && e.key <= '9') {
    const slot = e.key === '9' ? 8 : parseInt(e.key) - 1
    heldSlot.value = slot
    inventoryAction('/inventory/heldSlot', { slot })
    return
  }

  if (e.key === 'q' || e.key === 'Q') {
    e.preventDefault()
    const dropAll = e.ctrlKey || e.metaKey
    if (carriedItem.value) {
      // cursor stack: left-click-outside (button 0) drops all, right (1) drops one
      inventoryAction('/inventory/dropCursor', { button: dropAll ? 0 : 1 })
    } else {
      inventoryAction('/inventory/drop', { slot: heldSlot.value, ctrlDrop: dropAll })
    }
    return
  }
}

// ====================================================================
//  Entity fallback box sizes
// ====================================================================
const ENTITY_SIZES: Record<string, { w: number; h: number }> = {
  player: { w: 0.6, h: 1.8 },
  zombie: { w: 0.6, h: 1.95 },
  skeleton: { w: 0.6, h: 1.99 },
  creeper: { w: 0.6, h: 1.7 },
  cow: { w: 0.9, h: 1.4 },
  pig: { w: 0.9, h: 0.9 },
  sheep: { w: 0.9, h: 1.3 },
  villager: { w: 0.6, h: 1.95 },
  spider: { w: 1.4, h: 0.9 },
  enderman: { w: 0.6, h: 2.9 },
  item: { w: 0.25, h: 0.25 },
  armor_stand: { w: 0.5, h: 1.975 },
}
function getEntitySize(name: string): { w: number; h: number } {
  return ENTITY_SIZES[name] ?? { w: 0.6, h: 1.8 }
}

// ====================================================================
//  WebSocket handlers → prismarine-viewer
// ====================================================================
function chunkKey(cx: number, cz: number): string {
  return `${cx},${cz}`
}

function handleWorldInfo(msg: any): void {
  const newMinY = msg.minY ?? -64
  const newMaxY = msg.maxY ?? 319
  // A world_info that arrives after init with different bounds means the bot
  // changed dimension/server (e.g. lobby minY=0 -> game minY=-64). The old
  // chunks were built for the old height, so wipe and rebuild.
  const changed = worldInitDone && (newMinY !== worldMinY || newMaxY !== worldMaxY)
  worldMinY = newMinY
  worldMaxY = newMaxY
  worldHeight = worldMaxY - worldMinY + 1
  worldInitDone = true
  console.log('[viewer] world_info minY=%d maxY=%d height=%d changed=%s', worldMinY, worldMaxY, worldHeight, changed)
  if (changed) resetViewerWorld()
}

// Tear down all chunks + entities and re-init the renderer/workers so the
// world re-meshes with the current worldMinY/worldHeight.
function resetViewerWorld(): void {
  if (!viewer) return
  for (const id of entitySizeCache.keys()) viewer.entities.update({ id, delete: true })
  if (botMarker) viewer.entities.update({ id: -1, delete: true })
  entitySizeCache.clear()
  entityTargets.clear()
  entityCurrent.clear()
  botMarker = null
  pendingChunks.clear()
  loadedColumns.clear()
  chunkCount.value = 0
  viewer.world.loadedChunks = {}
  // resetWorld() clears section meshes + resets workers; setVersion re-sends
  // version + blockStates so the workers can mesh the new world.
  viewer.setVersion(MC_VERSION)
}

// Incoming chunks are buffered and processed nearest-to-bot first so the world
// fills in from the center outward instead of in (HashMap) arrival order.
const pendingChunks = new Map<string, any>()
let botChunkX = 0
let botChunkZ = 0
// pos 消息可能晚于（甚至缺于）初始区块推送；在那之前用已缓冲区块的
// 质心当中心，否则中心退化为世界原点，看起来就不是从中间向外加载了。
let hasBotPos = false

function handleChunk(msg: any): void {
  pendingChunks.set(chunkKey(msg.x, msg.z), msg)
}

function applyChunk(msg: any): void {
  if (!viewer) return
  const x = msg.x * 16
  const z = msg.z * 16
  viewer.world.loadedChunks[`${x},${z}`] = true

  for (const w of viewer.world.workers) {
    w.postMessage({ type: 'rawColumn', x, z, blocks: msg.data, minY: worldMinY, worldHeight })
  }
  for (let y = worldMinY; y <= worldMaxY; y += 16) {
    const loc = new Vec3(x, y, z)
    viewer.world.setSectionDirty(loc)
    viewer.world.setSectionDirty(loc.offset(-16, 0, 0))
    viewer.world.setSectionDirty(loc.offset(16, 0, 0))
    viewer.world.setSectionDirty(loc.offset(0, 0, -16))
    viewer.world.setSectionDirty(loc.offset(0, 0, 16))
  }
  loadedColumns.add(chunkKey(msg.x, msg.z))
  chunkCount.value = loadedColumns.size
}

// Process up to `budget` of the closest pending chunks (called once per frame).
function drainChunks(budget = 8): void {
  if (!viewer || pendingChunks.size === 0) return
  let centerX = botChunkX
  let centerZ = botChunkZ
  if (!hasBotPos) {
    let sumX = 0
    let sumZ = 0
    for (const m of pendingChunks.values()) { sumX += m.x; sumZ += m.z }
    centerX = sumX / pendingChunks.size
    centerZ = sumZ / pendingChunks.size
  }
  for (let n = 0; n < budget && pendingChunks.size > 0; n++) {
    let bestKey: string | null = null
    let bestDist = Infinity
    for (const [key, m] of pendingChunks) {
      const dx = m.x - centerX
      const dz = m.z - centerZ
      const d = dx * dx + dz * dz
      if (d < bestDist) { bestDist = d; bestKey = key }
    }
    if (bestKey === null) break
    const m = pendingChunks.get(bestKey)
    pendingChunks.delete(bestKey)
    applyChunk(m)
  }
}

function handleUnload(msg: any): void {
  if (!viewer) return
  pendingChunks.delete(chunkKey(msg.x, msg.z))
  if (loadedColumns.delete(chunkKey(msg.x, msg.z))) {
    viewer.removeColumn(msg.x * 16, msg.z * 16)
    chunkCount.value = loadedColumns.size
  }
}

function handleBlockUpdate(msg: any): void {
  if (!viewer) return
  viewer.setBlockStateId(new Vec3(msg.x, msg.y, msg.z), msg.stateId)
}

function toEntity(msg: any): any {
  const name = String(msg.name ?? '').replace(/^minecraft:/, '').toLowerCase()
  // Only pass name to prismarine-viewer if it has a model; unsupported
  // entities get the magenta fallback box without error spam.
  const safeName = supportedEntityNames.has(name) ? name : ''
  const size = getEntitySize(safeName)
  return {
    id: msg.id,
    name: safeName,
    pos: { x: msg.x, y: msg.y, z: msg.z },
    yaw: THREE.MathUtils.degToRad(msg.yaw ?? 0),
    width: size.w,
    height: size.h,
    username: name === 'player' ? (msg.username ?? 'player') : undefined,
  }
}

// Write an entity's transform straight onto its mesh. We deliberately bypass
// prismarine-viewer's entities.update(pos), which starts a 50ms TWEEN every
// call — spamming it per frame stacks overlapping tweens (including ones from
// the mesh's initial (0,0,0)), making entities "slide in from origin".
function setEntityTransform(id: number, x: number, y: number, z: number, yaw: number): void {
  const mesh = viewer?.entities?.entities?.[id]
  if (mesh) {
    mesh.position.set(x, y, z)
    mesh.rotation.y = yaw
  }
}

function handleEntityAdd(msg: any): void {
  if (!viewer) return
  const e = toEntity(msg)
  entitySizeCache.set(msg.id, { w: e.width, h: e.height })
  const yaw = THREE.MathUtils.degToRad(msg.yaw ?? 0)
  entityCurrent.set(msg.id, { x: msg.x, y: msg.y, z: msg.z, yaw })
  entityTargets.delete(msg.id)
  // If a nameless fallback box was already created (e.g. an entity_move arrived
  // before this add), drop it so we can build the proper model with the name.
  if (viewer.entities.entities[msg.id]) {
    viewer.entities.update({ id: msg.id, delete: true })
  }
  // Create the mesh WITHOUT pos so it isn't tweened in from (0,0,0), then place
  // it directly at its real position.
  viewer.entities.update({ id: e.id, name: e.name, width: e.width, height: e.height, username: e.username })
  setEntityTransform(msg.id, msg.x, msg.y, msg.z, yaw)
}

function handleEntityMove(msg: any): void {
  if (!viewer) return
  const yaw = THREE.MathUtils.degToRad(msg.yaw ?? 0)
  // If entity_add never arrived, create a minimal fallback box at the real spot
  if (!entitySizeCache.has(msg.id)) {
    entitySizeCache.set(msg.id, { w: 0.6, h: 1.8 })
    entityCurrent.set(msg.id, { x: msg.x, y: msg.y, z: msg.z, yaw })
    viewer.entities.update({ id: msg.id, width: 0.6, height: 1.8 })
    setEntityTransform(msg.id, msg.x, msg.y, msg.z, yaw)
  }
  // Store target; the animate loop lerps entityCurrent toward it.
  entityTargets.set(msg.id, { x: msg.x, y: msg.y, z: msg.z, yaw })
  if (!entityCurrent.has(msg.id)) {
    entityCurrent.set(msg.id, { x: msg.x, y: msg.y, z: msg.z, yaw })
  }
}

function handleEntityRemove(msg: any): void {
  entitySizeCache.delete(msg.id)
  entityTargets.delete(msg.id)
  entityCurrent.delete(msg.id)
  if (viewer) viewer.entities.update({ id: msg.id, delete: true })
}

function handlePos(msg: any): void {
  if (!viewer || !THREE) return
  // Track the bot's chunk so pending chunks can be meshed nearest-first.
  botChunkX = Math.floor(msg.x / 16)
  botChunkZ = Math.floor(msg.z / 16)
  hasBotPos = true
  // Register bot as a player entity so it shows the real player model
  if (!botMarker) {
    botMarker = true as any
    viewer.entities.update({
      id: -1,
      name: 'player',
      pos: { x: msg.x, y: msg.y, z: msg.z },
      yaw: THREE.MathUtils.degToRad(msg.yaw ?? 0),
      width: 0.6,
      height: 1.8,
      username: 'Bot',
    })
    // First fix: place the camera at a fixed offset from the bot. Without this
    // the camera stays at its initial world-origin position and only the
    // look-at target follows the bot, so large bot coordinates leave the
    // camera arbitrarily far away.
    if (controls) {
      controls.target.set(msg.x, msg.y + 1.6, msg.z)
      viewer.camera.position.set(msg.x, msg.y + 1.6 + 26, msg.z + 80)
      controls.update()
    }
  }
  viewer.entities.update({
    id: -1,
    pos: { x: msg.x, y: msg.y, z: msg.z },
    yaw: THREE.MathUtils.degToRad(msg.yaw ?? 0),
  })
  // Follow the bot: shift the whole orbit rig (target + camera) by the bot's
  // movement so the orbit distance stays constant regardless of coordinate
  // magnitude, while still letting the user orbit/zoom freely.
  if (controls) {
    const desired = new THREE.Vector3(msg.x, msg.y + 1.6, msg.z)
    const newTarget = controls.target.clone().lerp(desired, 0.2)
    const delta = newTarget.clone().sub(controls.target)
    controls.target.copy(newTarget)
    viewer.camera.position.add(delta)
  }
}

function handleInventoryUpdate(): void {
  fetchInventory()
}

// ====================================================================
//  Inventory API
// ====================================================================
async function fetchInventory(): Promise<void> {
  if (!botBaseUrl) return
  try {
    const resp = await fetch(`${botBaseUrl}/inventory`, {
      headers: { Authorization: `Bearer ${authToken}` },
    })
    if (!resp.ok) return
    const data = await resp.json()
    const slots: (InventoryItem | null)[] = Array(46).fill(null)
    for (const item of data.items) if (item) slots[item.slot] = item
    inventorySlots.value = slots
    heldSlot.value = data.heldSlot ?? 0
    carriedItem.value = data.cursor ?? null
  } catch (_) { /* silent */ }
}

async function inventoryAction(path: string, body?: any): Promise<void> {
  if (!botBaseUrl) return
  try {
    await fetch(`${botBaseUrl}${path}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${authToken}`, 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    })
    setTimeout(fetchInventory, 150)
  } catch (_) { /* silent */ }
}

// Left click: pick up / place / swap a stack. Shift+click: quick-move.
// slot is the raw container slot; the bot performs the real click and the
// server resyncs the inventory (and cursor) back to us.
function onSlotClick(slot: number, e: MouseEvent): void {
  const mode = e.shiftKey ? 'quick' : 'pickup'
  inventoryAction('/inventory/click', { slot, button: 0, mode })
}

// Right click: place one / pick up half / split.
function onSlotRight(slot: number): void {
  inventoryAction('/inventory/click', { slot, button: 1, mode: 'pickup' })
}

// ====================================================================
//  Connect
// ====================================================================
function normUrl(raw: string): string {
  return raw.includes('://') ? raw : `http://${raw}`
}

function connect(url: string, tok: string): void {
  authToken = tok
  botBaseUrl = normUrl(url)
  openSocket()
}

function scheduleReconnect(): void {
  if (!shouldReconnect) return
  if (reconnectTimer !== null) return
  statusText.value = `连接已断开，${RECONNECT_DELAY / 1000} 秒后重连…`
  reconnectTimer = window.setTimeout(() => {
    reconnectTimer = null
    if (!shouldReconnect) return
    statusText.value = '重新连接中…'
    openSocket()
  }, RECONNECT_DELAY)
}

function openSocket(): void {
  const httpUrl = new URL(botBaseUrl)
  const wsProto = httpUrl.protocol === 'https:' ? 'wss:' : 'ws:'
  const worldUrl = `${wsProto}//${httpUrl.host}/world?token=${encodeURIComponent(authToken)}`

  ws = new WebSocket(worldUrl)
  ws.onopen = () => {
    // After a reconnect the server resends world_info + chunks from scratch;
    // wipe the previous session's world so stale chunks/entities don't linger.
    if (everConnected) resetViewerWorld()
    everConnected = true
    connected.value = true
    statusText.value = 'ONLINE'
    statusColor.value = '#0f0'
    fetchInventory()
  }
  ws.onclose = () => {
    connected.value = false
    statusText.value = '连接已断开'
    statusColor.value = '#f00'
    scheduleReconnect()
  }
  ws.onerror = () => {
    statusText.value = '连接错误'
    statusColor.value = '#f80'
  }
  ws.onmessage = (e) => {
    try {
      const msg = JSON.parse(e.data)
      switch (msg.type) {
        case 'world_info': handleWorldInfo(msg); break
	        case 'chunk_data': handleChunk(msg); break
        case 'unload': handleUnload(msg); break
        case 'pos': handlePos(msg); break
        case 'entity_add': handleEntityAdd(msg); break
        case 'entity_move': handleEntityMove(msg); break
        case 'entity_rotate': break
        case 'entity_remove': handleEntityRemove(msg); break
        case 'block_update': handleBlockUpdate(msg); break
        case 'inventory_update': handleInventoryUpdate(); break
      }
    } catch (err) { console.warn('[viewer] bad WS frame', err, e.data) }
  }
}

// ====================================================================
//  Setup
// ====================================================================
onMounted(async () => {
  try {
  console.log('[viewer] onMounted start, canvas=', !!canvas.value)
  // On a .client.vue page Nuxt wraps the content in <ClientOnly>, which only
  // renders (and thus binds the canvas ref) AFTER this onMounted first fires.
  // Wait for the ref before initialising the renderer.
  if (!canvas.value) {
    await new Promise<void>((resolve) => {
      const stop = watch(canvas, (v) => { if (v) { stop(); resolve() } })
    })
  }
  console.log('[viewer] canvas ready=', !!canvas.value)

  THREE = await import('three')
  // prismarine-viewer Entity.js uses global THREE (no import/require)
  if (typeof window !== 'undefined') (window as any).THREE = THREE
  console.log('[viewer] three loaded')
  Vec3 = (await import('vec3')).Vec3
  console.log('[viewer] vec3 loaded')

  const { Viewer, supportedVersions } = await import('prismarine-viewer/viewer')
  console.log('[viewer] prismarine-viewer loaded, Viewer=', typeof Viewer)
  const { OrbitControls } = await import('three/examples/jsm/controls/OrbitControls.js')
  console.log('[viewer] OrbitControls loaded')

  if (!supportedVersions.includes(MC_VERSION)) supportedVersions.push(MC_VERSION)

  renderer = new THREE.WebGLRenderer({ canvas: canvas.value, antialias: false })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.setSize(viewWidth(), viewHeight())

  viewer = new Viewer(renderer)
  console.log('[viewer] Viewer constructed, workers=', viewer.world?.workers?.length)

  // Inject our self-generated 1.21.11 atlas + blocksStates so the viewer
  // doesn't fall back to its bundled 1.21.4 data.
  viewer.world.texturesDataUrl = `/prismarine/textures/${MC_VERSION}.png`
  try {
    viewer.world.blockStatesData = await fetch(`/prismarine/blocksStates/${MC_VERSION}.json`).then((r) => r.json())
  } catch (err) {
    console.error('failed to load blocksStates', err)
  }

  viewer.setVersion(MC_VERSION)

  viewer.camera.position.set(0, 90, 80)
  controls = new OrbitControls(viewer.camera, renderer.domElement)
  controls.target.set(0, 64, 0)
  controls.update()

  window.addEventListener('resize', onResize)
  window.addEventListener('mousemove', onMouseMove)
  window.addEventListener('keydown', onKeyDown)

  function animate(): void {
    rafId = requestAnimationFrame(animate)
    // Feed buffered chunks to the workers nearest-to-bot first (center-out).
    drainChunks()
    // Smooth entity interpolation — lerp toward the target and write the mesh
    // transform directly (no per-frame tween spam, no slide-in from origin).
    for (const [id, target] of entityTargets) {
      const cur = entityCurrent.get(id)
      if (!cur) continue
      const L = 0.3
      cur.x += (target.x - cur.x) * L
      cur.y += (target.y - cur.y) * L
      cur.z += (target.z - cur.z) * L
      cur.yaw += (target.yaw - cur.yaw) * L
      setEntityTransform(id, cur.x, cur.y, cur.z, cur.yaw)
    }
    controls.update()
    viewer.update()
    renderer.render(viewer.scene, viewer.camera)
  }
  animate()

  // Fetch bot address + token from backend, then connect.
  console.log('[viewer] fetching bot', id)
  try {
    const bot: any = await getBot(id)
    console.log('[viewer] getBot result', bot)
    if (!bot || !bot.url) {
      statusText.value = '未找到该 Bot'
      return
    }
    connect(bot.url, bot.token)
  } catch (e: any) {
    statusText.value = '获取 Bot 失败'
    console.error('[viewer] getBot error', e)
  }
  } catch (err) {
    statusText.value = '初始化失败(见控制台)'
    console.error('[viewer] onMounted error', err)
  }
})

// The canvas sits next to the app sidebar, so size to the container (falling
// back to the window before the ref is bound).
function viewWidth(): number {
  return rootEl.value?.clientWidth || window.innerWidth
}
function viewHeight(): number {
  return rootEl.value?.clientHeight || window.innerHeight
}

function onResize(): void {
  if (!renderer || !viewer) return
  viewer.camera.aspect = viewWidth() / viewHeight()
  viewer.camera.updateProjectionMatrix()
  renderer.setSize(viewWidth(), viewHeight())
}

onUnmounted(() => {
  shouldReconnect = false
  if (reconnectTimer !== null) {
    clearTimeout(reconnectTimer)
    reconnectTimer = null
  }
  window.removeEventListener('resize', onResize)
  window.removeEventListener('mousemove', onMouseMove)
  window.removeEventListener('keydown', onKeyDown)
  if (rafId) cancelAnimationFrame(rafId)
  ws?.close()
  if (viewer?.world?.workers) for (const w of viewer.world.workers) w.terminate?.()
  renderer?.dispose?.()
})
</script>

<style scoped>
.viewer-canvas {
  display: block;
  width: 100%;
  height: 100%;
}
.panel {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(0, 0, 0, 0.85);
  padding: 24px;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 320px;
  color: #fff;
  z-index: 10;
  text-align: center;
}
.panel h3 { margin: 0; }
.status {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 6px 12px;
  background: rgba(0, 0, 0, 0.7);
  color: #fff;
  font-family: monospace;
  font-size: 13px;
  display: flex;
  gap: 16px;
  z-index: 10;
}
.hotbar-overlay {
  position: absolute;
  bottom: 28px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 20;
  pointer-events: auto;
  user-select: none;
}
.hotbar-row { display: flex; gap: 2px; align-items: flex-end; }
.hotbar-slot {
  width: 44px;
  height: 44px;
  background: rgba(0, 0, 0, 0.6);
  border: 2px solid #555;
  position: relative;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}
.hotbar-slot.selected { border-color: #fff; background: rgba(255, 255, 255, 0.2); }
.hotbar-slot:hover { border-color: #aaa; }
.slot-number {
  position: absolute;
  top: 1px;
  left: 3px;
  font-size: 9px;
  color: #888;
  font-family: monospace;
}
.slot-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}
.item-icon {
  width: 32px;
  height: 32px;
  object-fit: contain;
  image-rendering: pixelated;
  pointer-events: none;
}
.item-name {
  font-size: 9px;
  color: #fff;
  text-align: center;
  line-height: 1.1;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 40px;
  word-break: break-all;
}
.item-count {
  font-size: 9px;
  color: #ff0;
  position: absolute;
  bottom: 2px;
  right: 4px;
  font-family: monospace;
}
.expand-btn {
  background: rgba(0, 0, 0, 0.6);
  border: 1px solid #555;
  color: #fff;
  font-size: 12px;
  cursor: pointer;
  padding: 4px 8px;
  margin-left: 8px;
  height: 44px;
}
.expand-btn:hover { background: rgba(255, 255, 255, 0.1); }
.inventory-panel {
  margin-top: 6px;
  background: rgba(0, 0, 0, 0.85);
  border: 2px solid #555;
  padding: 6px;
  border-radius: 4px;
}
.inv-grid { display: grid; grid-template-columns: repeat(9, 44px); gap: 2px; }
.inv-slot {
  width: 44px;
  height: 44px;
  background: rgba(0, 0, 0, 0.5);
  border: 1px solid #444;
  cursor: pointer;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}
.inv-slot:hover { border-color: #888; }
.armor-row { display: flex; gap: 2px; margin-top: 6px; margin-left: 1px; }
.armor { background: rgba(60, 40, 20, 0.5) !important; }
.offhand { margin-left: 120px; background: rgba(40, 40, 60, 0.5) !important; }
.cursor-item {
  position: fixed;
  pointer-events: none;
  z-index: 999;
  background: rgba(0, 0, 0, 0.75);
  border: 2px solid #fff;
  padding: 2px 6px;
  border-radius: 3px;
  min-width: 40px;
  min-height: 36px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  transform: translate(-50%, -50%);
}
.cursor-item .item-name { font-size: 10px; color: #fff; }
.cursor-item .item-count { font-size: 10px; color: #ff0; }
</style>
