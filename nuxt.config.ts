// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-09-08',
  devtools: { enabled: false },

  // This reverts the new srcDir default from `app` back to your root directory
  future: {
    compatibilityVersion: 4,
  },

  app: {
    head: {
      title: `DEAD DDOS`,
      meta: [{ charset: 'UTF-8' }, { name: 'viewport', content: 'width=device-width, initial-scale=1.0' }],
      script: [{ src: 'https://telegram.org/js/telegram-web-app.js', defer: true }],
    },
  },

  modules: ['@vueuse/nuxt', 'dayjs-nuxt', '@vee-validate/nuxt', '@pinia/nuxt', '@nuxtjs/tailwindcss', 'nuxt-snackbar'],

  css: ['~/assets/css/main.css'],

  postcss: {
    plugins: {
      tailwindcss: {},
      autoprefixer: {},
    },
  },

  runtimeConfig: {
    telegramBotToken: '',
    adminId: '',
    public: {
      baseUrl: '',
      tonAddress: '',
      ethereumAddress: '',
      tronAddress: '',
      solanaAddress: '',
      bitcoinAddress: ''
    },
  },

  snackbar: {
    bottom: false,
    top: true,
    // right: false,
    duration: 5000,
  },
})
