import { Telegraf } from 'telegraf'
import { startCommand } from './commands/start'
import { helpCommand } from './commands/help'
import { reportCommand } from './commands/report'
import { approveCommand, rejectCommnad } from './commands/profile'
import { questionCommand } from './commands/question'

const config = useRuntimeConfig()

const bot = new Telegraf(config.telegramBotToken as string, {
  telegram: { webhookReply: false },
})

// Регистрация команд
bot.start(startCommand)
bot.help(helpCommand)
bot.action(/^report:(resolve|reject):(\d+)$/, reportCommand)

// Одобрение профиля
bot.action(/^approve_profile:(\d+)$/, approveCommand)
bot.action(/^reject_profile:(\d+)$/, rejectCommnad)

bot.action(/^question:(answer|reject|archive):(\d+)$/, questionCommand)

if (process.env.NODE_ENV === 'production') {
  const webhookUrl = `https://brx.life/api/telegram`
  try {
    bot.telegram.setWebhook(webhookUrl)
    console.log(`Вебхук установлен: ${webhookUrl}`)
  } catch (error) {
    console.error('Ошибка установки вебхука, переключаемся на polling:', error)
    bot.launch()
  }
} else {
  bot.launch()
}

export default bot
