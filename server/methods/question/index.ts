import { sendTelegramAlert, sendQuestionNotification } from '~~/server/utils/telegram'
import type { QuestionStatus } from '@prisma/client'

interface QuestionData {
  question: string
  userId: number
  isPrivate?: boolean
  ipAddress?: string
  userAgent?: string
}

async function create(data: QuestionData) {
  try {
    const [user, question] = await Promise.all([
      data.userId ? getUserInfo(data.userId) : null,
      prisma.personalQuestion.create({
        data: {
          question: data.question,
          userId: data.userId,
          isPrivate: data.isPrivate || false,
          status: 'PENDING',
        },
      }),
    ])

    await sendQuestionNotification(
      {
        id: question.id,
        question: question.question,
        createdAt: question.createdAt,
      },
      {
        username: user?.username,
        firstName: user?.firstName,
        lastName: user?.lastName,
        telegramId: user?.telegramId,
      },
    )

    return {
      success: true,
      status: 201,
      data: {
        questionId: question.id,
        createdAt: question.createdAt,
      },
    }
  } catch (error) {
    console.error('Question creation error:', error)
    return {
      success: false,
      status: 500,
      error: 'Internal server error',
    }
  }
}

async function getUserInfo(userId: number) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      username: true,
      telegramId: true,
      firstName: true,
      lastName: true,
    },
  })
}

async function notifyUserAboutAnswer(telegramId: number, questionId: number, answer: string) {
  const message =
    `📬 *Ответ на ваш вопрос* #${questionId}\n\n` +
    `💬 *Ответ*:\n${answer}\n\n` +
    `Если у вас остались вопросы, не стесняйтесь задавать новые.`

  try {
    await sendTelegramAlert({
      chatId: telegramId,
      text: message,
      parseMode: 'MarkdownV2',
      disableNotification: false,
    })
  } catch (error) {
    console.error('Error sending answer to user:', error)
    throw error
  }
}

async function getQuestions(
  filter: {
    status?: QuestionStatus
    userId?: number
    page?: number
    limit?: number
  } = {},
) {
  try {
    const page = filter.page || 1
    const limit = filter.limit || 20
    const skip = (page - 1) * limit

    const [questions, total] = await Promise.all([
      prisma.personalQuestion.findMany({
        where: {
          status: filter.status,
          userId: filter.userId,
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              telegramId: true,
            },
          },
          answeredBy: {
            select: {
              id: true,
              username: true,
            },
          },
          logs: {
            orderBy: { createdAt: 'desc' },
            take: 5,
          },
        },
      }),
      prisma.personalQuestion.count({
        where: {
          status: filter.status,
          userId: filter.userId,
        },
      }),
    ])

    return {
      success: true,
      status: 200,
      data: {
        questions,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      },
    }
  } catch (error) {
    console.error('Error fetching questions:', error)
    return {
      success: false,
      status: 500,
      error: 'Internal server error',
    }
  }
}

async function getQuestionById(questionId: number) {
  try {
    const question = await prisma.personalQuestion.findUnique({
      where: { id: questionId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            telegramId: true,
          },
        },
        answeredBy: {
          select: {
            id: true,
            username: true,
          },
        },
        logs: {
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    if (!question) {
      return {
        success: false,
        status: 404,
        error: 'Question not found',
      }
    }

    return {
      success: true,
      status: 200,
      data: question,
    }
  } catch (error) {
    console.error('Error fetching question:', error)
    return {
      success: false,
      status: 500,
      error: 'Internal server error',
    }
  }
}

export default {
  create,
  getQuestions,
  getQuestionById,
}
