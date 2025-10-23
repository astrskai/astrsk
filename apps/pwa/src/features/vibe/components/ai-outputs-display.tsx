import React from "react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  ScrollArea,
} from "@/shared/ui";
import { Brain, Cpu, AlertCircle, CheckCircle, Clock } from "lucide-react";
import { cn } from "@/shared/lib";
import type {
  VibeAnalysisResult,
  VibeGeneratorResult,
} from "vibe-shared-types";

// Using the properly typed interfaces from vibe-shared-types

interface AIOutputsDisplayProps {
  analysis?: VibeAnalysisResult;
  generatorResult?: VibeGeneratorResult;
  className?: string;
}

export const AIOutputsDisplay: React.FC<AIOutputsDisplayProps> = ({
  analysis,
  generatorResult,
  className,
}) => {
  if (!analysis && !generatorResult) {
    return null;
  }

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case "low":
        return "bg-green-100 text-green-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "high":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getRequestTypeLabel = (type: string) => {
    switch (type) {
      case "simple_answer":
        return "Simple Answer";
      case "simple_edit":
        return "Simple Edit";
      case "complex_transformation":
        return "Complex Transformation";
      case "content_creation":
        return "Content Creation";
      case "structure_modification":
        return "Structure Modification";
      default:
        return type;
    }
  };

  return (
    <ScrollArea className={cn("h-96 w-full", className)}>
      <div className="space-y-4 p-1">
        {analysis && (
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                <Brain className="min-h-4 min-w-4 text-blue-600" />
                AI Analysis Results
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="text-xs font-medium text-black">
                    Request Type
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {getRequestTypeLabel(analysis.requestType)}
                  </Badge>
                </div>
                <div className="space-y-2">
                  <div className="text-xs font-medium text-black">
                    Confidence
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {Math.round(analysis.confidence * 100)}%
                  </Badge>
                </div>
              </div>

              {analysis.requestAnalysis && (
                <div className="space-y-2">
                  <div className="text-xs font-medium text-black">
                    Request Analysis
                  </div>
                  <div className="space-y-2 rounded-md bg-white p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-black">Intent:</span>
                      <Badge variant="outline" className="text-xs">
                        {analysis.requestAnalysis.intent}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-black">Complexity:</span>
                      <Badge
                        className={cn(
                          "text-xs",
                          getComplexityColor(
                            analysis.requestAnalysis.complexity,
                          ),
                        )}
                      >
                        {analysis.requestAnalysis.complexity}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-black">
                        Target Resources:
                      </span>
                      <span className="font-mono text-xs text-black">
                        {analysis.requestAnalysis.targetResources.length}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {analysis.stepByStepPlan &&
                analysis.stepByStepPlan.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-xs font-medium text-black">
                      Planned Steps
                    </div>
                    <div className="space-y-2 rounded-md bg-white p-3">
                      {analysis.stepByStepPlan.map((step, index) => (
                        <div
                          key={index}
                          className="flex items-start gap-3 text-xs"
                        >
                          <Badge
                            variant="outline"
                            className="min-w-fit text-xs"
                          >
                            {step.step}
                          </Badge>
                          <div className="flex-1">
                            <div className="text-black">{step.description}</div>
                            <div className="mt-1 text-xs text-gray-600">
                              {step.changeType} • {step.estimatedComplexity}{" "}
                              complexity
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              {analysis.reasoning && (
                <div className="space-y-2">
                  <div className="text-xs font-medium text-black">
                    Analysis Reasoning
                  </div>
                  <div className="rounded-md bg-white p-3 text-xs text-black">
                    {analysis.reasoning}
                  </div>
                </div>
              )}

              {analysis.recommendations &&
                analysis.recommendations.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-xs font-medium text-black">
                      Recommendations
                    </div>
                    <div className="rounded-md bg-white p-3">
                      {analysis.recommendations.map((rec, index) => (
                        <div
                          key={index}
                          className="flex items-start gap-2 text-xs"
                        >
                          <CheckCircle className="mt-0.5 min-h-3 min-w-3 text-green-500" />
                          <span className="text-black">{rec}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
            </CardContent>
          </Card>
        )}

        {generatorResult && (
          <Card className="border-purple-200 bg-purple-50">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                <Cpu className="min-h-4 min-w-4 text-purple-600" />
                AI Generator Results
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="text-xs font-medium text-black">
                    Operations Generated
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {generatorResult.stepResults.length}
                  </Badge>
                </div>
                <div className="space-y-2">
                  <div className="text-xs font-medium text-black">
                    Confidence
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {Math.round(generatorResult.overallConfidence * 100)}%
                  </Badge>
                </div>
              </div>

              {generatorResult.overallReasoning && (
                <div className="space-y-2">
                  <div className="text-xs font-medium text-black">
                    Overall Reasoning
                  </div>
                  <div className="rounded-md bg-white p-3 text-xs text-black">
                    {generatorResult.overallReasoning}
                  </div>
                </div>
              )}

              {generatorResult.warnings &&
                generatorResult.warnings.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-xs font-medium text-black">
                      Warnings
                    </div>
                    <div className="rounded-md bg-white p-3">
                      {generatorResult.warnings.map((warning, index) => (
                        <div
                          key={index}
                          className="flex items-start gap-2 text-xs"
                        >
                          <AlertCircle className="mt-0.5 min-h-3 min-w-3 text-yellow-500" />
                          <span className="text-black">{warning}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              <div className="space-y-2">
                <div className="text-xs font-medium text-black">
                  Processing Metadata
                </div>
                <div className="space-y-2 rounded-md bg-white p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-black">Model Used:</span>
                    <Badge variant="outline" className="font-mono text-xs">
                      {generatorResult.metadata.modelUsed}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-black">Token Usage:</span>
                    <span className="font-mono text-xs text-black">
                      {generatorResult.metadata.tokenUsage.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-black">Processing Time:</span>
                    <span className="font-mono text-xs text-black">
                      <Clock className="mr-1 inline min-h-3 min-w-3" />
                      {new Date(
                        generatorResult.metadata.generationTime,
                      ).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              </div>

              {generatorResult.metadata.processingSteps &&
                generatorResult.metadata.processingSteps.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-xs font-medium text-black">
                      Processing Steps
                    </div>
                    <div className="space-y-1 rounded-md bg-white p-3">
                      {generatorResult.metadata.processingSteps.map(
                        (step, index) => (
                          <div
                            key={index}
                            className="flex items-center gap-2 text-xs"
                          >
                            <CheckCircle className="min-h-3 min-w-3 text-green-500" />
                            <span className="text-black">{step}</span>
                          </div>
                        ),
                      )}
                    </div>
                  </div>
                )}

              {generatorResult.stepResults.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs font-medium text-black">
                    Generated Step Results
                  </div>
                  <div className="space-y-2">
                    {generatorResult.stepResults.map((stepResult, index) => (
                      <div
                        key={index}
                        className="rounded-md border-l-2 border-blue-200 bg-white p-3"
                      >
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="text-xs">
                              Step {stepResult.step}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {Math.round(stepResult.confidence * 100)}%
                              confidence
                            </Badge>
                          </div>
                          <div className="text-xs font-medium text-black">
                            {stepResult.description}
                          </div>
                          <div className="text-xs text-gray-600">
                            {stepResult.reasoning}
                          </div>
                          <details className="text-xs">
                            <summary className="cursor-pointer text-gray-500 hover:text-gray-700">
                              View Operation Details
                            </summary>
                            <pre className="mt-2 rounded bg-gray-50 p-2 text-xs whitespace-pre-wrap text-black">
                              {JSON.stringify(stepResult.operation, null, 2)}
                            </pre>
                          </details>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </ScrollArea>
  );
};
