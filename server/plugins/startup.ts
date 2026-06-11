/*
 *   Copyright (C) 2025 huangdihd
 *
 *   Nitro plugin — runs on server start, loads config/bots and starts update loops.
 */

import { loadConfig } from '../lib/config'
import { loadBots, updateLoop as botsLoop } from '../lib/bots'

export default defineNitroPlugin(async () => {
  // 1. load config
  loadConfig()
  console.log('Nitro: config loaded')

  // 2. load bots from database
  await loadBots()
  console.log('Nitro: bots loaded')

  // 3. start background update loop (fire-and-forget, don't block startup)
  void botsLoop()
})
