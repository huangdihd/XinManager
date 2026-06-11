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
import {getBots, deleteBot} from "~~/api/bot";
import BotCard from "~~/composables/BotCard.vue";
import PageHeader from "~~/composables/PageHeader.vue";
import BotCreator from "~~/composables/BotCreator.vue";
import ConfirmModal from "~~/composables/ConfirmModal.vue";
import type {BotStatus} from "~~/api/BotStatus";
import { useConfig } from "~~/composables/useConfig"

const data = ref([])

const showCreateDialog = ref(false)
const showDeleteConfirm = ref(false)
const pendingDelete = ref<BotStatus | null>(null)

const config = useConfig()

let timerId: number | undefined


onMounted(() => {
  refresh()
  timerId = window.setInterval(() => {
    refresh()
  }, config.value.bots_fetch_interval)

});

onUnmounted(() => {
  if (timerId !== undefined) {
    clearInterval(timerId)
    timerId = undefined
  }
})


async function refresh() {
  data.value = await getBots();
}

function afterCreate(bot: BotStatus) {
  showCreateDialog.value = false;
  refresh()
}

function onDeleteBot(bot: BotStatus) {
  pendingDelete.value = bot
  showDeleteConfirm.value = true
}

async function confirmDelete() {
  if (!pendingDelete.value) return
  await deleteBot(pendingDelete.value.id)
  pendingDelete.value = null
  await refresh()
}
</script>

<template>
  <div class="flex flex-col gap-5 p-6 lg:p-8">
    <PageHeader title="Bot管理" subtitle="管理已接入面板的机器人">
      <UButton icon="i-lucide-refresh-cw" color="neutral" variant="soft" @click="refresh">
        刷新
      </UButton>
      <UButton icon="i-lucide-plus" @click="showCreateDialog = true">
        添加Bot
      </UButton>
    </PageHeader>

    <div v-if="data.length === 0" class="flex flex-col items-center gap-3 py-24 text-muted">
      <UIcon name="i-lucide-bot" class="size-12 opacity-40" />
      <p class="text-sm">还没有Bot，点击右上角「添加Bot」接入一个吧</p>
    </div>
    <div v-else class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      <div v-for="bot in data" :key="bot.id" class="group relative transition-transform duration-200 hover:-translate-y-0.5">
        <UButton
            class="absolute right-3 top-4 z-10 opacity-0 transition-opacity duration-200 focus-visible:opacity-100 group-hover:opacity-100"
            icon="i-lucide-trash-2"
            color="error"
            variant="soft"
            size="sm"
            title="删除"
            @click.prevent.stop="onDeleteBot(bot)"
        />
        <a target="_blank" class="block no-underline" :href="`/bot/${bot.id}`">
          <BotCard :bot="bot" />
        </a>
      </div>
    </div>
  </div>

  <UModal v-model:open="showCreateDialog">
    <template #content>
      <BotCreator @afterCreate="afterCreate" />
    </template>
  </UModal>

  <ConfirmModal
      v-model:open="showDeleteConfirm"
      title="操作确认"
      :content="`你确定要删除Bot ${pendingDelete?.username ?? pendingDelete?.url ?? ''} 吗？`"
      confirm-text="删除"
      @confirm="confirmDelete"
  />
</template>
