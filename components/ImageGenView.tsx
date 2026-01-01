import React, { useState } from 'react';
import { Sparkles, Download, Image as ImageIcon, Loader2, ChevronDown } from 'lucide-react';
import { generateImage, IMAGE_MODELS, DEFAULT_IMAGE_MODEL } from '../services/geminiService';

export const ImageGenView: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [selectedModel, setSelectedModel] = useState(DEFAULT_IMAGE_MODEL);
  const [imageData, setImageData] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    
    setIsLoading(true);
    setError(null);
    setImageData(null);

    try {
      const base64Data = await generateImage(prompt, selectedModel);
      if (base64Data) {
        setImageData(base64Data);
      } else {
        setError("No image data received from the model.");
      }
    } catch (err: any) {
      // Check for specific error message regarding entity not found to prompt re-selection logic hint if needed,
      // though the service handles the openSelectKey.
      if (err.message && err.message.includes("Requested entity was not found")) {
         setError("API Key issue. Please try again or select a valid paid project key.");
      } else {
         setError(err.message || "Failed to generate image.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleGenerate();
    }
  };

  const handleDownload = () => {
    if (!imageData) return;
    const link = document.createElement('a');
    link.href = `data:image/png;base64,${imageData}`;
    link.download = `gemini-gen-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const currentModelInfo = IMAGE_MODELS.find(m => m.id === selectedModel);

  return (
    <div className="flex-1 h-full flex flex-col bg-slate-50 dark:bg-slate-900 overflow-y-auto">
       <div className="max-w-4xl mx-auto w-full p-6 flex flex-col h-full">
          
          <div className="mb-4 text-center mt-6">
            <h2 className="text-3xl font-bold text-slate-800 dark:text-white mb-2 flex items-center justify-center gap-3">
               <Sparkles className="text-purple-500" />
               <span>Imagine</span>
            </h2>
            <p className="text-slate-500 dark:text-slate-400 mb-4">
              Turn your words into art.
            </p>
            
            {/* Model Selector */}
            <div className="inline-block relative">
               <select
                 value={selectedModel}
                 onChange={(e) => setSelectedModel(e.target.value)}
                 className="appearance-none bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 py-2 pl-4 pr-10 rounded-full shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 cursor-pointer text-sm font-medium hover:border-purple-500 transition-colors"
                 disabled={isLoading}
               >
                 {IMAGE_MODELS.map((model) => (
                   <option key={model.id} value={model.id}>
                     {model.name}
                   </option>
                 ))}
               </select>
               <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                  <ChevronDown size={14} />
               </div>
            </div>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center min-h-[400px]">
             {isLoading ? (
               <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg aspect-square bg-slate-100 dark:bg-slate-800/50">
                  <Loader2 className="w-12 h-12 text-purple-500 animate-spin mb-4" />
                  <p className="text-slate-600 dark:text-slate-300 font-medium">Dreaming up your image...</p>
                  <p className="text-xs text-slate-400 mt-2">Using {currentModelInfo?.name}</p>
               </div>
             ) : imageData ? (
               <div className="relative group w-full max-w-lg">
                 <img 
                   src={`data:image/png;base64,${imageData}`} 
                   alt="Generated Content" 
                   className="w-full aspect-square object-cover rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700"
                 />
                 <button
                   onClick={handleDownload}
                   className="absolute bottom-4 right-4 bg-white dark:bg-slate-800 text-slate-800 dark:text-white p-3 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0 hover:scale-105"
                   title="Download"
                 >
                   <Download size={20} />
                 </button>
               </div>
             ) : (
               <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg aspect-square text-slate-400">
                  <ImageIcon size={48} className="mb-4 opacity-50" />
                  <p>Your imagination will appear here.</p>
               </div>
             )}
             
             {error && (
               <div className="mt-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-sm rounded-lg max-w-lg text-center">
                 {error}
               </div>
             )}
          </div>

          <div className="mt-8 mb-10 w-full max-w-2xl mx-auto">
             <div className="relative">
               <textarea
                 value={prompt}
                 onChange={(e) => setPrompt(e.target.value)}
                 onKeyDown={handleKeyDown}
                 placeholder="Describe the image you want to generate (e.g., 'A cyberpunk city at sunset with neon lights')"
                 className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 pr-14 shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent text-slate-800 dark:text-white resize-none"
                 rows={3}
                 disabled={isLoading}
               />
               <button
                 onClick={handleGenerate}
                 disabled={!prompt.trim() || isLoading}
                 className={`absolute bottom-3 right-3 p-2 rounded-lg transition-colors ${
                    !prompt.trim() || isLoading 
                    ? 'bg-slate-200 dark:bg-slate-700 text-slate-400 cursor-not-allowed'
                    : 'bg-purple-600 hover:bg-purple-700 text-white'
                 }`}
               >
                 <Sparkles size={20} />
               </button>
             </div>
             
             {currentModelInfo?.isPaid && (
               <p className="text-center text-xs text-amber-500/80 mt-2">
                 Paid project key required for Pro High Quality model.
               </p>
             )}
          </div>
       </div>
    </div>
  );
};