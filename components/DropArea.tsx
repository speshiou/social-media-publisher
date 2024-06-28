'use client'

import React, { useState, ChangeEvent } from 'react'
import clsx from 'clsx'
import { useForm } from './Form'

export default function DropArea({
  children,
  name,
  onDrop,
}: {
  children: React.ReactNode
  name: string
  onDrop?: (fileList: FileList) => void
}) {
  const [dragging, setDragging] = useState(false)
  const { setFormData } = useForm()

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    const file = event.dataTransfer.files[0]
    setFormData(name, file)
    setDragging(false)
    if (onDrop) {
      onDrop(event.dataTransfer.files)
    }
  }

  const muteEvent = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setDragging(event.type == 'dragover')
  }

  return (
    <div
      className={clsx({
        border: dragging,
        'border-blue-500': dragging,
      })}
      onDrop={handleDrop}
      onDragOver={muteEvent}
      onDragEnter={muteEvent}
      onDragLeave={muteEvent}
      onDragExit={muteEvent}
      onMouseLeave={() => setDragging(false)}
    >
      <div>{children}</div>
    </div>
  )
}
