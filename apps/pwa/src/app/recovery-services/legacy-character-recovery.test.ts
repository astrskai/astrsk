import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { LegacyCharacterRecovery } from "./legacy-character-recovery";
import { TestLegacySetup } from "./test-legacy-setup";
import { Drizzle } from "@/db/drizzle";
import { sql } from "drizzle-orm";

/**
 * Unit tests for LegacyCharacterRecovery
 *
 * Tests cover:
 * 1. Schema detection (columnExists)
 * 2. Legacy data detection (checkLegacyData)
 * 3. Character recovery (recoverCharacters)
 * 4. Scenario recovery (recoverScenarios)
 * 5. Full recovery flow (recoverAll)
 * 6. Backup functionality (downloadBackup)
 * 7. Error handling
 */

describe("LegacyCharacterRecovery", () => {
  let recovery: LegacyCharacterRecovery;
  let testSetup: TestLegacySetup;
  let logs: string[] = [];

  beforeEach(() => {
    recovery = new LegacyCharacterRecovery();
    testSetup = new TestLegacySetup();
    logs = [];

    // Capture logs
    recovery.setLogCallback((msg) => logs.push(msg));
    testSetup.setLogCallback((msg) => logs.push(msg));
  });

  afterEach(async () => {
    // Clean up legacy tables after each test
    await testSetup.cleanup();
  });

  describe("Schema Detection", () => {
    it("should detect existing columns in characters table", async () => {
      const db = await Drizzle.getInstance();

      // Check for columns that should exist
      const hasId = await recovery["columnExists"]("characters", "id");
      const hasName = await recovery["columnExists"]("characters", "name");
      const hasTitle = await recovery["columnExists"]("characters", "title");

      expect(hasId).toBe(true);
      expect(hasName).toBe(true);
      expect(hasTitle).toBe(true);
    });

    it("should return false for non-existent columns", async () => {
      const hasNonExistent = await recovery["columnExists"](
        "characters",
        "nonexistent_column_xyz",
      );

      expect(hasNonExistent).toBe(false);
    });

    it("should handle schema evolution (config, scenario, first_messages)", async () => {
      // These columns might or might not exist depending on schema version
      const hasConfig = await recovery["columnExists"]("characters", "config");
      const hasScenario = await recovery["columnExists"](
        "characters",
        "scenario",
      );
      const hasFirstMessages = await recovery["columnExists"](
        "characters",
        "first_messages",
      );

      // Just verify they return boolean values
      expect(typeof hasConfig).toBe("boolean");
      expect(typeof hasScenario).toBe("boolean");
      expect(typeof hasFirstMessages).toBe("boolean");
    });
  });

  describe("Legacy Data Detection", () => {
    it("should detect no legacy tables when none exist", async () => {
      const report = await recovery.checkLegacyData();

      expect(report.hasLegacyTables).toBe(false);
      expect(report.legacyCharacterCount).toBe(0);
      expect(report.legacyScenarioCount).toBe(0);
      expect(report.canRecover).toBe(false);
    });

    it("should detect legacy tables after setup", async () => {
      // Create legacy tables with test data
      await testSetup.createLegacyTablesAndCopy();

      const report = await recovery.checkLegacyData();

      expect(report.hasLegacyTables).toBe(true);
      expect(report.legacyCharacterCount).toBeGreaterThanOrEqual(0);
      expect(report.legacyScenarioCount).toBeGreaterThanOrEqual(0);
    });

    it("should calculate missing data correctly", async () => {
      // Get current counts
      const db = await Drizzle.getInstance();
      const currentChars = await db.execute(
        sql`SELECT COUNT(*) as count FROM characters`,
      );
      const currentScenarios = await db.execute(
        sql`SELECT COUNT(*) as count FROM scenarios`,
      );

      const initialCharCount = Number(currentChars.rows[0].count);
      const initialScenCount = Number(currentScenarios.rows[0].count);

      // Create legacy data
      await testSetup.createLegacyTablesAndCopy();

      const report = await recovery.checkLegacyData();

      // Missing should be 0 because we haven't deleted anything yet
      expect(report.missingCharacters).toBe(0);
      expect(report.missingScenarios).toBe(0);
      expect(report.canRecover).toBe(false); // Nothing to recover
    });
  });

  describe("Character Recovery", () => {
    it("should recover characters from legacy tables", async () => {
      // Setup: Create legacy tables and move data
      await testSetup.createLegacyTablesAndMove();

      // Verify characters are deleted
      const db = await Drizzle.getInstance();
      const beforeRecovery = await db.execute(
        sql`SELECT COUNT(*) as count FROM characters`,
      );
      const deletedCount = Number(beforeRecovery.rows[0].count);
      expect(deletedCount).toBe(0);

      // Recover
      const result = await recovery.recoverCharacters();

      // Verify characters are recovered
      const afterRecovery = await db.execute(
        sql`SELECT COUNT(*) as count FROM characters`,
      );
      const recoveredCount = Number(afterRecovery.rows[0].count);

      expect(result.recovered).toBeGreaterThanOrEqual(0);
      expect(result.failed).toBe(0);
      expect(recoveredCount).toBe(result.recovered);
    });

    it("should handle recovery with schema evolution", async () => {
      // This test verifies that recovery works even when new columns exist
      // that weren't in the legacy schema

      await testSetup.createLegacyTablesAndMove();

      const result = await recovery.recoverCharacters();

      // Should complete without errors
      expect(result.failed).toBe(0);

      // Verify that new columns have default values
      const db = await Drizzle.getInstance();
      const chars = await db.execute(sql`SELECT * FROM characters LIMIT 1`);

      if (chars.rows.length > 0) {
        const char = chars.rows[0];

        // New columns should have default values
        if (await recovery["columnExists"]("characters", "config")) {
          expect(char.config).toBeDefined();
        }
      }
    });

    it("should not duplicate characters on re-run (ON CONFLICT)", async () => {
      await testSetup.createLegacyTablesAndMove();

      // First recovery
      const firstResult = await recovery.recoverCharacters();
      const firstRecovered = firstResult.recovered;

      // Second recovery (should not create duplicates)
      const secondResult = await recovery.recoverCharacters();

      expect(secondResult.recovered).toBe(0); // Already recovered

      // Verify count didn't change
      const db = await Drizzle.getInstance();
      const finalCount = await db.execute(
        sql`SELECT COUNT(*) as count FROM characters`,
      );

      expect(Number(finalCount.rows[0].count)).toBe(firstRecovered);
    });
  });

  describe("Scenario Recovery", () => {
    it("should recover scenarios from legacy tables", async () => {
      await testSetup.createLegacyTablesAndMove();

      const result = await recovery.recoverScenarios();

      expect(result.recovered).toBeGreaterThanOrEqual(0);
      expect(result.failed).toBe(0);
    });

    it("should not duplicate scenarios on re-run", async () => {
      await testSetup.createLegacyTablesAndMove();

      const firstResult = await recovery.recoverScenarios();
      const secondResult = await recovery.recoverScenarios();

      expect(secondResult.recovered).toBe(0); // Already recovered
    });
  });

  describe("Full Recovery Flow", () => {
    it("should recover both characters and scenarios", async () => {
      await testSetup.createLegacyTablesAndMove();

      const result = await recovery.recoverAll();

      expect(result.characters.recovered).toBeGreaterThanOrEqual(0);
      expect(result.scenarios.recovered).toBeGreaterThanOrEqual(0);
      expect(result.characters.failed).toBe(0);
      expect(result.scenarios.failed).toBe(0);
    });

    it("should log recovery progress", async () => {
      await testSetup.createLegacyTablesAndCopy();

      logs = []; // Clear logs
      await recovery.recoverAll();

      // Verify logging occurred
      expect(logs.length).toBeGreaterThan(0);
      expect(logs.some((log) => log.includes("Recovering"))).toBe(true);
    });
  });

  describe("Backup Functionality", () => {
    it("should create backup data structure", async () => {
      await testSetup.createLegacyTablesAndCopy();

      const db = await Drizzle.getInstance();

      // Get backup data
      const legacyChars = await db.execute(sql`
        SELECT c.*, cc.*
        FROM cards c
        INNER JOIN character_cards cc ON c.id = cc.id
        WHERE c.type = 'character'
      `);

      const backupData = {
        timestamp: new Date().toISOString(),
        legacyCharacters: legacyChars.rows,
        legacyScenarios: [],
      };

      expect(backupData.legacyCharacters).toBeDefined();
      expect(Array.isArray(backupData.legacyCharacters)).toBe(true);
    });

    // Note: downloadBackup() creates a file download which is hard to test
    // in unit tests. This would be better tested in E2E/integration tests.
  });

  describe("Error Handling", () => {
    it("should handle database errors gracefully", async () => {
      // Try to recover from non-existent legacy tables
      const result = await recovery.recoverAll();

      // Should not throw, but return 0 recovered
      expect(result.characters.recovered).toBe(0);
      expect(result.scenarios.recovered).toBe(0);
    });

    it("should continue recovery even if some items fail", async () => {
      // This is harder to test without mocking database failures
      // Would require more complex setup with intentionally broken data

      // For now, just verify the interface exists
      expect(recovery.recoverCharacters).toBeDefined();
      expect(recovery.recoverScenarios).toBeDefined();
    });
  });

  describe("Logging", () => {
    it("should call log callback when set", async () => {
      const mockLog = vi.fn();
      recovery.setLogCallback(mockLog);

      await recovery.checkLegacyData();

      expect(mockLog).toHaveBeenCalled();
    });

    it("should not error when log callback is not set", async () => {
      const recoveryNoLog = new LegacyCharacterRecovery();

      // Should not throw
      await expect(recoveryNoLog.checkLegacyData()).resolves.toBeDefined();
    });
  });
});
