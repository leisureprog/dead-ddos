module.exports = {
  apps: [
    {
      name: 'Leisure - DeadDDos',
      port: '3000',
      exec_mode: 'cluster',
      instances: 'max',
      script: './.output/server/index.mjs',
      env: {
        NODE_ENV: 'production',

        NUXT_TELEGRAM_BOT_TOKEN: '',

        NUXT_PUBLIC_BASE_URL: '',

        DATABASE_URL: '',

        NUXT_PUBLIC_TON_ADDRESS: '',
        NUXT_PUBLIC_ETHEREUM_ADDRESS: '',
        NUXT_PUBLIC_TRON_ADDRESS: '',
        NUXT_PUBLIC_SOLANA_ADDRESS: '',
        NUXT_PUBLIC_BITCOIN_ADDRESS: '',
      },
    },
  ],
}
