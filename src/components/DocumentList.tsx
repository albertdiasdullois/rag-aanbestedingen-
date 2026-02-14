'use client'

import { useState, useEffect } from 'react'

interface Document {
  id: string
  title: string
  file_name: string
  file_type: string
  file_size: number
  upload_date: string
  processed: boolean
}

interface DocumentListProps {
  refreshTrigger: number
  onDeleteSuccess: () => void
}

export default function DocumentList({ refreshTrigger, onDeleteSuccess }: DocumentListProps) {
  const [documents, setDocuments] = useState<Document[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    fetchDocuments()
  }, [refreshTrigger])

  const fetchDocuments = async () => {
    try {
      const response = await fetch('/api/documents')
      const data = await response.json()
      
      if (response.ok) {
        setDocuments(data.documents || [])
      }
    } catch (error) {
      console.error('Error fetching documents:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Weet je zeker dat je dit document wilt verwijderen?')) {
      return
    }

    setDeletingId(id)

    try {
      const response = await fetch(`/api/documents?id=${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        onDeleteSuccess()
      } else {
        alert('Fout bij verwijderen van document')
      }
    } catch (error) {
      alert('Netwerk fout bij verwijderen')
    } finally {
      setDeletingId(null)
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('nl-NL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getFileIcon = (fileType: string) => {
    switch (fileType) {
      case 'pdf':
        return '📄'
      case 'docx':
        return '📝'
      case 'xlsx':
        return '📊'
      default:
        return '📎'
    }
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold text-gray-800">
          Documenten ({documents.length})
        </h2>
        <button
          onClick={fetchDocuments}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          ↻ Ververs
        </button>
      </div>

      {documents.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">
            Nog geen documenten geüpload
          </p>
          <p className="text-gray-400 text-sm mt-2">
            Upload je eerste document om te beginnen
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-4 flex-1">
                <span className="text-3xl">
                  {getFileIcon(doc.file_type)}
                </span>
                
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900 truncate">
                    {doc.title}
                  </h3>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-gray-500">
                      {formatFileSize(doc.file_size)}
                    </span>
                    <span className="text-xs text-gray-500">
                      {formatDate(doc.upload_date)}
                    </span>
                    <span 
                      className={`text-xs px-2 py-0.5 rounded ${
                        doc.processed 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {doc.processed ? 'Verwerkt' : 'Wordt verwerkt...'}
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleDelete(doc.id)}
                disabled={deletingId === doc.id}
                className="ml-4 text-red-600 hover:text-red-700 disabled:text-gray-400 font-medium text-sm"
              >
                {deletingId === doc.id ? 'Verwijderen...' : 'Verwijder'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
