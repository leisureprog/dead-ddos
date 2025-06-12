import bot from '../../bot'

const config = useRuntimeConfig()

export async function approveCommand(ctx: any) {
  const telegramId = Number(ctx.match[1])

  try {
    const user = await prisma.user.findUnique({
      where: { telegramId },
      include: { profile: true },
    })

    if (!user?.profile) {
      return ctx.answerCbQuery('Профиль не найден', { show_alert: true })
    }

    await prisma.userProfile.update({
      where: { userId: user.id },
      data: {
        isApproved: true,
        lastEdited: new Date(),
      },
    })

    await ctx.telegram.sendMessage(telegramId, '🎉 Your profile has been approved by the admin!', {
      parse_mode: 'Markdown',
    })

    await ctx.editMessageText(
      `${ctx.callbackQuery.message?.text}\n\n` + `✅ *ОДОБРЕНО* модератором @${ctx.from.username || 'unknown'}`,
      {
        parse_mode: 'MarkdownV2',
        reply_markup: undefined,
      },
    )

    return ctx.answerCbQuery('Профиль одобрен')
  } catch (error) {
    console.error('Error approving profile:', error)
    await ctx.answerCbQuery('Произошла ошибка', { show_alert: true })
  }
}

export async function rejectCommnad(ctx: any) {
  const telegramId = Number(ctx.match[1])
  const moderatorId = ctx.from.id

  try {
    const user = await prisma.user.findUnique({
      where: { telegramId },
      include: { profile: true },
    })

    if (!user?.profile) {
      return ctx.answerCbQuery('Профиль не найден', { show_alert: true })
    }

    await ctx.telegram.sendMessage(
      telegramId,
      '❌ Your profile has been rejected by a admin. Please update your information and submit for re-check..',
      { parse_mode: 'Markdown' },
    )

    await ctx.editMessageText(
      `${ctx.callbackQuery.message?.text}\n\n` + `❌ *ОТКЛОНЕНО* модератором @${ctx.from.username || 'unknown'}`,
      {
        parse_mode: 'MarkdownV2',
        reply_markup: undefined,
      },
    )

    return ctx.answerCbQuery('Профиль отклонен')
  } catch (error) {
    console.error('Error rejecting profile:', error)
    await ctx.answerCbQuery('Произошла ошибка', { show_alert: true })
  }
}

export async function notifyAdminAboutProfile(profile: any, user: any) {
  const message =
    `🆕 *НОВЫЙ ПРОФИЛЬ НА МОДЕРАЦИЮ*\n\n` +
    `👤 Пользователь: ${
      user.username ? `@${user.username}` : `${user.firstName || ''} ${user.lastName || ''}`.trim()
    }\n` +
    `🆔 ID: ${user.telegramId}\n\n` +
    `📛 *Никнейм*: ${escapeMarkdownV2(profile.nickname)}\n` +
    `🔢 *Возраст*: ${profile.age}\n` +
    `📱 *Telegram*: @${profile.telegram}\n` +
    `🛠 *Навыки*: ${escapeMarkdownV2(profile.skills)}`

  try {
    await bot.telegram.sendMessage(config.adminId!, message, {
      parse_mode: 'MarkdownV2',
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: '✅ Одобрить',
              callback_data: `approve_profile:${user.telegramId}`,
            },
            {
              text: '❌ Отклонить',
              callback_data: 'reject_profile:${user.telegramId}',
            },
          ],
        ],
      },
    })
  } catch (error) {
    console.error('Error sending profile notification:', error)
  }
}
