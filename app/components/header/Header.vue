<script lang="ts" setup>
import logo from '~/assets/images/logo2.jpg'
</script>

<template>
  <header class="sticky top-0 bg-black py-4 px-6 border-b border-[#fe39fa]">
    <div class="flex items-center">
      <img :src="logo" alt="DedSec Logo" class="h-12 w-12 mr-3" />
      <h1 class="text-2xl font-bold tracking-wider">DEAD<span class="text-[#fe39fa]">DDOS</span></h1>
    </div>
    <p class="text-xs mt-1 text-gray-400">// We are legion. We do not forgive. We do not forget.</p>
  </header>
</template>
