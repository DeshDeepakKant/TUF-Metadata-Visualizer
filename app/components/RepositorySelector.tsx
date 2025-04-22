'use client';

import React, { useState } from 'react';
import { discoverTufRepository } from '../utils/remoteTufClient';

interface RepositorySelectorProps {
  onRepositorySelected: (url: string) => void;
  isLoading: boolean;
}

/**
 * Component for selecting and validating a remote TUF repository URL
 */
export default function RepositorySelector({ onRepositorySelected, isLoading }: RepositorySelectorProps) {
  const [url, setUrl] = useState('');
  const [validationStatus, setValidationStatus] = useState<'idle' | 'validating' | 'valid' | 'invalid'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const exampleUrls = [
    'https://tuf-repo-cdn.sigstore.dev/',
    'https://raw.githubusercontent.com/theupdateframework/tuf/develop/tests/repository_data/repository/metadata/'
  ];

  /**
   * Validate the repository URL to ensure it's a valid TUF repository
   */
  const validateRepository = async () => {
    if (!url) {
      setErrorMessage('Please enter a repository URL');
      return;
    }

    setValidationStatus('validating');
    setErrorMessage('');

    try {
      const isValid = await discoverTufRepository(url);
      
      if (isValid) {
        setValidationStatus('valid');
        onRepositorySelected(url);
      } else {
        setValidationStatus('invalid');
        setErrorMessage('Could not find TUF metadata at this URL. Make sure it contains timestamp.json.');
      }
    } catch (error) {
      setValidationStatus('invalid');
      setErrorMessage(`Error validating repository: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  /**
   * Set an example URL
   */
  const setExampleUrl = (exampleUrl: string) => {
    setUrl(exampleUrl);
    setValidationStatus('idle');
    setErrorMessage('');
  };

  return (
    <div className="mb-6 p-4 border border-gray-200 rounded-lg bg-white shadow-sm">
      <h2 className="text-xl font-semibold mb-4">TUF Repository</h2>
      
      <div className="mb-4">
        <label htmlFor="repo-url" className="block text-sm font-medium text-gray-700 mb-1">
          Repository URL
        </label>
        <input
          id="repo-url"
          type="text"
          value={url}
          onChange={(e) => {
            setUrl(e.target.value);
            setValidationStatus('idle');
            setErrorMessage('');
          }}
          placeholder="https://example.com/metadata/"
          className="w-full p-2 border border-gray-300 rounded-md"
          disabled={isLoading || validationStatus === 'validating'}
        />
      </div>
      
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={validateRepository}
          disabled={isLoading || validationStatus === 'validating' || !url}
          className={`px-4 py-2 rounded-md text-white ${
            isLoading || validationStatus === 'validating'
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {validationStatus === 'validating' ? 'Validating...' : 'Load Repository'}
        </button>
        
        {validationStatus === 'valid' && (
          <div className="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 rounded-md">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Valid repository
          </div>
        )}
        
        {errorMessage && (
          <div className="w-full mt-2 text-red-600 text-sm">
            {errorMessage}
          </div>
        )}
      </div>
      
      <div>
        <p className="text-sm text-gray-600 mb-2">Example repositories:</p>
        <div className="flex flex-col gap-2">
          {exampleUrls.map((exampleUrl, index) => (
            <button
              key={index}
              onClick={() => setExampleUrl(exampleUrl)}
              className="text-left text-blue-600 hover:text-blue-800 text-sm"
              disabled={isLoading || validationStatus === 'validating'}
            >
              {exampleUrl}
            </button>
          ))}
        </div>
      </div>
      
      <div className="mt-4 text-xs text-gray-500">
        <p>Note: Remote repositories may have CORS restrictions. If you encounter CORS errors, consider using a CORS proxy.</p>
      </div>
    </div>
  );
} 