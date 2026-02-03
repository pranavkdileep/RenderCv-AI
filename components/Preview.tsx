"use client";
import React, { useState, useTransition } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import { renderSvgFromYaml } from "@/actions/renderSvg";

interface PreviewProps {
  yamlCode: string;
  onFixError?: (error: string) => void;
}

const Preview: React.FC<PreviewProps> = ({ yamlCode, onFixError }) => {
  const [svgs, setSvgs] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleRender = () => {
    setError(null);
    startTransition(async () => {
      const result = await renderSvgFromYaml(yamlCode);
      if (result.error) {
        setError(result.error);
        setSvgs([]);
        return;
      }
      setSvgs(result.svgs);
    });
  };

  const isRendering = isPending;

  return (
    <div className="h-full flex flex-col bg-gray-200 p-4 md:p-8">
      <div className="flex items-center justify-between mb-4 gap-2">
        
        <button
          type="button"
          onClick={handleRender}
          disabled={isRendering || !yamlCode.trim()}
          className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white shadow hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {isRendering && <Loader2 className="h-4 w-4 animate-spin" />}
          {isRendering ? "Rendering..." : "Render Preview"}
        </button>
      </div>

      {error && (
        <div className="mb-4 flex items-start gap-2 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          <AlertTriangle className="mt-0.5 h-4 w-4" />
          <div className="flex-1">
            <div>{error}</div>
            {error.includes("RenderCVValidationError") && onFixError && (
              <button
                type="button"
                onClick={() => onFixError(error)}
                className="mt-2 inline-flex items-center gap-1 rounded-md bg-purple-600 px-2.5 py-1 text-xs font-medium text-white shadow hover:bg-purple-700"
              >
                Fix with AI
              </button>
            )}
          </div>
        </div>
      )}

      {!svgs.length && !error && !isRendering && (
        <div className="flex-1 flex items-center justify-center">
          <div className="rounded-md border border-dashed border-gray-300 bg-white px-6 py-8 text-center text-sm text-gray-500 max-w-sm">
            Click "Render Preview" to generate your CV preview from the current YAML.
          </div>
        </div>
      )}

      {(svgs.length > 0 || isRendering) && (
        <div className="flex-1 overflow-y-auto flex justify-center">
          <div className="w-[210mm] min-h-[297mm] bg-white text-gray-900 shadow-2xl p-0 box-border flex flex-col gap-4">
            {isRendering && svgs.length === 0 && (
              <div className="flex-1 flex items-center justify-center text-sm text-gray-500">
                Rendering preview...
              </div>
            )}
            {svgs.map((svg, index) => (
              <div
                key={index}
                className="w-full min-h-[297mm] flex-shrink-0 flex items-stretch justify-stretch"
              >
                <div
                  className="w-full h-auto [&>svg]:w-full [&>svg]:h-auto [&>svg]:block"
                  aria-label={`Page ${index + 1}`}
                  dangerouslySetInnerHTML={{ __html: svg }}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Preview;
