'use client'

import DropArea from '@/components/DropArea'
import Form from '@/components/Form'
import { restoreFaces } from '@/lib/actions'
import { PhotoIcon } from '@heroicons/react/24/solid'
import { useState } from 'react'

export default function Home() {
  const [originalImage, setOriginalImage] = useState<string>()
  const [outputImage, setOutputImage] = useState<string>()

  async function onSubmit(formData: FormData) {
    const images = await restoreFaces(formData)
    if (images) {
      setOutputImage(images[0])
    }
  }

  async function handleDrop(fileList: FileList) {
    const reader = new FileReader()
    reader.onload = (event) => {
      if (event.target?.result) {
        const dataUrl = event.target.result as string
        setOriginalImage(dataUrl)
        setOutputImage(undefined)
      }
    }
    reader.readAsDataURL(fileList[0])
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <Form method="POST" onSubmit={onSubmit}>
        <DropArea name="file" onDrop={handleDrop}>
          <div className="col-span-full">
            <label
              htmlFor="cover-photo"
              className="block text-sm font-medium leading-6 text-gray-900"
            >
              Restore Faces
            </label>
            <div className="mt-2 flex justify-center rounded-lg border border-dashed border-gray-900/25 px-6 py-10">
              <div className="text-center">
                <PhotoIcon
                  className="mx-auto h-12 w-12 text-gray-300"
                  aria-hidden="true"
                />
                <div className="mt-4 flex text-sm leading-6 text-gray-600">
                  <label
                    htmlFor="file-upload"
                    className="relative cursor-pointer rounded-md bg-white font-semibold text-indigo-600 focus-within:outline-none focus-within:ring-2 focus-within:ring-indigo-600 focus-within:ring-offset-2 hover:text-indigo-500"
                  >
                    <span>Upload a file</span>
                    <input
                      id="file-upload"
                      name="file-upload"
                      type="file"
                      className="sr-only"
                    />
                  </label>
                  <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-xs leading-5 text-gray-600">
                  PNG, JPG, GIF up to 10MB
                </p>
              </div>
            </div>
          </div>
          <div className="mt-6 flex items-center justify-end gap-x-6">
            <button
              type="button"
              className="text-sm font-semibold leading-6 text-gray-900"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            >
              Inpaint
            </button>
          </div>
          <div className="grid grid-cols-2">
            {originalImage && <img src={originalImage} />}
            {outputImage && <img src={outputImage} />}
          </div>
        </DropArea>
      </Form>
    </main>
  )
}
