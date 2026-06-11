import { requireAuth } from '../../utils/auth'
export default defineEventHandler((event) => {
  if (!requireAuth(event)) return { message: 'Unauthorized' }
  return { message: 'OK' }
})
