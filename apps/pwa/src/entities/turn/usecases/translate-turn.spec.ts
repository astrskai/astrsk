import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from "vitest";

import { UniqueEntityID } from "@/shared/domain/unique-entity-id";

import { TranslationConfig } from "@/entities/session/domain/translation-config";
import { Option } from "@/entities/turn/domain/option";
import { Turn } from "@/entities/turn/domain/turn";
import { DrizzleTurnRepo } from "@/entities/turn/repos/impl/drizzle-turn-repo";
import { TranslateTurn } from "@/entities/turn/usecases/translate-turn";
import mockGoogleTranslate from "@test/translation/translate-message/mock-google-translate.json";

const restHandler = [
  http.get("https://translate.googleapis.com/translate_a/single", () => {
    return HttpResponse.json(mockGoogleTranslate);
  }),
];

const server = setupServer(...restHandler);

describe("TranslateMessage", () => {
  let target: TranslateTurn;

  let turnRepo: DrizzleTurnRepo;

  beforeAll(() => {
    server.listen({ onUnhandledRequest: "error" });
  });

  beforeEach(() => {
    turnRepo = new DrizzleTurnRepo();

    target = new TranslateTurn(turnRepo, turnRepo);
  });

  afterEach(async () => {
    server.resetHandlers();
  });

  afterAll(() => {
    server.close();
  });

  it("[T-U-TM-001] 메시지 번역 - 메시지를 번역한다.", async () => {
    // Given
    const translationConfig = TranslationConfig.create({
      displayLanguage: "ko",
      promptLanguage: "en",
    }).getValue();
    const option = Option.create({
      content: "Hello, Nami. I'm Luffy.",
      tokenSize: 6,
    }).getValue();
    const message = Turn.create({
      sessionId: new UniqueEntityID(),
      characterCardId: new UniqueEntityID(),
      characterName: "Luffy",
      options: [option],
    }).getValue();
    await turnRepo.saveTurn(message);

    // When
    const result = await target.execute({
      turnId: message.id,
      isUser: false,
      config: translationConfig,
    });

    // Then
    expect(result.isSuccess).toBe(true);
    const savedMessage = (await turnRepo.getTurnById(message.id)).getValue();
    expect(savedMessage.translations?.get("ko")).toBe(
      "안녕, 나미. 저는 루피입니다.",
    );
  });
});
