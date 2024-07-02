import { listInstances } from '@/lib/lambdalabs'
import TelegramApi, { InlineKeyboardMarkup } from '@/lib/telegram/api'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const telegramBot = new TelegramApi(process.env.DEV_TELEGRAM_BOT_API_TOKEN!)

  try {
    const result = await listInstances()
    for (const instance of result.data) {
      console.log(result)
      const markup: InlineKeyboardMarkup = {
        inline_keyboard: [
          [
            {
              text: '🖥 Console',
              url: instance.jupyter_url,
            },
            {
              text: '⛔️ Terminate',
              url: `${process.env.HOST}/api/instances/${instance.id}`,
            },
          ],
        ],
      }

      await telegramBot.sendMessage(
        parseInt(process.env.DEV_TELEGRAM_CHAT_ID!),
        `${getStatusEmoji(instance.status)} ${instance.instance_type.name} - ${
          instance.status
        }`,
        markup
      )
    }
  } catch (error) {
    console.error('Error fetching data:', error)
    await telegramBot.sendMessage(
      parseInt(process.env.DEV_TELEGRAM_CHAT_ID!),
      '⚠️ Failed to check running instances'
    )
  }

  return Response.json({ status: 'SUCCESS' })
}

function getStatusEmoji(status: InstanceStatus): string {
  switch (status) {
    case 'active':
      return '🟢'
    case 'terminating':
      return '🔴'
    default:
      return '🟡'
  }
}
