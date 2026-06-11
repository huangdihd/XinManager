import { readBody } from 'h3'
import { requireAuth } from '../../utils/auth'
import { config, saveConfig } from '../../lib/config'

export default defineEventHandler(async (event) => {
  if (!requireAuth(event)) return { message: 'Unauthorized' }
  const body = await readBody(event)
  if (body?.value === undefined) { setResponseStatus(event, 400); return { message: 'Bad request' } }
  const v = Number(body.value)
  if (isNaN(v)) { setResponseStatus(event, 400); return { message: 'Bad request' } }
  config.bots_fetch_interval = v; saveConfig()
  return { message: 'Success' }
})
