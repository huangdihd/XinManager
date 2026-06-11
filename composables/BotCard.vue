<!--
  -   Copyright (C) 2025 huangdihd
  -
  -   This program is free software: you can redistribute it and/or modify
  -   it under the terms of the GNU General Public License as published by
  -   the Free Software Foundation, either version 3 of the License, or
  -   (at your option) any later version.
  -
  -   This program is distributed in the hope that it will be useful,
  -   but WITHOUT ANY WARRANTY; without even the implied warranty of
  -   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  -   GNU General Public License for more details.
  -
  -   You should have received a copy of the GNU General Public License
  -   along with this program.  If not, see <https://www.gnu.org/licenses/>.
  -->

<script setup lang="ts">
import { type BotStatus } from "../api/BotStatus";
const props = defineProps({
      bot: {
        type: Object as () => BotStatus,
        required: true
      }
    })

const url = computed(() => props.bot?.url)
const name = computed(() => props.bot?.username)
const version = computed(() => props.bot?.version)
const server = computed(() => props.bot?.server)
const available = computed(() => props.bot?.available)
</script>
<template>
  <div class="flex h-full flex-col gap-3 rounded-xl border border-default bg-elevated/40 p-4 shadow-sm transition-shadow duration-200 hover:shadow-md">
    <div class="flex items-center gap-3">
      <div
          class="flex size-10 shrink-0 items-center justify-center rounded-lg text-base font-bold text-white"
          :class="available ? 'bg-gradient-to-br from-emerald-400 to-teal-600' : 'bg-gray-400 dark:bg-gray-600'"
      >
        {{ (name?.[0] ?? '?').toUpperCase() }}
      </div>
      <div class="min-w-0 flex-1">
        <div class="truncate font-semibold text-highlighted">{{ available ? name : '未连接' }}</div>
        <div class="truncate text-xs text-muted">{{ url }}</div>
      </div>
      <UBadge
          :color="available ? 'success' : 'error'"
          variant="subtle"
          size="sm"
          class="transition-opacity duration-200 group-hover:opacity-0"
      >
        {{ available ? '在线' : '离线' }}
      </UBadge>
    </div>
    <div v-if="available" class="grid grid-cols-2 gap-2 text-sm">
      <div class="truncate"><span class="text-muted">版本 </span><span class="font-medium text-default">{{ version }}</span></div>
      <div class="truncate"><span class="text-muted">服务器 </span><span class="font-medium text-default">{{ server || '—' }}</span></div>
    </div>
    <p v-else class="text-sm text-muted">无法连接到该机器人，请检查其运行状态</p>
  </div>
</template>
