import { notifyAdminAboutProfile } from '~~/server/bot/commands/profile'
import { upsertUser, getUserAvatar, createWebAppSession } from '../../utils/user'

interface UserProfileData {
  nickname: string
  age: number
  telegram: string
  skills: string
  userId: number
}
async function add({
  telegramId,
  username,
  avatar,
  firstName,
  lastName,
  languageCode,
  isPremium,
}: {
  telegramId: number
  username?: string
  avatar?: string
  firstName?: string
  lastName?: string
  languageCode?: string
  isPremium?: boolean
}) {
  try {
    const [userAvatar] = await Promise.all([avatar ? Promise.resolve(avatar) : getUserAvatar(telegramId)])

    const newUser = await upsertUser({
      telegramId,
      username,
      avatar: userAvatar as string,
      firstName,
      lastName,
      languageCode,
      isPremium,
    })

    if (!newUser || !newUser.isActive) {
      return {
        status: 404,
        result: !newUser ? 'User not created' : 'User blocked',
      }
    }

    const session = await createWebAppSession(newUser.id)

    return {
      status: 200,
      user: {
        id: newUser.id,
        telegramId: newUser.telegramId,
        username: newUser.username,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        isPremium: newUser.isPremium,
        avatar: newUser.avatar,
      },
      session,
    }
  } catch (error) {
    console.error(error)
    return { status: 400, message: 'An error occurred' }
  } finally {
    await prisma.$disconnect()
  }
}

async function upsertUserProfile(profileData: UserProfileData) {
  try {
    const result = await prisma.$transaction(async tx => {
      const userExists = await tx.user.findUnique({
        where: { id: profileData.userId },
        select: { id: true },
      })

      if (!userExists) {
        throw new Error('User not found')
      }

      const profile = await tx.userProfile.upsert({
        where: { userId: profileData.userId },
        update: {
          nickname: profileData.nickname,
          age: profileData.age,
          telegram: profileData.telegram,
          skills: profileData.skills,
          isApproved: false,
          lastEdited: new Date(),
        },
        create: {
          userId: profileData.userId,
          nickname: profileData.nickname,
          age: profileData.age,
          telegram: profileData.telegram,
          skills: profileData.skills,
          isApproved: false,
        },
      })

      const user = await tx.user.findUnique({
        where: { id: profileData.userId },
        select: {
          telegramId: true,
          username: true,
          firstName: true,
          lastName: true,
        },
      })

      return { profile, user }
    })

    await notifyAdminAboutProfile(result.profile, result.user)

    return result
  } catch (error) {
    console.error('Error in upsertUserProfile:', error)
    throw error
  }
}

async function getUserProfile({ userId }: { userId: number }) {
  return await prisma.userProfile.findUnique({
    where: { userId },
    include: {
      user: {
        select: {
          username: true,
          telegramId: true,
        },
      },
    },
  })
}

async function closeWebAppSession({ sessionId }: { sessionId: number }) {
  try {
    if (!sessionId) {
      return { status: 404, message: 'sessionId not found' }
    }

    const closedSession = await prisma.webAppSession.update({
      where: {
        id: sessionId,
      },
      data: {
        expiresAt: new Date(),
      },
    })

    return {
      status: 200,
      result: closedSession,
    }
  } catch (error) {
    console.error('Error closing session:', error)
    return {
      status: 500,
      error: 'Internal Server Error',
    }
  } finally {
    await prisma.$disconnect()
  }
}

export default {
  add,
  closeWebAppSession,
  upsertUserProfile,
  getUserProfile,
}
