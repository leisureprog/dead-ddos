<script lang="ts" setup>
import { TransitionRoot, TransitionChild, Dialog, DialogPanel, DialogTitle } from '@headlessui/vue'

const { isOpen = false, title = '' } = defineProps<{
  isOpen: boolean
  title?: string
}>()

const emit = defineEmits(['close'])

const windowWidth = ref(window.innerWidth)

const isMdDevice = computed(() => windowWidth.value > 798)

const handleResize = () => {
  windowWidth.value = window.innerWidth
}

onMounted(() => {
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})

function getAnimationClasses() {
  return {
    enter: 'duration-300 ease-out transform origin-top',
    enterFrom: 'opacity-0 scale-95 translate-y-full',
    enterTo: 'opacity-100 scale-100 translate-y-0',
    leave: 'duration-200 ease-in transform origin-top',
    leaveFrom: 'opacity-100 scale-100 translate-y-0',
    leaveTo: 'opacity-0 scale-95 translate-y-full',
  }
}
</script>

<template>
  <TransitionRoot appear :show="isOpen" as="template">
    <Dialog as="div" @close="emit('close')" class="relative z-50">
      <div class="fixed top-[117px] inset-0 overflow-auto">
        <div class="flex min-h-full">
          <TransitionChild
            as="template"
            :enter="getAnimationClasses().enter"
            :enter-from="getAnimationClasses().enterFrom"
            :enter-to="getAnimationClasses().enterTo"
            :leave="getAnimationClasses().leave"
            :leave-from="getAnimationClasses().leaveFrom"
            :leave-to="getAnimationClasses().leaveTo">
            <DialogPanel
              class="w-full transform overflow-hidden px-6 pt-4 pb-10 text-left align-bottom shadow-xl transition-all bg-black">
              <header class="relative flex items-center justify-between h-12">
                <button
                  @click="emit('close')"
                  class="bg-[#b5e103]/10 hover:bg-[#b5e103]/20 text-[#b5e103] py-2 px-4 rounded-lg border border-[#b5e103] hover:border-[#fe39fa]">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="h-5 w-5 transform transition-transform duration-300 group-hover:-translate-x-1"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M19 12H5m0 0l7 7m-7-7l7-7" />
                  </svg>
                </button>

                <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <DialogTitle as="h3" class="text-xl font-bold text-[#fe39fa] whitespace-nowrap">
                    {{ title }}
                  </DialogTitle>
                </div>
              </header>

              <div class="relative h-full flex flex-col">
                <slot />
              </div>
            </DialogPanel>
          </TransitionChild>
        </div>
      </div>
    </Dialog>
  </TransitionRoot>
</template>
