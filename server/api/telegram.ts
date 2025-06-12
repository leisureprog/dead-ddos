import bot from '../bot'

// Обработчик вебхука
export default defineEventHandler(async event => {
  try {
    await bot.handleUpdate(await readBody(event), event.node.res)
    return { ok: true }
  } catch (err) {
    console.error('Telegram error:', err)
    return { ok: false }
  }
})
