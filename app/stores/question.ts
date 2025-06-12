import type { PersonalQuestion, QuestionStatus, User } from '@prisma/client'
import { client } from '~/configs/rpc'

interface QuestionState {
  questions: PersonalQuestion[]
  currentQuestion:
    | (PersonalQuestion & {
        user?: Pick<User, 'id' | 'username' | 'telegramId'>
        answeredBy?: Pick<User, 'id' | 'username'>
        logs?: any[]
      })
    | null
  loading: boolean
  error: string | null
  pagination: {
    page: number
    limit: number
    total: number
  }
  lastUpdated: number | null
}

// Cache constants
const QUESTIONS_CACHE_KEY = 'questionsStoreCache'
const CACHE_TTL = 10 * 60 * 1000 // 10 minutes

export const useQuestionStore = defineStore('question', {
  state: (): QuestionState => ({
    questions: [],
    currentQuestion: null,
    loading: false,
    error: null,
    pagination: {
      page: 1,
      limit: 20,
      total: 0,
    },
    lastUpdated: null,
  }),

  getters: {
    pendingQuestions: state => state.questions.filter(q => q.status === 'PENDING'),
    userQuestions: state => (userId: number) => state.questions.filter(q => q.userId === userId),
    hasMore: state => state.questions.length < state.pagination.total,
  },

  actions: {
    restoreFromCache() {
      try {
        const cachedData = localStorage.getItem(QUESTIONS_CACHE_KEY)
        if (!cachedData) return false

        const { data, timestamp } = JSON.parse(cachedData)

        if (Date.now() - timestamp > CACHE_TTL) {
          localStorage.removeItem(QUESTIONS_CACHE_KEY)
          return false
        }

        this.$patch({
          questions: data.questions,
          pagination: data.pagination,
          lastUpdated: timestamp,
        })
        return true
      } catch (error) {
        console.error('Error restoring questions from cache:', error)
        return false
      }
    },

    saveToCache() {
      try {
        const dataToCache = {
          questions: this.questions,
          pagination: this.pagination,
        }

        const cacheData = {
          data: dataToCache,
          timestamp: Date.now(),
        }

        localStorage.setItem(QUESTIONS_CACHE_KEY, JSON.stringify(cacheData))
        this.lastUpdated = Date.now()
      } catch (error) {
        console.error('Error saving questions to cache:', error)
      }
    },

    // Question operations
    async createQuestion(params: {
      question: string
      userId: number
      isPrivate?: boolean
      ipAddress?: string
      userAgent?: string
    }) {
      try {
        this.loading = true
        this.error = null

        const response = await client.request('question.create', params)

        if (!response.success) {
          throw new Error(response.error || 'Error creating question')
        }

        this.questions.unshift({
          ...response.data,
          status: 'PENDING',
          createdAt: new Date(),
        })
        this.pagination.total += 1
        this.saveToCache()

        return response.data
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Error creating question'
        throw error
      } finally {
        this.loading = false
      }
    },

    async fetchQuestions(params?: { status?: QuestionStatus; userId: number; page?: number; refresh?: boolean }) {
      if (!params?.refresh && this.restoreFromCache()) {
        return
      }

      try {
        this.loading = true
        this.error = null

        const page = params?.page || this.pagination.page
        const limit = this.pagination.limit

        const response = await client.request('question.getQuestions', {
          status: params?.status,
          userId: params?.userId,
          page,
          limit,
        })

        if (!response.success) {
          throw new Error(response.error || 'Error loading questions')
        }

        this.$patch({
          questions: response.data.questions,
          pagination: {
            page,
            limit,
            total: response.data.pagination.total,
          },
        })
        this.saveToCache()
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Error loading questions'
        throw error
      } finally {
        this.loading = false
      }
    },

    async loadMoreQuestions() {
      if (!this.hasMore || this.loading) return

      try {
        this.loading = true
        const nextPage = this.pagination.page + 1

        const response = await client.request('question.getQuestions', {
          page: nextPage,
          limit: this.pagination.limit,
        })

        if (!response.success) {
          throw new Error(response.error || 'Error loading more questions')
        }

        this.questions.push(...response.data.questions)
        this.pagination.page = nextPage
        this.saveToCache()
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Error loading more questions'
        throw error
      } finally {
        this.loading = false
      }
    },

    async getQuestionById(id: number) {
      try {
        this.loading = true
        this.error = null

        const cachedQuestion = this.questions.find(q => q.id === id)
        if (cachedQuestion) {
          this.currentQuestion = cachedQuestion
          return cachedQuestion
        }

        const response = await client.request('question.getQuestionById', { id })

        if (!response.success) {
          throw new Error(response.error || 'Question not found')
        }

        this.currentQuestion = response.data
        return response.data
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Error loading question'
        throw error
      } finally {
        this.loading = false
      }
    },

    async processQuestion(params: {
      questionId: number
      adminId: number
      status: 'ANSWERED' | 'REJECTED' | 'ARCHIVED'
      answer?: string
    }) {
      try {
        this.loading = true
        this.error = null

        const response = await client.request('question.processQuestion', params)

        if (!response.success) {
          throw new Error(response.error || 'Error processing question')
        }

        // Update local state
        const index = this.questions.findIndex(q => q.id === params.questionId)
        if (index !== -1) {
          this.questions[index] = response.data
        }

        if (this.currentQuestion?.id === params.questionId) {
          this.currentQuestion = response.data
        }

        this.saveToCache()
        return response.data
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Error processing question'
        throw error
      } finally {
        this.loading = false
      }
    },

    reset() {
      this.$reset()
      localStorage.removeItem(QUESTIONS_CACHE_KEY)
    },
  },
})
