import { describe, expect, it } from "vitest";

import { Entry } from "@/modules/card/domain/entry";
import { Lorebook } from "@/modules/card/domain/lorebook";

describe("Lorebook", () => {
  describe("searchEntries()", () => {
    describe("[SC-D-L-004] 로어북 엔트리 검색 - 엔트리 이름, 키, 보조 키, 내용으로 엔트리를 검색한다.", () => {
      it("페이지네이션", () => {
        // Given
        const entry1 = Entry.create({
          name: "Entry 1",
          enabled: true,
          keys: ["key1", "key2"],
          recallRange: 1,
          content: "Content 1",
        }).getValue();
        const entry2 = Entry.create({
          name: "Entry 2",
          enabled: true,
          keys: ["key1", "key2"],
          recallRange: 1,
          content: "Content 2",
        }).getValue();
        const entry3 = Entry.create({
          name: "Entry 3",
          enabled: true,
          keys: ["key1", "key2"],
          recallRange: 1,
          content: "Content 3",
        }).getValue();
        const lorebook = Lorebook.create({
          entries: [entry1, entry2, entry3],
        }).getValue();

        // When
        const result = lorebook.searchEntries({
          limit: 2,
        });

        // Then
        expect(result.isSuccess).toBe(true);
        const entries = result.getValue();
        expect(entries.length).toBe(2);
      });

      it("검색 키워드", () => {
        // Given
        const keyword = "KEYWORD";
        const entry1 = Entry.create({
          name: "Entry KEYWORD",
          enabled: true,
          keys: ["key1", "key2"],
          recallRange: 1,
          content: "Content 1",
        }).getValue();
        const entry2 = Entry.create({
          name: "Entry 2",
          enabled: true,
          keys: ["KEYWORD", "key2"],
          recallRange: 1,
          content: "Content 2",
        }).getValue();
        const entry3 = Entry.create({
          name: "Entry 3",
          enabled: true,
          keys: ["key1", "KEYWORD"],
          recallRange: 1,
          content: "Content 3",
        }).getValue();
        const entry4 = Entry.create({
          name: "Entry 4",
          enabled: true,
          keys: ["key1", "key2"],
          recallRange: 1,
          content: "Content KEYWORD",
        }).getValue();
        const entry5 = Entry.create({
          name: "Entry 5",
          enabled: true,
          keys: ["key1", "key2"],
          recallRange: 1,
          content: "Content 5",
        }).getValue();
        const lorebook = Lorebook.create({
          entries: [entry1, entry2, entry3, entry4, entry5],
        }).getValue();

        // When
        const result = lorebook.searchEntries({
          limit: 5,
          keyword,
        });

        // Then
        expect(result.isSuccess).toBe(true);
        const entries = result.getValue();
        expect(entries.length).toBe(4);
        expect(entries).toContain(entry1);
        expect(entries).toContain(entry2);
        expect(entries).toContain(entry3);
        expect(entries).toContain(entry4);
        expect(entries).not.toContain(entry5);
      });
    });
  });

  describe("scanHistory()", () => {
    describe("[SC-D-L-006] 로어북 엔트리 활성 - 엔트리 키를 통해 엔트리의 활성화 여부를 결정한다.", () => {
      it("엔트리 키 일치", () => {
        // Given
        const entry = Entry.create({
          name: "Entry 1",
          enabled: true,
          keys: ["key1", "key2"],
          recallRange: 1,
          content: "Content 1",
        }).getValue();
        const lorebook = Lorebook.create({
          entries: [entry],
        }).getValue();

        // When
        const result = lorebook.scanHistory(["Message content key1"]);

        // Then
        expect(result.isSuccess).toBe(true);
        const entries = result.getValue();
        expect(entries).toContain(entry);
      });

      it("엔트리 키 불일치", () => {
        // Given
        const entry = Entry.create({
          name: "Entry 1",
          enabled: true,
          keys: ["key1", "key2"],
          recallRange: 1,
          content: "Content 1",
        }).getValue();
        const lorebook = Lorebook.create({
          entries: [entry],
        }).getValue();

        // When
        const result = lorebook.scanHistory(["Message content key3"]);

        // Then
        expect(result.isSuccess).toBe(true);
        const entries = result.getValue();
        expect(entries.length).toBe(0);
      });
    });

    describe("[SC-D-L-007] 로어북 엔트리 비활성 - 엔트리가 항상 활성화되지 않는다.", () => {
      it("엔트리 키 일치", () => {
        // Given
        const entry = Entry.create({
          name: "Entry 1",
          enabled: false,
          keys: ["key1", "key2"],
          recallRange: 1,
          content: "Content 1",
        }).getValue();
        const lorebook = Lorebook.create({
          entries: [entry],
        }).getValue();

        // When
        const result = lorebook.scanHistory(["Message content key1"]);

        // Then
        expect(result.isSuccess).toBe(true);
        const entries = result.getValue();
        expect(entries.length).toBe(0);
      });

      it("엔트리 키 불일치", () => {
        // Given
        const entry = Entry.create({
          name: "Entry 1",
          enabled: false,
          keys: ["key1", "key2"],
          recallRange: 1,
          content: "Content 1",
        }).getValue();
        const lorebook = Lorebook.create({
          entries: [entry],
        }).getValue();

        // When
        const result = lorebook.scanHistory(["Message content key3"]);

        // Then
        expect(result.isSuccess).toBe(true);
        const entries = result.getValue();
        expect(entries.length).toBe(0);
      });
    });

    describe("[SC-D-L-009] 로어북 엔트리 키 대소문자 구분하지 않음 - 엔트리 활성화 여부를 확인할 때 활성화 키의 대소문자를 구분하지 않는다.", () => {
      it("대소문자 일치", () => {
        // Given
        const entry = Entry.create({
          name: "Entry 1",
          enabled: true,
          keys: ["key1", "key2"],
          recallRange: 1,
          content: "Content 1",
        }).getValue();
        const lorebook = Lorebook.create({
          entries: [entry],
        }).getValue();

        // When
        const result = lorebook.scanHistory(["Message content key1"]);

        // Then
        expect(result.isSuccess).toBe(true);
        const entries = result.getValue();
        expect(entries).toContain(entry);
      });

      it("대소문자 불일치", () => {
        // Given
        const entry = Entry.create({
          name: "Entry 1",
          enabled: true,
          keys: ["key1", "key2"],
          recallRange: 1,
          content: "Content 1",
        }).getValue();
        const lorebook = Lorebook.create({
          entries: [entry],
        }).getValue();

        // When
        const result = lorebook.scanHistory(["Message content KEY1"]);

        // Then
        expect(result.isSuccess).toBe(true);
        const entries = result.getValue();
        expect(entries).toContain(entry);
      });
    });

    describe("[SC-D-L-011] 로어북 엔트리 스캔 뎁스 - 히스토리의 특정 뎁스까지 엔트리 활성화 여부를 확인한다.", () => {
      it("엔트리 스캔 댑스 3, 뎁스 3에 엔트리 키 존재: 활성", () => {
        // Given
        const entry = Entry.create({
          name: "Entry 1",
          enabled: true,
          keys: ["key1", "key2"],
          recallRange: 3,
          content: "Content 1",
        }).getValue();
        const lorebook = Lorebook.create({
          entries: [entry],
        }).getValue();

        // When
        const result = lorebook.scanHistory([
          "Depth1 Message content",
          "Depth2 Message content",
          "Depth3 Message content key1",
        ]);

        // Then
        expect(result.isSuccess).toBe(true);
        const entries = result.getValue();
        expect(entries).toContain(entry);
      });

      it("엔트리 스캔 댑스 1, 뎁스 2에 엔트리 키 존재: 비활성", () => {
        // Given
        const entry = Entry.create({
          name: "Entry 1",
          enabled: true,
          keys: ["key1", "key2"],
          recallRange: 1,
          content: "Content 1",
        }).getValue();
        const lorebook = Lorebook.create({
          entries: [entry],
        }).getValue();

        // When
        const result = lorebook.scanHistory([
          "Depth1 Message content",
          "Depth2 Message content key2",
          "Depth3 Message content",
        ]);

        // Then
        expect(result.isSuccess).toBe(true);
        const entries = result.getValue();
        expect(entries.length).toBe(0);
      });
    });

    /*
    describe("[SC-D-L-012] 로어북 엔트리 순서 - 활성화된 엔트리를 순서에 따라 내림차순으로 정렬한다.", () => {
      it("내림차순 정렬", () => {
        // Given
        const entry1 = Entry.create({
          name: "Entry 1",
          enabled: true,
          order: 1,
          keys: ["key1", "key2"],
          recallRange: 1,
          content: "Content 1",
        }).getValue();
        const entry2 = Entry.create({
          name: "Entry 2",
          enabled: true,
          order: 2,
          keys: ["key1", "key2"],
          recallRange: 1,
          content: "Content 2",
        }).getValue();
        const entry3 = Entry.create({
          name: "Entry 3",
          enabled: true,
          order: 3,
          keys: ["key1", "key2"],
          recallRange: 1,
          content: "Content 3",
        }).getValue();
        const lorebook = Lorebook.create({
          entries: [entry1, entry2, entry3],
        }).getValue();

        // When
        const result = lorebook.scanHistory(["Message content key1"]);

        // Then
        expect(result.isSuccess).toBe(true);
        const entries = result.getValue();
        expect(entries.length).toBe(3);
        expect(entries[0]).toBe(entry3);
        expect(entries[1]).toBe(entry2);
        expect(entries[2]).toBe(entry1);
      });
    });
    */

    /*
    describe("[SC-D-L-013] 로어북 엔트리 확률 - 활성화된 엔트리를 설정한 확률에 따라 다시 활성화 여부를 결정한다.", () => {
      it("신뢰 수준 95%, 오차 범위 ±5%, 기대 비율 50%: 500회 실시", () => {
        // Given
        const entry = Entry.create({
          name: "Entry 1",
          enabled: true,
          order: 1,
          keys: ["key1", "key2"],
          recallRange: 1,
          content: "Content 1",
        }).getValue();
        const lorebook = Lorebook.create({
          entries: [entry],
        }).getValue();

        // When
        let activeCount = 0;
        for (let i = 0; i < 500; i++) {
          const result = lorebook.scanHistory(["Message content key1"]);
          if (result.isSuccess && result.getValue().length > 0) {
            activeCount++;
          }
        }

        // Then
        expect(activeCount).toBeGreaterThanOrEqual(225);
        expect(activeCount).toBeLessThanOrEqual(275);
      });
    });
    */
  });
});
