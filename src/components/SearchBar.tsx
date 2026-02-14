'use client'

import { useState } from 'react'

interface SearchResult {
  answer: string
  sources: Array<{
    id: string
    fileName: string
    fileType: string
    content: string
    similarity: number
    pageNumber?: number
    sheetName?: string
  }>
}

export default function SearchBar() {
  const [query, setQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [result, setResult] = useState<SearchResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!query.trim()) {
      setError('Voer een zoekopdracht in')
      return
    }

    setIsSearching(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      })

      const data = await response.json()

      if (response.ok) {
        setResult(data)
      } else {
        setError(data.error || 'Zoeken mislukt')
      }
    } catch (err) {
      setError('Netwerk fout bij zoeken')
    } finally {
      setIsSearching(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-semibold text-gray-800 mb-4">
        Zoeken in Documenten
      </h2>

      <form onSubmit={handleSearch} className="mb-6">
        <div className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Stel een vraag over je aanbestedingen..."
            className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isSearching}
          />
          <button
            type="submit"
            disabled={isSearching}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-2.5 px-6 rounded-lg transition-colors duration-200"
          >
            {isSearching ? 'Zoeken...' : 'Zoek'}
          </button>
        </div>
      </form>

      {error && (
        <div className="bg-red-50 text-red-800 border border-red-200 p-4 rounded-lg mb-4">
          {error}
        </div>
      )}

      {result && (
        <div className="space-y-6">
          {/* Answer */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">
              Antwoord:
            </h3>
            <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
              {result.answer}
            </p>
          </div>

          {/* Sources */}
          {result.sources.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-3">
                Bronnen ({result.sources.length}):
              </h3>
              <div className="space-y-3">
                {result.sources.map((source, index) => (
                  <div 
                    key={source.id} 
                    className="bg-gray-50 border border-gray-200 rounded-lg p-4"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="bg-blue-600 text-white text-xs font-semibold px-2 py-1 rounded">
                          {index + 1}
                        </span>
                        <span className="font-medium text-gray-800">
                          {source.fileName}
                        </span>
                        <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded">
                          {source.fileType.toUpperCase()}
                        </span>
                      </div>
                      <span className="text-xs text-gray-500">
                        {Math.round(source.similarity * 100)}% match
                      </span>
                    </div>
                    
                    {(source.pageNumber || source.sheetName) && (
                      <div className="text-xs text-gray-600 mb-2">
                        {source.pageNumber && `Pagina ${source.pageNumber}`}
                        {source.sheetName && `Sheet: ${source.sheetName}`}
                      </div>
                    )}
                    
                    <p className="text-sm text-gray-600 italic">
                      "{source.content}"
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
