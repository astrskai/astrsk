/**
 * [CLEANUP-TODO] UNUSED COMPONENT
 * Last checked: 2025-10-22
 * Usage: None (except stories)
 * Action: Review for deletion
 */

import MonacoEditor, {
  EditorProps,
  loader,
  OnMount,
} from "@monaco-editor/react";
import { merge } from "lodash-es";
import type { editor } from "monaco-editor";
import { useEffect, useRef } from "react";

import { variableList } from "@/shared/prompt/domain/variable";
import { cn } from "@/shared/utils";

import { Banner } from "@/components/ui/banner";

// Only configure Monaco in browser environment
if (typeof window !== "undefined") {
  // Add variables to suggestions and define custom syntax highlighting
  loader.init().then((monaco) => {
    // Register completion item provider for liquid
    monaco.languages.registerCompletionItemProvider("liquid", {
      provideCompletionItems(model, position, context, token) {
        const word = model.getWordUntilPosition(position);
        const range = {
          startLineNumber: position.lineNumber,
          endLineNumber: position.lineNumber,
          startColumn: word.startColumn,
          endColumn: word.endColumn,
        };
        const suggestions = variableList.map((variable) => ({
          label: variable.variable,
          kind: monaco.languages.CompletionItemKind.Variable,
          detail: `${variable.variable}: ${variable.dataType}`,
          documentation: variable.template
            ? {
                value: `${variable.description}\n<br /><br />Example:\n\`\`\`\n${variable.template}\n\`\`\``,
                supportHtml: true,
              }
            : variable.description,
          insertText: variable.variable,
          range: range,
        }));
        return {
          suggestions: suggestions,
        };
      },
    });

    // Define custom highlighting rules for special text
    monaco.languages.setMonarchTokensProvider("liquid", {
      tokenizer: {
        root: [
          // Rule to detect "<<<History Message>>>" and tokenize it
          [/<<<History Message>>>/g, "historyMessage"],
          [
            /<<<History Message With Character Name>>>/g,
            "historyMessageWithName",
          ],
          [/ADD HERE/g, "addHere"],
          // Default rule to handle other content
          [/./, "text"],
        ],
      },
    });

    // Register a theme rule for the historyMessage token
    monaco.editor.defineTheme("astrsk-theme-light", {
      base: "vs",
      inherit: true,
      rules: [
        { token: "historyMessage", foreground: "0000ff" }, // Blue color in hex
        {
          token: "historyMessageWithName",
          foreground: "0000ff",
          // fontStyle: "bold",
        }, // Blue color in hex
        { token: "addHere", foreground: "32D5CB" }, // Blue color in hex
      ],
      colors: {},
    });

    monaco.editor.defineTheme("astrsk-theme-dark", {
      base: "vs-dark",
      inherit: true,
      rules: [
        { token: "historyMessage", foreground: "68c5f6" }, // Light blue for dark theme
        {
          token: "historyMessageWithName",
          foreground: "68c5f6",
          // fontStyle: "bold",
        }, // Light blue for dark theme
        { token: "addHere", foreground: "32D5CB" }, // Blue color in hex
      ],
      colors: {},
    });
  });
}

const defaultOptions: EditorProps["options"] = {
  minimap: {
    enabled: false,
  },
  scrollbar: {
    vertical: "visible",
    horizontal: "visible",
  },
  lineNumbers: "on",
  wordWrap: "bounded", // Better than "on" - wraps at min(viewport, wordWrapColumn)
  wordWrapColumn: 120, // Set specific column limit to prevent excessive right space
  wrappingIndent: "none", // Minimize wrap indentation
  wrappingStrategy: "advanced", // Better wrap algorithm
  scrollBeyondLastColumn: 0, // Disable extra horizontal scrolling
  fontSize: 12,
  lineHeight: 18,
  overviewRulerBorder: false,
  overviewRulerLanes: 0,
  scrollBeyondLastLine: false,
};

const CodeEditor = ({
  defaultLanguage = "liquid",
  className,
  options,
  defaultValue,
  value,
  onChange,
  onMount,
  errorLines = [],
}: {
  defaultLanguage?: string;
  options?: EditorProps["options"];
  defaultValue?: string;
  value?: string;
  onChange?: (value: string) => void;
  onMount?: OnMount;
  className?: string;
  errorLines?: { error: string; line: number }[];
}) => {
  const mergedOptions = merge({}, defaultOptions, options);
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<any>(null);

  // // Set up WebAssembly loader for minijinja
  // useWasmLoader();

  // Handle editor mount
  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    // Call the original onMount if provided
    if (onMount) {
      onMount(editor, monaco);
    }
  };

  // Update markers when errors change
  useEffect(() => {
    if (editorRef.current && monacoRef.current) {
      if (!errorLines || errorLines.length === 0) {
        const model = editorRef.current.getModel();
        if (model) {
          // Clear existing markers
          monacoRef.current.editor.setModelMarkers(model, "errors", []);
        }
      } else {
        const model = editorRef.current.getModel();
        if (model) {
          // Clear existing markers
          monacoRef.current.editor.setModelMarkers(model, "errors", []);
          // Add new markers
          const markers = errorLines.map((errorLine) => ({
            startLineNumber: errorLine.line,
            startColumn: 1,
            endLineNumber: errorLine.line,
            endColumn: 100,
            message: errorLine.error,
            severity: monacoRef.current.MarkerSeverity.Error,
          }));

          monacoRef.current.editor.setModelMarkers(model, "errors", markers);
        }
      }
    }
  }, [errorLines]);

  return (
    <div className={cn("h-full", className)}>
      {errorLines.map(
        (errorLine) =>
          errorLine.line === -1 && (
            <Banner
              key={errorLine.line}
              title="Failed to parse template"
              description={errorLine.error}
              className="rounded-none"
            />
          ),
      )}
      <MonacoEditor
        defaultLanguage={defaultLanguage}
        defaultValue={defaultValue}
        theme="astrsk-theme-dark"
        // theme={theme === "dark" ? "astrsk-theme-dark" : "astrsk-theme-light"}
        options={mergedOptions}
        value={value}
        onChange={(newValue) => {
          onChange && onChange(newValue ?? "");
        }}
        onMount={handleEditorDidMount}
        className={cn(
          errorLines.map(
            (errorLine) => errorLine.line === -1 && "h-[calc(100%-48px)]",
          ),
        )}
      />
    </div>
  );
};

export { CodeEditor };
