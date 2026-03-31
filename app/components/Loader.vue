<script setup lang="ts">
defineOptions({ name: 'AppLoader' })

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
      class="fixed inset-0 z-50 grid place-items-center bg-slate-950/20 backdrop-blur-sm"
    >
      <div class="w-72 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-2xl shadow-slate-900/10">
        <div class="h-0.5 w-full overflow-hidden bg-slate-100">
          <div class="h-full w-1/2 animate-[slide_1.2s_ease-in-out_infinite] rounded-full bg-linear-to-r from-cyan-400 to-cyan-600" />
        </div>
        <div class="flex items-center gap-3 px-5 py-4">
          <div class="shrink-0 rounded-full bg-cyan-50 p-2">
            <span class="block h-4 w-4 animate-spin rounded-full border-2 border-cyan-200 border-t-cyan-500" />
          </div>
          <p class="text-sm font-medium text-slate-700">{{ text }}</p>
        </div>
      </div>
    </div>
  </transition>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 180ms ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

@keyframes slide {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(300%); }
}
</style>
