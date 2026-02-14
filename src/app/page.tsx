'use client'

import { useState } from 'react'
import UploadForm from '@/components/UploadForm'
import SearchBar from '@/components/SearchBar'
import DocumentList from '@/components/DocumentList'

export default function Home() {
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const handleUploadSuccess = () => {
    setRefreshTrigger(prev => prev + 1)
  }

  const handleDeleteSuccess = () => {
    setRefreshTrigger(prev => prev + 1)
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Aanbestedingen RAG Systeem
          </h1>
          <p className="text-lg text-gray-600">
            Upload PDF, Word en Excel documenten en stel vragen over je aanbestedingen
          </p>
        </div>

        {/* Upload Section */}
        <div className="mb-12">
          <UploadForm onUploadSuccess={handleUploadSuccess} />
        </div>

        {/* Search Section */}
        <div className="mb-12">
          <SearchBar />
        </div>

        {/* Documents List */}
        <div>
          <DocumentList 
            refreshTrigger={refreshTrigger} 
            onDeleteSuccess={handleDeleteSuccess}
          />
        </div>
      </div>
    </main>
  )
}
