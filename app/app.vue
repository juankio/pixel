<script setup lang="ts">
const title = 'PixelTrace Studio | Vectorización de logos'
const description = 'Herramienta SaaS para vectorizar logos, editar colores SVG en tiempo real y descargar resultados.'

useHead({
  htmlAttrs: {
    lang: 'es'
  },
  meta: [
    { name: 'viewport', content: 'width=device-width, initial-scale=1' }
  ],
  link: [
    { rel: 'icon', href: '/favicon.ico' }
  ]
})

useSeoMeta({
  title,
  description,
  ogTitle: title,
  ogDescription: description,
  twitterCard: 'summary_large_image'
})
</script>

<template>
  <UApp>
    <NuxtPage />
  </UApp>
</template>
