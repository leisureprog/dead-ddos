import { type Context } from 'telegraf'
import bot from '../index'

export const reportCommand = async (ctx: Context & { match: any; from: any; callbackQuery: any }) => {
  if (!ctx.match || !ctx.from?.id) return

  const [_, action, reportId] = ctx.match
  const userId = ctx.from.id

  const hasAccess = await checkUserAccess(userId)
  if (!hasAccess) {
    return ctx.answerCbQuery('❌ У вас нет прав для этого действия', { show_alert: true })
  }

  try {
    const result = await processReportAction(parseInt(reportId), action, userId)

    const responseText = escapeMarkdownV2(
      `${ctx.callbackQuery.message?.text}\n\n` +
        `✅ Статус: ${action === 'resolve' ? 'SOLVED' : 'REJECTED'}\n` +
        `👮‍♂️ Модератор: @${ctx.from.username || 'unknown'}\n` +
        `⏱ Время: ${new Date().toLocaleString()}`,
    )

    await ctx.editMessageText(responseText, {
      parse_mode: 'MarkdownV2',
      reply_markup: undefined,
    })

    await ctx.answerCbQuery(`Report ${action === 'resolve' ? 'resolved' : 'rejected'}`)
  } catch (error: any) {
    console.error('Error processing report action:', error)
    await handleReportError(ctx, reportId, action, error)
  }
}

async function processReportAction(reportId: number, action: string, userId: number) {
  return await prisma.$transaction(async tx => {
    const existingReport = await tx.report.findUnique({
      where: { id: reportId },
      select: { id: true, status: true, userId: true },
    })

    if (!existingReport) {
      throw new Error(`Report with ID ${reportId} not found`)
    }

    const adminUser = await tx.user.findUnique({
      where: { telegramId: userId },
      select: { id: true },
    })

    if (!adminUser) {
      throw new Error(`Admin user with Telegram ID ${userId} not found`)
    }

    const updatedReport = await tx.report.update({
      where: { id: reportId },
      data: {
        status: action === 'resolve' ? 'RESOLVED' : 'REJECTED',
        processedAt: new Date(),
        processedBy: adminUser.id,
      },
      include: {
        user: {
          select: {
            telegramId: true,
            username: true,
          },
        },
      },
    })

    await tx.reportLog.create({
      data: {
        reportId: updatedReport.id,
        action: action.toUpperCase(),
        adminId: adminUser.id, // Используем внутренний ID
        previousStatus: existingReport.status,
        newStatus: action === 'resolve' ? 'RESOLVED' : 'REJECTED',
      },
    })

    if (action === 'reject' && updatedReport.user) {
      await sendUserNotification(
        updatedReport.user.telegramId,
        `Your report #${updatedReport.id} was reviewed and rejected`,
      )
    }

    return updatedReport
  })
}

async function handleReportError(ctx: Context, reportId: string, action: string, error: Error) {
  await ctx.answerCbQuery('⚠️ An error occurred while processing')

  if (process.env.ADMIN_CHAT_ID) {
    const errorText = escapeMarkdownV2(
      `🚨Ошибка обработки отчета #${reportId}\n\n` +
        `Действие: ${action}\n` +
        `Модератор: @${ctx.from?.username || 'unknown'}\n` +
        `Ошибка: ${error.message}`,
    )

    await ctx.telegram.sendMessage(process.env.ADMIN_CHAT_ID, errorText, { parse_mode: 'MarkdownV2' })
  }
}

async function sendUserNotification(telegramId: number, message: string) {
  try {
    await bot.telegram.sendMessage(telegramId, escapeMarkdownV2(message), { parse_mode: 'MarkdownV2' })
  } catch (error) {
    console.error('Error sending user notification:', error)
  }
}
