'use client'

import {
  FormEventHandler,
  FormHTMLAttributes,
  createContext,
  useContext,
  useState,
} from 'react'

type FormContextProps = {
  setFormData: (name: string, value: string | Blob) => void
}

// Create the context
export const CreateFormContext = createContext<FormContextProps>({
  setFormData: (name: string, value: string | Blob) => void {},
})

// Custom hook to access the CreateImageTaskContext from any component
export const useForm = () => {
  return useContext(CreateFormContext)
}

export default function Form(
  props: Omit<FormHTMLAttributes<HTMLFormElement>, 'onSubmit'> & {
    onSubmit: (formData: FormData) => void
  }
) {
  const [extraFormData, setExtraFormData] = useState<
    Record<string, string | Blob>
  >({})

  const { onSubmit, ...internalProps } = props

  const handleSubmit: FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    console.log(extraFormData)
    for (const name in extraFormData) {
      formData.set(name, extraFormData[name])
    }
    onSubmit(formData)
  }

  function setFormData(name: string, value: string | Blob) {
    const data: Record<string, string | Blob> = {}
    data[name] = value
    console.log(data)
    setExtraFormData({ ...extraFormData, ...data })
  }

  const value: FormContextProps = {
    setFormData,
  }

  return (
    <CreateFormContext.Provider value={value}>
      <form {...internalProps} onSubmit={handleSubmit}>
        {props.children}
      </form>
    </CreateFormContext.Provider>
  )
}
