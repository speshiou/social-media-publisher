'use server'

import sharp from 'sharp'
import exif, { ImageTags } from 'exif-reader'
import { img2img } from './sdwebui'
import { exifUserComment } from './utils'

export async function restoreFaces(formData: FormData) {
  const file = formData.get('file')

  if (file instanceof File) {
    const buffer = Buffer.from(await file.arrayBuffer())
    const base64img = buffer.toString('base64')
    const image = sharp(buffer)
    let conceptPrompt = formData.get('prompt') || ''
    const metadata = await image.metadata()
    if (!conceptPrompt && metadata.exif) {
      const imageData = exif(metadata.exif)?.Image
      if (imageData) {
        const userComment = imageData[exifUserComment]
        if (userComment) {
          const { prompt } = JSON.parse(userComment as string)
          conceptPrompt = prompt
        }
      }
    }

    const images = await img2img({
      prompt: `score_9, score_8_up, score_7_up, ${conceptPrompt}, source_anime, <lora:Anime Summer Days 2 Style SDXL_LoRA_Pony Diffusion V6 XL:0.8>`,
      negative_prompt:
        'score_6, score_5, score_4, pony, muscular, furry, child, kid, monochrome, skinny, realistic, censored',
      width: metadata.width,
      height: metadata.height,
      denoising_strength: 0.3,
      init_images: [base64img],
    })
    return {
      images: images,
      prompt: conceptPrompt as string,
    }
  }
  return null
}
