import React, { createContext, useState, useContext, ReactNode } from 'react'

interface SaveStatus {
  isSaving: boolean
  lastSaved: number | null
  error: string | null
}

interface SaveStatusContextType extends SaveStatus {
  setSaving: (saving: boolean) => void
  setSaved: () => void
  setError: (error: string) => void
  clearError: () => void
}

const SaveStatusContext = createContext<SaveStatusContextType | undefined>(undefined)

export function SaveStatusProvider({ children }: { children: ReactNode }) {
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  const setSaving = (saving: boolean) => {
    setIsSaving(saving)
  }

  const setSaved = () => {
    setIsSaving(false)
    setLastSaved(Date.now())
    setError(null)
  }

  const setError = (error: string) => {
    setIsSaving(false)
    setError(error)
  }

  const clearError = () => {
    setError(null)
  }

  return (
    <SaveStatusContext.Provider
      value={{
        isSaving,
        lastSaved,
        error,
        setSaving,
        setSaved,
        setError,
        clearError
      }}
    >
      {children}
    </SaveStatusContext.Provider>
  )
}

export function useSaveStatus() {
  const context = useContext(SaveStatusContext)
  if (!context) {
    throw new Error('useSaveStatus must be used within a SaveStatusProvider')
  }
  return context
}
