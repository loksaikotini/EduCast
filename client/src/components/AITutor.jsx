import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { FiSend } from 'react-icons/fi';

export default function AITutor() {
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const { fetchWithAuth } = useContext(AuthContext);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setIsLoading(true);
    setError('');
    setResponse('');

    try {
      const res = await fetchWithAuth('/ai/ask', {
        method: 'POST',
        body: JSON.stringify({ prompt }),
      });
      
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to get a response.');
      }
      setResponse(data.answer);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="bg-white/20 backdrop-blur-md p-6 rounded-xl shadow-lg">
      <h2 className="text-xl font-semibold mb-3 text-indigo-100">✨ AI Tutor</h2>
      <p className="text-sm text-indigo-200 mb-4">Have a question? Ask me anything!</p>
      
      <form onSubmit={handleSubmit} className="space-y-3">
        <textarea
          placeholder="e.g., Explain what a black hole is..."
          className="w-full border border-indigo-300 bg-white/80 text-gray-800 p-3 rounded-md focus:ring-2 focus:ring-purple-400 min-h-[80px]"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
        />
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-md transition duration-150 disabled:opacity-60 flex items-center justify-center"
        >
          <FiSend className="mr-2"/> {isLoading ? 'Thinking...' : 'Ask Question'}
        </button>
      </form>

      {error && <p className="mt-4 text-red-300 bg-red-900/50 p-3 rounded-md">{error}</p>}
      
      {response && (
        <div className="mt-4 p-4 bg-black/20 rounded-md">
          <h3 className="font-semibold text-indigo-100 mb-2">Answer:</h3>
          <p className="text-white whitespace-pre-wrap">{response}</p>
        </div>
      )}
    </section>
  );
}
