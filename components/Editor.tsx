import React from 'react';
import Editor, { OnMount } from "@monaco-editor/react";

interface EditorProps {
  value: string;
  onChange: (value: string | undefined) => void;
  onEditorMount?: (editorInstance: any) => void;
}

const YamlEditor: React.FC<EditorProps> = ({ value, onChange, onEditorMount }) => {
  const handleEditorDidMount: OnMount = (editor, monaco) => {
    // Optional: Add custom schema validation here if needed in the future
    monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
      validate: true,
      schemas: []
    });

    if (onEditorMount) {
      onEditorMount(editor);
    }
  };

  return (
    <div className="h-full w-full rounded-lg overflow-hidden border border-gray-700 shadow-inner bg-[#1e1e1e]">
      <Editor
        height="100%"
        defaultLanguage="yaml"
        value={value}
        theme="vs-dark"
        onChange={onChange}
        onMount={handleEditorDidMount}
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          fontFamily: "'JetBrains Mono', monospace",
          scrollBeyondLastLine: false,
          wordWrap: 'on',
          padding: { top: 16, bottom: 16 },
          renderLineHighlight: 'all',
        }}
      />
    </div>
  );
};

export default YamlEditor;
