import { requireAuth } from '../../utils/auth'
import { getBot, removeBot } from '../../lib/bots'

export default defineEventHandler((event) => {
  if (!requireAuth(event)) return { message: 'Unauthorized' }
  const id = Number(event.context.params?.id)
  if (isNaN(id)) { setResponseStatus(event, 400); return { message: 'Bad request' } }
  if (!getBot(id)) { setResponseStatus(event, 404); return { message: 'Bot not found' } }
  removeBot(id)
  return { message: 'Bot deleted' }
})
