const config = useRuntimeConfig()

async function create({
  userId,
  id,
  title,
  price,
  currency,
}: {
  userId: number
  id: string
  title: string
  price: number
  currency: string
}) {
  try {
    // Получаем данные пользователя
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        telegramId: true,
        firstName: true,
        lastName: true,
      },
    })

    if (!user) {
      throw new Error('User not found')
    }

    const adminMessage =
      `💰 *НОВЫЙ ПЛАТЕЖ* #${id}\n\n` +
      `🏷️ План: *${title}*\n` +
      `💵 Сумма: *${currency}${price}*\n` +
      `👤 Пользователь: ${user.firstName || ''} ${user.lastName || ''} ` +
      `(${user.username ? `@${user.username}` : `ID: ${user.id}`})\n` +
      `🆔 Telegram ID: ${user.telegramId || 'не указан'}`

    await sendTelegramAlert({
      chatId: config.adminId,
      text: adminMessage,
      parseMode: 'MarkdownV2',
    })

    return {
      success: true,
      status: 200,
      data: true,
    }
  } catch (error) {
    console.error('Payment creation error:', error)

    await sendTelegramAlert({
      chatId: config.adminId,
      text: `❌ Ошибка при обработке платежа #${id}\n\n${error instanceof Error ? error.message : 'Unknown error'}`,
    })

    return {
      success: false,
      status: 500,
      error: 'Internal server error',
    }
  }
}

export default {
  create,
}
