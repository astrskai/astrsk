/**
 * Message Evaluator Service
 * Analyzes agent messages to detect hallucinations, context issues, and state problems
 */

import type { Turn } from '../../turn/domain/turn';
import type { Agent } from '../../agent/domain/agent';
import type { Flow } from '../../flow/domain/flow';
import type { Session } from '../../session/domain/session';
import type {
  EvaluationReport,
  EvaluationConfig,
  BehaviorAnalysis,
  ContextAnalysis,
  StateAnalysis,
  PromptAnalysis,
  EvaluationIssue,
  DEFAULT_EVALUATION_CONFIG,
} from '../types/evaluation-report';

export interface EvaluationContext {
  message: Turn;
  agent: Agent;
  flow: Flow;
  session: Session;
  allTurns: Turn[];

  // Execution metadata
  promptMessages: Array<{ role: string; content: string }>;
  modelParameters: Record<string, any>;
  executionTimeMs: number;
}

export class MessageEvaluator {
  private config: EvaluationConfig;

  constructor(config: Partial<EvaluationConfig> = {}) {
    this.config = { ...DEFAULT_EVALUATION_CONFIG, ...config };
  }

  /**
   * Main evaluation method
   */
  async evaluate(context: EvaluationContext): Promise<EvaluationReport> {
    const startTime = Date.now();

    // Run all analyses
    const [behaviorAnalysis, contextAnalysis, stateAnalysis, promptAnalysis] = await Promise.all([
      this.config.enabledChecks.behaviorAnalysis
        ? this.analyzeBehavior(context)
        : this.createEmptyBehaviorAnalysis(),
      this.config.enabledChecks.contextAnalysis
        ? this.analyzeContext(context)
        : this.createEmptyContextAnalysis(),
      this.config.enabledChecks.stateAnalysis
        ? this.analyzeState(context)
        : this.createEmptyStateAnalysis(),
      this.config.enabledChecks.promptAnalysis
        ? this.analyzePrompt(context)
        : this.createEmptyPromptAnalysis(),
    ]);

    // Collect all issues
    const issues = this.collectIssues({
      behaviorAnalysis,
      contextAnalysis,
      stateAnalysis,
      promptAnalysis,
    });

    // Generate recommendations
    const recommendations = this.generateRecommendations(issues);

    // Calculate overall score
    const overallScore = this.calculateOverallScore({
      behaviorAnalysis,
      contextAnalysis,
      stateAnalysis,
      promptAnalysis,
      issues,
    });

    return {
      messageId: context.message.id.toString(),
      agentName: context.agent.props.name,
      modelName: context.agent.props.modelName ?? 'unknown',
      timestamp: new Date(),
      behaviorAnalysis,
      contextAnalysis,
      stateAnalysis,
      promptAnalysis,
      overallScore,
      issues,
      recommendations,
    };
  }

  /**
   * Analyze behavior patterns and hallucination
   */
  private async analyzeBehavior(context: EvaluationContext): Promise<BehaviorAnalysis> {
    const content = context.message.content;
    const variables = context.message.variables;

    // Analyze output characteristics
    const tokenCount = this.estimateTokenCount(content);
    const sentences = content.split(/[.!?]+/).filter((s) => s.trim().length > 0);
    const averageSentenceLength = sentences.length > 0
      ? content.length / sentences.length
      : 0;

    // Detect patterns
    const patterns = {
      repetitive: this.detectRepetition(content),
      outOfContext: this.detectOutOfContext(content, context),
      contradictory: this.detectContradictions(content, context.allTurns),
      incomplete: this.detectIncompleteness(content, context.agent),
    };

    // Determine response type
    let responseType: BehaviorAnalysis['responseType'] = 'normal';
    let confidence = 0.9;
    let reasoning = 'Response appears normal';

    if (patterns.outOfContext) {
      responseType = 'hallucination';
      confidence = 0.8;
      reasoning = 'Response contains information not grounded in provided context';
    } else if (patterns.incomplete) {
      responseType = 'incomplete';
      confidence = 0.7;
      reasoning = 'Response appears truncated or incomplete';
    } else if (content.toLowerCase().includes('cannot') || content.toLowerCase().includes('unable to')) {
      responseType = 'refusal';
      confidence = 0.85;
      reasoning = 'Agent refused to complete the request';
    }

    // Calculate coherence score
    const coherenceScore = this.calculateCoherence(content, patterns);

    return {
      responseType,
      confidence,
      reasoning,
      tokenCount,
      averageSentenceLength,
      coherenceScore,
      patterns,
    };
  }

  /**
   * Analyze context usage and completeness
   */
  private async analyzeContext(context: EvaluationContext): Promise<ContextAnalysis> {
    const missingInformation = this.detectMissingInformation(context);
    const redundantInformation = this.detectRedundantInformation(context);

    // Calculate history usage
    const historyTurnsAvailable = context.allTurns.length;
    const historyTurnsUsed = this.countHistoryTurnsUsed(context.promptMessages, context.allTurns);

    // Check for character and user context
    const characterInfoPresent = this.hasCharacterInfo(context.promptMessages);
    const userContextPresent = this.hasUserContext(context.promptMessages);

    // Detect context overload
    const totalPromptTokens = context.promptMessages.reduce(
      (sum, msg) => sum + this.estimateTokenCount(msg.content),
      0,
    );
    const contextOverload = totalPromptTokens > 6000; // Arbitrary threshold

    // Calculate quality scores
    const relevanceScore = this.calculateContextRelevance(context);
    const completenessScore = this.calculateContextCompleteness(
      characterInfoPresent,
      userContextPresent,
      missingInformation,
    );

    return {
      historyTurnsUsed,
      historyTurnsAvailable,
      characterInfoPresent,
      userContextPresent,
      missingInformation,
      redundantInformation,
      contextOverload,
      relevanceScore,
      completenessScore,
    };
  }

  /**
   * Analyze state updates and consistency
   */
  private async analyzeState(context: EvaluationContext): Promise<StateAnalysis> {
    const dataStoreUpdates = this.analyzeDataStoreUpdates(context);
    const issues = this.detectStateIssues(context, dataStoreUpdates);

    // Determine update frequency
    const updateCount = dataStoreUpdates.length;
    let updateFrequency: StateAnalysis['updateFrequency'] = 'none';
    if (updateCount === 0) {
      updateFrequency = 'none';
    } else if (updateCount <= 3) {
      updateFrequency = 'normal';
    } else if (updateCount <= 6) {
      updateFrequency = 'aggressive';
    } else {
      updateFrequency = 'excessive';
    }

    // Check for double counting
    const doubleCountingDetected = this.detectDoubleCounting(context, dataStoreUpdates);

    // Calculate state consistency
    const stateConsistency = this.calculateStateConsistency(dataStoreUpdates, issues);

    return {
      dataStoreUpdates,
      issues,
      updateFrequency,
      doubleCountingDetected,
      stateConsistency,
    };
  }

  /**
   * Analyze prompt quality
   */
  private async analyzePrompt(context: EvaluationContext): Promise<PromptAnalysis> {
    const systemMessages = context.promptMessages.filter((m) => m.role === 'system');
    const systemMessagePresent = systemMessages.length > 0;

    // Count examples
    const exampleCount = context.promptMessages.filter((m) =>
      m.content.toLowerCase().includes('example'),
    ).length;

    // Detect contradictions and ambiguities
    const contradictions = this.detectPromptContradictions(context.promptMessages);
    const ambiguities = this.detectPromptAmbiguities(context.promptMessages);

    // Calculate quality scores
    const specificityScore = this.calculatePromptSpecificity(context.promptMessages);
    const consistencyScore = contradictions.length === 0 ? 1.0 : Math.max(0, 1 - contradictions.length * 0.2);
    const instructionClarity = (specificityScore + consistencyScore) / 2;

    return {
      systemMessagePresent,
      instructionClarity,
      exampleCount,
      contradictions,
      ambiguities,
      specificityScore,
      consistencyScore,
    };
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  private detectRepetition(content: string): boolean {
    const sentences = content.split(/[.!?]+/).filter((s) => s.trim().length > 0);
    const uniqueSentences = new Set(sentences.map((s) => s.trim().toLowerCase()));
    return sentences.length > 3 && uniqueSentences.size < sentences.length * 0.7;
  }

  private detectOutOfContext(content: string, context: EvaluationContext): boolean {
    // Check if response contains specific facts not in context
    const hasProperNouns = /[A-Z][a-z]+(?:\s[A-Z][a-z]+)*/.test(content);
    const hasSpecificNumbers = /\d{4,}/.test(content); // Years, IDs, etc.

    if (hasProperNouns || hasSpecificNumbers) {
      const contextString = context.promptMessages.map((m) => m.content).join(' ');
      // Simple check: if content has facts not in context
      return content.split(' ').some((word) => {
        if (word.length < 4) return false;
        return /[A-Z]/.test(word[0]) && !contextString.includes(word);
      });
    }

    return false;
  }

  private detectContradictions(content: string, allTurns: Turn[]): boolean {
    // Simple contradiction detection
    const previousContent = allTurns.slice(-5).map((t) => t.content).join(' ').toLowerCase();
    const currentLower = content.toLowerCase();

    const contradictionPairs = [
      ['yes', 'no'],
      ['always', 'never'],
      ['will', 'will not'],
      ['can', 'cannot'],
    ];

    return contradictionPairs.some(([word1, word2]) => {
      return previousContent.includes(word1) && currentLower.includes(word2);
    });
  }

  private detectIncompleteness(content: string, agent: Agent): boolean {
    // Check if response seems cut off
    const endsAbruptly = !content.match(/[.!?]$/);
    const tooShort = content.length < 20;
    return endsAbruptly || tooShort;
  }

  private calculateCoherence(content: string, patterns: BehaviorAnalysis['patterns']): number {
    let score = 1.0;
    if (patterns.repetitive) score -= 0.3;
    if (patterns.outOfContext) score -= 0.4;
    if (patterns.contradictory) score -= 0.3;
    if (patterns.incomplete) score -= 0.2;
    return Math.max(0, score);
  }

  private detectMissingInformation(context: EvaluationContext): ContextAnalysis['missingInformation'] {
    const missing: ContextAnalysis['missingInformation'] = [];

    // Check for character traits
    const hasCharacterTraits = context.promptMessages.some((m) =>
      m.content.toLowerCase().includes('personality') ||
      m.content.toLowerCase().includes('trait'),
    );
    if (!hasCharacterTraits) {
      missing.push({
        type: 'character_traits',
        description: 'Character personality or traits not found in context',
        impact: 'medium',
        suggestion: 'Add character card description to system message',
      });
    }

    // Check for conversation history
    if (context.allTurns.length > 0 && !this.hasConversationHistory(context.promptMessages)) {
      missing.push({
        type: 'conversation_history',
        description: 'Previous conversation turns not included',
        impact: 'high',
        suggestion: 'Include recent conversation history in prompt',
      });
    }

    return missing;
  }

  private detectRedundantInformation(context: EvaluationContext): ContextAnalysis['redundantInformation'] {
    const redundant: ContextAnalysis['redundantInformation'] = [];

    // Check for duplicate history
    const historyCount = context.promptMessages.filter((m) =>
      m.role === 'user' || m.role === 'assistant',
    ).length;
    if (historyCount > 20) {
      redundant.push({
        type: 'duplicate_history',
        description: `Excessive history messages (${historyCount})`,
        impact: 'medium',
      });
    }

    return redundant;
  }

  private countHistoryTurnsUsed(promptMessages: Array<{ role: string; content: string }>, allTurns: Turn[]): number {
    return promptMessages.filter((m) => m.role === 'user' || m.role === 'assistant').length;
  }

  private hasCharacterInfo(promptMessages: Array<{ role: string; content: string }>): boolean {
    return promptMessages.some((m) =>
      m.content.toLowerCase().includes('character') ||
      m.content.toLowerCase().includes('personality'),
    );
  }

  private hasUserContext(promptMessages: Array<{ role: string; content: string }>): boolean {
    return promptMessages.some((m) => m.role === 'user');
  }

  private hasConversationHistory(promptMessages: Array<{ role: string; content: string }>): boolean {
    return promptMessages.filter((m) => m.role === 'user' || m.role === 'assistant').length > 0;
  }

  private calculateContextRelevance(context: EvaluationContext): number {
    // Simple relevance check based on content similarity
    const messageContent = context.message.content.toLowerCase();
    const contextContent = context.promptMessages.map((m) => m.content.toLowerCase()).join(' ');

    const messageWords = new Set(messageContent.split(/\s+/).filter((w) => w.length > 3));
    const contextWords = new Set(contextContent.split(/\s+/).filter((w) => w.length > 3));

    const intersection = new Set([...messageWords].filter((w) => contextWords.has(w)));
    return messageWords.size > 0 ? intersection.size / messageWords.size : 0.5;
  }

  private calculateContextCompleteness(
    characterInfoPresent: boolean,
    userContextPresent: boolean,
    missingInformation: ContextAnalysis['missingInformation'],
  ): number {
    let score = 1.0;
    if (!characterInfoPresent) score -= 0.3;
    if (!userContextPresent) score -= 0.2;
    score -= missingInformation.length * 0.1;
    return Math.max(0, score);
  }

  private analyzeDataStoreUpdates(context: EvaluationContext): StateAnalysis['dataStoreUpdates'] {
    const updates: StateAnalysis['dataStoreUpdates'] = [];
    const currentDataStore = context.message.dataStore ?? [];

    // Compare with flow schema to validate updates
    const schema = context.flow.props.dataStoreSchema;
    if (!schema) return updates;

    for (const field of currentDataStore) {
      const schemaField = schema.fields.find((f) => f.id === field.id);
      if (!schemaField) continue;

      // Find previous value
      const previousTurn = context.allTurns[context.allTurns.length - 1];
      const previousField = previousTurn?.dataStore?.find((f) => f.id === field.id);
      const previousValue = previousField?.value ?? null;

      // Validate type
      const isValid = this.validateFieldType(field.value, field.type);

      updates.push({
        fieldName: field.name,
        fieldType: field.type,
        previousValue,
        newValue: field.value,
        isValid,
        reasoning: this.getUpdateReasoning(field, previousValue, isValid),
      });
    }

    return updates;
  }

  private detectStateIssues(context: EvaluationContext, updates: StateAnalysis['dataStoreUpdates']): StateAnalysis['issues'] {
    const issues: StateAnalysis['issues'] = [];

    // Check for invalid values
    for (const update of updates) {
      if (!update.isValid) {
        issues.push({
          type: 'type_mismatch',
          fieldName: update.fieldName,
          description: `Value "${update.newValue}" does not match expected type "${update.fieldType}"`,
          severity: 'high',
          suggestion: `Ensure agent outputs valid ${update.fieldType} values`,
        });
      }
    }

    // Check for double counting (numeric fields only)
    for (const update of updates) {
      if (update.fieldType === 'number' || update.fieldType === 'integer') {
        const prev = parseFloat(update.previousValue ?? '0');
        const curr = parseFloat(update.newValue);
        if (!isNaN(prev) && !isNaN(curr) && curr > prev * 2) {
          issues.push({
            type: 'excessive_update',
            fieldName: update.fieldName,
            description: `Value increased from ${prev} to ${curr} (more than 2x)`,
            severity: 'medium',
            suggestion: 'Check if increment logic is correct',
          });
        }
      }
    }

    return issues;
  }

  private detectDoubleCounting(context: EvaluationContext, updates: StateAnalysis['dataStoreUpdates']): boolean {
    return updates.some((update) => {
      if (update.fieldType !== 'number' && update.fieldType !== 'integer') return false;
      const prev = parseFloat(update.previousValue ?? '0');
      const curr = parseFloat(update.newValue);
      return !isNaN(prev) && !isNaN(curr) && curr === prev * 2;
    });
  }

  private calculateStateConsistency(updates: StateAnalysis['dataStoreUpdates'], issues: StateAnalysis['issues']): number {
    if (updates.length === 0) return 1.0;
    const invalidCount = updates.filter((u) => !u.isValid).length;
    const issueWeight = issues.reduce((sum, issue) => {
      return sum + (issue.severity === 'high' ? 0.2 : issue.severity === 'medium' ? 0.1 : 0.05);
    }, 0);
    return Math.max(0, 1.0 - (invalidCount / updates.length) - issueWeight);
  }

  private validateFieldType(value: string, type: string): boolean {
    switch (type) {
      case 'number':
      case 'integer':
        return !isNaN(parseFloat(value));
      case 'boolean':
        return value === 'true' || value === 'false';
      case 'string':
        return true;
      default:
        return true;
    }
  }

  private getUpdateReasoning(field: any, previousValue: string | null, isValid: boolean): string {
    if (!isValid) return 'Invalid type for field';
    if (previousValue === null) return 'Initial value set';
    if (previousValue === field.value) return 'Value unchanged';
    return 'Value updated';
  }

  private detectPromptContradictions(promptMessages: Array<{ role: string; content: string }>): PromptAnalysis['contradictions'] {
    const contradictions: PromptAnalysis['contradictions'] = [];

    // Simple check for contradictory instructions
    const systemContent = promptMessages
      .filter((m) => m.role === 'system')
      .map((m) => m.content.toLowerCase())
      .join(' ');

    const contradictionPatterns = [
      { keywords: ['always', 'never'], description: 'Contains both "always" and "never" instructions' },
      { keywords: ['must', 'must not'], description: 'Contains contradictory "must" instructions' },
    ];

    for (const pattern of contradictionPatterns) {
      if (pattern.keywords.every((kw) => systemContent.includes(kw))) {
        contradictions.push({
          description: pattern.description,
          severity: 'medium',
          suggestion: 'Review and clarify conflicting instructions',
        });
      }
    }

    return contradictions;
  }

  private detectPromptAmbiguities(promptMessages: Array<{ role: string; content: string }>): PromptAnalysis['ambiguities'] {
    const ambiguities: PromptAnalysis['ambiguities'] = [];

    const systemContent = promptMessages
      .filter((m) => m.role === 'system')
      .map((m) => m.content)
      .join(' ');

    // Check for vague language
    const vagueTerms = ['maybe', 'perhaps', 'might', 'could', 'possibly'];
    const foundVagueTerms = vagueTerms.filter((term) => systemContent.toLowerCase().includes(term));

    if (foundVagueTerms.length > 0) {
      ambiguities.push({
        description: `Prompt contains vague language: ${foundVagueTerms.join(', ')}`,
        impact: 'medium',
        suggestion: 'Use more specific and directive language',
      });
    }

    return ambiguities;
  }

  private calculatePromptSpecificity(promptMessages: Array<{ role: string; content: string }>): number {
    const systemContent = promptMessages
      .filter((m) => m.role === 'system')
      .map((m) => m.content)
      .join(' ');

    // Higher score for specific instructions
    let score = 0.5;
    if (systemContent.includes('must')) score += 0.1;
    if (systemContent.includes('should')) score += 0.1;
    if (systemContent.includes('example')) score += 0.1;
    if (systemContent.length > 200) score += 0.2;
    return Math.min(1.0, score);
  }

  private estimateTokenCount(text: string): number {
    // Rough estimate: 1 token ≈ 4 characters
    return Math.ceil(text.length / 4);
  }

  private collectIssues(analyses: {
    behaviorAnalysis: BehaviorAnalysis;
    contextAnalysis: ContextAnalysis;
    stateAnalysis: StateAnalysis;
    promptAnalysis: PromptAnalysis;
  }): EvaluationIssue[] {
    const issues: EvaluationIssue[] = [];

    // Behavior issues
    if (analyses.behaviorAnalysis.responseType === 'hallucination') {
      issues.push({
        category: 'behavior',
        severity: 'high',
        title: 'Hallucination Detected',
        description: analyses.behaviorAnalysis.reasoning,
        evidence: 'Response contains information not grounded in context',
        suggestion: 'Review and improve context completeness',
      });
    }

    if (analyses.behaviorAnalysis.patterns.repetitive) {
      issues.push({
        category: 'behavior',
        severity: 'medium',
        title: 'Repetitive Content',
        description: 'Response contains repetitive sentences or phrases',
        evidence: `Coherence score: ${analyses.behaviorAnalysis.coherenceScore.toFixed(2)}`,
        suggestion: 'Adjust temperature or add diversity to prompts',
      });
    }

    // Context issues
    for (const missing of analyses.contextAnalysis.missingInformation) {
      issues.push({
        category: 'context',
        severity: missing.impact === 'high' ? 'high' : 'medium',
        title: `Missing: ${missing.type.replace(/_/g, ' ')}`,
        description: missing.description,
        evidence: 'Information not found in prompt',
        suggestion: missing.suggestion,
      });
    }

    if (analyses.contextAnalysis.contextOverload) {
      issues.push({
        category: 'context',
        severity: 'medium',
        title: 'Context Overload',
        description: 'Too much context provided to the agent',
        evidence: 'Total prompt tokens exceed recommended limit',
        suggestion: 'Reduce history length or remove redundant information',
      });
    }

    // State issues
    for (const stateIssue of analyses.stateAnalysis.issues) {
      issues.push({
        category: 'state',
        severity: stateIssue.severity,
        title: `State Issue: ${stateIssue.fieldName}`,
        description: stateIssue.description,
        evidence: `Issue type: ${stateIssue.type}`,
        suggestion: stateIssue.suggestion,
      });
    }

    if (analyses.stateAnalysis.doubleCountingDetected) {
      issues.push({
        category: 'state',
        severity: 'high',
        title: 'Double Counting Detected',
        description: 'A numeric field was doubled instead of incremented',
        evidence: 'Value increased by exactly 2x',
        suggestion: 'Review increment logic in agent or dataStore node',
      });
    }

    // Prompt issues
    for (const contradiction of analyses.promptAnalysis.contradictions) {
      issues.push({
        category: 'prompt',
        severity: contradiction.severity,
        title: 'Prompt Contradiction',
        description: contradiction.description,
        evidence: 'Conflicting instructions found',
        suggestion: contradiction.suggestion,
      });
    }

    return issues;
  }

  private generateRecommendations(issues: EvaluationIssue[]): string[] {
    const recommendations: string[] = [];

    // Group issues by category
    const criticalIssues = issues.filter((i) => i.severity === 'critical');
    const highIssues = issues.filter((i) => i.severity === 'high');
    const mediumIssues = issues.filter((i) => i.severity === 'medium');

    if (criticalIssues.length > 0) {
      recommendations.push('🚨 Critical issues detected - immediate attention required');
    }

    if (highIssues.length > 0) {
      recommendations.push(`⚠️  Fix ${highIssues.length} high-severity issue(s) to improve reliability`);
    }

    if (mediumIssues.length > 0) {
      recommendations.push(`💡 Address ${mediumIssues.length} medium-severity issue(s) for better performance`);
    }

    // Specific recommendations
    const contextIssues = issues.filter((i) => i.category === 'context');
    if (contextIssues.length > 2) {
      recommendations.push('📝 Review agent prompts to include missing context');
    }

    const stateIssues = issues.filter((i) => i.category === 'state');
    if (stateIssues.length > 0) {
      recommendations.push('🔧 Check dataStore schema and agent structured output configuration');
    }

    if (recommendations.length === 0) {
      recommendations.push('✅ No major issues detected - agent is performing well');
    }

    return recommendations;
  }

  private calculateOverallScore(data: {
    behaviorAnalysis: BehaviorAnalysis;
    contextAnalysis: ContextAnalysis;
    stateAnalysis: StateAnalysis;
    promptAnalysis: PromptAnalysis;
    issues: EvaluationIssue[];
  }): number {
    // Weighted average of all scores
    const weights = {
      behavior: 0.3,
      context: 0.25,
      state: 0.25,
      prompt: 0.2,
    };

    const behaviorScore = data.behaviorAnalysis.coherenceScore * 100;
    const contextScore = (data.contextAnalysis.relevanceScore + data.contextAnalysis.completenessScore) / 2 * 100;
    const stateScore = data.stateAnalysis.stateConsistency * 100;
    const promptScore = (data.promptAnalysis.specificityScore + data.promptAnalysis.consistencyScore) / 2 * 100;

    const weightedScore =
      behaviorScore * weights.behavior +
      contextScore * weights.context +
      stateScore * weights.state +
      promptScore * weights.prompt;

    // Apply penalty for issues
    const issuePenalty = data.issues.reduce((penalty, issue) => {
      return penalty + (issue.severity === 'critical' ? 15 : issue.severity === 'high' ? 10 : issue.severity === 'medium' ? 5 : 2);
    }, 0);

    return Math.max(0, Math.min(100, weightedScore - issuePenalty));
  }

  // Empty analysis creators
  private createEmptyBehaviorAnalysis(): BehaviorAnalysis {
    return {
      responseType: 'normal',
      confidence: 1.0,
      reasoning: 'Analysis skipped',
      tokenCount: 0,
      averageSentenceLength: 0,
      coherenceScore: 1.0,
      patterns: {
        repetitive: false,
        outOfContext: false,
        contradictory: false,
        incomplete: false,
      },
    };
  }

  private createEmptyContextAnalysis(): ContextAnalysis {
    return {
      historyTurnsUsed: 0,
      historyTurnsAvailable: 0,
      characterInfoPresent: false,
      userContextPresent: false,
      missingInformation: [],
      redundantInformation: [],
      contextOverload: false,
      relevanceScore: 1.0,
      completenessScore: 1.0,
    };
  }

  private createEmptyStateAnalysis(): StateAnalysis {
    return {
      dataStoreUpdates: [],
      issues: [],
      updateFrequency: 'none',
      doubleCountingDetected: false,
      stateConsistency: 1.0,
    };
  }

  private createEmptyPromptAnalysis(): PromptAnalysis {
    return {
      systemMessagePresent: false,
      instructionClarity: 1.0,
      exampleCount: 0,
      contradictions: [],
      ambiguities: [],
      specificityScore: 1.0,
      consistencyScore: 1.0,
    };
  }
}
