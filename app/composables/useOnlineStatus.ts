export const useOnlineStatus = () => {
  const isOnline = ref(false)

  const updateOnlineStatus = () => {
    isOnline.value = navigator.onLine
  }

  // Проверяем, что код выполняется на клиенте
  if (process.client) {
    onMounted(() => {
      updateOnlineStatus() // Инициализируем статус при монтировании
      window.addEventListener('online', updateOnlineStatus)
      window.addEventListener('offline', updateOnlineStatus)
    })
    
    onBeforeUnmount(() => {
      window.removeEventListener('online', updateOnlineStatus)
      window.removeEventListener('offline', updateOnlineStatus)
    })
  } else {
    // Если не клиент, просто устанавливаем значение по умолчанию
    isOnline.value = true 
  }

  return {
    isOnline
  }
}
