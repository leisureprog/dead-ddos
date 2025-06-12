<script lang="ts" setup>
const userStore = useUserStore()
</script>

<template>
  <!-- User Info Section -->
  <section class="mb-8 p-4 bg-gray-900 rounded-lg border border-[#b5e103]">
    <h2 class="text-xl font-bold uppercase mb-3 flex items-center text-[#fe39fa]">
      <span class="mdi mdi-account-circle mr-2"></span>
      Welcome
    </h2>
    <div class="grid grid-cols-4 gap-4">
      <div class="col-span-1">
        <img
          v-if="userStore?.avatar"
          :src="userStore.avatar"
          alt="User Avatar"
          class="rounded-full w-16 h-16 border-2 border-[#fe39fa]" />
      </div>
      <div class="col-span-3">
        <p class="text-sm"><span class="text-gray-400">ID:</span> {{ userStore?.telegramId }}</p>
        <p class="text-sm"><span class="text-gray-400">Username:</span> @{{ userStore?.username }}</p>
        <p v-if="userStore?.first_name && userStore?.last_name" class="text-sm"
          ><span class="text-gray-400">Name:</span> {{ userStore?.first_name }} {{ userStore?.last_name }}</p
        >
      </div>
    </div>
  </section>

  <!-- Actions Section -->
  <section class="mb-8">
    <h2 class="text-xl font-bold mb-4 flex items-center text-[#fe39fa]">
      <span class="mdi mdi-console mr-2"></span>
      ACTIONS
    </h2>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Report />

      <JoinUs />

      <PersonalQuestion />
    </div>
  </section>

  <!-- Membership Section -->
  <section class="mb-8">
    <h2 class="text-xl font-bold mb-4 flex items-center text-[#fe39fa]">
      <span class="mdi mdi-shield-account mr-2"></span>
      MEMBERSHIP
    </h2>

    <Payment />
  </section>

  <!-- Status Bar -->
  <div
    class="fixed bottom-0 left-0 right-0 bg-black text-[#b5e103] text-xs py-2 px-4 border-t border-[#fe39fa] flex justify-between">
    <span>STATUS: <span class="text-[#fe39fa]">CONNECTED</span></span>
    <span
      >USER: <span class="text-[#fe39fa]">@{{ userStore?.username }}</span></span
    >
    <span>VERSION: <span class="text-[#fe39fa]">1.0.0</span></span>
  </div>
</template>

<style>
body {
  font-family: 'Courier New', monospace;
}

/* Neon glow effects */
.glow-text {
  text-shadow: 0 0 8px rgba(181, 225, 3, 0.7);
}

.glow-pink {
  text-shadow: 0 0 8px rgba(254, 57, 250, 0.7);
}

.glow-box {
  box-shadow: 0 0 15px rgba(181, 225, 3, 0.3);
}

.glow-box-pink {
  box-shadow: 0 0 15px rgba(254, 57, 250, 0.3);
}

/* Scrollbar */
::-webkit-scrollbar {
  width: 8px;
}

::-webkit-scrollbar-track {
  background: #111;
}

::-webkit-scrollbar-thumb {
  background: #b5e103;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: #fe39fa;
}

/* Input focus effects */
input:focus,
textarea:focus {
  outline: none;
  box-shadow: 0 0 0 2px #fe39fa;
}
</style>
