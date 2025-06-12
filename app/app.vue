<script lang="ts" setup>
import logo from '~/assets/images/logo2.jpg'

const QRCode = defineAsyncComponent(() => import('qrcode-vue3'))

const userStore = useUserStore()
const { isMobile } = useDeviceDetector()
const { isOnline } = useOnlineStatus()

onMounted(() => {
  document.addEventListener('dblclick', function (event) {
    event.preventDefault()
  })
})

onMounted(() => {
  window.addEventListener('beforeunload', userStore.closeSession)
})

onBeforeUnmount(() => {
  window.removeEventListener('beforeunload', userStore.closeSession)
})

const { loading, error, refetch } = useRefetch()

const config = useRuntimeConfig()
</script>

<template>
  <ClientOnly>
    <Welcome v-if="isMobile">
      <div class="flex flex-col justify-center text-center items-center m-auto">
        <QRCode
          value="https://t.me/DeadDDos_bot/start"
          :width="256"
          :height="256"
          :image="logo"
          :imageOptions="{ margin: 8 }"
          :dotsOptions="{ type: 'extra-rounded' }"
          imgclass="flex rounded-2xl" />
        <div class="mt-4 text-2xl text-white">Switch to mobile device 📲</div>
      </div>
    </Welcome>

    <Welcome v-else-if="userStore.isAppLoading || !isOnline || userStore.error">
      <template v-if="userStore.isAppLoading">
        <div class="flex flex-col justify-center text-center items-center m-auto">
          <span class="text-xl text-white">Loading</span>
        </div>
      </template>

      <template v-else-if="!isOnline">
        <div class="flex flex-col justify-center text-center items-center m-auto">
          <span class="text-xl text-white">No internet connection 😢</span>
        </div>
      </template>

      <template v-else-if="userStore.error">
        <div class="flex flex-col justify-center text-center items-center m-auto">
          <span class="text-xl text-white">{{ error || `Error retrieving data. Please update your app. 😔` }}</span>
          <button
            @click="refetch()"
            class="bg-[#b5e103]/10 hover:bg-[#b5e103]/20 text-[#b5e103] py-2 px-4 rounded-lg border mt-4 border-[#b5e103] hover:border-[#fe39fa]"
            >Refresh</button
          >
        </div>
      </template>
    </Welcome>

    <div v-else class="min-h-screen bg-black text-[#b5e103] font-mono">
      <Header />

      <div class="container mx-auto px-4 py-6">
        <main>
          <NuxtLayout />
        </main>
      </div>

      <NuxtSnackbar />
    </div>
  </ClientOnly>
</template>
