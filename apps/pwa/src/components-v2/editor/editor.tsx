import { useCallback, useEffect, useRef } from "react";
import { Editor as MonacoEditor } from "@monaco-editor/react";
import type { editor } from "monaco-editor";
import { useTheme } from "@/components-v2/theme-provider";
import { Maximize2, Minimize2 } from "lucide-react";
import { cn } from "@/components-v2/lib/utils";

interface EditorProps {
  value: string;
  onChange?: (
    value: string | undefined,
    ev?: editor.IModelContentChangedEvent,
  ) => void;
  language?: string;
  height?: string | number;
  width?: string | number;
  className?: string;
  containerClassName?: string;
  expandable?: boolean;
  isExpanded?: boolean;
  onExpandToggle?: (expanded: boolean) => void;
  onMount?: (
    editor: editor.IStandaloneCodeEditor,
    monaco: typeof import("monaco-editor"),
  ) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  options?: editor.IStandaloneEditorConstructionOptions;
  defaultOptions?: boolean;
  padding?: {
    top?: number;
    right?: number;
    bottom?: number;
    left?: number;
  };
}

// Default editor options for consistency
const DEFAULT_EDITOR_OPTIONS: editor.IStandaloneEditorConstructionOptions = {
  minimap: { enabled: false },
  overviewRulerLanes: 0, // Disable overview ruler
  hideCursorInOverviewRuler: true,
  fontSize: 12,
  fontFamily: "Inter, monospace",
  wordWrap: "bounded", // Better than "on" - wraps at min(viewport, wordWrapColumn)
  wordWrapColumn: 120, // Set specific column limit to prevent excessive right space
  wrappingIndent: "none", // Minimize wrap indentation
  wrappingStrategy: "advanced", // Better wrap algorithm
  scrollBeyondLastColumn: 0, // Disable extra horizontal scrolling
  lineNumbers: "off",
  scrollBeyondLastLine: false,
  padding: { top: 2, bottom: 2 },
  glyphMargin: false,
  folding: false,
  lineDecorationsWidth: 0,
  lineNumbersMinChars: 0,
  stickyScroll: { enabled: false },
  automaticLayout: true,
  scrollbar: {
    vertical: "auto",
    horizontal: "hidden",
    verticalScrollbarSize: 10,
    horizontalScrollbarSize: 10,
    useShadows: false,
    verticalHasArrows: false,
    horizontalHasArrows: false,
  },
};

export function Editor({
  value,
  onChange,
  language = "markdown",
  height = "100%",
  width = "100%",
  className,
  containerClassName,
  expandable = false,
  isExpanded = false,
  onExpandToggle,
  onMount,
  onFocus,
  onBlur,
  options = {},
  defaultOptions = true,
  padding = { top: 2, right: 2, bottom: 2, left: 2 },
}: EditorProps) {
  const { theme } = useTheme();
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<typeof import("monaco-editor") | null>(null);

  // Theme names
  const darkTheme = "astrsk-dark";
  const lightTheme = "astrsk-light";
  const currentTheme = theme === "dark" ? darkTheme : lightTheme;

  // Define themes before mount
  const defineThemes = useCallback(
    (monaco: typeof import("monaco-editor")) => {
      // Dark theme with transparent background
      monaco.editor.defineTheme(darkTheme, {
        base: "vs-dark",
        inherit: true,
        rules: [],
        colors: {
          "editor.background": "#00000000", // Transparent
        },
      });

      // Light theme with transparent background
      monaco.editor.defineTheme(lightTheme, {
        base: "vs",
        inherit: true,
        rules: [],
        colors: {
          "editor.background": "#00000000", // Transparent
        },
      });
    },
    [darkTheme, lightTheme],
  );

  // Handle before mount
  const handleBeforeMount = useCallback(
    (monaco: typeof import("monaco-editor")) => {
      monacoRef.current = monaco;
      defineThemes(monaco);
    },
    [defineThemes],
  );

  // Handle mount
  const handleMount = useCallback(
    (
      editor: editor.IStandaloneCodeEditor,
      monaco: typeof import("monaco-editor"),
    ) => {
      editorRef.current = editor;
      monacoRef.current = monaco;

      // Force set theme after mount
      monaco.editor.setTheme(currentTheme);

      // Call custom onMount if provided
      if (onMount) {
        onMount(editor, monaco);
      }
    },
    [currentTheme, onMount],
  );

  // Update theme when it changes
  useEffect(() => {
    if (monacoRef.current && editorRef.current) {
      monacoRef.current.editor.setTheme(currentTheme);
    }
  }, [currentTheme]);

  // Handle expand toggle
  const handleExpandToggle = useCallback(() => {
    if (onExpandToggle) {
      onExpandToggle(!isExpanded);
    }
  }, [isExpanded, onExpandToggle]);

  // Merge options with defaults
  const mergedOptions = defaultOptions
    ? { ...DEFAULT_EDITOR_OPTIONS, ...options }
    : options;

  // Build container padding classes
  const paddingClasses = cn(
    padding.top === 0
      ? "pt-0"
      : padding.top === 1
        ? "pt-1"
        : padding.top === 2
          ? "pt-2"
          : padding.top === 3
            ? "pt-3"
            : padding.top === 4
              ? "pt-4"
              : "",
    padding.right === 0
      ? "pr-0"
      : padding.right === 1
        ? "pr-1"
        : padding.right === 2
          ? "pr-2"
          : padding.right === 3
            ? "pr-3"
            : padding.right === 4
              ? "pr-4"
              : "",
    padding.bottom === 0
      ? "pb-0"
      : padding.bottom === 1
        ? "pb-1"
        : padding.bottom === 2
          ? "pb-2"
          : padding.bottom === 3
            ? "pb-3"
            : padding.bottom === 4
              ? "pb-4"
              : "",
    padding.left === 0
      ? "pl-0"
      : padding.left === 1
        ? "pl-1"
        : padding.left === 2
          ? "pl-2"
          : padding.left === 3
            ? "pl-3"
            : padding.left === 4
              ? "pl-4"
              : "",
  );

  return (
    <div
      className={cn(
        "w-full h-full bg-background-surface-0 rounded-md outline-1 outline-offset-[-1px] outline-border-normal relative",
        containerClassName,
      )}
      onFocus={onFocus}
      onBlur={onBlur}
      tabIndex={-1}
    >
      {expandable && (
        <button
          onClick={handleExpandToggle}
          className="absolute top-2 right-2 z-10 w-6 h-6 rounded-sm hover:bg-background-surface-1 flex items-center justify-center transition-colors"
          aria-label={isExpanded ? "Minimize editor" : "Maximize editor"}
        >
          {isExpanded ? (
            <Minimize2 className="w-4 h-4 text-text-subtle" />
          ) : (
            <Maximize2 className="w-4 h-4 text-text-subtle" />
          )}
        </button>
      )}
      <div className={cn("w-full h-full", paddingClasses, className)}>
        <MonacoEditor
          height={height}
          width={width}
          language={language}
          value={value}
          theme={currentTheme}
          beforeMount={handleBeforeMount}
          onMount={handleMount}
          onChange={onChange}
          options={mergedOptions}
        />
      </div>
    </div>
  );
}
