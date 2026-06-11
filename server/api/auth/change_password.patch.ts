import { readBody, deleteCookie } from 'h3'
import { requireAuth } from '../../utils/auth'
import { config, saveConfig } from '../../lib/config'

export default defineEventHandler(async (event) => {
  if (!requireAuth(event)) return { message: 'Unauthorized' }
  const body = await readBody(event)
  if (!body?.password) {
    setResponseStatus(event, 400); return { message: 'Password is required' }
  }
  if (body.password.length < 8) {
    setResponseStatus(event, 400); return { message: 'Password must be at least 8 characters' }
  }
  if (body.password === config.password) {
    setResponseStatus(event, 400); return { message: 'New password must be different' }
  }
  config.password = body.password
  saveConfig()
  deleteCookie(event, 'password', { httpOnly: true, path: '/api', sameSite: 'strict' })
  return { message: 'Password changed' }
})
