import os from 'node:os'

export default defineEventHandler(async () => {
  const memTotal = os.totalmem(); const memFree = os.freemem()
  const memUsage = ((memTotal - memFree) / memTotal) * 100
  const si = await import('systeminformation')
  const load = await si.currentLoad()
  return { cpu: load.currentLoad, memory: memUsage }
})
