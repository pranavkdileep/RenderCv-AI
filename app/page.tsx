"use client";
import { generateResumeYAML, editResumeYAML } from "@/actions/geminiServices";
import { renderPdfFromYaml } from "@/actions/renderPdf";
import AIPrompt from "@/components/AIPrompt";
import Editor from "@/components/Editor";
import Preview from "@/components/Preview";
import ApiConfigurationModal from "@/components/ApiConfigurationModal";
import { ViewMode } from "@/types";
import { Check, Code, Copy, Download, FileText, KeyRound, XCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import GalaxyAILoader from "@/components/ui/GalaxyAILoader";

const INITIAL_YAML = `cv:
  name: Your Name
  location: City, Country
  email: your.email@example.com
  phone: "+91 9544047655"
  sections:
    summary:
      - Experienced professional with a passion for building great products.
    experience:
      - company: Example Corp
        position: Software Engineer
        start_date: '2020-01'
        end_date: present
        location: Remote
        highlights:
          - Developed a high-performance web application.
          - Improved system reliability by 99.9%.
    education:
      - institution: University of Technology
        area: Computer Science
        degree: BS
        start_date: '2016-09'
        end_date: '2020-05'
        location: City, State
        highlights:
          - Graduated with Honors
design:
  theme: classic
`;

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "RenderCV AI Resume Builder",
  description:
    "AI-powered resume builder that generates RenderCV-compatible YAML and professional PDF resumes.",
  url: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Any",
  creator: {
    "@type": "Organization",
    name: "KtuCyber",
  },
};

export default function Home() {
  const [yamlCode, setYamlCode] = useState(INITIAL_YAML);
  const [viewMode, setViewMode] = useState<ViewMode>("preview");
  const [isGenerating, setIsGenerating] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [hasGeneratedYaml, setHasGeneratedYaml] = useState(false);

  type ApiMode = "user" | "public" | null;

  const [apiMode, setApiMode] = useState<ApiMode>(null);
  const [userApiKey, setUserApiKey] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [showApiPrompt, setShowApiPrompt] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [aiFixPrompt, setAiFixPrompt] = useState<string | undefined>(undefined);

  const editorInstanceRef = useRef<any | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const storedMode = (window.localStorage.getItem("geminiKeyMode") as ApiMode | null) || null;
    const storedUserKey = window.localStorage.getItem("geminiUserApiKey");
    const storedYaml = window.sessionStorage.getItem("resumeYaml");
    const storedChanged = window.sessionStorage.getItem("yamlChanged");

    if (storedMode) {
      setApiMode(storedMode);
    }
    if (storedUserKey) {
      setUserApiKey(storedUserKey);
    }
    if (storedYaml) {
      setYamlCode(storedYaml);
    }
    if (storedChanged === "true") {
      setHasGeneratedYaml(true);
    }
    
    setIsInitialized(true);
  }, []);

  useEffect(() => {
    if (!isInitialized) return;
    const needsConfig = !apiMode || (apiMode === "user" && !userApiKey);
    if (needsConfig) {
       // logic can stay here if desired, but user interaction flow is preferred
    }
  }, [apiMode, userApiKey, isInitialized]);
  
  const handleSaveUserKey = (key: string) => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("geminiUserApiKey", key);
      window.localStorage.setItem("geminiKeyMode", "user");
    }
    setUserApiKey(key);
    setApiMode("user");
    setShowApiPrompt(false);
    setIsSettingsOpen(false);
  };

  const handleDeleteUserKey = () => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("geminiUserApiKey");
      if (apiMode === "user") {
        window.localStorage.removeItem("geminiKeyMode");
      }
    }
    setUserApiKey(null);
    if (apiMode === "user") {
      setApiMode(null);
    }
  };

  const handleSetPublicMode = () => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("geminiKeyMode", "public");
    }
    setApiMode("public");
    setShowApiPrompt(false);
    setIsSettingsOpen(false);
  };

  const handleClear = () => {
    setYamlCode(INITIAL_YAML);
    setHasGeneratedYaml(false);
    if (typeof window !== "undefined") {
      window.sessionStorage.removeItem("resumeYaml");
      window.sessionStorage.removeItem("yamlChanged");
    }
  };

  const handleGenerate = async (prompt: string) => {
    if (!apiMode || (apiMode === "user" && !userApiKey)) {
      setShowApiPrompt(true);
      return;
    }

    setIsGenerating(true);
    try {
      const options = {
        apiKey: apiMode === "user" ? userApiKey : null,
        usePublicKey: apiMode === "public",
      } as const;

      const newYaml = hasGeneratedYaml
        ? await editResumeYAML(prompt, yamlCode, options)
        : await generateResumeYAML(prompt, yamlCode, options);

      setYamlCode(newYaml);
      setHasGeneratedYaml(true);

      if (typeof window !== "undefined") {
        window.sessionStorage.setItem("resumeYaml", newYaml);
        window.sessionStorage.setItem("yamlChanged", "true");
      }
    } catch (error) {
      alert("Failed to generate content. Please try again."+error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = async () => {
    try {
      const result = await renderPdfFromYaml(yamlCode);

      if (result.error || !result.pdfBase64) {
        alert(result.error || "Failed to generate PDF.");
        return;
      }

      const byteCharacters = atob(result.pdfBase64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: "application/pdf" });

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `cv_${new Date().toISOString().slice(0, 10)}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("PDF download error", error);
      alert("Failed to download PDF. Please ensure the backend is running."+error);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(yamlCode);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const handleFixError = (error: string) => {
    const fixText = `fix ${error}`;
    setAiFixPrompt(fixText);
    setViewMode("editor");

    // Defer focus to ensure layout/view updates first
    setTimeout(() => {
      if (editorInstanceRef.current && typeof editorInstanceRef.current.focus === "function") {
        editorInstanceRef.current.focus();
      }
    }, 0);
  };

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ApiConfigurationModal
        isOpen={showApiPrompt || isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        isForced={showApiPrompt}
        currentMode={apiMode}
        currentUserKey={userApiKey}
        onSaveUserKey={handleSaveUserKey}
        onDeleteUserKey={handleDeleteUserKey}
        onSetPublicMode={handleSetPublicMode}
      />

      <nav className="h-16 border-b border-gray-800 bg-gray-950 flex items-center justify-between px-4 sm:px-6 shrink-0 z-30">
        <div className="flex items-center gap-3">
          <div className="bg-purple-600 p-2 rounded-lg">
            {/* <FileText size={20} className="text-white" /> */}
            <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-5 w-5 mr-0.5"
              >
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
              </svg>
          </div>
          <div className="hidden sm:block">
            <h1 className="font-bold text-lg leading-tight">RenderCV AI Builder By KtuCyber</h1>
            <p className="text-xs text-gray-400">Build RenderCV-compatible YAML And Export To PDF</p>
          </div>
          <div className="sm:hidden">
            <h1 className="font-bold text-base leading-tight">RenderCV AI</h1>
          </div>
        </div>
        
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => setIsSettingsOpen(true)}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs border rounded-md transition-colors ${
              apiMode ? "border-gray-700 bg-gray-800 hover:bg-gray-700" : "border-red-500/60 bg-gray-900 hover:bg-gray-800"
            }`}
          >
            <KeyRound size={14} className={apiMode ? "text-green-400" : "text-red-400"} />
            <span className="hidden sm:inline">
              {apiMode === "user" && userApiKey && "My Gemini Key"}
              {apiMode === "public" && "Public Key (resumebuilder)"}
              {!apiMode || (apiMode === "user" && !userApiKey) ? "Set Gemini Key" : null}
            </span>
            <span className="sm:hidden">
               {apiMode ? "Key Set" : "Set Key"}
            </span>
          </button>

          <button
             onClick={handleCopy}
             className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-md transition-colors"
             title="Copy YAML"
          >
            {copySuccess ? <Check size={14} className="text-green-400"/> : <Copy size={14} />}
            <span className="hidden sm:inline">{copySuccess ? "Copied" : "Copy"}</span>
          </button>

          <button
            onClick={handleClear}
            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-900 hover:bg-gray-800 border border-gray-700 rounded-md transition-colors"
            title="Clear YAML and start over"
          >
            <XCircle size={14} className="text-red-400" />
            <span className="hidden sm:inline">Clear</span>
          </button>
          
          <button 
            onClick={handleDownload}
            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors font-medium"
          >
            <Download size={14} />
            <span className="hidden sm:inline">Download</span>
          </button>
        </div>
      </nav>

      <div className="flex flex-1 overflow-hidden">
        <div className={`${viewMode === 'preview' ? 'hidden md:flex' : 'flex'} w-full md:w-1/2 lg:w-[45%] flex-col border-r border-gray-800 bg-[#1e1e1e]`}>
          <AIPrompt onGenerate={handleGenerate} isGenerating={isGenerating} prefillPrompt={aiFixPrompt} />
          
          <div className="flex items-center justify-between px-4 py-2 bg-[#252526] border-b border-gray-800">
             <span className="text-xs font-mono text-gray-400 flex items-center gap-2">
               <Code size={12} /> resume.yaml
             </span>
             <span className="text-[10px] text-gray-500 uppercase tracking-widest">Manual Edit</span>
          </div>

          <div className="flex-1 overflow-hidden relative group">
             <Editor 
                value={yamlCode} 
               onChange={(val) => setYamlCode(val || '')}
               onEditorMount={(instance) => {
                editorInstanceRef.current = instance;
               }}
             />
             {isGenerating && (
                <div className="absolute inset-0 bg-black/50 backdrop-blur-sm z-10 flex items-center justify-center flex-col gap-4">
                  {/* <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-purple-500"></div> */}
                  <GalaxyAILoader />
                  <p className="text-purple-300 font-medium animate-pulse">Generating Schema...</p>
                </div>
             )}
          </div>
        </div>

        <div className={`${viewMode === 'preview' ? 'flex' : 'hidden md:flex'} flex-col w-full md:w-1/2 lg:w-[55%] bg-gray-900`}>
          <div className="h-12 border-b border-gray-800 flex items-center justify-between px-4 bg-gray-950 shrink-0">
            <span className="font-semibold text-sm text-gray-300">Live Preview</span>
            <div className="flex bg-gray-800 rounded p-1">
               <span className="text-[10px] text-gray-500 px-2">PDF Render</span>
            </div>
          </div>
          <div className="flex-1 overflow-hidden p-0 sm:p-4 bg-gray-900/50">
             <Preview yamlCode={yamlCode} onFixError={handleFixError} />
          </div>
        </div>

        <div className="md:hidden absolute bottom-6 left-1/2 -translate-x-1/2 flex bg-gray-800 rounded-full shadow-2xl border border-gray-700 p-1 z-50">
          <button 
            onClick={() => setViewMode('editor')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${viewMode === 'editor' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'}`}
          >
            Editor
          </button>
          <button 
            onClick={() => setViewMode('preview')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${viewMode === 'preview' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'}`}
          >
            Preview
          </button>
        </div>

        {viewMode === 'preview' && (
          <div className="md:hidden absolute inset-0 top-16 bg-gray-900 z-40 p-4 overflow-y-auto">
             <Preview yamlCode={yamlCode} onFixError={handleFixError} />
          </div>
        )}
      </div>
    </div>
  );
}
