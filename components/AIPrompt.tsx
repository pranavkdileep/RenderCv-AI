"use client";
import React, { useState } from 'react';
import { Sparkles, Send, Loader2 } from 'lucide-react';

interface AIPromptProps {
  onGenerate: (prompt: string) => Promise<void>;
  isGenerating: boolean;
  prefillPrompt?: string;
}

const AIPrompt: React.FC<AIPromptProps> = ({ onGenerate, isGenerating, prefillPrompt }) => {
  const [prompt, setPrompt] = useState('');

  React.useEffect(() => {
    if (prefillPrompt !== undefined) {
      setPrompt(prefillPrompt);
    }
  }, [prefillPrompt]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isGenerating) return;
    await onGenerate(prompt);
    setPrompt('');
  };

  return (
    <div className="bg-gray-800 border-b border-gray-700 p-4">
      <div className="flex items-center gap-2 mb-3 text-purple-400 font-semibold">
        <Sparkles size={18} />
        <span>AI Assistant</span>
      </div>
      <form onSubmit={handleSubmit} className="relative">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe your resume updates... (e.g., 'Add a senior software engineer role at Google from 2020 to 2023 with focus on cloud architecture')"
          className="w-full bg-gray-900 text-gray-200 text-sm rounded-lg p-3 pr-12 border border-gray-700 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none resize-none h-24 transition-all"
          disabled={isGenerating}
        />
        <button
          type="submit"
          disabled={!prompt.trim() || isGenerating}
          className="absolute bottom-3 right-3 p-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-md transition-colors shadow-lg"
        >
          {isGenerating ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
        </button>
      </form>
      <p className="text-xs text-gray-500 mt-2">
        Pro tip: Mention "Education", "Experience", or "Skills" to target specific sections.
      </p>
    </div>
  );
};

export default AIPrompt;
