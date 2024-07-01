import { terminateInstance } from '@/lib/lambdalabs'
import TelegramApi from '@/lib/telegram/api'

export const dynamic = 'force-dynamic'

export async function GET(
  request: Request,
  { params }: { params: { instance_id: string } }
) {
  const telegramBot = new TelegramApi(process.env.DEV_TELEGRAM_BOT_API_TOKEN!)

  try {
    const result = await terminateInstance(params.instance_id)
    await telegramBot.sendMessage(
      parseInt(process.env.DEV_TELEGRAM_CHAT_ID!),
      '⚠️ Terminating ...'
    )
  } catch (error) {
    console.error('Error fetching data:', error)
    await telegramBot.sendMessage(
      parseInt(process.env.DEV_TELEGRAM_CHAT_ID!),
      '⚠️ Failed to terminate the instance'
    )
  }

  return Response.json({ status: 'SUCCESS', id: params.instance_id })
}
