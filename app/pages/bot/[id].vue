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
import {getBot} from '~~/api/bot';
import { useRoute } from 'vue-router'
import {ref} from 'vue'
import type { BotStatus } from '~~/api/BotStatus'
import BotCard from "~~/composables/BotCard.vue";
import { useConfig } from "~~/composables/useConfig"
import axios from "axios";

const route = useRoute()
const toast = useToast()
const id = computed(() => Number(route.params.id))
const router = useRouter()

const bot = ref<BotStatus>({} as BotStatus)

const terminal = ref(null)
const fit = ref(null)

const ws = ref(null)

const connecting = ref(false)

const players = ref([])
const config = useConfig()

let timerId: number | undefined

function normUrl(raw: string): string {
  return raw.includes('://') ? raw : `http://${raw}`
}

function connect_ws() {
  if (!connecting.value) return

  const httpUrl = new URL(normUrl(bot.value.url))
  httpUrl.protocol = httpUrl.protocol.replace('http', 'ws')
  const wsUrl = new URL('term', httpUrl)
  wsUrl.searchParams.set('token', bot.value.token)

  ws.value = new WebSocket(wsUrl.toString())

  ws.value.onmessage = (event) => {
    terminal.value?.write(event.data)
  }

  ws.value.onerror = (event) => {
    console.log(event);
    terminal.value?.write(`[XinManager]连接错误:${event.message || "未知原因"}\n\r`);
  }

  ws.value.onclose = () => {
    terminal.value?.write('[XinManager]连接已关闭\n\r');
    if (!connecting.value) return
    terminal.value?.write('[XinManager]尝试重新连接\n\r');
    connect_ws()
  }
}

async function refresh() {
  try {
    bot.value = await getBot(id.value);
  } catch (e) {
    toast.add({
      title: '获取机器人失败',
      description: e.response?.data?.message || e.message || '获取机器人失败',
      color: 'error',
      icon: 'i-lucide-circle-x'
    })
    await router.push('/bots')
    return
  }
  // 玩家列表拉取失败（bot 离线等）不应中断页面其余功能（如终端初始化）
  try {
    players.value = (await axios.get(
        new URL("players", normUrl(bot.value.url)),
        {
          headers: {
            "Authorization": `Bearer ${bot.value.token}`
          }
        }
    ))
    .data
  } catch {
    players.value = []
  }
}

onMounted(async () => {
  await refresh()
  timerId = setInterval(refresh, config.value.bots_fetch_interval)
  connecting.value = true
  const container = document.getElementById('terminal') as HTMLElement;
  if (!container) return;

  if (terminal.value) return;

  const { Terminal } = await import('@xterm/xterm');
  const { FitAddon } = await import('@xterm/addon-fit');
  let WebglAddon: any;
  try { WebglAddon = (await import('@xterm/addon-webgl')).WebglAddon; } catch {}

  await import('@xterm/xterm/css/xterm.css');

  terminal.value = new Terminal({
    cursorBlink: true,
    fontSize: 14,
    fontFamily: 'monospace' ,
    theme: {
      background: 'rgba(0, 0, 0, 0.8)',
      foreground: 'rgba(255, 255, 255, 0.8)',
      cursor: 'rgba(255, 255, 255, 0.8)',
    }
  });
  fit.value = new FitAddon();
  terminal.value.loadAddon(fit.value);
  if (WebglAddon) { try { terminal.value.loadAddon(new WebglAddon()); } catch {} }

  terminal.value.open(container);
  terminal.value.onData((data) => {
    ws.value?.send(data)
  })
  fit.value.fit();
  window.onresize = () => {
    if (!fit.value) return;
    if (!terminal.value) return;
    fit.value.fit();
  }

  connect_ws()

})

onUnmounted(() => {
  if (timerId !== undefined) {
    clearInterval(timerId)
    timerId = undefined
  }
  connecting.value = false
  ws.value?.close()
  const container = document.getElementById('terminal') as HTMLElement;
  if (!container) return;
  if (!terminal.value) return;
  terminal.value.dispose();
  terminal.value = null;
  fit.value = null;
})

</script>

<template>
  <div class="grid h-screen grid-cols-4 grid-rows-5 gap-4 p-4">
    <div class="flex flex-col gap-3">
      <BotCard class="flex-1" :bot="bot" />
      <UButton
          v-if="bot.worldViewerAvailable"
          block
          variant="soft"
          icon="i-lucide-globe"
          @click="router.push(`/viewer/${id}`)"
      >
        查看世界
      </UButton>
    </div>
    <UCard
        class="col-span-3 row-span-5"
        :ui="{ root: 'h-full flex flex-col', body: 'flex-1 min-h-0 p-3 sm:p-3' }"
    >
      <template #header>
        <h3 class="font-semibold text-highlighted">终端</h3>
      </template>
      <ClientOnly>
        <div class="h-full overflow-hidden rounded-lg" id="terminal" />
      </ClientOnly>
    </UCard>
    <UCard
        class="row-span-4"
        :ui="{ root: 'h-full flex flex-col', body: 'flex-1 min-h-0 overflow-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden' }"
    >
      <template #header>
        <h3 class="font-semibold text-highlighted">玩家列表</h3>
      </template>
      <ul class="divide-y divide-default">
        <li v-for="player in players" :key="player.id" class="py-2 text-sm text-default">
          {{ player.name }}
        </li>
      </ul>
      <p v-if="players.length === 0" class="py-2 text-sm text-muted">暂无玩家</p>
    </UCard>
  </div>
</template>
