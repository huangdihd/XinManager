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
withDefaults(defineProps<{
  title: string
  content?: string
  confirmText?: string
  cancelText?: string
  confirmColor?: 'error' | 'primary' | 'warning'
}>(), {
  confirmText: '确定',
  cancelText: '取消',
  confirmColor: 'error'
})

const open = defineModel<boolean>('open', { default: false })

const emit = defineEmits<{
  (e: 'confirm'): void
}>()

function onConfirm() {
  open.value = false
  emit('confirm')
}
</script>

<template>
  <UModal v-model:open="open" :title="title" :description="content">
    <template #footer>
      <div class="flex w-full justify-end gap-2">
        <UButton color="neutral" variant="ghost" @click="open = false">{{ cancelText }}</UButton>
        <UButton :color="confirmColor" @click="onConfirm">{{ confirmText }}</UButton>
      </div>
    </template>
  </UModal>
</template>
