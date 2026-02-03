import React, { useState, useEffect } from 'react';
import { KeyRound, X, Save, Trash2, ShieldCheck, Globe } from 'lucide-react';

interface ApiConfigurationModalProps {
  isOpen: boolean;
  onClose: () => void;
  isForced?: boolean; // If true, user must select an option to proceed (no close button)
  currentMode: "user" | "public" | null;
  currentUserKey: string | null;
  onSaveUserKey: (key: string) => void;
  onDeleteUserKey: () => void;
  onSetPublicMode: () => void;
}

const ApiConfigurationModal: React.FC<ApiConfigurationModalProps> = ({
  isOpen,
  onClose,
  isForced = false,
  currentMode,
  currentUserKey,
  onSaveUserKey,
  onDeleteUserKey,
  onSetPublicMode,
}) => {
  const [apiKeyInput, setApiKeyInput] = useState(currentUserKey || '');

  useEffect(() => {
    if (isOpen) {
        setApiKeyInput(currentUserKey || '');
    }
  }, [isOpen, currentUserKey]);

  if (!isOpen) return null;

  const handleSave = () => {
    if (!apiKeyInput.trim()) {
      alert("Please enter a valid API key.");
      return;
    }
    onSaveUserKey(apiKeyInput.trim());
    if (!isForced) onClose();
  };

  const handleDelete = () => {
    onDeleteUserKey();
    setApiKeyInput('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-gray-900 border border-gray-700 rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-gray-800/50 px-6 py-4 border-b border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-3 text-purple-400">
            <div className="p-2 bg-purple-500/10 rounded-lg">
                <KeyRound size={20} />
            </div>
            <h2 className="font-semibold text-lg text-white">API Configuration</h2>
          </div>
          {!isForced && (
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors p-1 rounded-md hover:bg-gray-800"
            >
              <X size={20} />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          <p className="text-sm text-gray-400 leading-relaxed">
            To generate resume content with AI, please configure the Google Gemini API.
          </p>

          {/* User Key Section */}
          <div className={`space-y-3 p-4 rounded-lg border transition-all ${currentMode === 'user' ? 'bg-purple-900/10 border-purple-500/50' : 'bg-gray-800/30 border-gray-700 hover:border-gray-600'}`}>
             <div className="flex items-center gap-2 mb-2">
                <ShieldCheck size={16} className={currentMode === 'user' ? "text-purple-400" : "text-gray-500"} />
                <label className="text-sm font-medium text-gray-200">Your Private API Key</label>
             </div>
             
             <div className="flex gap-2">
               <input 
                 type="password" 
                 value={apiKeyInput}
                 onChange={(e) => setApiKeyInput(e.target.value)}
                 placeholder="Enter gemini-pro-key..."
                 className="flex-1 bg-gray-950 border border-gray-700 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
               />
               {currentUserKey && (
                   <button 
                    onClick={handleDelete}
                    title="Delete stored key"
                    className="p-2 text-red-400 hover:bg-red-950/30 border border-gray-700 hover:border-red-900 rounded-md transition-colors"
                   >
                       <Trash2 size={16} />
                   </button>
               )}
             </div>
             
             <button 
                onClick={handleSave}
                disabled={!apiKeyInput.trim()}
                className="w-full mt-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:text-gray-500 text-white font-medium py-2 px-4 rounded-md text-xs sm:text-sm flex items-center justify-center gap-2 transition-all"
             >
                <Save size={14} />
                {currentUserKey ? "Update & Use My Key" : "Save & Use My Key"}
             </button>
             <p className="text-[10px] text-gray-500 px-1">
                Your key is stored locally in your browser and sent directly to Google.
             </p>
          </div>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-gray-700" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-gray-900 px-2 text-gray-500">Or</span>
            </div>
          </div>

          {/* Public Key Section */}
          <div className={`p-4 rounded-lg border transition-all ${currentMode === 'public' ? 'bg-blue-900/10 border-blue-500/50' : 'bg-gray-800/30 border-gray-700 hover:border-gray-600'}`}>
            <div className="flex items-center justify-between mb-3">
                 <div className="flex items-center gap-2">
                    <Globe size={16} className={currentMode === 'public' ? "text-blue-400" : "text-gray-500"} />
                    <label className="text-sm font-medium text-gray-200">Public Key</label>
                 </div>
                 {currentMode === 'public' && <span className="text-[10px] bg-blue-900/50 text-blue-200 px-2 py-0.5 rounded-full border border-blue-800">Active</span>}
            </div>
            
            <p className="text-xs text-gray-400 mb-3">
                Use the shared API key provided by the server. Ideal for testing.
            </p>
            
            <button 
               onClick={() => {
                   onSetPublicMode();
                   if(!isForced) onClose();
               }}
               className="w-full bg-gray-800 hover:bg-blue-900/20 border border-gray-600 hover:border-blue-500/50 text-gray-200 hover:text-blue-100 font-medium py-2 px-4 rounded-md text-xs sm:text-sm transition-all"
            >
                Use Public Key
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApiConfigurationModal;
