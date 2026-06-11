/*
 *   Copyright (C) 2025 huangdihd
 */

import { getCookie } from 'h3'
import { config } from '../lib/config'

/**
 * Returns true if the request has a valid auth cookie.
 */
export function isAuthed(event: any): boolean {
  const password = getCookie(event, 'password')
  return password === config.password
}

/**
 * Sends 401 and returns false if not authed.
 */
export function requireAuth(event: any): boolean {
  if (!isAuthed(event)) {
    setResponseStatus(event, 401)
    return false
  }
  return true
}
