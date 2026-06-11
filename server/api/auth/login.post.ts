/*
 *   Copyright (C) 2025 huangdihd
 */

import { readBody, setCookie } from 'h3'
import { config } from '../../lib/config'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  if (!body?.password || body.password !== config.password) {
    setResponseStatus(event, 401)
    return { message: 'Wrong password' }
  }
  setCookie(event, 'password', body.password, {
    httpOnly: true,
    path: '/api',
    sameSite: 'strict',
    maxAge: 30 * 24 * 60 * 60,
  })
  return { message: 'Logged in' }
})
