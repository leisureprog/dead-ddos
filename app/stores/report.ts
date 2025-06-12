import type { Report, ReportStatus } from '@prisma/client'
import { client } from '~/configs/rpc'

interface ReportState {
  reports: Report[]
  currentReport: Report | null
  loading: boolean
  error: string | null
  pagination: {
    page: number
    limit: number
    total: number
  }
  lastUpdated: number | null
}

const REPORTS_CACHE_KEY = 'reportsStoreCache'
const CACHE_TTL = 10 * 60 * 1000 // 10 минут

export const useReportStore = defineStore('report', {
  state: (): ReportState => ({
    reports: [],
    currentReport: null,
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
    pendingReports: state => state.reports.filter(r => r.status === 'PENDING'),
    userReports: state => (userId: number) => state.reports.filter(r => r.userId === userId),
    hasMore: state => state.reports.length < state.pagination.total,
  },

  actions: {
    restoreFromCache() {
      try {
        const cachedData = localStorage.getItem(REPORTS_CACHE_KEY)
        if (!cachedData) return false

        const { data, timestamp } = JSON.parse(cachedData)

        // Проверяем, не устарели ли данные
        if (Date.now() - timestamp > CACHE_TTL) {
          localStorage.removeItem(REPORTS_CACHE_KEY)
          return false
        }

        this.$patch({
          reports: data.reports,
          pagination: data.pagination,
          lastUpdated: timestamp,
        })
        return true
      } catch (error) {
        console.error('Ошибка восстановления отчетов из кэша:', error)
        return false
      }
    },

    saveToCache() {
      try {
        const dataToCache = {
          reports: this.reports,
          pagination: this.pagination,
        }

        const cacheData = {
          data: dataToCache,
          timestamp: Date.now(),
        }

        localStorage.setItem(REPORTS_CACHE_KEY, JSON.stringify(cacheData))
        this.lastUpdated = Date.now()
      } catch (error) {
        console.error('Ошибка сохранения отчетов в кэш:', error)
      }
    },

    async createReport(params: { message: string; userId?: number; ipAddress?: string; userAgent?: string }) {
      try {
        this.loading = true
        this.error = null

        const response = await client.request('report.create', {
          ...params,
          status: 'PENDING',
        })

        if (response.status !== 201) {
          throw new Error(response.error || 'Ошибка создания отчета')
        }

        this.reports.unshift(response.data)
        this.pagination.total += 1
        this.saveToCache()

        return response.data
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Ошибка создания отчета'
        throw error
      } finally {
        this.loading = false
      }
    },

    async fetchReports(params?: { status?: ReportStatus; userId?: number; page?: number; refresh?: boolean }) {
      if (!params?.refresh && this.restoreFromCache()) {
        return
      }

      try {
        this.loading = true
        this.error = null

        const page = params?.page || this.pagination.page
        const limit = this.pagination.limit

        const response = await client.request('report.getAll', {
          status: params?.status,
          userId: params?.userId,
          page,
          limit,
        })

        if (response.status !== 200) {
          throw new Error(response.error || 'Ошибка загрузки отчетов')
        }

        this.$patch({
          reports: response.data.reports,
          pagination: {
            page,
            limit,
            total: response.data.total,
          },
        })
        this.saveToCache()
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Ошибка загрузки отчетов'
        throw error
      } finally {
        this.loading = false
      }
    },

    async loadMoreReports() {
      if (!this.hasMore || this.loading) return

      try {
        this.loading = true
        const nextPage = this.pagination.page + 1

        const response = await client.request('report.getAll', {
          page: nextPage,
          limit: this.pagination.limit,
        })

        if (response.status !== 200) {
          throw new Error(response.error || 'Ошибка загрузки отчетов')
        }

        this.reports.push(...response.data.reports)
        this.pagination.page = nextPage
        this.saveToCache()
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Ошибка загрузки отчетов'
        throw error
      } finally {
        this.loading = false
      }
    },

    async getReportById(id: number) {
      try {
        this.loading = true
        this.error = null

        const cachedReport = this.reports.find(r => r.id === id)
        if (cachedReport) {
          this.currentReport = cachedReport
          return cachedReport
        }

        const response = await client.request('report.getById', { id })

        if (response.status !== 200) {
          throw new Error(response.error || 'Отчет не найден')
        }

        this.currentReport = response.data
        return response.data
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Ошибка загрузки отчета'
        throw error
      } finally {
        this.loading = false
      }
    },

    async updateReportStatus(params: { id: number; status: ReportStatus; adminNotes?: string }) {
      try {
        this.loading = true
        this.error = null

        const response = await client.request('report.update', params)

        if (response.status !== 200) {
          throw new Error(response.error || 'Ошибка обновления отчета')
        }

        const index = this.reports.findIndex(r => r.id === params.id)
        if (index !== -1) {
          this.reports[index] = response.data
        }

        if (this.currentReport?.id === params.id) {
          this.currentReport = response.data
        }

        this.saveToCache()
        return response.data
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Ошибка обновления отчета'
        throw error
      } finally {
        this.loading = false
      }
    },

    reset() {
      this.$reset()
      localStorage.removeItem(REPORTS_CACHE_KEY)
    },
  },
})
