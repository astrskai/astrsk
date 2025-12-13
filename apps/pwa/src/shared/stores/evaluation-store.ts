/**
 * Evaluation Store
 * Manages evaluation state and reports for agent messages
 */

import { create } from 'zustand';
import type { EvaluationReport } from '../../entities/evaluation/types/evaluation-report';

interface EvaluationState {
  // Current evaluation
  isEvaluating: boolean;
  currentMessageId: string | null;
  currentReport: EvaluationReport | null;

  // Report history (keyed by message ID)
  reports: Map<string, EvaluationReport>;

  // UI state
  isReportModalOpen: boolean;

  // Actions
  startEvaluation: (messageId: string) => void;
  setReport: (report: EvaluationReport) => void;
  finishEvaluation: () => void;
  openReportModal: (messageId: string) => void;
  closeReportModal: () => void;
  clearReport: (messageId: string) => void;
  clearAllReports: () => void;
}

export const useEvaluationStore = create<EvaluationState>((set, get) => ({
  // Initial state
  isEvaluating: false,
  currentMessageId: null,
  currentReport: null,
  reports: new Map(),
  isReportModalOpen: false,

  // Actions
  startEvaluation: (messageId) => {
    set({
      isEvaluating: true,
      currentMessageId: messageId,
      currentReport: null,
    });
  },

  setReport: (report) => {
    const { reports } = get();
    const newReports = new Map(reports);
    newReports.set(report.messageId, report);
    set({
      currentReport: report,
      reports: newReports,
    });
  },

  finishEvaluation: () => {
    set({
      isEvaluating: false,
    });
  },

  openReportModal: (messageId) => {
    const { reports } = get();
    const report = reports.get(messageId);
    set({
      currentReport: report ?? null,
      isReportModalOpen: true,
    });
  },

  closeReportModal: () => {
    set({
      isReportModalOpen: false,
    });
  },

  clearReport: (messageId) => {
    const { reports } = get();
    const newReports = new Map(reports);
    newReports.delete(messageId);
    set({ reports: newReports });
  },

  clearAllReports: () => {
    set({
      reports: new Map(),
      currentReport: null,
    });
  },
}));

// Zustand selectors for optimal re-rendering
useEvaluationStore.use = {
  isEvaluating: () => useEvaluationStore((state) => state.isEvaluating),
  currentReport: () => useEvaluationStore((state) => state.currentReport),
  isReportModalOpen: () => useEvaluationStore((state) => state.isReportModalOpen),
  hasReport: (messageId: string) => useEvaluationStore((state) => state.reports.has(messageId)),
  getReport: (messageId: string) => useEvaluationStore((state) => state.reports.get(messageId)),
};
