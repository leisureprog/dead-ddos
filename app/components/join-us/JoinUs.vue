<script lang="ts" setup>
const userStore = useUserStore()

onMounted(userStore.fetchUserProfile)

const [isOpen, open] = useToggle()
</script>

<template>
  <button
    @click="open()"
    class="bg-gray-900 hover:bg-[#b5e103]/10 text-[#b5e103] py-3 px-4 rounded-lg border border-[#b5e103] transition-all flex items-center uppercase justify-center hover:border-[#fe39fa]"
    :disabled="isSubmitting">
    <span class="mdi mr-2" :class="userStore.profile ? 'mdi-account-edit' : 'mdi-account-plus'"></span>
    {{ userStore.profile ? 'Edit Profile' : 'Join Us' }}
  </button>

  <CustomModal :is-open="isOpen" @close="isOpen = false" :title="userStore.profile ? 'EDIT PROFILE' : 'JOIN US'">
    <JoinUsModal :profile="userStore.profile" @close="isOpen = false" />
  </CustomModal>
</template>
