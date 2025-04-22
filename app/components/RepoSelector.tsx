'use client';

import React, { useState } from 'react';

// Known public TUF repositories
const KNOWN_REPOS = [
  {
    name: 'Sigstore',
    url: 'https://tuf-repo-cdn.sigstore.dev/',
    description: 'Sigstore TUF repository'
  },
  {
    name: 'Local Repository',
    url: '/metadata/',
    description: 'Local TUF repository in /public/metadata/'
  }
];

export interface RepoSelectorProps {
  onSelectRepository: (url: string) => void;
  loading?: boolean;
}

export default function RepoSelector({ onSelectRepository, loading = false }: RepoSelectorProps) {
  const [customUrl, setCustomUrl] = useState('');
  const [activeTab, setActiveTab] = useState<'known' | 'custom'>('known');

  const handleKnownRepoSelect = (url: string) => {
    onSelectRepository(url);
  };

  const handleCustomRepoSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (customUrl.trim()) {
      onSelectRepository(customUrl);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto border rounded-lg overflow-hidden shadow-sm">
      <div className="p-4 border-b bg-gray-50">
        <h2 className="text-xl font-semibold">TUF Repository</h2>
        <p className="text-sm text-gray-500">
          Select a TUF metadata repository to visualize
        </p>
      </div>
      
      <div className="p-4">
        {/* Tabs */}
        <div className="flex border-b mb-4">
          <button
            className={`px-4 py-2 font-medium text-sm ${
              activeTab === 'known' 
                ? 'border-b-2 border-blue-500 text-blue-600' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('known')}
            disabled={loading}
          >
            Known Repositories
          </button>
          <button
            className={`px-4 py-2 font-medium text-sm ${
              activeTab === 'custom' 
                ? 'border-b-2 border-blue-500 text-blue-600' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('custom')}
            disabled={loading}
          >
            Custom URL
          </button>
        </div>
        
        {/* Known Repos Tab */}
        {activeTab === 'known' && (
          <div className="space-y-4 py-2">
            {KNOWN_REPOS.map((repo) => (
              <button
                key={repo.url}
                className="w-full text-left border rounded-md p-4 hover:bg-gray-50 transition-colors"
                onClick={() => handleKnownRepoSelect(repo.url)}
                disabled={loading}
              >
                <div>
                  <span className="font-medium block">{repo.name}</span>
                  <span className="text-sm text-gray-500 block">{repo.url}</span>
                  <span className="text-xs text-gray-400 block mt-1">{repo.description}</span>
                </div>
              </button>
            ))}
          </div>
        )}
        
        {/* Custom URL Tab */}
        {activeTab === 'custom' && (
          <form onSubmit={handleCustomRepoSubmit} className="py-2">
            <div className="space-y-4">
              <label htmlFor="repo-url" className="block text-sm font-medium">
                Repository URL
              </label>
              <input
                id="repo-url"
                type="text"
                className="w-full p-2 border rounded-md"
                placeholder="https://example.com/tuf/"
                value={customUrl}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCustomUrl(e.target.value)}
                disabled={loading}
              />
              <p className="text-xs text-gray-500">
                Enter the base URL of a TUF repository that contains root.json, timestamp.json, etc.
              </p>
              <button
                type="submit"
                className={`px-4 py-2 rounded-md text-white ${
                  loading || !customUrl.trim()
                    ? 'bg-blue-300 cursor-not-allowed'
                    : 'bg-blue-500 hover:bg-blue-600'
                }`}
                disabled={loading || !customUrl.trim()}
              >
                {loading ? 'Loading...' : 'Load Repository'}
              </button>
            </div>
          </form>
        )}
      </div>
      
      <div className="p-4 border-t bg-gray-50 text-xs text-gray-500">
        Note: Remote repositories must support CORS or use the TUF standard API endpoints.
      </div>
    </div>
  );
} 