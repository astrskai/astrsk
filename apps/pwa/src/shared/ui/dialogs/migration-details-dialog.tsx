import DialogBase from "./base";
import { Button, ScrollArea } from "@/shared/ui";
import { useMigrationDetailsDialogStore } from "@/shared/stores/migration-details-dialog-store";
import { CheckCircle2, XCircle, Table, Code } from "lucide-react";
import { useMemo } from "react";

/**
 * Parse SQL statement to extract operation type and affected tables
 */
function parseSqlStatement(sql: string): {
  operation: string;
  tables: string[];
  description: string;
} {
  const trimmed = sql.trim();

  // CREATE TABLE
  if (/^CREATE TABLE/i.test(trimmed)) {
    const match = trimmed.match(/CREATE TABLE\s+(?:IF NOT EXISTS\s+)?"?(\w+)"?/i);
    const tableName = match?.[1] || "unknown";
    return {
      operation: "CREATE TABLE",
      tables: [tableName],
      description: `Create table "${tableName}"`,
    };
  }

  // DROP TABLE
  if (/^DROP TABLE/i.test(trimmed)) {
    const match = trimmed.match(/DROP TABLE\s+(?:IF EXISTS\s+)?"?(\w+)"?/i);
    const tableName = match?.[1] || "unknown";
    return {
      operation: "DROP TABLE",
      tables: [tableName],
      description: `Drop table "${tableName}"`,
    };
  }

  // ALTER TABLE - ADD COLUMN
  if (/^ALTER TABLE.*ADD COLUMN/i.test(trimmed)) {
    const tableMatch = trimmed.match(/ALTER TABLE\s+"?(\w+)"?/i);
    const columnMatch = trimmed.match(/ADD COLUMN\s+(?:IF NOT EXISTS\s+)?"?(\w+)"?\s+(\w+)/i);
    const tableName = tableMatch?.[1] || "unknown";
    const columnName = columnMatch?.[1] || "unknown";
    const columnType = columnMatch?.[2] || "";
    return {
      operation: "ADD COLUMN",
      tables: [tableName],
      description: `Add column "${columnName}" (${columnType}) to "${tableName}"`,
    };
  }

  // ALTER TABLE - DROP COLUMN
  if (/^ALTER TABLE.*DROP COLUMN/i.test(trimmed)) {
    const tableMatch = trimmed.match(/ALTER TABLE\s+"?(\w+)"?/i);
    const columnMatch = trimmed.match(/DROP COLUMN\s+(?:IF EXISTS\s+)?"?(\w+)"?/i);
    const tableName = tableMatch?.[1] || "unknown";
    const columnName = columnMatch?.[1] || "unknown";
    return {
      operation: "DROP COLUMN",
      tables: [tableName],
      description: `Drop column "${columnName}" from "${tableName}"`,
    };
  }

  // CREATE INDEX
  if (/^CREATE.*INDEX/i.test(trimmed)) {
    const match = trimmed.match(/ON\s+"?(\w+)"?/i);
    const tableName = match?.[1] || "unknown";
    return {
      operation: "CREATE INDEX",
      tables: [tableName],
      description: `Create index on "${tableName}"`,
    };
  }

  // Fallback for unrecognized statements
  const operationMatch = trimmed.match(/^(\w+(?:\s+\w+)?)/);
  return {
    operation: operationMatch?.[1] || "UNKNOWN",
    tables: [],
    description: trimmed.substring(0, 100) + (trimmed.length > 100 ? "..." : ""),
  };
}

/**
 * Global Migration Details Dialog
 * Controlled by migration-details-dialog-store
 * Use showMigrationDetails() to open from anywhere
 */
export function MigrationDetailsDialog() {
  const { isOpen, migration, close } = useMigrationDetailsDialogStore();

  // Parse SQL statements to extract meaningful information
  const parsedStatements = useMemo(() => {
    if (!migration?.sql || migration.sql.length === 0) return [];
    return migration.sql.map(parseSqlStatement);
  }, [migration?.sql]);

  // Extract unique affected tables
  const affectedTables = useMemo(() => {
    const tables = new Set<string>();
    parsedStatements.forEach((stmt) => {
      stmt.tables.forEach((table) => tables.add(table));
    });
    return Array.from(tables).sort();
  }, [parsedStatements]);

  const handleCopyDetails = () => {
    if (!migration?.sql) return;
    const content = migration.sql.join("\n\n");
    navigator.clipboard.writeText(content);
  };

  if (!migration) return null;

  const isSuccess = migration.status === "success";

  return (
    <DialogBase
      open={isOpen}
      onOpenChange={() => {
        // do nothing
      }}
      title={`Migration Details: ${migration.fileName}`}
      description={
        isSuccess
          ? `Successfully executed in ${migration.duration}ms`
          : `Failed after ${migration.duration}ms`
      }
      size="xl"
      content={
        <div className="flex flex-col gap-4">
          {/* Status Badge */}
          <div className="flex items-center gap-2">
            {isSuccess ? (
              <>
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <span className="text-sm font-medium text-green-400">
                  Migration Successful
                </span>
              </>
            ) : (
              <>
                <XCircle className="h-5 w-5 text-red-500" />
                <span className="text-sm font-medium text-red-400">
                  Migration Failed
                </span>
              </>
            )}
            <span className="text-text-secondary ml-auto text-xs">
              {migration.duration}ms
            </span>
          </div>

          {/* Affected Tables */}
          {affectedTables.length > 0 && (
            <div className="rounded-lg border border-gray-700 bg-gray-800/50 p-3">
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-200">
                <Table className="h-4 w-4" />
                Affected Tables ({affectedTables.length})
              </div>
              <div className="flex flex-wrap gap-2">
                {affectedTables.map((table) => (
                  <span
                    key={table}
                    className="rounded bg-blue-500/20 px-2 py-1 font-mono text-xs text-blue-300"
                  >
                    {table}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Operations Summary */}
          {parsedStatements.length > 0 && (
            <div className="rounded-lg border border-gray-700 bg-gray-800/50 p-3">
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-200">
                <Code className="h-4 w-4" />
                Operations ({parsedStatements.length})
              </div>
              <ScrollArea className="max-h-[200px]">
                <div className="space-y-2">
                  {parsedStatements.map((stmt, index) => (
                    <div
                      key={index}
                      className="rounded border border-gray-700 bg-gray-900/50 p-2"
                    >
                      <div className="mb-1 flex items-center gap-2">
                        <span className="rounded bg-purple-500/20 px-2 py-0.5 font-mono text-xs text-purple-300">
                          {stmt.operation}
                        </span>
                        {stmt.tables.length > 0 && (
                          <span className="font-mono text-xs text-gray-400">
                            {stmt.tables.join(", ")}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-300">{stmt.description}</p>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}

          {/* Raw SQL Statements */}
          {migration.sql && migration.sql.length > 0 ? (
            <div className="rounded-lg border border-gray-700 bg-gray-800/50 p-3">
              <div className="mb-2 text-sm font-semibold text-gray-200">
                SQL Statements
              </div>
              <ScrollArea className="h-full max-h-[300px]">
                <pre className="font-mono text-xs break-words whitespace-pre-wrap text-gray-300">
                  {migration.sql.join("\n\n")}
                </pre>
              </ScrollArea>
            </div>
          ) : (
            <div className="rounded-lg border border-gray-700 bg-gray-800/50 p-3">
              <p className="text-center text-sm text-gray-400">
                No SQL details available for this migration
              </p>
            </div>
          )}

          {/* Error Details (if failed) */}
          {!isSuccess && migration.error && (
            <div className="rounded-lg border border-red-500/50 bg-red-500/10 p-3">
              <div className="mb-2 text-sm font-semibold text-red-400">
                Error Details
              </div>
              <ScrollArea className="max-h-[150px]">
                <pre className="font-mono text-xs break-words whitespace-pre-wrap text-red-300">
                  {migration.error}
                </pre>
              </ScrollArea>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex justify-end gap-2">
            {migration.sql && migration.sql.length > 0 && (
              <Button variant="ghost" onClick={handleCopyDetails}>
                Copy SQL
              </Button>
            )}
            <Button onClick={close}>Close</Button>
          </div>
        </div>
      }
    />
  );
}
