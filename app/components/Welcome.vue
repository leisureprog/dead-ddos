<script lang="ts" setup></script>

<template>
  <div
    class="relative flex flex-col justify-end items-center min-h-screen bg-000 bg-cover bg-center bg-no-repeat w-full">
    <div class="absolute z-10 inset-x-0 top-0 h-1/4 bg-gradient-to-b from-black to-transparent"></div>
    <div class="absolute z-10 inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black to-transparent"></div>

    <slot />
  </div>
</template>
