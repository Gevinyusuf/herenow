'use client';

import { useState } from 'react';
import { X, Zap } from 'lucide-react';

interface AIModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (content: string) => void;
}

export default function AIModal({ isOpen, onClose, onApply }: AIModalProps) {
  const [prompt, setPrompt] = useState('');
  const [generatedContent, setGeneratedContent] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  if (!isOpen) return null;

  const handleGenerate = () => {
    if (!prompt) return;
    
    setIsGenerating(true);
    
    setTimeout(() => {
      const draft = `
        <h1>Join us for an unforgettable evening!</h1>
        <p>We're bringing together top innovators and creators for a night of networking, learning, and celebration.</p>
        <h2>What to expect:</h2>
        <ul>
          <li>Inspiring talks from industry leaders</li>
          <li>Delicious food and beverages</li>
          <li>Great company and networking opportunities</li>
        </ul>
        <p>Don't miss out on this opportunity to connect!</p>
      `;
      setGeneratedContent(draft);
      setIsGenerating(false);
    }, 1500);
  };

  const handleApply = () => {
    if (generatedContent) {
      onApply(generatedContent);
      setPrompt('');
      setGeneratedContent('');
    }
  };

  return (
    <div
      className={`fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-opacity duration-300 ${
        isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
      }`}
      onClick={onClose}
    >
      <div
        className={`bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 transition-transform duration-300 ${
          isOpen ? 'scale-100' : 'scale-95'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-full bg-orange-100 text-orange-600">
              <Zap size={20} />
            </div>
            <h3 className="text-xl font-bold text-slate-900">AI Magic Assistant</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={24} />
          </button>
        </div>
        <div className="space-y-4">
          <p className="text-sm text-slate-600">Describe the vibe, key details, and audience of your event. I'll write the copy for you!</p>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="w-full h-24 bg-slate-50 rounded-xl p-3 text-sm text-slate-700 border border-slate-200 focus:outline-none focus:border-orange-300 resize-none"
            placeholder="e.g. A tech networking night in New York for startup founders..."
          />
          {generatedContent && (
            <div className="p-3 bg-orange-50 rounded-xl border border-orange-100 text-sm text-slate-700">
              <div dangerouslySetInnerHTML={{ __html: generatedContent }} />
            </div>
          )}
          <button
            onClick={handleGenerate}
            disabled={isGenerating || !prompt}
            className="w-full py-2.5 rounded-xl text-white font-bold shadow-md hover:opacity-90 transition disabled:opacity-50"
            style={{ backgroundColor: 'var(--color-herenow-orange)' }}
          >
            {isGenerating ? 'Generating...' : 'Generate Copy'}
          </button>
          {generatedContent && (
            <button
              onClick={handleApply}
              className="w-full py-2.5 border-2 border-orange-500 text-orange-600 font-bold rounded-xl hover:bg-orange-50 transition"
            >
              Use This Draft
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

