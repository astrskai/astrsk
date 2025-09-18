/**
 * Global polling manager to handle video generation polling across component lifecycles
 */
class PollingManager {
  private static instance: PollingManager;
  private activePolling: Map<string, NodeJS.Timeout> = new Map();
  private pollingCallbacks: Map<string, () => Promise<any>> = new Map();

  private constructor() {}

  static getInstance(): PollingManager {
    if (!PollingManager.instance) {
      PollingManager.instance = new PollingManager();
    }
    return PollingManager.instance;
  }

  isPolling(taskId: string): boolean {
    return this.activePolling.has(taskId);
  }

  startPolling(
    taskId: string,
    callback: () => Promise<any>,
    intervalMs: number = 5000,
  ): void {
    // Don't start if already polling
    if (this.isPolling(taskId)) {
      console.log(
        `Polling already active for task ${taskId}, skipping duplicate`,
      );
      return;
    }

    console.log(`Starting polling for task ${taskId}`);

    // Store the callback for potential resumption
    this.pollingCallbacks.set(taskId, callback);

    // Start the polling interval
    const interval = setInterval(callback, intervalMs);
    this.activePolling.set(taskId, interval);
  }

  stopPolling(taskId: string): void {
    const interval = this.activePolling.get(taskId);
    if (interval) {
      console.log(`Stopping polling for task ${taskId}`);
      clearInterval(interval);
      this.activePolling.delete(taskId);
      this.pollingCallbacks.delete(taskId);
    }
  }

  stopAllPolling(): void {
    console.log(`Stopping all polling (${this.activePolling.size} active)`);
    this.activePolling.forEach((interval, taskId) => {
      clearInterval(interval);
    });
    this.activePolling.clear();
    this.pollingCallbacks.clear();
  }

  getActivePollingTasks(): string[] {
    return Array.from(this.activePolling.keys());
  }
}

export const pollingManager = PollingManager.getInstance();
