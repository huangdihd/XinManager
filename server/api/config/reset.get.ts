import { requireAuth } from '../../utils/auth'
import { config, saveConfig } from '../../lib/config'

export default defineEventHandler((event) => {
  if (!requireAuth(event)) return { message: 'Unauthorized' }
  config.bots_fetch_interval = 10000
  saveConfig()
  return { message: 'Success' }
})
