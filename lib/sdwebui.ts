import { base64PngPrefix } from './utils'

type Txt2ImgRequestData = {
  prompt: string
  negative_prompt?: string
  steps?: number
  cfg_scale?: number
  width?: number
  height?: number
  batch_size?: number
  denoising_strength?: number
  alwayson_scripts?: ScriptsInputs
}

type Img2ImgRequestData = Txt2ImgRequestData & {
  init_images: string[]
}

type ScriptsInputs = {
  controlnet?: {
    args: {
      input_image: string // Assuming this is the base64 encoded image
      module: string
      model: string
      weight: number
    }[]
  }
  AnimateDiff?: {
    args: AnimateDiffInputs[]
  }
  ADetailer?: {}
}

type AnimateDiffInputs = {
  model: string
  enable: boolean
  video_length: number
  fps: number
  loop_number: number
  closed_loop: string
  batch_size: number
  stride: number
  overlap: number
  format: string[]
  interp: string
  interp_x: number
  video_source: string | null
  video_path: string | null
  latent_power: number
  latent_scale: number
  last_frame: string | null
  latent_power_last: number
  latent_scale_last: number
  request_id: string
}

export async function img2img(inputs: Img2ImgRequestData) {
  let payload: Img2ImgRequestData = {
    steps: 20,
    cfg_scale: 7,
    width: 1024,
    height: 1024,
    // "batch_count": 2,
    batch_size: 1,
    denoising_strength: 0.75,

    ...inputs,
  }

  const scripts: ScriptsInputs = {}

  payload['alwayson_scripts'] = scripts
  scripts.ADetailer = {
    args: [
      {
        ad_model: 'face_yolov8n.pt',
        // ad_denoising_strength: 0.6,
      },
    ],
  }

  payload['alwayson_scripts'] = scripts

  const response = await fetch(
    `${process.env.SD_WEBUI_HOST}/sdapi/v1/img2img`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    }
  )

  const data = await response.json()
  let images = data['images'] as string[]
  images = images.map((image) => {
    if (URL.canParse(image)) {
      return image
    }
    return `${base64PngPrefix}${image}`
  })
  return images
}
