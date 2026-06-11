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
import type { NavigationMenuItem } from '@nuxt/ui'
import ThemeSwitcher from '~~/composables/ThemeSwitcher.vue'

const items: NavigationMenuItem[] = [
  { label: '首页', icon: 'i-lucide-house', to: '/' },
  { label: 'Bot管理', icon: 'i-lucide-bot', to: '/bots' },
  { label: '设置', icon: 'i-lucide-settings', to: '/settings' }
]
</script>

<template>
  <aside class="flex w-60 shrink-0 flex-col border-r border-default bg-elevated/40">
    <NuxtLink to="/" class="flex h-16 items-center gap-3 px-5">
      <div class="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 text-base font-black text-white shadow-md">
        X
      </div>
      <span class="text-base font-semibold text-highlighted">Xin Manager</span>
    </NuxtLink>
    <UNavigationMenu
        orientation="vertical"
        :items="items"
        class="px-3"
        :ui="{ link: 'gap-3 py-2.5' }"
    />
    <div class="mt-auto flex items-center justify-between px-5 py-4">
      <span class="text-xs text-muted">主题</span>
      <ThemeSwitcher />
    </div>
  </aside>
</template>
