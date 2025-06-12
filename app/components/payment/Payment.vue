<script lang="ts" setup>
import tether from '~/assets/images/icons/tether.svg'

const plans = [
  {
    id: 'basic',
    title: 'BASIC',
    price: 20,
    currency: '$',
    popular: false,
    features: ['Access to missions', 'Direct communication with us'],
    buttonStyle: 'bg-[#b5e103]/10 hover:bg-[#b5e103]/20 text-[#b5e103] border-[#b5e103] hover:border-[#fe39fa]',
  },
  {
    id: 'normal',
    title: 'NORMAL',
    price: 50,
    currency: '$',
    popular: true,
    features: ['Channel admin panel', 'Access to admin chat', 'Early access to our goals'],
    buttonStyle: 'bg-[#fe39fa]/10 hover:bg-[#fe39fa]/20 text-[#fe39fa] border-[#fe39fa] hover:border-[#b5e103]',
  },
]

const QRCode = defineAsyncComponent(() => import('qrcode-vue3'))
const userStore = useUserStore()
const paymentStore = usePaymentStore()

const isOpenPayment = ref(false)
const selectedTier = ref('')
const selectedNetwork = ref('')
const isLoading = ref(true)
const isProcessing = ref(false)
const progress = ref(0)
const showContent = ref(false)
let processingInterval: NodeJS.Timeout | null = null

const config = useRuntimeConfig()

const walletAddresses = {
  ton: config.public.tonAddress,
  ethereum: config.public.ethereumAddress,
  tron: config.public.tronAddress,
  solana: config.public.solanaAddress,
  bitcoin: config.public.bitcoinAddress,
}

const openPayment = async (tier: string) => {
  selectedTier.value = tier
  isOpenPayment.value = true
  isLoading.value = true
  showContent.value = false
  selectedNetwork.value = ''
  resetProcessing()

  setTimeout(() => {
    isLoading.value = false
    showContent.value = true
  }, 2000)
}

const getSelectedPlan = computed(() => {
  return plans.find(plan => plan.id === selectedTier.value)
})

const currentAddress = computed(() => walletAddresses[selectedNetwork.value as keyof typeof walletAddresses])

const qrValue = computed(() => {
  const amount = getSelectedPlan.value?.price || 0
  switch (selectedNetwork.value) {
    case 'ethereum':
      return `ethereum:${currentAddress.value}@1?value=${amount}e6`
    case 'ton':
      return `ton://transfer/${currentAddress.value}?amount=${amount * 1e6}`
    case 'tron':
      return `tron:${currentAddress.value}?amount=${amount}`
    case 'solana':
      return `solana:${currentAddress.value}?amount=${amount}`
    case 'bitcoin':
      return `bitcoin:${currentAddress.value}?amount=${amount}`
    default:
      return currentAddress.value
  }
})

const { copy, isSupported, copied } = useClipboard()
const copyAddress = () => copy(currentAddress.value)

const processPayment = async () => {
  if (!selectedNetwork.value) {
    console.log('Please select a network before confirming payment')
    return
  }

  try {
    const selectedPlan = getSelectedPlan.value
    if (!selectedPlan || !userStore.id) return

    await paymentStore.createPayment({
      userId: userStore.id,
      id: `${selectedPlan.id}_${Date.now()}`,
      title: selectedPlan.title,
      price: selectedPlan.price,
      currency: selectedPlan.currency,
      paymentMethod: `USDT_${selectedNetwork.value.toUpperCase()}`,
    })

    console.log(`Processing USDT payment on ${selectedNetwork.value} for ${selectedTier.value} tier`)
    isOpenPayment.value = false
  } catch (error) {
    console.error('Payment processing error:', error)
  }
}

const startProcessing = () => {
  resetProcessing()
  isProcessing.value = true
  progress.value = 0

  processingInterval = setInterval(() => {
    progress.value += 5
    if (progress.value >= 100) {
      resetProcessing()
      setTimeout(() => (isProcessing.value = false), 1000)
    }
  }, 30000)
}

const resetProcessing = () => {
  if (processingInterval) {
    clearInterval(processingInterval)
    processingInterval = null
  }
  progress.value = 0
}

watch(selectedNetwork, (newNetwork, oldNetwork) => {
  if (newNetwork && newNetwork !== oldNetwork) {
    setTimeout(() => {
      startProcessing()
    }, 3000)
  } else if (!newNetwork) {
    isProcessing.value = false
    resetProcessing()
  }
})

onUnmounted(() => {
  resetProcessing()
})
</script>

<template>
  <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
    <div
      v-for="plan in plans"
      :key="plan.id"
      class="bg-gray-900 p-6 rounded-lg border"
      :class="[plan.popular ? 'border-[#fe39fa] hover:border-[#b5e103]' : 'border-[#b5e103] hover:border-[#fe39fa]']">
      <div v-if="plan.popular" class="absolute top-0 right-0 bg-[#fe39fa] text-black px-2 py-1 text-xs font-bold">
        POPULAR
      </div>
      <h3 class="text-lg font-bold mb-2 text-center" :class="plan.popular ? 'text-[#fe39fa]' : 'text-[#fe39fa]'">
        {{ plan.title }}
      </h3>
      <p class="text-2xl font-bold text-center mb-4 text-[#b5e103]">{{ plan.currency }}{{ plan.price }}</p>
      <ul class="text-sm space-y-2">
        <li v-for="(feature, index) in plan.features" :key="index" class="flex items-start">
          <span class="mdi mdi-check text-[#b5e103] mr-2 mt-1"></span>
          {{ feature }}
        </li>
      </ul>
      <button
        @click="openPayment(plan.id)"
        class="mt-6 w-full py-2 px-4 rounded-lg border transition-all"
        :class="plan.buttonStyle">
        SELECT TIER
      </button>
    </div>
  </div>

  <CustomModal
    v-if="getSelectedPlan"
    :is-open="isOpenPayment"
    @close="isOpenPayment = false"
    :title="`PAYMENT FOR ${getSelectedPlan.title}`">
    <div class="p-6 flex flex-col items-center min-h-[400px] relative">
      <transition name="fade">
        <div v-if="isLoading" class="absolute inset-0 flex flex-col items-center justify-center">
          <div class="w-12 h-12 border-4 border-[#b5e103] border-t-transparent rounded-full animate-spin mb-4"></div>
          <p class="text-gray-400">Preparing payment data...</p>
        </div>
      </transition>

      <transition name="fade">
        <div v-if="showContent" class="w-full">
          <p class="mb-4 text-[#b5e103] text-center">
            Amount: <span class="font-bold">{{ getSelectedPlan.currency }}{{ getSelectedPlan.price }}</span>
          </p>

          <div class="mb-6 w-full max-w-md">
            <h4 class="font-bold mb-2 text-[#fe39fa]">SELECT NETWORK (USDT):</h4>
            <select
              v-model="selectedNetwork"
              class="w-full bg-[#2a2a2a] text-[#b5e103] border border-[#b5e103] rounded-lg p-2 focus:outline-none focus:border-[#fe39fa]">
              <option value="" disabled>Select a network</option>
              <option value="ton">TON</option>
              <option value="ethereum">Ethereum</option>
              <option value="tron">TRON</option>
              <option value="solana">Solana</option>
              <option value="bitcoin">Bitcoin</option>
            </select>
          </div>

          <div v-if="selectedNetwork" class="w-full">
            <div class="mt-4 mb-8 w-64 mx-auto">
              <QRCode
                :value="qrValue"
                :width="256"
                :height="256"
                :image="tether"
                :imageOptions="{ margin: 6, imageSize: 0.4 }"
                :dotsOptions="{ type: 'extra-rounded' }"
                imgclass="mx-auto rounded-2xl" />
            </div>

            <div class="w-full max-w-md bg-[#1d1a20] rounded-xl p-4 mb-6">
              <div class="text-sm text-gray-400 mb-2">Wallet Address:</div>
              <div
                @click="copyAddress()"
                class="flex items-center justify-between bg-[#2a2a2a] rounded-lg p-3 cursor-pointer hover:bg-[#2a2a2a]/90 transition">
                <span class="text-[#b5e103] font-mono text-sm truncate mr-2">{{ currentAddress }}</span>
                <button
                  class="text-[#fe39fa] hover:text-[#b5e103] transition relative"
                  :disabled="!isSupported"
                  :title="copied ? 'Copied!' : 'Copy'">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                  </svg>
                  <span
                    v-if="copied"
                    class="absolute -top-8 -right-2 bg-[#fe39fa] text-black text-xs px-2 py-1 rounded whitespace-nowrap">
                    Copied!
                  </span>
                </button>
              </div>
            </div>

            <transition name="fade">
              <div v-if="isProcessing">
                <button
                  @click="processPayment"
                  class="w-full max-w-md py-3 px-6 bg-[#fe39fa] hover:bg-[#fe39fa]/90 text-white font-bold rounded-lg transition mb-3">
                  Confirm Payment
                </button>

                <div class="w-full max-w-md mb-6 flex flex-col items-center">
                  <div
                    class="w-8 h-8 border-2 border-[#b5e103] border-t-transparent rounded-full animate-spin mb-3"></div>
                  <div class="text-sm text-gray-400 mb-2">Waiting for deposit...</div>
                  <div class="w-full">
                    <div class="flex justify-between text-xs text-gray-400 mb-1">
                      <span>Verification Progress:</span>
                      <span>{{ progress }}%</span>
                    </div>
                    <div class="w-full bg-[#2a2a2a] rounded-full h-2">
                      <div
                        class="bg-gradient-to-r from-[#b5e103] to-[#fe39fa] h-2 rounded-full transition-all duration-300"
                        :style="{ width: `${progress}%` }"></div>
                    </div>
                  </div>
                </div>
              </div>
            </transition>
            <div class="text-sm text-gray-300 text-center">
              Scan the QR code to send USDT<br />
              or use the wallet address above
            </div>
          </div>
        </div>
      </transition>
    </div>
  </CustomModal>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
.animate-spin {
  animation: spin 1s linear infinite;
}
</style>
