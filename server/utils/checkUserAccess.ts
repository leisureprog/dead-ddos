export async function checkUserAccess(userId: number): Promise<boolean> {
    if (process.env.ADMIN_CHAT_ID && userId === Number(process.env.ADMIN_CHAT_ID)) {
        return true
    }

    const user = await prisma.user.findUnique({
        where: { telegramId: userId },
        select: { role: true },
    })

    return !!user && ['ADMIN', 'MODERATOR'].includes(user.role)
}