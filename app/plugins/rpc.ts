import { client } from '~/configs/rpc'

export default defineNuxtPlugin(nuxtApp => {
  return {
    provide: { client },
  }
})
