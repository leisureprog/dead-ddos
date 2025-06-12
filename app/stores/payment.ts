import { client } from '~/configs/rpc'

interface Payment {
  userId: number
  id: string
  title: string
  amount: number
  currency: string
  status: 'PENDING' | 'CONFIRM'
  createdAt: Date
  updatedAt: Date
}

interface PaymentState {
  payments: Payment[]
  loading: boolean
  error: string | null
  lastPayment: {
    data: any | null
    error: string | null
    loading: boolean
  }
}

export const usePaymentStore = defineStore('payment', {
  state: (): PaymentState => ({
    payments: [],
    loading: false,
    error: null,
    lastPayment: {
      data: null,
      error: null,
      loading: false,
    },
  }),

  actions: {
    async createPayment(params: { userId: number; id: string; title: string; price: number; currency: string }) {
      try {
        this.lastPayment.loading = true
        this.lastPayment.error = null

        const response = await client.request('payment.create', params)

        if (!response) {
          throw new Error(response.error || 'Payment creation failed')
        }

        // Добавляем платеж в историю
        this.payments.unshift({
          id: params.id,
          title: params.title,
          userId: params.userId,
          amount: params.price,
          currency: params.currency,
          status: 'PENDING',
          createdAt: new Date(),
          updatedAt: new Date(),
        })

        // Сохраняем последний платеж
        this.lastPayment.data = response

        return response
      } catch (error) {
        this.lastPayment.error = error instanceof Error ? error.message : 'Payment creation error'
        throw error
      } finally {
        this.lastPayment.loading = false
      }
    },

    clearLastPayment() {
      this.lastPayment = {
        data: null,
        error: null,
        loading: false,
      }
    },
  },
})
