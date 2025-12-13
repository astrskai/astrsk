/**
 * Evaluation Report Modal
 * Displays comprehensive agent message evaluation results
 */

import React, { useState } from 'react';
import type { EvaluationReport } from '../../../entities/evaluation/types/evaluation-report';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../../shared/ui/dialog';
import { ScrollArea } from '../../../shared/ui/scroll-area';
import { Badge } from '../../../shared/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../shared/ui/tabs';

interface EvaluationReportModalProps {
  report: EvaluationReport | null;
  isOpen: boolean;
  onClose: () => void;
}

export const EvaluationReportModal: React.FC<EvaluationReportModalProps> = ({
  report,
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState('overview');

  if (!report) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Agent Message Evaluation Report</span>
            <ScoreBadge score={report.overallScore} />
          </DialogTitle>
          <div className="text-sm text-muted-foreground">
            {report.agentName} • {report.modelName} • {new Date(report.timestamp).toLocaleString()}
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="behavior">Behavior</TabsTrigger>
            <TabsTrigger value="context">Context</TabsTrigger>
            <TabsTrigger value="state">State</TabsTrigger>
            <TabsTrigger value="prompt">Prompt</TabsTrigger>
          </TabsList>

          <ScrollArea className="flex-1 mt-4">
            <TabsContent value="overview" className="space-y-4 p-1">
              <OverviewTab report={report} />
            </TabsContent>

            <TabsContent value="behavior" className="space-y-4 p-1">
              <BehaviorTab analysis={report.behaviorAnalysis} />
            </TabsContent>

            <TabsContent value="context" className="space-y-4 p-1">
              <ContextTab analysis={report.contextAnalysis} />
            </TabsContent>

            <TabsContent value="state" className="space-y-4 p-1">
              <StateTab analysis={report.stateAnalysis} />
            </TabsContent>

            <TabsContent value="prompt" className="space-y-4 p-1">
              <PromptTab analysis={report.promptAnalysis} />
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

// ============================================================================
// Overview Tab
// ============================================================================

const OverviewTab: React.FC<{ report: EvaluationReport }> = ({ report }) => {
  return (
    <div className="space-y-6">
      {/* Overall Assessment */}
      <section>
        <h3 className="text-lg font-semibold mb-3">Overall Assessment</h3>
        <div className="flex items-center gap-4 mb-4">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Overall Score</span>
              <span className="text-sm font-bold">{report.overallScore}/100</span>
            </div>
            <div className="h-2 bg-secondary rounded-full overflow-hidden">
              <div
                className={`h-full transition-all ${getScoreColor(report.overallScore)}`}
                style={{ width: `${report.overallScore}%` }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Recommendations */}
      <section>
        <h3 className="text-lg font-semibold mb-3">Recommendations</h3>
        <div className="space-y-2">
          {report.recommendations.map((rec, idx) => (
            <div key={idx} className="flex items-start gap-2 p-3 bg-secondary rounded-lg">
              <div className="text-sm">{rec}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Issues Summary */}
      {report.issues.length > 0 && (
        <section>
          <h3 className="text-lg font-semibold mb-3">
            Issues Detected ({report.issues.length})
          </h3>
          <div className="space-y-3">
            {report.issues.map((issue, idx) => (
              <IssueCard key={idx} issue={issue} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

// ============================================================================
// Behavior Tab
// ============================================================================

const BehaviorTab: React.FC<{ analysis: EvaluationReport['behaviorAnalysis'] }> = ({ analysis }) => {
  return (
    <div className="space-y-6">
      {/* Response Type */}
      <section>
        <h3 className="text-lg font-semibold mb-3">Response Analysis</h3>
        <div className="grid grid-cols-2 gap-4">
          <MetricCard
            label="Response Type"
            value={<ResponseTypeBadge type={analysis.responseType} />}
          />
          <MetricCard
            label="Confidence"
            value={`${(analysis.confidence * 100).toFixed(0)}%`}
          />
          <MetricCard
            label="Token Count"
            value={analysis.tokenCount.toString()}
          />
          <MetricCard
            label="Coherence Score"
            value={`${(analysis.coherenceScore * 100).toFixed(0)}%`}
          />
        </div>
        <div className="mt-4 p-3 bg-secondary rounded-lg">
          <div className="text-sm font-medium mb-1">Reasoning</div>
          <div className="text-sm text-muted-foreground">{analysis.reasoning}</div>
        </div>
      </section>

      {/* Patterns Detected */}
      <section>
        <h3 className="text-lg font-semibold mb-3">Patterns Detected</h3>
        <div className="grid grid-cols-2 gap-3">
          <PatternItem
            label="Repetitive"
            detected={analysis.patterns.repetitive}
          />
          <PatternItem
            label="Out of Context"
            detected={analysis.patterns.outOfContext}
          />
          <PatternItem
            label="Contradictory"
            detected={analysis.patterns.contradictory}
          />
          <PatternItem
            label="Incomplete"
            detected={analysis.patterns.incomplete}
          />
        </div>
      </section>

      {/* Metrics */}
      <section>
        <h3 className="text-lg font-semibold mb-3">Text Metrics</h3>
        <div className="p-4 bg-secondary rounded-lg space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Average Sentence Length</span>
            <span className="font-medium">{analysis.averageSentenceLength.toFixed(0)} chars</span>
          </div>
        </div>
      </section>
    </div>
  );
};

// ============================================================================
// Context Tab
// ============================================================================

const ContextTab: React.FC<{ analysis: EvaluationReport['contextAnalysis'] }> = ({ analysis }) => {
  return (
    <div className="space-y-6">
      {/* Context Summary */}
      <section>
        <h3 className="text-lg font-semibold mb-3">Context Summary</h3>
        <div className="grid grid-cols-2 gap-4">
          <MetricCard
            label="History Turns Used"
            value={`${analysis.historyTurnsUsed} / ${analysis.historyTurnsAvailable}`}
          />
          <MetricCard
            label="Relevance Score"
            value={`${(analysis.relevanceScore * 100).toFixed(0)}%`}
          />
          <MetricCard
            label="Completeness Score"
            value={`${(analysis.completenessScore * 100).toFixed(0)}%`}
          />
          <MetricCard
            label="Context Overload"
            value={analysis.contextOverload ? 'Yes' : 'No'}
            variant={analysis.contextOverload ? 'warning' : 'success'}
          />
        </div>
      </section>

      {/* Context Availability */}
      <section>
        <h3 className="text-lg font-semibold mb-3">Context Availability</h3>
        <div className="grid grid-cols-2 gap-3">
          <PatternItem
            label="Character Info"
            detected={analysis.characterInfoPresent}
          />
          <PatternItem
            label="User Context"
            detected={analysis.userContextPresent}
          />
        </div>
      </section>

      {/* Missing Information */}
      {analysis.missingInformation.length > 0 && (
        <section>
          <h3 className="text-lg font-semibold mb-3">Missing Information</h3>
          <div className="space-y-3">
            {analysis.missingInformation.map((missing, idx) => (
              <div key={idx} className="p-3 bg-secondary rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{missing.type.replace(/_/g, ' ')}</span>
                  <ImpactBadge impact={missing.impact} />
                </div>
                <div className="text-sm text-muted-foreground">{missing.description}</div>
                <div className="text-xs text-muted-foreground">💡 {missing.suggestion}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Redundant Information */}
      {analysis.redundantInformation.length > 0 && (
        <section>
          <h3 className="text-lg font-semibold mb-3">Redundant Information</h3>
          <div className="space-y-3">
            {analysis.redundantInformation.map((redundant, idx) => (
              <div key={idx} className="p-3 bg-secondary rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{redundant.type.replace(/_/g, ' ')}</span>
                  <ImpactBadge impact={redundant.impact} />
                </div>
                <div className="text-sm text-muted-foreground">{redundant.description}</div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

// ============================================================================
// State Tab
// ============================================================================

const StateTab: React.FC<{ analysis: EvaluationReport['stateAnalysis'] }> = ({ analysis }) => {
  return (
    <div className="space-y-6">
      {/* State Summary */}
      <section>
        <h3 className="text-lg font-semibold mb-3">State Summary</h3>
        <div className="grid grid-cols-2 gap-4">
          <MetricCard
            label="Update Frequency"
            value={analysis.updateFrequency}
            variant={analysis.updateFrequency === 'excessive' ? 'warning' : 'default'}
          />
          <MetricCard
            label="Consistency Score"
            value={`${(analysis.stateConsistency * 100).toFixed(0)}%`}
          />
          <MetricCard
            label="Updates Count"
            value={analysis.dataStoreUpdates.length.toString()}
          />
          <MetricCard
            label="Double Counting"
            value={analysis.doubleCountingDetected ? 'Detected' : 'None'}
            variant={analysis.doubleCountingDetected ? 'error' : 'success'}
          />
        </div>
      </section>

      {/* DataStore Updates */}
      {analysis.dataStoreUpdates.length > 0 && (
        <section>
          <h3 className="text-lg font-semibold mb-3">DataStore Updates</h3>
          <div className="space-y-3">
            {analysis.dataStoreUpdates.map((update, idx) => (
              <div key={idx} className="p-3 bg-secondary rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{update.fieldName}</span>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {update.fieldType}
                    </Badge>
                    {update.isValid ? (
                      <Badge variant="success" className="text-xs">Valid</Badge>
                    ) : (
                      <Badge variant="destructive" className="text-xs">Invalid</Badge>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-muted-foreground">Previous: </span>
                    <span className="font-mono">{update.previousValue ?? 'null'}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">New: </span>
                    <span className="font-mono">{update.newValue}</span>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">{update.reasoning}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* State Issues */}
      {analysis.issues.length > 0 && (
        <section>
          <h3 className="text-lg font-semibold mb-3">State Issues</h3>
          <div className="space-y-3">
            {analysis.issues.map((issue, idx) => (
              <div key={idx} className="p-3 bg-secondary rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{issue.fieldName}</span>
                  <SeverityBadge severity={issue.severity} />
                </div>
                <div className="text-sm text-muted-foreground">{issue.description}</div>
                <div className="text-xs text-muted-foreground">💡 {issue.suggestion}</div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

// ============================================================================
// Prompt Tab
// ============================================================================

const PromptTab: React.FC<{ analysis: EvaluationReport['promptAnalysis'] }> = ({ analysis }) => {
  return (
    <div className="space-y-6">
      {/* Prompt Quality */}
      <section>
        <h3 className="text-lg font-semibold mb-3">Prompt Quality</h3>
        <div className="grid grid-cols-2 gap-4">
          <MetricCard
            label="Instruction Clarity"
            value={`${(analysis.instructionClarity * 100).toFixed(0)}%`}
          />
          <MetricCard
            label="Specificity Score"
            value={`${(analysis.specificityScore * 100).toFixed(0)}%`}
          />
          <MetricCard
            label="Consistency Score"
            value={`${(analysis.consistencyScore * 100).toFixed(0)}%`}
          />
          <MetricCard
            label="Example Count"
            value={analysis.exampleCount.toString()}
          />
        </div>
      </section>

      {/* Prompt Structure */}
      <section>
        <h3 className="text-lg font-semibold mb-3">Prompt Structure</h3>
        <div className="grid grid-cols-2 gap-3">
          <PatternItem
            label="System Message Present"
            detected={analysis.systemMessagePresent}
          />
        </div>
      </section>

      {/* Contradictions */}
      {analysis.contradictions.length > 0 && (
        <section>
          <h3 className="text-lg font-semibold mb-3">Contradictions</h3>
          <div className="space-y-3">
            {analysis.contradictions.map((contradiction, idx) => (
              <div key={idx} className="p-3 bg-secondary rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Contradiction {idx + 1}</span>
                  <SeverityBadge severity={contradiction.severity} />
                </div>
                <div className="text-sm text-muted-foreground">{contradiction.description}</div>
                <div className="text-xs text-muted-foreground">💡 {contradiction.suggestion}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Ambiguities */}
      {analysis.ambiguities.length > 0 && (
        <section>
          <h3 className="text-lg font-semibold mb-3">Ambiguities</h3>
          <div className="space-y-3">
            {analysis.ambiguities.map((ambiguity, idx) => (
              <div key={idx} className="p-3 bg-secondary rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Ambiguity {idx + 1}</span>
                  <ImpactBadge impact={ambiguity.impact} />
                </div>
                <div className="text-sm text-muted-foreground">{ambiguity.description}</div>
                <div className="text-xs text-muted-foreground">💡 {ambiguity.suggestion}</div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

// ============================================================================
// Reusable Components
// ============================================================================

const IssueCard: React.FC<{ issue: EvaluationReport['issues'][0] }> = ({ issue }) => {
  return (
    <div className="p-4 bg-secondary rounded-lg space-y-2">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium">{issue.title}</span>
            <CategoryBadge category={issue.category} />
          </div>
          <div className="text-sm text-muted-foreground">{issue.description}</div>
        </div>
        <SeverityBadge severity={issue.severity} />
      </div>
      <div className="text-xs text-muted-foreground">
        <strong>Evidence:</strong> {issue.evidence}
      </div>
      <div className="text-xs text-muted-foreground">
        💡 <strong>Suggestion:</strong> {issue.suggestion}
      </div>
    </div>
  );
};

const MetricCard: React.FC<{
  label: string;
  value: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error';
}> = ({ label, value, variant = 'default' }) => {
  const colors = {
    default: 'bg-secondary',
    success: 'bg-green-500/10 border border-green-500/20',
    warning: 'bg-yellow-500/10 border border-yellow-500/20',
    error: 'bg-red-500/10 border border-red-500/20',
  };

  return (
    <div className={`p-3 rounded-lg ${colors[variant]}`}>
      <div className="text-xs text-muted-foreground mb-1">{label}</div>
      <div className="text-sm font-semibold">{value}</div>
    </div>
  );
};

const PatternItem: React.FC<{ label: string; detected: boolean }> = ({ label, detected }) => {
  return (
    <div className="flex items-center justify-between p-3 bg-secondary rounded-lg">
      <span className="text-sm">{label}</span>
      {detected ? (
        <Badge variant="destructive" className="text-xs">Detected</Badge>
      ) : (
        <Badge variant="success" className="text-xs">Clear</Badge>
      )}
    </div>
  );
};

// ============================================================================
// Badge Components
// ============================================================================

const ScoreBadge: React.FC<{ score: number }> = ({ score }) => {
  const getVariant = (score: number): 'success' | 'warning' | 'destructive' => {
    if (score >= 80) return 'success';
    if (score >= 60) return 'warning';
    return 'destructive';
  };

  return (
    <Badge variant={getVariant(score)} className="text-lg px-3 py-1">
      {score.toFixed(0)}/100
    </Badge>
  );
};

const ResponseTypeBadge: React.FC<{ type: 'normal' | 'hallucination' | 'refusal' | 'incomplete' }> = ({ type }) => {
  const variants = {
    normal: 'success',
    hallucination: 'destructive',
    refusal: 'warning',
    incomplete: 'warning',
  } as const;

  return (
    <Badge variant={variants[type]}>
      {type.charAt(0).toUpperCase() + type.slice(1)}
    </Badge>
  );
};

const SeverityBadge: React.FC<{ severity: 'low' | 'medium' | 'high' | 'critical' }> = ({ severity }) => {
  const variants = {
    low: 'secondary',
    medium: 'warning',
    high: 'destructive',
    critical: 'destructive',
  } as const;

  return (
    <Badge variant={variants[severity]}>
      {severity.charAt(0).toUpperCase() + severity.slice(1)}
    </Badge>
  );
};

const ImpactBadge: React.FC<{ impact: 'low' | 'medium' | 'high' }> = ({ impact }) => {
  const variants = {
    low: 'secondary',
    medium: 'warning',
    high: 'destructive',
  } as const;

  return (
    <Badge variant={variants[impact]} className="text-xs">
      {impact.charAt(0).toUpperCase() + impact.slice(1)} Impact
    </Badge>
  );
};

const CategoryBadge: React.FC<{ category: 'behavior' | 'context' | 'state' | 'prompt' }> = ({ category }) => {
  return (
    <Badge variant="outline" className="text-xs">
      {category}
    </Badge>
  );
};

// ============================================================================
// Helper Functions
// ============================================================================

function getScoreColor(score: number): string {
  if (score >= 80) return 'bg-green-500';
  if (score >= 60) return 'bg-yellow-500';
  return 'bg-red-500';
}
