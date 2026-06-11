/*
 *   Copyright (C) 2025 huangdihd
 *
 *   This program is free software: you can redistribute it and/or modify
 *   it under the terms of the GNU General Public License as published by
 *   the Free Software Foundation, either version 3 of the License, or
 *   (at your option) any later version.
 */

import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'

export interface Config {
  password: string
  cookie_secret: string
  bots_fetch_interval: number
}

const CONFIG_PATH = path.resolve(process.cwd(), 'config.json')

function randomString(len = 32): string {
  return crypto.randomBytes(len).toString('hex').slice(0, len)
}

function defaultConfig(): Config {
  return {
    password: randomString(),
    cookie_secret: randomString(),
    bots_fetch_interval: 10000,
  }
}

export let config: Config

export function loadConfig(): Config {
  if (!fs.existsSync(CONFIG_PATH)) {
    console.log('config.json not found, creating default')
    config = defaultConfig()
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2))
    console.log('password:', config.password)
    return config
  }
  config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'))
  return config
}

export function saveConfig(): void {
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2))
}
