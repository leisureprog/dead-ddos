import { type Context } from 'telegraf'

const config = useRuntimeConfig()

interface WelcomeMessageParams {
  firstName?: string
  username?: string
}

const replyMarkup = {
  inline_keyboard: [
    [
      {
        text: '💀 ENTER KILLZONE 💀',
        web_app: { url: config.public.baseUrl },
      },
    ],
  ],
  resize_keyboard: true,
  one_time_keyboard: true,
}

const generateWelcomeMessage = ({ firstName, username }: WelcomeMessageParams): string => {
  const playerName = firstName || username || 'ANONYMOUS_GHOST'
  const randomIP = `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.x.x`

  return `
🔻 *ENCRYPTED TRANSMISSION* 🔻
╔════════════════════════════╗
   █▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀█
   █  D E A D D D O S  █
   █▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄█
╚════════════════════════════╝

*TARGET ACQUIRED*: ${playerName.toUpperCase()}
*IP MASK*: ${randomIP} | *STATUS*: TRACKED

⚠️ *WARNING*: HIGH-RISK ENVIRONMENT
• All connections monitored
• Countermeasures active
• 0-day exploits loaded

▌│█║▌║▌║ *MISSION PARAMETERS* ║▌║▌║█│▌
☠️ DESTROY corrupt nodes
💾 EXFILTRATE classified data
🔥 OVERLOAD mainframes

[!] OPERATIONAL PROTOCOLS:
  ✓ TOR routing enabled
  ✓ MAC spoofing active
  ✓ Forensic countermeasures engaged

*"The infrastructure will burn. No logs. No witnesses."*

═══ ∘◦❰💀❱◦∘ ═══
`.trim()
}

export const startCommand = async (ctx: Context) => {
  try {
    await ctx.sendChatAction('typing')
    await new Promise(resolve => setTimeout(resolve, 1000))

    await ctx.sendChatAction('upload_document')
    await ctx.reply('Decrypting security layers...')
    await new Promise(resolve => setTimeout(resolve, 800))

    await ctx.sendChatAction('find_location')
    await ctx.reply('Bypassing firewalls...')
    await new Promise(resolve => setTimeout(resolve, 1200))

    const message = generateWelcomeMessage({
      firstName: ctx.from?.first_name,
      username: ctx.from?.username,
    })

    await ctx.sendChatAction('typing')
    await new Promise(resolve => setTimeout(resolve, 2000))

    await ctx.replyWithHTML(message, {
      reply_markup: config.public.baseUrl ? replyMarkup : undefined,
      parse_mode: 'Markdown',
    })
  } catch (error) {
    console.error('SYSTEM FAILURE:', error)
    await ctx.sendChatAction('typing')
    await ctx.replyWithHTML(
      '🚨 <b>OPERATION FAILED</b> 🚨\n' + 'Emergency protocols activated. Try again after TOR restart.',
    )
  }
}
