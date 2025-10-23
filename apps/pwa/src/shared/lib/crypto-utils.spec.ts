import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  validatePassphraseStrength,
  wrapPrivateKey,
  unwrapPrivateKey,
  generateSymmetricKey,
  exportSymmetricKey,
  importSymmetricKey,
  generateIV,
} from "@/shared/lib/crypto-utils";

describe("Crypto Utilities", () => {
  // Mock crypto keys
  const mockPrivateKey = {
    type: "private",
    algorithm: { name: "RSA-OAEP" },
    extractable: true,
    usages: ["decrypt"],
  } as CryptoKey;

  const mockSymmetricKey = {
    type: "secret",
    algorithm: { name: "AES-GCM" },
    extractable: true,
    usages: ["encrypt", "decrypt"],
  } as CryptoKey;

  beforeEach(() => {
    // Mock subtle crypto API
    vi.stubGlobal("crypto", {
      subtle: {
        exportKey: vi.fn().mockResolvedValue(new ArrayBuffer(32)),
        importKey: vi.fn().mockImplementation((format, keyData, algorithm) => {
          if (algorithm.name === "PBKDF2") {
            return Promise.resolve({
              type: "private",
              algorithm: { name: "PBKDF2" },
              extractable: false,
              usages: ["deriveKey"],
            });
          } else if (algorithm.name === "AES-GCM") {
            return Promise.resolve(mockSymmetricKey);
          } else {
            return Promise.resolve(mockPrivateKey);
          }
        }),
        deriveKey: vi.fn().mockResolvedValue({
          type: "secret",
          algorithm: { name: "AES-GCM" },
          extractable: false,
          usages: ["encrypt", "decrypt"],
        }),
        encrypt: vi.fn().mockResolvedValue(new ArrayBuffer(48)),
        decrypt: vi.fn().mockResolvedValue(new ArrayBuffer(32)),
        generateKey: vi.fn().mockResolvedValue(mockSymmetricKey),
      },
      getRandomValues: vi.fn().mockImplementation((array) => {
        // Fill array with pseudo-random values for testing
        for (let i = 0; i < array.length; i++) {
          array[i] = i % 256;
        }
        return array;
      }),
    });

    // Mock TextEncoder
    global.TextEncoder = vi.fn().mockImplementation(() => ({
      encode: vi.fn().mockReturnValue(new Uint8Array(10)),
    }));

    // Mock String.fromCharCode
    global.String.fromCharCode = vi.fn().mockImplementation((...codes) => {
      // Simple implementation to avoid recursion - just join the characters
      let result = "";
      for (let i = 0; i < codes.length; i++) {
        // Use fromCodePoint directly instead of fromCharCode to avoid recursion
        result += String.fromCodePoint(codes[i]);
      }
      return result;
    });

    // Mock btoa and atob functions
    global.btoa = vi.fn().mockImplementation((str) => "base64encoded" + str);
    global.atob = vi
      .fn()
      .mockImplementation((str) => str.replace("base64encoded", ""));

    // Mock JSON stringify/parse
    global.JSON.stringify = vi.fn().mockReturnValue("{}");
    global.JSON.parse = vi.fn().mockReturnValue({
      salt: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16],
      iv: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
      encryptedKey: [1, 2, 3, 4, 5],
    });
  });

  describe("validatePassphraseStrength", () => {
    it("[S-U-VPS-001] 강력한 암호 검증 - 모든 요구사항을 충족하는 강력한 암호는 유효한 것으로 검증된다.", () => {
      // Given
      const strongPassphrase = "StrongP@ssword123";

      // When
      const result = validatePassphraseStrength(strongPassphrase);

      // Then
      expect(result.isValid).toBe(true);
      expect(result.reason).toBeUndefined();
    });

    it("[S-U-VPS-002] 짧은 암호 검증 - 너무 짧은 암호는 유효하지 않은 것으로 검증된다.", () => {
      // Given
      const shortPassphrase = "Short1@";

      // When
      const result = validatePassphraseStrength(shortPassphrase);

      // Then
      expect(result.isValid).toBe(false);
      expect(result.reason).toContain("at least 12 characters");
    });

    it("[S-U-VPS-003] 복잡성 부족 암호 검증 - 복잡성 요구사항을 충족하지 않는 암호는 유효하지 않다.", () => {
      // Test missing uppercase
      expect(validatePassphraseStrength("nouppercase123!")).toEqual({
        isValid: false,
        reason:
          "Passphrase must include uppercase, lowercase, numbers, and special characters",
      });

      // Test missing lowercase
      expect(validatePassphraseStrength("NOLOWERCASE123!")).toEqual({
        isValid: false,
        reason:
          "Passphrase must include uppercase, lowercase, numbers, and special characters",
      });

      // Test missing numbers
      expect(validatePassphraseStrength("NoNumbers!@#")).toEqual({
        isValid: false,
        reason:
          "Passphrase must include uppercase, lowercase, numbers, and special characters",
      });

      // Test missing special characters
      expect(validatePassphraseStrength("NoSpecialChars123")).toEqual({
        isValid: false,
        reason:
          "Passphrase must include uppercase, lowercase, numbers, and special characters",
      });
    });
  });

  describe("wrapPrivateKey", () => {
    it("[S-U-WPK-001] 개인 키 래핑 - 암호를 사용하여 개인 키를 성공적으로 래핑한다.", async () => {
      // Given
      const passphrase = "StrongP@ssword123";

      // When
      const result = await wrapPrivateKey(mockPrivateKey, passphrase);

      // Then
      expect(result).toBeDefined();
      expect(typeof result).toBe("string");
      expect(global.btoa).toHaveBeenCalled();
      expect(crypto.subtle.exportKey).toHaveBeenCalledWith(
        "pkcs8",
        mockPrivateKey,
      );
      expect(crypto.subtle.importKey).toHaveBeenCalled();
      expect(crypto.subtle.deriveKey).toHaveBeenCalled();
      expect(crypto.subtle.encrypt).toHaveBeenCalled();
      expect(crypto.getRandomValues).toHaveBeenCalledTimes(2); // Salt and IV
    });
  });

  describe("unwrapPrivateKey", () => {
    it("[S-U-UPK-001] 개인 키 언래핑 - 올바른 암호로 개인 키를 성공적으로 언래핑한다.", async () => {
      // Given
      const wrappedKeyData = "base64encoded{}";
      const passphrase = "StrongP@ssword123";

      // When
      const result = await unwrapPrivateKey(wrappedKeyData, passphrase);

      // Then
      expect(result).not.toBeNull();
      expect(global.atob).toHaveBeenCalledWith(wrappedKeyData);
      expect(crypto.subtle.importKey).toHaveBeenCalled();
      expect(crypto.subtle.deriveKey).toHaveBeenCalled();
      expect(crypto.subtle.decrypt).toHaveBeenCalled();
    });

    it("[S-U-UPK-002] 잘못된 암호 처리 - 잘못된 암호를 사용하면 null을 반환한다.", async () => {
      // Given
      const wrappedKeyData = "base64encoded{}";
      const wrongPassphrase = "WrongP@ssword123";

      // Setup crypto to throw on decrypt
      vi.stubGlobal("crypto", {
        subtle: {
          importKey: vi.fn().mockResolvedValue({
            type: "private",
            algorithm: { name: "PBKDF2" },
            extractable: false,
            usages: ["deriveKey"],
          }),
          deriveKey: vi.fn().mockResolvedValue({
            type: "secret",
            algorithm: { name: "AES-GCM" },
            extractable: false,
            usages: ["decrypt"],
          }),
          decrypt: vi.fn().mockRejectedValue(new Error("Decryption failed")),
        },
      });

      // When
      const result = await unwrapPrivateKey(wrappedKeyData, wrongPassphrase);

      // Then
      expect(result).toBeNull();
    });
  });

  describe("generateSymmetricKey", () => {
    it("[S-U-GSK-001] 대칭 키 생성 - AES-GCM 대칭 키를 성공적으로 생성한다.", async () => {
      // When
      const result = await generateSymmetricKey();

      // Then
      expect(result).toBeDefined();
      expect(crypto.subtle.generateKey).toHaveBeenCalledWith(
        {
          name: "AES-GCM",
          length: 256,
        },
        true,
        ["encrypt", "decrypt"],
      );
    });
  });

  describe("exportSymmetricKey", () => {
    it("[S-U-ESK-001] 대칭 키 내보내기 - 대칭 키를 성공적으로 내보낸다.", async () => {
      // When
      const result = await exportSymmetricKey(mockSymmetricKey);

      // Then
      expect(result).toBeDefined();
      expect(result).toBeInstanceOf(ArrayBuffer);
      expect(crypto.subtle.exportKey).toHaveBeenCalledWith(
        "raw",
        mockSymmetricKey,
      );
    });
  });

  describe("importSymmetricKey", () => {
    it("[S-U-ISK-001] 대칭 키 가져오기 - 원시 키 데이터로부터 대칭 키를 성공적으로 가져온다.", async () => {
      // Given
      const rawKeyData = new ArrayBuffer(32);

      // When
      const result = await importSymmetricKey(rawKeyData);

      // Then
      expect(result).toBeDefined();
      expect(result).toEqual(mockSymmetricKey);
      expect(crypto.subtle.importKey).toHaveBeenCalledWith(
        "raw",
        rawKeyData,
        {
          name: "AES-GCM",
          length: 256,
        },
        false,
        ["decrypt", "encrypt"],
      );
    });
  });

  describe("generateIV", () => {
    it("[S-U-GIV-001] 초기화 벡터 생성 - AES-GCM 암호화를 위한 초기화 벡터를 성공적으로 생성한다.", () => {
      // When
      const result = generateIV();

      // Then
      expect(result).toBeDefined();
      expect(result).toBeInstanceOf(Uint8Array);
      expect(result.length).toBe(12);
      expect(crypto.getRandomValues).toHaveBeenCalledWith(
        expect.any(Uint8Array),
      );
    });
  });

  describe("Base64 encoding/decoding patterns", () => {
    it("[S-U-B64-001] ArrayBuffer to Base64 - ArrayBuffer를 Base64 문자열로 변환한다.", () => {
      // Given
      const buffer = new ArrayBuffer(4);
      const view = new Uint8Array(buffer);
      view.set([65, 66, 67, 68]); // ABCD

      // When
      const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));

      // Then
      expect(base64).toBeDefined();
      expect(String.fromCharCode).toHaveBeenCalled();
      expect(btoa).toHaveBeenCalled();
    });

    it("[S-U-B64-002] Base64 to ArrayBuffer - Base64 문자열을 ArrayBuffer로 변환한다.", () => {
      // Given
      const base64 = "QUJDRA=="; // ABCD

      // When - simulate decoding process used in our code
      const binary = atob(base64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      const buffer = bytes.buffer;

      // Then
      expect(buffer).toBeDefined();
      expect(buffer).toBeInstanceOf(ArrayBuffer);
      expect(atob).toHaveBeenCalledWith(base64);
    });
  });
});
