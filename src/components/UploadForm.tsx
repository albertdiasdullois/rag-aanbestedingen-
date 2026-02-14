'use client'

import { useState, useRef } from 'react'

interface UploadFormProps {
  onUploadSuccess: () => void
}

export default function UploadForm({ onUploadSuccess }: UploadFormProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setMessage(null)

    const formData = new FormData(e.currentTarget)
    const file = formData.get('file') as File

    if (!file || file.size === 0) {
      setMessage({ type: 'error', text: 'Selecteer een bestand' })
      return
    }

    setIsUploading(true)

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (response.ok) {
        setMessage({ 
          type: 'success', 
          text: `${data.document.file_name} succesvol geüpload! Document wordt verwerkt...` 
        })
        
        // Reset form
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
        
        // Notify parent
        onUploadSuccess()
      } else {
        setMessage({ type: 'error', text: data.error || 'Upload mislukt' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Netwerk fout bij uploaden' })
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-semibold text-gray-800 mb-4">
        Document Uploaden
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label 
            htmlFor="file" 
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Selecteer een PDF, Word of Excel bestand
          </label>
          <input
            ref={fileInputRef}
            type="file"
            id="file"
            name="file"
            accept=".pdf,.docx,.doc,.xlsx,.xls"
            className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent p-2.5"
            disabled={isUploading}
          />
          <p className="mt-1 text-xs text-gray-500">
            Ondersteunde formaten: PDF, Word (.docx), Excel (.xlsx)
          </p>
        </div>

        <button
          type="submit"
          disabled={isUploading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-2.5 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center"
        >
          {isUploading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Uploaden...
            </>
          ) : (
            'Upload Document'
          )}
        </button>
      </form>

      {message && (
        <div 
          className={`mt-4 p-4 rounded-lg ${
            message.type === 'success' 
              ? 'bg-green-50 text-green-800 border border-green-200' 
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {message.text}
        </div>
      )}
    </div>
  )
}
