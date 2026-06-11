import { deleteCookie } from 'h3'
export default defineEventHandler((event) => {
  deleteCookie(event, 'password', { httpOnly: true, path: '/api', sameSite: 'strict' })
  return { message: 'Logged out' }
})
