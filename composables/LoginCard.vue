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
import { ref } from "vue"
import { useRouter } from "vue-router"

import { login } from "~~/api/auth";

const router = useRouter()
const password = ref("")
const showPassword = ref(false)
const loading = ref(false)
const errorMsg = ref("")
const fieldError = ref("")

const onSubmit = async () => {
  errorMsg.value = ""
  fieldError.value = ""
  if (!password.value) {
    fieldError.value = "请输入管理密码"
    return
  }
  if (password.value.length < 8) {
    fieldError.value = "至少 8 位字符"
    return
  }

  loading.value = true
  try {
    await login(password.value)
    await router.push("/")
  } catch (e: any) {
    errorMsg.value = e?.data?.message || e?.message || "登录失败，请稍后重试"
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <UCard class="shadow-xl" :ui="{ body: 'p-8 sm:p-8' }">
    <div class="flex flex-col gap-5">
      <div class="flex flex-col items-center gap-3 text-center">
        <div class="flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 text-lg font-black text-white shadow-md">
          X
        </div>
        <div>
          <h1 class="text-xl font-bold text-highlighted">登录 Xin Manager</h1>
          <p class="mt-1 text-sm text-muted">请输入管理密码以继续</p>
        </div>
      </div>

      <UAlert v-if="errorMsg" color="error" variant="subtle" :title="errorMsg" />

      <UFormField label="密码" :error="fieldError || undefined">
        <UInput
            v-model="password"
            class="w-full"
            size="lg"
            :type="showPassword ? 'text' : 'password'"
            placeholder="输入管理密码"
            @keyup.enter="onSubmit"
        >
          <template #trailing>
            <UButton
                variant="link"
                color="neutral"
                size="sm"
                :icon="showPassword ? 'i-lucide-eye-off' : 'i-lucide-eye'"
                :aria-label="showPassword ? '隐藏密码' : '显示密码'"
                @click="showPassword = !showPassword"
            />
          </template>
        </UInput>
      </UFormField>

      <UButton block size="lg" :loading="loading" @click="onSubmit">
        登录
      </UButton>
    </div>
  </UCard>
</template>
