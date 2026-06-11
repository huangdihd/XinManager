import { requireAuth } from '../../utils/auth'
import { getBot } from '../../lib/bots'

export default defineEventHandler((event) => {
  if (!requireAuth(event)) return { message: 'Unauthorized' }
  const id = Number(event.context.params?.id)
  if (isNaN(id)) { setResponseStatus(event, 400); return { message: 'Bad request' } }
  const bot = getBot(id)
  if (!bot) { setResponseStatus(event, 404); return { message: 'Bot not found' } }
  return bot.toJSON()
})
