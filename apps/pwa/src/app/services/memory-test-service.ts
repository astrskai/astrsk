import { UniqueEntityID } from "@/shared/domain";
import { useMemoryTestStore, type PlantedFact, type ValidationTest } from "@/shared/stores/memory-test-store";
import { createMessage, executeFlow } from "@/app/services/session-play-service";
import { fetchSession } from "@/entities/session/api";
import { sessionQueries } from "@/entities/session/api/query-factory";
import { fetchCard } from "@/entities/card/api/query-factory";
import { Turn } from "@/entities/turn/domain/turn";
import { Option } from "@/entities/turn/domain/option";
import { SessionService } from "@/app/services/session-service";
import { TurnService } from "@/app/services/turn-service";
import { queryClient } from "@/shared/api/query-client";
import { turnQueries } from "@/entities/turn/api/turn-queries";
import { TurnDrizzleMapper } from "@/entities/turn/mappers/turn-drizzle-mapper";
import { cloneDeep } from "lodash-es";
import { CharacterCard } from "@/entities/card/domain/character-card";

/**
 * Memory Test Service
 * Automates stress testing for compression memory recall
 */

// Fact templates for planting - user shares these facts
const FACT_TEMPLATES = [
  {
    fact: "exactly 12 times",
    message: "I walked past the old cafe exactly 12 times before I finally decided to go inside.",
  },
  {
    fact: "crimson red scarf",
    message: "She was wearing a beautiful crimson red scarf when we first met at the market.",
  },
  {
    fact: "3:47 PM on Thursday",
    message: "The important meeting is scheduled for precisely 3:47 PM on Thursday afternoon.",
  },
  {
    fact: "three older sisters",
    message: "Growing up, I had three older sisters who always looked out for me.",
  },
  {
    fact: "buried 47 feet underground",
    message: "The ancient artifact was discovered buried 47 feet underground in the excavation site.",
  },
  {
    fact: "seventeen silver coins",
    message: "The mysterious stranger paid with seventeen silver coins, each one perfectly polished.",
  },
  {
    fact: "blue marble notebook",
    message: "I always write my thoughts in my blue marble notebook that I carry everywhere.",
  },
  {
    fact: "lived there for 8 years",
    message: "Before moving here, I lived there for 8 years and made many wonderful memories.",
  },
  {
    fact: "speaks five languages fluently",
    message: "My mentor is incredibly talented and speaks five languages fluently.",
  },
  {
    fact: "baked fresh at 6 AM",
    message: "The bread at that bakery is baked fresh at 6 AM every single morning.",
  },
  {
    fact: "costs exactly $23.50",
    message: "That particular book costs exactly $23.50, which I thought was quite specific.",
  },
  {
    fact: "won the championship in 2019",
    message: "Our team won the championship in 2019, and we still celebrate that victory.",
  },
  {
    fact: "allergic to strawberries",
    message: "I have to be careful because I'm severely allergic to strawberries.",
  },
  {
    fact: "drives a vintage 1967 Mustang",
    message: "My neighbor drives a beautifully restored vintage 1967 Mustang in cherry red.",
  },
  {
    fact: "painting took 3 months",
    message: "The intricate ceiling painting took the artist 3 months to complete.",
  },
  {
    fact: "has 142 pages",
    message: "I counted every page, and the journal has exactly 142 pages.",
  },
  {
    fact: "opens at sunrise",
    message: "The temple opens at sunrise and closes at sunset every day without fail.",
  },
  {
    fact: "weighs 220 pounds",
    message: "The champion fighter weighs 220 pounds and trains six hours daily.",
  },
  {
    fact: "born on February 14th",
    message: "Coincidentally, she was born on February 14th, Valentine's Day.",
  },
  {
    fact: "has a tattoo of a phoenix",
    message: "He has a tattoo of a phoenix on his left shoulder that symbolizes rebirth.",
  },
];

// Casual user messages for natural conversation flow
const CASUAL_USER_MESSAGES = [
  "That's interesting! Tell me more.",
  "What do you think about that?",
  "I see what you mean.",
  "How does that make you feel?",
  "What happened after that?",
  "That reminds me of something...",
  "I never thought about it that way.",
  "You might be right about that.",
  "What would you do in that situation?",
  "That's a good point.",
];

// Question templates
const QUESTION_TEMPLATES = [
  "Earlier you mentioned something about {fact}. Can you remind me of the exact details?",
  "What did you say about {fact}?",
  "I'm trying to remember - what was that detail about {fact}?",
  "Can you recall what you told me about {fact}?",
  "Earlier you shared something specific about {fact}. What was it exactly?",
];

class MemoryTestService {
  private store = useMemoryTestStore;

  /**
   * Generate a character response for auto-reply
   * This follows the same pattern as chat-main-area.tsx:generateCharacterMessage
   */
  private async generateCharacterResponse(
    session: any,
    sessionId: UniqueEntityID,
    flowId: UniqueEntityID,
    characterCardId: UniqueEntityID,
  ): Promise<void> {
    let streamingMessage: Turn | null = null;

    try {
      // Get dataStore from last turn for inheritance
      let lastDataStore: any[] = [];
      if (session.turnIds.length > 0) {
        const lastTurnId = session.turnIds[session.turnIds.length - 1];
        try {
          const lastTurnData = await queryClient.fetchQuery(
            turnQueries.detail(lastTurnId)
          );
          if (lastTurnData) {
            const lastTurn = TurnDrizzleMapper.toDomain(lastTurnData as any);
            lastDataStore = cloneDeep(lastTurn.dataStore);
          }
        } catch (error) {
          console.warn(`[MemoryTest] Failed to get last turn's dataStore:`, error);
        }
      }

      // Get card to get name
      const card = await fetchCard(characterCardId);
      const cardName =
        card instanceof CharacterCard
          ? card.props.name
          : card.props.title;

      // Create new empty message
      const messageOrError = Turn.create({
        sessionId: sessionId,
        characterCardId: characterCardId,
        characterName: cardName,
        options: [],
      });

      if (messageOrError.isFailure) {
        throw new Error(messageOrError.getError());
      }

      streamingMessage = messageOrError.getValue();

      // Add new empty option with inherited dataStore
      const emptyOptionOrError = Option.create({
        content: "",
        tokenSize: 0,
        dataStore: lastDataStore,
      });

      if (emptyOptionOrError.isFailure) {
        throw new Error(emptyOptionOrError.getError());
      }

      streamingMessage.addOption(emptyOptionOrError.getValue());

      // Set query cache
      queryClient.setQueryData(
        turnQueries.detail(streamingMessage.id).queryKey,
        TurnDrizzleMapper.toPersistence(streamingMessage),
      );

      // Add new empty message to session
      const addResult = await SessionService.addMessage.execute({
        sessionId: sessionId,
        message: streamingMessage,
      });

      if (addResult.isFailure) {
        throw new Error(addResult.getError());
      }

      console.log(`[MemoryTest] Added character turn, turnId:`, streamingMessage.id.toString());

      // Execute flow
      const flowResult = executeFlow({
        flowId: flowId,
        sessionId: sessionId,
        characterCardId: characterCardId,
        regenerateMessageId: undefined,
        stopSignalByUser: new AbortController().signal,
        triggerType: "auto-reply",
      });

      // Stream response
      for await (const response of flowResult) {
        streamingMessage.setContent(response.content);
        if (response.variables) {
          streamingMessage.setVariables(response.variables);
        }
        if (response.dataStore) {
          streamingMessage.setDataStore(response.dataStore);
        }
        if (response.translations) {
          for (const [lang, translation] of response.translations) {
            streamingMessage.setTranslation(lang, translation);
          }
        }

        // Update query cache during streaming
        queryClient.setQueryData(
          turnQueries.detail(streamingMessage.id).queryKey,
          TurnDrizzleMapper.toPersistence(streamingMessage),
        );
      }

      // Save final turn
      await TurnService.updateTurn.execute(streamingMessage);

      // Invalidate session query to update UI
      await queryClient.invalidateQueries({
        queryKey: sessionQueries.detail(sessionId).queryKey,
      });
    } catch (error) {
      console.error(`[MemoryTest] Error generating character response:`, error);
      throw error;
    }
  }

  /**
   * Run complete auto-generation phase
   * Generates N turns with planted facts every 5 turns
   * Pattern: User character speaks → AI character responds → User character speaks → AI character responds...
   * Every 5th user turn plants a fact
   */
  async runAutoGeneration(sessionId: string, totalTurns: number): Promise<void> {
    const storeActions = this.store.getState();
    storeActions.startGeneration(sessionId, totalTurns);

    // Create UniqueEntityID once and reuse it everywhere
    const sessionIdEntity = new UniqueEntityID(sessionId);
    console.log(`[MemoryTest] Starting generation for session:`, sessionIdEntity.toString());

    // Fetch session to get character IDs
    const session = await fetchSession(sessionIdEntity);

    if (!session.userCharacterCardId) {
      throw new Error("Session has no user character assigned");
    }

    const userCharacterCardId = session.userCharacterCardId;

    if (!session.flowId) {
      throw new Error("Session has no flow assigned");
    }

    if (session.aiCharacterCardIds.length === 0) {
      throw new Error("Session has no AI characters");
    }

    const factInterval = 5; // Plant fact every 5 user turns
    let factIndex = 0;
    let userTurnCount = 0; // Track user turns separately

    for (let turn = 1; turn <= totalTurns; turn++) {
      // Check if user requested stop
      if (this.store.getState().shouldStop) {
        console.log(`[MemoryTest] Generation stopped at turn ${turn}/${totalTurns}`);
        break;
      }

      console.log(`[MemoryTest] Generating turn ${turn}/${totalTurns}...`);

      try {
        // Refetch session to get updated turnIds
        const currentSession = await fetchSession(sessionIdEntity);

        // Alternate between user and AI characters
        const isUserTurn = turn % 2 === 1; // Odd turns = user, even turns = AI

        if (isUserTurn) {
          // User character's turn
          userTurnCount++;

          let plantedFact: PlantedFact | null = null;

          // Determine if this user turn should plant a fact
          const shouldPlantFact = userTurnCount % factInterval === 0 && userTurnCount >= factInterval;

          if (shouldPlantFact) {
            // Inject fact as a static user message
            const template = FACT_TEMPLATES[factIndex % FACT_TEMPLATES.length];

            plantedFact = {
              turnNumber: turn,
              turnId: "", // Will be filled after turn is created
              fact: template.fact,
              fullMessage: template.message,
              context: "", // Will be filled after AI response
            };

            factIndex++;
            console.log(`[MemoryTest] Planting fact at turn ${turn}: "${template.fact}"`);

            // Create static user message with the fact
            const userMessageOrError = await createMessage({
              sessionId: sessionIdEntity,
              characterCardId: userCharacterCardId,
              defaultCharacterName: "User",
              messageContent: template.message,
            });

            if (userMessageOrError.isFailure) {
              throw new Error(userMessageOrError.getError());
            }

            const userMessageTurn = userMessageOrError.getValue();

            // Add user message to session
            const addResult = await SessionService.addMessage.execute({
              sessionId: sessionIdEntity,
              message: userMessageTurn,
            });

            if (addResult.isFailure) {
              throw new Error(addResult.getError());
            }

            console.log(`[MemoryTest] Added FACT user message, turnId:`, userMessageTurn.id.toString());

            plantedFact.turnId = userMessageTurn.id.toString();
            plantedFact.context = template.message;
            storeActions.plantFact(plantedFact);

            await queryClient.invalidateQueries({
              queryKey: sessionQueries.detail(sessionIdEntity).queryKey,
            });
          } else {
            // Normal AI-generated user message (simulate user character button press)
            console.log(`[MemoryTest] Generating user character response...`);
            await this.generateCharacterResponse(
              currentSession,
              sessionIdEntity,
              session.flowId,
              userCharacterCardId
            );
          }
        } else {
          // AI character's turn
          // Pick random or rotate AI character
          let characterId: UniqueEntityID;

          if (session.autoReply === "random") {
            const randomIndex = Math.floor(Math.random() * session.aiCharacterCardIds.length);
            characterId = session.aiCharacterCardIds[randomIndex];
          } else {
            // Rotate or default to first character
            characterId = session.aiCharacterCardIds[0];
          }

          console.log(`[MemoryTest] Generating AI character response...`);
          await this.generateCharacterResponse(
            currentSession,
            sessionIdEntity,
            session.flowId,
            characterId
          );
        }

        // Update progress
        storeActions.incrementTurn();

        // Small delay to avoid overwhelming the system
        await this.delay(500);
      } catch (error) {
        console.error(`[MemoryTest] Error generating turn ${turn}:`, error);
        throw error;
      }
    }

    storeActions.finishGeneration();
    console.log(`[MemoryTest] Auto-generation complete!`);
  }

  /**
   * Run batch validation phase
   * Tests each planted fact for recall accuracy
   */
  async runBatchValidation(sessionId: string): Promise<void> {
    const { plantedFacts, currentTurn, startValidation, recordValidation, finishValidation } =
      this.store.getState();

    if (plantedFacts.length === 0) {
      console.warn("[MemoryTest] No planted facts to validate!");
      return;
    }

    // Fetch session to get user character ID
    const session = await fetchSession(new UniqueEntityID(sessionId));
    const userCharacterCardId = session.userCharacterCardId;

    startValidation();

    for (let i = 0; i < plantedFacts.length; i++) {
      // Check if user requested stop
      if (this.store.getState().shouldStop) {
        console.log(`[MemoryTest] Validation stopped at test ${i + 1}/${plantedFacts.length}`);
        break;
      }

      const plantedFact = plantedFacts[i];
      const turnDistance = currentTurn - plantedFact.turnNumber;

      console.log(`[MemoryTest] Validating fact ${i + 1}/${plantedFacts.length}...`);
      console.log(`  Fact: "${plantedFact.fact}" (turn ${plantedFact.turnNumber}, distance: ${turnDistance})`);

      try {
        // Generate question about the fact
        const question = this.generateQuestion(plantedFact.fact);

        // Capture console logs to extract retrieved anchors
        const consoleLogs: string[] = [];
        const originalLog = console.log;
        console.log = (...args: any[]) => {
          consoleLogs.push(args.join(" "));
          originalLog(...args);
        };

        // Create question message
        const sessionIdEntity = new UniqueEntityID(sessionId);
        const questionMessageOrError = await createMessage({
          sessionId: sessionIdEntity,
          characterCardId: userCharacterCardId,
          defaultCharacterName: "User",
          messageContent: question,
        });

        if (questionMessageOrError.isFailure) {
          throw new Error(questionMessageOrError.getError());
        }

        const questionTurn = questionMessageOrError.getValue();

        // Add question to session
        const addResult = await SessionService.addMessage.execute({
          sessionId: sessionIdEntity,
          message: questionTurn,
        });

        if (addResult.isFailure) {
          throw new Error(addResult.getError());
        }

        // Restore console.log
        console.log = originalLog;

        const response = questionTurn.content || "";

        // Parse retrieved anchors from console logs
        const retrievedAnchors = this.parseRetrievedAnchors(consoleLogs);

        // Validate response contains the fact
        const responseContainsFact = this.validateResponse(response, plantedFact.fact);

        // Create validation test result
        const test: ValidationTest = {
          testNumber: i + 1,
          factTurnNumber: plantedFact.turnNumber,
          fact: plantedFact.fact,
          question,
          retrievedAnchors,
          response,
          responseContainsFact,
          turnDistance,
          passed: responseContainsFact, // For now, just check if response contains fact
        };

        recordValidation(test);

        // Small delay between validations
        await this.delay(500);
      } catch (error) {
        console.error(`[MemoryTest] Error validating fact ${i + 1}:`, error);
        // Record as failed test
        recordValidation({
          testNumber: i + 1,
          factTurnNumber: plantedFact.turnNumber,
          fact: plantedFact.fact,
          question: "Error during validation",
          retrievedAnchors: [],
          response: `Error: ${error}`,
          responseContainsFact: false,
          turnDistance,
          passed: false,
        });
      }
    }

    finishValidation();
    console.log(`[MemoryTest] Batch validation complete!`);
  }

  /**
   * Generate a question about a planted fact
   */
  private generateQuestion(fact: string): string {
    const template = QUESTION_TEMPLATES[
      Math.floor(Math.random() * QUESTION_TEMPLATES.length)
    ];

    // Extract a keyword from the fact for the question
    const keyword = this.extractKeyword(fact);
    return template.replace("{fact}", keyword);
  }

  /**
   * Extract keyword from fact for question generation
   */
  private extractKeyword(fact: string): string {
    // Simple heuristic: use last 2-3 words
    const words = fact.split(" ");
    if (words.length <= 2) return fact;
    return words.slice(-2).join(" ");
  }

  /**
   * Parse retrieved anchors from console logs
   */
  private parseRetrievedAnchors(logs: string[]): string[] {
    const relevantLog = logs.find(log =>
      log.includes("[CompressionSystem] Relevant anchors:")
    );

    if (!relevantLog) return [];

    // Extract anchors from log like: "[CompressionSystem] Relevant anchors: [anchor1, anchor2]"
    const match = relevantLog.match(/\[([^\]]+)\]/);
    if (!match) return [];

    const anchorsStr = match[1];
    return anchorsStr.split(",").map(a => a.trim()).filter(a => a.length > 0);
  }

  /**
   * Validate if response contains the fact
   */
  private validateResponse(response: string, fact: string): boolean {
    const normalizedResponse = response.toLowerCase();
    const normalizedFact = fact.toLowerCase();

    // Simple substring match
    return normalizedResponse.includes(normalizedFact);
  }

  /**
   * Utility delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Export test results as JSON file
   */
  exportResults(sessionId: string): void {
    const state = this.store.getState();

    const report = {
      metadata: {
        sessionId,
        timestamp: new Date().toISOString(),
        totalTurns: state.totalTurns,
        phase: state.phase,
      },
      plantedFacts: state.plantedFacts,
      validationTests: state.validationTests,
      summary: state.summary,
    };

    // Create downloadable JSON file
    const blob = new Blob([JSON.stringify(report, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `memory-test-${sessionId}-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    console.log(`[MemoryTest] Exported results to file`);
  }

  /**
   * Get current test results
   */
  getResults() {
    const state = this.store.getState();
    return {
      plantedFacts: state.plantedFacts,
      validationTests: state.validationTests,
      summary: state.summary,
      phase: state.phase,
    };
  }
}

export const memoryTestService = new MemoryTestService();
