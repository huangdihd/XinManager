import { readBody } from 'h3'
import { requireAuth } from '../../utils/auth'
import { addBot } from '../../lib/bots'

export default defineEventHandler(async (event) => {
  if (!requireAuth(event)) return { message: 'Unauthorized' }
  const body = await readBody(event)
  if (!body?.url || !body?.token) {
    setResponseStatus(event, 400); return { message: 'Bad request' }
  }
  try { new URL(body.url) } catch {
    setResponseStatus(event, 400); return { message: 'Invalid URL' }
  }
  const bot = await addBot(body.url, body.token)
  return bot.toJSON()
})
