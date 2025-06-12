import type { ReportStatus } from '@prisma/client'
import { useFormatDate } from '~/composables/useFormatDate'
import { sendTelegramAlert } from '~~/server/utils/telegram'

interface ReportData {
  message: string
  userId?: number
  ipAddress?: string
  userAgent?: string
}

interface AdminAlert {
  reportId: number
  message: string
  createdAt: Date
  userInfo?: string
  ipAddress?: string
}

interface ProcessReportData {
  reportId: number
  adminId: number
  status: 'REVIEWED' | 'RESOLVED' | 'REJECTED'
  adminNotes?: string
}

async function create(data: ReportData) {
  try {
    const [user, report] = await Promise.all([
      data.userId ? getUserInfo(data.userId) : null,
      prisma.report.create({
        data: {
          message: data.message,
          userId: data.userId,
          status: 'PENDING',
          ipAddress: data.ipAddress,
          userAgent: data.userAgent,
        },
      }),
    ])

    await notifyAdmin({
      reportId: report.id,
      message: report.message,
      createdAt: report.createdAt,
      userInfo: user ? `${user.username || user.firstName} (ID: ${user.telegramId})` : 'Anonymous',
      ipAddress: data.ipAddress,
    })

    return {
      success: true,
      status: 201,
      data: {
        reportId: report.id,
        createdAt: report.createdAt,
      },
    }
  } catch (error) {
    console.error('Report creation error:', error)
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

async function notifyAdmin(data: AdminAlert) {
  const alertText =
    `🚨 *НОВЫЙ ОТЧЕТ* #${data.reportId}\n\n` +
    `📝 ${data.message}\n\n` +
    `👤 ${(data.userInfo && `@${data.userInfo}`) || 'Нет информации о пользователе'}\n` +
    `⏱️ ${useFormatDate(data.createdAt)}`

  await sendTelegramAlert({
    chatId: process.env.ADMIN_CHAT_ID!,
    text: alertText,
    entityId: data.reportId,
  })
}

async function processReport(data: ProcessReportData) {
  try {
    const report = await prisma.report.update({
      where: { id: data.reportId },
      data: {
        status: data.status,
        processedAt: new Date(),
        processedBy: data.adminId,
        adminNotes: data.adminNotes,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            telegramId: true,
          },
        },
      },
    })

    return {
      success: true,
      status: 200,
      data: report,
    }
  } catch (error: any) {
    console.error('Error processing report:', error)
    return {
      success: false,
      status: error.code === 'P2025' ? 404 : 500,
      error: error.code === 'P2025' ? 'Report not found' : 'Internal server error',
    }
  }
}

async function getReports(
  filter: {
    status?: ReportStatus
    userId?: number
    page?: number
    limit?: number
  } = {},
) {
  try {
    const page = filter.page || 1
    const limit = filter.limit || 20
    const skip = (page - 1) * limit

    const [reports, total] = await Promise.all([
      prisma.report.findMany({
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
        },
      }),
      prisma.report.count({
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
        reports,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      },
    }
  } catch (error) {
    console.error('Error fetching reports:', error)
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
