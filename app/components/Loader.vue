<script setup lang="ts">
defineOptions({
  name: 'AppLoader'
})

withDefaults(defineProps<{
  show: boolean
  text?: string
}>(), {
  text: 'Procesando imagen...'
})
</script>

<template>
  <transition name="fade">
    <div
      v-if="show"
      class="fixed inset-0 z-50 grid place-items-center bg-slate-950/30 backdrop-blur-[2px]"
    >
      <div class="w-[260px] rounded-2xl border border-slate-200 bg-white p-5 shadow-xl">
        <div class="flex items-center gap-3">
          <span class="h-5 w-5 animate-spin rounded-full border-2 border-cyan-200 border-t-cyan-600" />
          <p class="text-sm font-medium text-slate-700">
            {{ text }}
          </p>
        </div>
      </div>
    </div>
  </transition>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 160ms ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
