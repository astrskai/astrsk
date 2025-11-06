declare const __APP_VERSION__: string;

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

interface DumpMetadata {
  database: string;
  assets: string[];
}

interface Window {
  electron?: {
    process: {
      platform: string;
    };
  };
  api?: {
    updater?: {
      checkForUpdates: () => Promise<UpdateCheckResult | null>;
      quitAndInstall: (
        isSilent?: boolean,
        isForceRunAfter?: boolean,
      ) => Promise<void>;
      downloadUpdate: (
        cancellationToken?: CancellationToken,
      ) => Promise<Array<string>>;
      relaunch: () => Promise<void>;
      onError: (callback: (error: Error, message?: string) => void) => void;
      onUpdateAvailable: (callback: (info: UpdateInfo) => void) => void;
      onDownloadProgress: (callback: (info: ProgressInfo) => void) => void;
      onUpdateDownloaded: (
        callback: (event: UpdateDownloadedEvent) => void,
      ) => void;
    };
    topBar?: {
      windowMinimize: () => Promise<void>;
      windowMaximize: () => Promise<void>;
      windowUnmaximize: () => Promise<void>;
      windowClose: () => Promise<void>;
      newWindow: () => Promise<void>;
      onWindowMaximized: (callback: () => void) => void;
      onWindowUnmaximized: (callback: () => void) => void;
    };
    dump?: {
      getMetadata: () => Promise<DumpMetadata | null>;
      getDump: (dumpPath: string) => Promise<string | null>;
      setDump: (dumpPath: string, dumpContent: string) => Promise<void>;
      deleteDump: (dumpPath: string) => Promise<void>;
    };
    debug?: {
      openDevTools: () => Promise<void>;
    };
    config?: {
      getConfig: (key: string) => Promise<any>;
      setConfig: (key: string, value: any) => Promise<void>;
    };
    httpProxy?: {
      fetch: (options: {
        url: string;
        method: string;
        headers?: Record<string, string>;
        body?: any;
        timeout?: number;
      }) => Promise<{
        status: number;
        statusText: string;
        data: any;
        headers: Record<string, string>;
      }>;

      // Streaming API
      streamStart: (options: {
        streamId: string;
        url: string;
        method: string;
        headers?: Record<string, string>;
        body?: any;
        timeout?: number;
      }) => void;

      streamAbort: (streamId: string) => void;

      onStreamChunk: (callback: (data: {
        streamId: string;
        chunk: string;
        headers: Record<string, string>;
        status: number;
        statusText: string;
      }) => void) => void;

      onStreamEnd: (callback: (data: { streamId: string }) => void) => void;

      onStreamError: (callback: (data: { streamId: string; error: string }) => void) => void;

      removeStreamListeners: () => void;
    };
  };
}
