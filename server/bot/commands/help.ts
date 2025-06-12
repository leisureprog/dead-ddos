import { type Context } from 'telegraf'

export const helpCommand = async (ctx: Context) => {
  try {
    await ctx.sendChatAction('typing')
    await ctx.reply('⏳ Bypassing helpdesk encryption...')
    await new Promise(resolve => setTimeout(resolve, 800))

    await ctx.sendChatAction('find_location')
    await ctx.reply('🔓 Accessing shadow protocols...')
    await new Promise(resolve => setTimeout(resolve, 1200))

    await ctx.replyWithHTML(
      `
╔════════════════════╗
                          <b>D E A D D D O S</b>  
╚════════════════════╝
<b>📜 BLACKNET MANUAL v3.1.4</b>

▌│█║▌║▌║ <b>CORE COMMANDS</b> ║▌║▌║█│▌
☠️ <code>/start</code> - Initiate system breach

▌│█║▌║▌║ <b>SECURE CHANNELS</b> ║▌║▌║█│▌
🛡️ <a href="https://t.me/deadddos_support">TECH SUPPORT</a> - 24/7/365
🌐 <a href="https://t.me/deadddos_news">INTEL FEED</a> - Zero-day alerts

<b>⚠️ WARNING: All connections logged and encrypted</b>
`.trim(),
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: '💀 EMERGENCY REQUEST', url: 'https://t.me/deadddos_support' }],
            [{ text: '📡 LIVE DATABREACHES', url: 'https://t.me/deadddos_news' }],
          ],
        },
        parse_mode: 'HTML',
      },
    )
  } catch (error) {
    console.error('HELP DESK FAILURE:', error)
    await ctx.replyWithHTML('💥 <b>SYSTEM CORRUPTED</b>\n' + 'Emergency reboot required. Try /start')
  }
}
