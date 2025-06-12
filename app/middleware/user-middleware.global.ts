export default defineNuxtRouteMiddleware(async (to, from) => {
  if (process.client) {
    const userStore = useUserStore()

    if (userStore.isInitialized) return

    const { useMiniApp, useViewport } = await import('vue-tg')
    const { initDataUnsafe } = useMiniApp()
    const { isExpanded } = useViewport()

    try {
      // Ожидание инициализации WebApp
      if (!isExpanded) {
        await new Promise(resolve => {
          const check = () => {
            if (isExpanded) resolve(true)
            else setTimeout(check, 50)
          }
          check()
        })
      }

      if (initDataUnsafe?.user) {
        const userData = {
          ...(initDataUnsafe.user as any),
          isPremium: initDataUnsafe.user?.is_premium,
        }

        // Регистрация с трекингом внутри store
        userStore.registerUser({
          telegramId: userData.id,
          username: userData.username,
          avatar: userData.photo_url,
          firstName: userData.first_name,
          lastName: userData.last_name,
          languageCode: userData.language_code,
          isPremium: userData.isPremium,
        })
      } else if (process.env.NODE_ENV === 'development') {
        // Mock данные для разработки
        userStore.registerUser({
          telegramId: 7230932774,
          username: 'leisure',
          avatar: '',
          firstName: '',
          lastName: '',
          languageCode: 'ru',
          isPremium: true,
        })
      } else {
        return navigateTo('/')
      }

      userStore.setInitialized(true)
    } catch (error) {
      console.error('User initialization failed:', error)
      if (process.env.NODE_ENV !== 'development') {
        return navigateTo('/')
      }
    }
  }
})
