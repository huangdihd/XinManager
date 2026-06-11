import { requireAuth } from '../../utils/auth'
import { config } from '../../lib/config'

export default defineEventHandler((event) => {
  if (!requireAuth(event)) return { message: 'Unauthorized' }
  return {
    bots_fetch_interval: config.bots_fetch_interval,
  }
})
