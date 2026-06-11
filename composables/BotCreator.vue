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

import { ref } from 'vue'
import { addBot } from "~~/api/bot";
import type { BotStatus } from "~~/api/BotStatus";
import type {AxiosError, AxiosResponse} from "axios";


const url = ref('')
const token = ref('')
const showPassword = ref(false)
const loading = ref(false)
const errorMsg = ref('')

const emit = defineEmits<{
  (e: 'afterCreate', bot: BotStatus): void
}>()

function onSubmit() {
  loading.value = true
  errorMsg.value = ''
  if (!url.value) {
    errorMsg.value = '请输入url'
    loading.value = false
    return
  }
  if (!token.value) {
    errorMsg.value = '请输入token'
    loading.value = false
    return
  }
  if (!URL.parse(url.value)) {
    errorMsg.value = '请输入正确的url'
    loading.value = false
    return
  }
  addBot(url.value, token.value)
    .then((r : AxiosResponse<BotStatus>) => {
      emit('afterCreate', r.data as BotStatus)
      url.value = ''
      token.value = ''
    })
    .catch((e: AxiosError) => {
      console.log(e)
      errorMsg.value = e.response?.data?.message || e.message || '添加失败'
    })
    .finally(() => {
      loading.value = false

    })
}

</script>

<template>
  <div class="flex flex-col gap-4 p-6">
    <div>
      <h2 class="text-lg font-semibold text-highlighted">添加Bot</h2>
      <p class="mt-1 text-sm text-muted">输入xinRemote插件的连接信息以接入机器人</p>
    </div>

    <UFormField label="URL">
      <UInput
          v-model="url"
          class="w-full"
          placeholder="输入xinRemote插件的url"
          @keyup.enter="onSubmit"
      />
    </UFormField>
    <UFormField label="Token" help="可从bot运行目录下 remote_config.json 中获取">
      <UInput
          v-model="token"
          class="w-full"
          :type="showPassword ? 'text' : 'password'"
          placeholder="输入xinRemote插件的token"
          @keyup.enter="onSubmit"
      >
        <template #trailing>
          <UButton
              variant="link"
              color="neutral"
              size="sm"
              :icon="showPassword ? 'i-lucide-eye-off' : 'i-lucide-eye'"
              :aria-label="showPassword ? '隐藏token' : '显示token'"
              @click="showPassword = !showPassword"
          />
        </template>
      </UInput>
    </UFormField>

    <UAlert v-if="errorMsg" color="error" variant="subtle" :title="errorMsg" />

    <UButton block :loading="loading" @click="onSubmit">
      添加
    </UButton>
  </div>
</template>
