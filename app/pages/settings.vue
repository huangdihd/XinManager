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

import ThemeSwitcher from "~~/composables/ThemeSwitcher.vue";
import PageHeader from "~~/composables/PageHeader.vue";
import ConfirmModal from "~~/composables/ConfirmModal.vue";
import { useRouter } from "vue-router";
import { logout } from "~~/api/auth";
import { changePassword } from "~~/api/auth";
import { getConfig, patchBotsFetchInterval, resetConfig } from "~~/api/config";
import { useConfig } from "~~/composables/useConfig";

const bots_fetch_interval = ref(10000)
const password = ref("")
const showPassword = ref(false)

const showLogoutConfirm = ref(false)
const showResetConfirm = ref(false)

const router = useRouter()
const toast = useToast()
const config = useConfig()

function errorToast(title: string, e: any) {
  toast.add({
    title,
    description: e?.response?.data?.message || e?.message || title,
    color: 'error',
    icon: 'i-lucide-circle-x'
  })
}

async function onLogout() {
  try {
    await logout()
    await router.push("/login")
  } catch (error) {
    errorToast("退出登录失败", error)
    console.error("退出登录失败", error)
  }
}

async function onChangePassword() {
  try {
    await changePassword(password.value)
  }
  catch (e) {
    errorToast("修改失败", e)
    return
  }
  toast.add({
    title: "修改成功",
    description: "密码修改成功，请重新登录。",
    color: 'success',
    icon: 'i-lucide-circle-check'
  })
  try {
    await logout()
    await router.push("/login")
  } catch (error) {
    console.error("退出登录失败", error)
  }
}

async function onChangeBotsFetchInterval() {
  try {
    await patchBotsFetchInterval(Number(bots_fetch_interval.value))
    const config = await getConfig()
    bots_fetch_interval.value = config.bots_fetch_interval
    toast.add({ title: "已保存", color: 'success', icon: 'i-lucide-circle-check' })
  }
  catch (e) {
    errorToast("修改失败", e)
  }
}

async function onReset() {
  try {
    await resetConfig()
    toast.add({ title: "已重置所有设置", color: 'success', icon: 'i-lucide-circle-check' })
  }
  catch (e) {
    errorToast("重置失败", e)
  }
}

onMounted(() => {
  bots_fetch_interval.value = config.value.bots_fetch_interval
})

</script>

<template>
  <div class="mx-auto flex w-full max-w-3xl flex-col gap-5 p-6 lg:p-8">
    <PageHeader title="设置" subtitle="面板外观、数据与安全配置" />

    <UCard>
      <template #header>
        <h3 class="font-semibold text-highlighted">外观设置</h3>
      </template>
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm font-medium text-default">深色模式</p>
          <p class="mt-0.5 text-xs text-muted">切换面板的明暗主题</p>
        </div>
        <ThemeSwitcher />
      </div>
    </UCard>

    <UCard>
      <template #header>
        <h3 class="font-semibold text-highlighted">数据更新设置</h3>
      </template>
      <div class="flex flex-col gap-5">
        <UFormField label="Bots数据更新间隔" help="单位：毫秒">
          <div class="flex gap-2">
            <UInput
                v-model="bots_fetch_interval"
                type="number"
                class="w-full max-w-60"
                placeholder="单位：毫秒"
                @keyup.enter="onChangeBotsFetchInterval"
            />
            <UButton color="neutral" variant="soft" @click="onChangeBotsFetchInterval">保存</UButton>
          </div>
        </UFormField>
      </div>
    </UCard>

    <UCard>
      <template #header>
        <h3 class="font-semibold text-highlighted">安全设置</h3>
      </template>
      <div class="flex flex-col gap-5">
        <UFormField label="修改密码" help="修改成功后需要重新登录">
          <div class="flex gap-2">
            <UInput
                v-model="password"
                class="w-full max-w-60"
                :type="showPassword ? 'text' : 'password'"
                placeholder="输入新密码"
                @keyup.enter="onChangePassword"
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
            <UButton @click="onChangePassword">修改密码</UButton>
          </div>
        </UFormField>
        <USeparator />
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-default">退出登录</p>
            <p class="mt-0.5 text-xs text-muted">退出后需要重新输入管理密码</p>
          </div>
          <UButton color="error" variant="soft" icon="i-lucide-log-out" @click="showLogoutConfirm = true">
            退出登录
          </UButton>
        </div>
      </div>
    </UCard>

    <UCard>
      <template #header>
        <h3 class="font-semibold text-highlighted">重置设置</h3>
      </template>
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm font-medium text-default">重置所有设置</p>
          <p class="mt-0.5 text-xs text-muted">所有配置将恢复为默认值，此操作不可撤销</p>
        </div>
        <UButton color="error" icon="i-lucide-rotate-ccw" @click="showResetConfirm = true">
          重置
        </UButton>
      </div>
    </UCard>

    <UCard>
      <template #header>
        <h3 class="font-semibold text-highlighted">关于</h3>
      </template>
      <div class="flex flex-col gap-2 text-sm text-default">
        <p>本项目使用 GPLv3 协议开源</p>
        <div class="flex items-center gap-2">
          <span class="text-muted">作者:</span>
          <UButton
              to="https://github.com/huangdihd"
              target="_blank"
              variant="link"
              color="neutral"
              class="p-0"
          >
            huangdihd
          </UButton>
        </div>
        <div>
          <UButton
              to="https://github.com/huangdihd/xinManager"
              target="_blank"
              icon="i-lucide-github"
              color="neutral"
              variant="soft"
          >
            GitHub
          </UButton>
        </div>
      </div>
    </UCard>
  </div>

  <ConfirmModal
      v-model:open="showLogoutConfirm"
      title="确认退出登录吗？"
      content="退出登录后，您需要重新登录才能继续使用该面板。"
      confirm-text="退出登录"
      @confirm="onLogout"
  />
  <ConfirmModal
      v-model:open="showResetConfirm"
      title="确认重置吗？"
      content="重置后，所有配置将恢复为默认值。"
      confirm-text="重置"
      @confirm="onReset"
  />
</template>
