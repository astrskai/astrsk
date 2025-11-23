import { lazy, Suspense, useCallback, useEffect, useRef } from "react";
import type { editor } from "monaco-editor";
import { ErrorBoundary } from "react-error-boundary";
import { useTheme } from "@/app/providers/theme-provider";
import { Maximize2, Minimize2 } from "lucide-react";
import { cn } from "@/shared/lib";

// Lazy load Monaco Editor
const MonacoEditor = lazy(() =>
  import("@monaco-editor/react").then((module) => ({
    default: module.Editor,
  })),
);

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
  clearUndoOnValueChange?: boolean;
  isLoading?: boolean;
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
  clearUndoOnValueChange = false,
  isLoading = false,
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

      // Track focus state to prevent model disposal while editor is focused
      editor.onDidFocusEditorWidget(() => {
        isFocusedRef.current = true;
      });

      editor.onDidBlurEditorWidget(() => {
        isFocusedRef.current = false;
      });

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

  // Clear undo history when value changes externally (e.g., switching between message fields)
  const prevValueRef = useRef(value);
  const isUserTypingRef = useRef(false);
  const isFocusedRef = useRef(false);
  const lastDisposeTimeRef = useRef(0);

  useEffect(() => {
    // Add extra safety checks to prevent disposal during active use
    const now = Date.now();
    const timeSinceLastDispose = now - lastDisposeTimeRef.current;
    const hasRecentDispose = timeSinceLastDispose < 500; // Don't dispose within 500ms of last dispose

    if (
      clearUndoOnValueChange &&
      editorRef.current &&
      monacoRef.current &&
      value !== prevValueRef.current &&
      !isUserTypingRef.current &&
      !isFocusedRef.current &&
      !hasRecentDispose
    ) {
      const editor = editorRef.current;
      const monaco = monacoRef.current;
      const currentModel = editor.getModel();

      if (currentModel) {
        try {
          // Additional check: make sure editor is not busy with any operations
          if (
            editor.hasTextFocus() ||
            document.activeElement === editor.getDomNode()
          ) {
            // Editor is still active, don't dispose
            prevValueRef.current = value;
            return;
          }

          // Store current editor state
          const currentPosition = editor.getPosition();

          // Dispose the old model and create a new one to completely clear undo history
          const oldUri = currentModel.uri;
          currentModel.dispose();
          lastDisposeTimeRef.current = now;

          // Create a new model with the new content
          const newModel = monaco.editor.createModel(value, language, oldUri);

          // Set the new model on the editor
          editor.setModel(newModel);

          // Re-establish the onChange handler for the new model
          if (onChange) {
            newModel.onDidChangeContent((e) => {
              isUserTypingRef.current = true;
              const newValue = newModel.getValue();
              onChange(newValue, e);
              // Reset the flag after a short delay to allow for the next external change
              setTimeout(() => {
                isUserTypingRef.current = false;
              }, 150);
            });
          }

          // Restore cursor position if possible
          if (currentPosition && value.length >= currentPosition.lineNumber) {
            editor.setPosition(currentPosition);
          }
        } catch (error) {
          // Silently handle disposal errors to prevent console spam
          // Fall back to just updating the value without clearing undo
          try {
            const currentModel = editor.getModel();
            if (currentModel && currentModel.getValue() !== value) {
              currentModel.setValue(value);
            }
          } catch (fallbackError) {
            // Even fallback failed, just ignore to prevent further errors
          }
        }
      }
    }
    prevValueRef.current = value;
  }, [value, clearUndoOnValueChange, language, onChange]);

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
        "bg-background-surface-0 outline-border-normal relative h-full w-full rounded-md outline-1 outline-offset-[-1px]",
        containerClassName,
      )}
      onFocus={onFocus}
      onBlur={onBlur}
      tabIndex={-1}
    >
      {expandable && (
        <button
          onClick={handleExpandToggle}
          className="hover:bg-background-surface-1 absolute top-2 right-2 z-10 flex h-6 w-6 items-center justify-center rounded-sm transition-colors"
          aria-label={isExpanded ? "Minimize editor" : "Maximize editor"}
        >
          {isExpanded ? (
            <Minimize2 className="text-text-subtle h-4 w-4" />
          ) : (
            <Maximize2 className="text-text-subtle h-4 w-4" />
          )}
        </button>
      )}
      <div className={cn("relative h-full w-full", paddingClasses, className)}>
        <ErrorBoundary
          fallback={
            <div className="bg-background-surface-0 flex h-full w-full items-center justify-center">
              <div className="bg-background-surface-2 flex flex-col items-center gap-2 rounded-md px-4 py-3 shadow-sm">
                <p className="text-text-subtle text-sm">Failed to load editor</p>
                <button
                  onClick={() => window.location.reload()}
                  className="text-text-primary text-xs underline hover:no-underline"
                >
                  Reload page
                </button>
              </div>
            </div>
          }
          onError={(error, errorInfo) => {
            console.error("Monaco Editor loading failed:", error, errorInfo);
          }}
        >
          <Suspense
            fallback={
              <div className="bg-background-surface-0 flex h-full w-full items-center justify-center">
                <div className="bg-background-surface-2 flex items-center gap-2 rounded-md px-3 py-2 shadow-sm">
                  <div className="border-border-normal border-t-text-primary h-4 w-4 animate-spin rounded-full border-2"></div>
                  <span className="text-text-subtle text-xs font-medium">
                    Loading editor...
                  </span>
                </div>
              </div>
            }
          >
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
          </Suspense>
        </ErrorBoundary>

        {/* Loading overlay */}
        {isLoading && (
          <div className="bg-background-surface-0/80 absolute inset-0 z-20 flex items-center justify-center backdrop-blur-sm">
            <div className="bg-background-surface-2 flex items-center gap-2 rounded-md px-3 py-2 shadow-sm">
              <div className="border-border-normal border-t-text-primary h-4 w-4 animate-spin rounded-full border-2"></div>
              <span className="text-text-subtle text-xs font-medium">
                Saving...
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
