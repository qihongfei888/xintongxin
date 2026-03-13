import React from 'react'
import { Check, AlertCircle, Loader2 } from 'lucide-react'
import { useSaveStatus } from '../contexts/SaveStatusContext'

export function SaveStatusIndicator() {
  const { isSaving, lastSaved, error, clearError } = useSaveStatus()

  if (error) {
    return (
      <div className="save-status error">
        <AlertCircle size={16} />
        <span>{error}</span>
        <button onClick={clearError} className="small">
          关闭
        </button>
      </div>
    )
  }

  if (isSaving) {
    return (
      <div className="save-status saving">
        <Loader2 size={16} className="spin" />
        <span>保存中...</span>
      </div>
    )
  }

  if (lastSaved) {
    const time = new Date(lastSaved).toLocaleTimeString()
    return (
      <div className="save-status saved">
        <Check size={16} />
        <span>已保存 {time}</span>
      </div>
    )
  }

  return null
}
