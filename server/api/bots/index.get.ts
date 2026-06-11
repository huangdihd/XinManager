import { requireAuth } from '../../utils/auth'
import { getBots } from '../../lib/bots'

export default defineEventHandler((event) => {
  if (!requireAuth(event)) return { message: 'Unauthorized' }
  return getBots().map(b => b.toJSON())
})
