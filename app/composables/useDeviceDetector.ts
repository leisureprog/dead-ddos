export function useDeviceDetector() {
  const isMobile = ref(false)

  const checkDeviceType = () => {
    const width = window.innerWidth
    const userAgent = navigator.userAgent

    // Проверка на мобильное устройство и Telegram Mini App
    isMobile.value = !(/mobile/i.test(userAgent) || width < 768 || /Telegram/.test(userAgent))
  }

  onMounted(() => {
    checkDeviceType()
    window.addEventListener('resize', checkDeviceType)
  })

  onUnmounted(() => {
    window.removeEventListener('resize', checkDeviceType)
  })

  return {
    isMobile,
  }
}
