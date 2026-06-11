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

import { getPerformance } from "~~/api/performance";
import PageHeader from "~~/composables/PageHeader.vue";
import { getBots } from "~~/api/bot";
import { useConfig } from "~~/composables/useConfig";
import type { BotStatus } from "~~/api/BotStatus";


const bots = ref<BotStatus[]>([])

const TotalBotCount = ref(0)
const AvailableBotCount = ref(0)
const JoinedBotCount = ref(0)

const cpuUsage = ref(0)
const memoryUsage = ref(0)

// 性能趋势采样（固定 3s 一次，保留最近 60 个点 = 3 分钟）
const PERF_SAMPLE_INTERVAL = 3000
const PERF_SAMPLE_MAX = 60
const perfSamples = ref<{ cpu: number; mem: number }[]>([])

const config = useConfig()

const botStats = computed(() => [
  { label: '已进入游戏', value: JoinedBotCount.value },
  { label: '可用', value: AvailableBotCount.value },
  { label: '总数', value: TotalBotCount.value }
])

function usageColor(value: number) {
  if (value >= 90) return 'error'
  if (value >= 70) return 'warning'
  return 'primary'
}

function serverLabel(bot: BotStatus): string {
  if (!bot.available) return '—'
  if (bot.server === 'Game') return '游戏中'
  if (bot.server === 'Login') return '登录中'
  return bot.server || '连接中'
}

// 把采样序列转成 SVG polyline 的 points（viewBox 0 0 100 32）
function sparkPoints(key: 'cpu' | 'mem'): string {
  const s = perfSamples.value
  if (s.length < 2) return ''
  const step = 100 / (PERF_SAMPLE_MAX - 1)
  // 不足 60 个点时从右侧对齐，曲线随时间从右往左生长
  const offset = 100 - (s.length - 1) * step
  return s
      .map((p, i) => `${(offset + i * step).toFixed(2)},${(31 - (p[key] / 100) * 30).toFixed(2)}`)
      .join(' ')
}

async function refreshBotCount() {
  bots.value = await getBots()
  TotalBotCount.value = bots.value.length
  AvailableBotCount.value = 0
  JoinedBotCount.value = 0
  for (const bot of bots.value) {
    if (bot.available) {
      AvailableBotCount.value++
    }
    if (bot.server === 'Game') {
      JoinedBotCount.value++
    }
  }
}

async function refreshPerformance() {
  const performance = await getPerformance()
  cpuUsage.value = performance.cpu
  memoryUsage.value = performance.memory
  perfSamples.value.push({ cpu: performance.cpu, mem: performance.memory })
  if (perfSamples.value.length > PERF_SAMPLE_MAX) perfSamples.value.shift()
}


let botsTimerId: number | undefined
let perfTimerId: number | undefined


onMounted(() => {
  refreshBotCount()
  refreshPerformance()
  botsTimerId = window.setInterval(() => {
    refreshBotCount()
  }, config.value.bots_fetch_interval)
  perfTimerId = window.setInterval(() => {
    refreshPerformance()
  }, PERF_SAMPLE_INTERVAL)
});

onUnmounted(() => {
  if (botsTimerId !== undefined) {
    clearInterval(botsTimerId)
    botsTimerId = undefined
  }
  if (perfTimerId !== undefined) {
    clearInterval(perfTimerId)
    perfTimerId = undefined
  }
})


</script>

<template>
  <div class="flex flex-col gap-5 p-6 lg:p-8">
    <PageHeader title="首页" subtitle="机器人与主机运行概览" />
    <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
      <UCard>
        <template #header>
          <h3 class="font-semibold text-highlighted">机器人在线状态</h3>
        </template>
        <div class="flex h-full select-none items-center justify-around gap-4 py-2">
          <div v-for="stat in botStats" :key="stat.label" class="flex flex-col items-center gap-1">
            <span class="text-4xl font-bold tabular-nums text-highlighted">{{ stat.value }}</span>
            <span class="text-xs text-muted">{{ stat.label }}</span>
          </div>
        </div>
      </UCard>

      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="font-semibold text-highlighted">面板所在主机性能</h3>
            <div class="flex items-center gap-4 text-xs text-muted">
              <span class="flex items-center gap-1.5"><span class="size-2 rounded-full bg-primary" />CPU</span>
              <span class="flex items-center gap-1.5"><span class="size-2 rounded-full bg-sky-400" />内存</span>
            </div>
          </div>
        </template>
        <div class="flex select-none flex-col gap-4">
          <div class="flex items-center gap-4">
            <span class="w-10 shrink-0 text-sm text-muted">CPU</span>
            <UProgress :model-value="cpuUsage" :max="100" :color="usageColor(cpuUsage)" size="lg" />
            <span class="w-16 shrink-0 text-right text-sm font-medium tabular-nums">{{ cpuUsage.toFixed(1) }}%</span>
          </div>
          <div class="flex items-center gap-4">
            <span class="w-10 shrink-0 text-sm text-muted">内存</span>
            <UProgress :model-value="memoryUsage" :max="100" :color="usageColor(memoryUsage)" size="lg" />
            <span class="w-16 shrink-0 text-right text-sm font-medium tabular-nums">{{ memoryUsage.toFixed(1) }}%</span>
          </div>
          <!-- 最近 3 分钟趋势 -->
          <div class="relative h-20 overflow-hidden rounded-lg border border-default bg-elevated/40">
            <svg class="size-full" viewBox="0 0 100 32" preserveAspectRatio="none">
              <line v-for="y in [8, 16, 24]" :key="y" x1="0" :y1="y" x2="100" :y2="y" class="stroke-(--ui-border)" stroke-width="0.2" />
              <polyline :points="sparkPoints('mem')" fill="none" class="stroke-sky-400" stroke-width="0.8" stroke-linejoin="round" />
              <polyline :points="sparkPoints('cpu')" fill="none" class="stroke-primary" stroke-width="0.8" stroke-linejoin="round" />
            </svg>
            <span class="absolute left-2 top-1 text-[10px] text-muted">最近 3 分钟</span>
          </div>
        </div>
      </UCard>

      <UCard class="md:col-span-2" :ui="{ body: 'p-0 sm:p-0' }">
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="font-semibold text-highlighted">Bot 概览</h3>
            <UButton to="/bots" variant="link" color="neutral" size="sm" trailing-icon="i-lucide-arrow-right">
              管理
            </UButton>
          </div>
        </template>
        <div v-if="bots.length === 0" class="flex flex-col items-center gap-3 py-10 text-muted">
          <UIcon name="i-lucide-bot" class="size-10 opacity-40" />
          <p class="text-sm">还没有接入任何 Bot</p>
          <UButton to="/bots" size="sm" icon="i-lucide-plus" variant="soft">去添加</UButton>
        </div>
        <ul v-else class="divide-y divide-default">
          <li v-for="bot in bots" :key="bot.id">
            <a
                :href="`/bot/${bot.id}`"
                target="_blank"
                class="flex items-center gap-3 px-4 py-3 no-underline transition-colors hover:bg-elevated/60"
            >
              <div
                  class="flex size-9 shrink-0 items-center justify-center rounded-lg text-sm font-bold text-white"
                  :class="bot.available ? 'bg-gradient-to-br from-emerald-400 to-teal-600' : 'bg-gray-400 dark:bg-gray-600'"
              >
                {{ (bot.username?.[0] ?? '?').toUpperCase() }}
              </div>
              <div class="min-w-0 flex-1">
                <div class="truncate text-sm font-medium text-highlighted">{{ bot.available ? bot.username : '未连接' }}</div>
                <div class="truncate text-xs text-muted">{{ bot.url }}</div>
              </div>
              <span class="hidden w-24 shrink-0 text-xs text-muted sm:block">{{ bot.available ? bot.version : '' }}</span>
              <span class="hidden w-20 shrink-0 text-xs text-muted sm:block">{{ serverLabel(bot) }}</span>
              <UBadge :color="bot.available ? 'success' : 'error'" variant="subtle" size="sm" class="shrink-0">
                {{ bot.available ? '在线' : '离线' }}
              </UBadge>
            </a>
          </li>
        </ul>
      </UCard>
    </div>
  </div>
</template>
