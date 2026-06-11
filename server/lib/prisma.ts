/*
 *   Copyright (C) 2025 huangdihd
 */

import { PrismaClient } from '@prisma/client'

let _prisma: PrismaClient

export function getPrisma(): PrismaClient {
  if (!_prisma) _prisma = new PrismaClient()
  return _prisma
}
