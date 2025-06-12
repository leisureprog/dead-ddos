import bot from '../bot'

type ReportAction = 'resolve' | 'reject' | 'view'
type QuestionAction = 'answer' | 'reject' | 'archive'

interface TelegramAlertOptions {
  chatId: string | number
  text: string
  entityId?: number
  actions?: ReportAction[] | QuestionAction[]
  entityType?: 'report' | 'question'
  parseMode?: 'MarkdownV2' | 'HTML'
  disableNotification?: boolean
}

export async function sendTelegramAlert(options: TelegramAlertOptions): Promise<boolean> {
  const {
    chatId,
    text,
    entityId,
    actions = options.entityType === 'question' ? ['answer', 'reject'] : ['resolve', 'reject'],
    entityType = 'report',
    parseMode = 'MarkdownV2',
    disableNotification = false,
  } = options

  try {
    const formattedText = parseMode === 'MarkdownV2' ? escapeMarkdownV2(text) : text

    const replyMarkup = entityId ? createActionButtons(entityId, actions, entityType) : undefined

    await bot.telegram.sendMessage(chatId, formattedText, {
      parse_mode: parseMode,
      disable_notification: disableNotification,
      reply_markup: replyMarkup,
    })

    return true
  } catch (error) {
    console.error('Ошибка отправки алерта в Telegram:', error)
    return false
  }
}

function createActionButtons(
  entityId: number,
  actions: ReportAction[] | QuestionAction[],
  entityType: 'report' | 'question' = 'report',
) {
  const buttons = []

  if (entityType === 'report') {
    const reportActions = actions as ReportAction[]
    if (reportActions.includes('resolve')) {
      buttons.push({
        text: '✅ Решить',
        callback_data: `report:resolve:${entityId}`,
      })
    }
    if (reportActions.includes('reject')) {
      buttons.push({
        text: '❌ Отклонить',
        callback_data: `report:reject:${entityId}`,
      })
    }
    if (reportActions.includes('view')) {
      buttons.push({
        text: '👀 Подробнее',
        url: `${process.env.ADMIN_URL}/reports/${entityId}`,
      })
    }
  } else {
    const questionActions = actions as QuestionAction[]
    if (questionActions.includes('answer')) {
      buttons.push({
        text: '💬 Ответить',
        callback_data: `question:answer:${entityId}`,
      })
    }
    if (questionActions.includes('reject')) {
      buttons.push({
        text: '❌ Отклонить',
        callback_data: `question:reject:${entityId}`,
      })
    }
    if (questionActions.includes('archive')) {
      buttons.push({
        text: '📦 В архив',
        callback_data: `question:archive:${entityId}`,
      })
    }
  }

  return {
    inline_keyboard: [buttons],
  }
}


function escapeMarkdownV2(text: string) {
  return text.replace(/[_*[\]()~`>#+-=|{}.!]/g, '\\$&')
}

export async function sendQuestionNotification(question: any, user: any) {
  const message =
    `❓ *НОВЫЙ ВОПРОС* #${question.id}\n\n` +
    `📝 Вопрос:\n${question.question}\n\n` +
    `👤 Пользователь: ${user.username ? `@${user.username}` : user.firstName || 'Аноним'}\n` +
    `⏱ Дата: ${new Date(question.createdAt).toLocaleString()}`

  return sendTelegramAlert({
    chatId: process.env.ADMIN_CHAT_ID!,
    text: message,
    entityId: question.id,
    entityType: 'question',
    actions: ['answer', 'reject'],
    parseMode: 'MarkdownV2',
  })
}
