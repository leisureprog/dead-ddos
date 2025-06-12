import { type Context } from 'telegraf'
import bot from '../index'

export const questionCommand = async (ctx: Context & { match: any; from: any; callbackQuery: any }) => {
  if (!ctx.match || !ctx.from?.id) return

  const [_, action, questionId] = ctx.match
  const userId = ctx.from.id

  const hasAccess = await checkUserAccess(userId)
  if (!hasAccess) {
    return ctx.answerCbQuery("❌ You don't have permission for this action", { show_alert: true })
  }

  try {
    const result = await processQuestionAction(parseInt(questionId), action, userId, ctx)

    const responseText = escapeMarkdownV2(
      `${ctx.callbackQuery.message?.text}\n\n` +
        `✅ Status: ${getStatusText(action)}\n` +
        `👨‍🏫 Moderator: @${ctx.from.username || 'unknown'}\n` +
        `⏱ Time: ${new Date().toLocaleString()}` +
        (action === 'answer' && result.answer ? `\n\n💬 Answer: ${result.answer}` : ''),
    )

    await ctx.editMessageText(responseText, {
      parse_mode: 'MarkdownV2',
      reply_markup: undefined,
    })

    await ctx.answerCbQuery(
      `Question ${action === 'answer' ? 'answered' : action === 'reject' ? 'rejected' : 'archived'}`,
    )
  } catch (error: any) {
    console.error('Error processing question action:', error)
    await handleQuestionError(ctx, questionId, action, error)
  }
}

function getStatusText(action: string): string {
  switch (action) {
    case 'answer':
      return 'ANSWERED'
    case 'reject':
      return 'REJECTED'
    case 'archive':
      return 'ARCHIVED'
    default:
      return 'PROCESSED'
  }
}

async function processQuestionAction(
  questionId: number,
  action: string,
  userId: number,
  ctx: Context & { match: any; from: any; callbackQuery: any },
) {
  return await prisma.$transaction(async tx => {
    const existingQuestion = await tx.personalQuestion.findUnique({
      where: { id: questionId },
      select: { id: true, status: true, userId: true, question: true },
    })

    if (!existingQuestion) {
      throw new Error(`Question with ID ${questionId} not found`)
    }

    const adminUser = await tx.user.findUnique({
      where: { telegramId: userId },
      select: { id: true, username: true },
    })

    if (!adminUser) {
      throw new Error(`Admin user with Telegram ID ${userId} not found`)
    }

    const updateData: any = {
      status: getStatusText(action),
      answeredById: adminUser.id,
      updatedAt: new Date(),
    }

    if (action === 'answer' && ctx.callbackQuery?.message?.reply_to_message?.text) {
      updateData.answer = ctx.callbackQuery.message.reply_to_message.text
    }

    const updatedQuestion = await tx.personalQuestion.update({
      where: { id: questionId },
      data: updateData,
      include: {
        user: {
          select: {
            telegramId: true,
            username: true,
          },
        },
      },
    })

    await tx.questionLog.create({
      data: {
        questionId: updatedQuestion.id,
        action: getStatusText(action),
        adminId: adminUser.id,
        previousStatus: existingQuestion.status as string,
        newStatus: getStatusText(action),
        comment: action === 'answer' ? 'Answer provided' : `Question ${action}ed`,
      },
    })

    if (updatedQuestion.user) {
      let notificationMessage = ''

      if (action === 'answer') {
        notificationMessage =
          `📬 Your question has been answered\n\n` +
          `❓ Question: ${existingQuestion.question}\n` +
          `💬 Answer: ${updateData.answer || 'No answer provided'}\n\n` +
          `Thank you for your question!`
      } else if (action === 'reject') {
        notificationMessage =
          `⚠️ Your question has been reviewed\n\n` +
          `❓ Question: ${existingQuestion.question}\n` +
          `Status: Rejected\n\n` +
          `Please review our guidelines and try again.`
      }

      if (notificationMessage) {
        await sendUserNotification(updatedQuestion.user.telegramId, notificationMessage)
      }
    }

    return updatedQuestion
  })
}

async function handleQuestionError(ctx: Context, questionId: string, action: string, error: Error) {
  await ctx.answerCbQuery('⚠️ An error occurred while processing')

  if (process.env.ADMIN_CHAT_ID) {
    const errorText = escapeMarkdownV2(
      `🚨 Question processing error #${questionId}\n\n` +
        `Action: ${action}\n` +
        `Moderator: @${ctx.from?.username || 'unknown'}\n` +
        `Error: ${error.message}`,
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
