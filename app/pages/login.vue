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
import LoginCard from "~~/composables/LoginCard.vue";
import { useRouter } from 'vue-router'

const router = useRouter()

definePageMeta({
  hideSidebar: true,
  noAuth: true,
})

onMounted(async () => {
  const result = await fetch('/api/auth/check')
  if (result.status === 200) {
    await router.push('/')
  }
})
</script>

<template>
  <div class="flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-teal-100 p-4 dark:from-gray-950 dark:via-gray-900 dark:to-emerald-950">
    <LoginCard class="w-full max-w-md" />
  </div>
</template>
