interface ApiResponse {
  ok: boolean
  description: string
  result: any
}

export type InlineKeyboardMarkup = {
  inline_keyboard: InlineKeyboardButton[][]
}

export type InlineKeyboardButton = {
  text: string
  url?: string
  web_app?: WebAppInfo
}

export type WebAppInfo = {
  url: string
}

interface MenuButton {
  /* Define the structure for the menu button */
}

interface Media {
  type: string
  media: string
  caption?: string
  parse_mode?: string
}

class TelegramApi {
  private token: string

  constructor(token: string) {
    this.token = token
  }

  private async request(api: string, formData: FormData): Promise<any> {
    const requestUrl: string =
      'https://api.telegram.org/bot' + this.token + '/' + api

    const options: RequestInit = {
      method: 'POST',
      body: formData,
    }

    const response = await fetch(requestUrl, options)
    if (!response.ok) {
      console.log(await response.text())
      throw new Error('Telegram API Error: ' + response.statusText)
    }
    const result = await response.json()
    if (!result.ok) {
      console.log(await response.text())
      throw new Error('Telegram API Error: ' + result.description)
    }
    return result.result
  }

  async sendMessage(
    chatId: number,
    message: string,
    replyMarkup?: InlineKeyboardMarkup
  ): Promise<any> {
    const formData = new FormData()
    formData.append('chat_id', chatId.toString())
    formData.append('text', message)

    if (replyMarkup) {
      formData.append('reply_markup', JSON.stringify(replyMarkup))
    }

    return this.request('sendMessage', formData)
  }

  async sendMediaGroup(
    chatId: number,
    photos: string[],
    caption: string
  ): Promise<any> {
    const mediaArray: Media[] = []

    const formData = new FormData()
    formData.append('chat_id', chatId.toString())

    photos.forEach((photo, index) => {
      let media: Media

      if (URL.canParse(photo)) {
        media = {
          type: 'photo',
          media: photo,
        }
      } else {
        const base64Image = photo
        const filename = `photo${index}.png`
        media = {
          type: 'photo',
          media: `attach://${filename}`,
        }

        const binaryData = Buffer.from(base64Image, 'base64')

        const blob = new Blob([binaryData], { type: 'image/png' })
        formData.append(filename, blob, filename)
      }

      if (index === 0) {
        media.caption = caption
        media.parse_mode = 'HTML'
      }

      mediaArray.push(media)
    })

    formData.append('media', JSON.stringify(mediaArray))

    console.log(formData)

    const result = await this.request('sendMediaGroup', formData)
  }
}

export default TelegramApi
