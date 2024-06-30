'use server'

import sharp, { ExifDir } from 'sharp'
import exif, { ImageTags } from 'exif-reader'
import { img2img } from './sdwebui'
import { base64PngPrefix, exifUserComment } from './utils'

type GenMetaData = {
  prompt?: string
  character?: string
  concept?: string
  series?: string
}

export async function restoreFaces(formData: FormData) {
  const file = formData.get('file')

  if (!(file instanceof File)) {
    throw new Error('File is missing')
  }
  let genMetaData: GenMetaData = {}
  const buffer = Buffer.from(await file.arrayBuffer())
  const base64img = buffer.toString('base64')
  const image = sharp(buffer)
  let conceptPrompt = (formData.get('prompt') || '') as string
  // read meta from the original image
  const metadata = await image.metadata()
  if (metadata.exif) {
    const imageData = exif(metadata.exif)?.Image
    if (imageData) {
      const userComment = imageData[exifUserComment]
      if (userComment) {
        let userCommentString = userComment.toString()
        if (userCommentString.startsWith('ASCII')) {
          // WORKAROUND: sharp will prepend 8 chars to the leading
          userCommentString = userCommentString.substring('ASCII'.length + 3)
        }
        console.log(userCommentString)
        const originalMetaData = JSON.parse(userCommentString)
        genMetaData = {
          ...originalMetaData,
        }
        if (!conceptPrompt) {
          conceptPrompt = originalMetaData.prompt
        }
      }
    }
  }

  genMetaData.prompt = conceptPrompt

  const images = await img2img({
    prompt: `score_9, score_8_up, score_7_up, ${conceptPrompt}, source_anime, <lora:Anime Summer Days 2 Style SDXL_LoRA_Pony Diffusion V6 XL:0.8>`,
    negative_prompt:
      'score_6, score_5, score_4, pony, muscular, furry, child, kid, monochrome, skinny, realistic, censored',
    width: metadata.width,
    height: metadata.height,
    denoising_strength: 0.3,
    init_images: [base64img],
  })
  const tasks = images.map(async (image) => {
    const buffer = Buffer.from(image, 'base64')
    return await sharp(buffer)
      .withExif({
        IFD0: {
          UserComment: JSON.stringify(genMetaData),
        },
      })
      .toBuffer()
  })
  const buffers = await Promise.all(tasks)
  const imageUrls = buffers.map(
    (buffer) => `${base64PngPrefix}${buffer.toString('base64')}`
  )
  return {
    images: imageUrls,
    prompt: conceptPrompt,
  }
}
