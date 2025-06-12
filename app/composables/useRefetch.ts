export function useRefetch() {
  const loading = ref(false)
  const error = ref<Error | null>(null)
  const router = useRouter()

  const refetch = async (
    options: {
      reload?: boolean
      route?: string
      force?: boolean
    } = {},
  ) => {
    loading.value = true
    error.value = null

    try {
      if (options.route) {
        // Переход на новый маршрут
        await router.push(options.route)
      } else if (options.reload || options.force) {
        // Принудительная перезагрузка страницы
        if (options.force) {
          // Полная перезагрузка (с очисткой кеша)
          window.location.href = window.location.href
        } else {
          // Обычная перезагрузка
          window.location.reload()
        }
      } else {
        // Мягкий рефетч - просто обновляем данные компонента
        // (нужно реализовать в компоненте)
        return true
      }
    } catch (err) {
      error.value = err instanceof Error ? err : new Error(String(err))
      throw error.value
    } finally {
      loading.value = false
    }
  }

  return {
    loading,
    error,
    refetch,
  }
}
