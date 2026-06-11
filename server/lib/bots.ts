/*
 *   Copyright (C) 2025 huangdihd
 */

import { getPrisma } from './prisma'
import { config } from './config'

export interface BotData {
  id: number
  url: string
  token: string
  version: string
  server: string
  username: string
  available: boolean
  worldViewerAvailable: boolean
}

class Bot {
  constructor(
    public id: number,
    public url: string,
    public token: string,
    public version: string = 'Unknown',
    public server: string = 'Unknown',
    public username: string = 'Unknown',
    public available: boolean = false,
    public worldViewerAvailable: boolean = false,
  ) {}

  async fetchUpdate(): Promise<void> {
    try {
      const base = this.url.includes('://') ? this.url : `http://${this.url}`
      const statusUrl = new URL('/status', base)
      const res = await fetch(statusUrl, {
        headers: { Authorization: `Bearer ${this.token}` },
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      this.version = data.version ?? 'Unknown'
      this.server = data.server ?? 'Unknown'
      this.username = data.username ?? 'Unknown'
      this.worldViewerAvailable = data.worldViewerAvailable ?? false
      this.available = true
    } catch {
      this.available = false
      this.server = 'Unknown'
      this.version = 'Unknown'
      this.username = 'Unknown'
      this.worldViewerAvailable = false
    }
  }

  toJSON(): BotData {
    return {
      id: this.id,
      url: this.url,
      token: this.token,
      version: this.version,
      server: this.server,
      username: this.username,
      available: this.available,
      worldViewerAvailable: this.worldViewerAvailable,
    }
  }
}

const bots = new Map<number, Bot>()

export async function loadBots(): Promise<void> {
  const prisma = getPrisma()
  const rows = await prisma.bot.findMany()
  for (const row of rows) {
    bots.set(row.id, new Bot(row.id, row.url, row.token))
  }
  console.log(`loaded ${bots.size} bots from db`)
}

export function getBots(): Bot[] {
  return [...bots.values()]
}

export function getBot(id: number): Bot | undefined {
  return bots.get(id)
}

export async function addBot(url: string, token: string): Promise<Bot> {
  const prisma = getPrisma()
  const row = await prisma.bot.create({ data: { url, token } })
  const bot = new Bot(row.id, row.url, row.token)
  bots.set(row.id, bot)
  await bot.fetchUpdate()
  return bot
}

export function removeBot(id: number): void {
  const prisma = getPrisma()
  prisma.bot.delete({ where: { id } }).then(() => {
    bots.delete(id)
  })
}

export async function fetchUpdates(): Promise<void> {
  for (const bot of bots.values()) {
    await bot.fetchUpdate()
  }
}

export async function updateLoop(): Promise<void> {
  while (true) {
    try { await fetchUpdates() } catch {}
    await new Promise(r => setTimeout(r, config.bots_fetch_interval))
  }
}
