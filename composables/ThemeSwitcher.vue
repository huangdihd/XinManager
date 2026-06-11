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
const colorMode = useColorMode()

const isDark = computed(() => colorMode.value === 'dark')

function onToggle(value: boolean) {
  colorMode.preference = value ? 'dark' : 'light'
}
</script>

<template>
  <ClientOnly>
    <USwitch
        :model-value="isDark"
        unchecked-icon="i-lucide-sun"
        checked-icon="i-lucide-moon"
        size="lg"
        @update:model-value="onToggle"
    />
    <template #fallback>
      <USwitch size="lg" disabled />
    </template>
  </ClientOnly>
</template>
