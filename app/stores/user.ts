import type { WebAppSession } from '@prisma/client'
import { client } from '~/configs/rpc'

interface UserProfileState {
  nickname: string
  age: number
  telegram: string
  skills: string
  isApproved: boolean
  lastEdited: Date | null
}

interface UserState {
  isInitialized: boolean
  id: number
  telegramId: number
  username: string | null
  avatar: string | null
  firstName: string | null
  lastName: string | null
  languageCode: string | null
  isPremium: boolean
  session: WebAppSession | null
  isAppLoading: boolean
  loading: boolean
  error: boolean
  isUpdating: boolean
  profile: UserProfileState | null
}

const CACHE_KEY = 'userStoreCache'
const CACHE_TTL = 5 * 60 * 1000 // 5 минут в миллисекундах

export const useUserStore = defineStore('user', {
  state: (): UserState => ({
    isInitialized: false,
    id: 0,
    telegramId: 0,
    username: null,
    avatar: null,
    firstName: null,
    lastName: null,
    languageCode: null,
    isPremium: false,
    session: null,
    isAppLoading: false,
    loading: false,
    error: false,
    isUpdating: false,
    profile: null,
  }),

  getters: {
    displayName: state => {
      return state.profile?.nickname || state.firstName
        ? `${state.firstName} ${state.lastName || ''}`.trim()
        : state.username || state.telegramId || 'N/A'
    },

    isProfileComplete: state => {
      return (
        !!state.profile &&
        !!state.profile.nickname &&
        !!state.profile.age &&
        !!state.profile.telegram &&
        !!state.profile.skills
      )
    },
  },

  actions: {
    restoreFromCache() {
      try {
        const cachedData = localStorage.getItem(CACHE_KEY)
        if (!cachedData) return false

        const { data, timestamp } = JSON.parse(cachedData)

        if (Date.now() - timestamp > CACHE_TTL) {
          localStorage.removeItem(CACHE_KEY)
          return false
        }

        const { loading, error, isUpdating, isAppLoading, ...restData } = data
        this.$patch(restData)
        return true
      } catch (error) {
        console.error('Ошибка восстановления из кэша:', error)
        return false
      }
    },

    saveToCache() {
      try {
        const { loading, error, isUpdating, isAppLoading, ...dataToCache } = this.$state

        const cacheData = {
          data: dataToCache,
          timestamp: Date.now(),
        }

        localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData))
      } catch (error) {
        console.error('Ошибка сохранения в кэш:', error)
      }
    },

    async registerUser(params: {
      telegramId: number
      friendId?: number
      username?: string
      avatar?: string
      firstName?: string
      lastName?: string
      languageCode?: string
      isPremium?: boolean
      registrationSource?: string
    }) {
      try {
        this.isAppLoading = true
        this.error = false

        const response = await client.request('user.add', params)

        if (response.status !== 200) {
          throw new Error(response.message || 'Ошибка регистрации')
        }

        this.$patch(response.user)
        this.saveToCache()
      } catch (error) {
        this.error = true
        console.error('Ошибка регистрации:', error)
        throw error
      } finally {
        this.isAppLoading = false
      }
    },

    async fetchUserData() {
      if (this.restoreFromCache()) {
        return
      }

      try {
        this.loading = true
        const response = await client.request('user.get', { userId: this.id })
        this.$patch(response)
        this.saveToCache()
      } catch (error) {
        console.error('Ошибка загрузки данных:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    async closeSession() {
      try {
        if (!this.session) return

        const response = await client.request('user.closeWebAppSession', {
          sessionId: this.session.id,
        })

        if (response.status === 200) {
          this.session = null
          this.saveToCache()
        }
        return response
      } catch (error) {
        console.error('Ошибка закрытия сессии:', error)
        throw error
      }
    },

    setInitialized(value: boolean) {
      this.isInitialized = value
    },

    reset() {
      this.$reset()
      localStorage.removeItem(CACHE_KEY)
    },

    /**
     * Загружает профиль пользователя
     */
    async fetchUserProfile() {
      try {
        this.loading = true
        const response = await client.request('user.getUserProfile', { userId: this.id })

        if (response) {
          this.profile = {
            nickname: response.nickname || '',
            age: response.age || 0,
            telegram: response.telegram || '',
            skills: response.skills || '',
            isApproved: response.isApproved || false,
            lastEdited: response.lastEdited || null,
          }
          this.saveToCache()
        }

        return this.profile
      } catch (error) {
        console.error('Ошибка загрузки профиля:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    /**
     * Обновляет профиль пользователя
     */
    async updateUserProfile(profileData: { nickname: string; age: number; telegram: string; skills: string }) {
      try {
        this.isUpdating = true
        this.error = false

        const response = await client.request('user.upsertUserProfile', {
          userId: this.id,
          ...profileData,
        })

        if (response) {
          this.profile = {
            nickname: profileData.nickname,
            age: profileData.age,
            telegram: profileData.telegram,
            skills: profileData.skills,
            isApproved: false,
            lastEdited: new Date(),
          }
          this.saveToCache()
        }
        return response
      } catch (error) {
        this.error = true
        console.error('Ошибка обновления профиля:', error)
        throw error
      } finally {
        this.isUpdating = false
      }
    },

    /**
     * Проверяет, одобрен ли профиль
     */
    async checkProfileApproval() {
      try {
        if (!this.profile) {
          await this.fetchUserProfile()
        }
        return this.profile?.isApproved ?? false
      } catch (error) {
        console.error('Ошибка проверки статуса профиля:', error)
        return false
      }
    },

    /**
     * Отправляет профиль на модерацию
     */
    async submitProfileForApproval() {
      try {
        this.isUpdating = true
        const response = await client.request('user.profile.submit', { userId: this.id })

        if (response.status === 200) {
          if (this.profile) {
            this.profile = {
              nickname: this.profile.nickname,
              age: this.profile.age,
              telegram: this.profile.telegram,
              skills: this.profile.skills,
              isApproved: false,
              lastEdited: new Date(),
            }
          } else {
            this.profile = {
              nickname: '',
              age: 0,
              telegram: '',
              skills: '',
              isApproved: false,
              lastEdited: new Date(),
            }
          }
          this.saveToCache()
        }
        return response
      } catch (error) {
        console.error('Ошибка отправки профиля на модерацию:', error)
        throw error
      } finally {
        this.isUpdating = false
      }
    },
  },
})
