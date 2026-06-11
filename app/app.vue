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
import SideBar from "~~/composables/SideBar.vue";
import { useRoute } from "vue-router"
import { ref } from 'vue'
import { check } from '~~/api/auth'

const isLoading = ref(true)

const route = useRoute()

const noSidebar = computed(() => route.meta?.hideSidebar === true)

const noAuth = computed(() => route.meta?.noAuth === true)

onMounted(() => {
  isLoading.value = false
  if (import.meta.env.BROWSER && !noAuth.value) check()
})
</script>

<template>
  <UApp>
    <div class="flex h-screen overflow-hidden bg-default text-default">
      <SideBar v-if="!noSidebar" />
      <div v-if="isLoading" class="fixed inset-0 z-[9999] flex items-center justify-center bg-default">
        <div class="size-12 animate-spin rounded-full border-4 border-accented border-t-primary" />
      </div>
      <main class="min-w-0 flex-1 overflow-auto">
        <NuxtPage />
      </main>
    </div>
  </UApp>
</template>
