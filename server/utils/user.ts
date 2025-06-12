import axios from 'axios'
import { Telegraf } from 'telegraf'

const config = useRuntimeConfig()

const bot = new Telegraf(config.telegramBotToken)

export async function upsertUser({
  telegramId,
  username,
  avatar,
  firstName,
  lastName,
  languageCode,
  isPremium = false,
}: {
  telegramId: number
  username?: string
  avatar?: string
  firstName?: string
  lastName?: string
  languageCode?: string
  isPremium?: boolean
}) {
  return await prisma.user.upsert({
    where: { telegramId },
    create: {
      telegramId,
      username,
      avatar,
      firstName,
      lastName,
      languageCode,
      isPremium,
    },
    update: {
      username,
      avatar,
      firstName,
      lastName,
      languageCode,
      isPremium,
      updatedAt: new Date(),
    },
  })
}

export async function createWebAppSession(userId: number, initData: string = '') {
  await prisma.webAppSession.updateMany({
    where: {
      userId,
      expiresAt: { gt: new Date() }, 
    },
    data: {
      expiresAt: new Date(), 
    },
  })

  const session = await prisma.webAppSession.create({
    data: {
      userId,
      initData,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // Истекает через 24 часа
    },
  })

  return {
    sessionId: session.id,
    expiresAt: session.expiresAt,
  }
}

export async function getUserAvatar(telegramId: number): Promise<string | null> {
  try {
    const photos = await bot.telegram.getUserProfilePhotos(telegramId)

    if (photos.total_count > 0) {
      const fileId = photos.photos[0][0].file_id
      const file = await bot.telegram.getFile(fileId)
      const filePath = file.file_path

      const avatarUrl = `https://api.telegram.org/file/bot${config.telegramBotToken}/${filePath}`

      const response = await axios.get(avatarUrl, { responseType: 'arraybuffer' })

      // Преобразуем в Base64
      const base64Image = Buffer.from(response.data, 'binary').toString('base64')

      // Возвращаем строку Base64
      return `data:image/jpeg;base64,${base64Image}`
    }

    return null
  } catch (error) {
    console.error('Error getting user avatar:', error)
    return null
  }
}
