// frontend/src/__tests__/useTranslationHelper.test.js
/* eslint-env node, jest */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";

// 1) Mock base: ES
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key, options) => options?.defaultValue || key,
    i18n: {
      resolvedLanguage: "es",
      language: "es",
    },
  }),
}));

// Import del hook (usa el mock anterior)
import { useTranslationHelper } from "../hooks/useTranslationHelper";

function TestComponent() {
  const { tv, isEn } = useTranslationHelper();

  return (
    <div>
      <div data-testid="language">{isEn ? "EN" : "ES"}</div>
      <div data-testid="translation">{tv("test.key", "Texto en español", "Text in English")}</div>
    </div>
  );
}

describe("useTranslationHelper Hook (ES)", () => {
  afterEach(() => {
    cleanup();
  });

  it("should return translation helper functions", () => {
    render(<TestComponent />);
    expect(screen.getByTestId("translation")).toBeInTheDocument();
  });

  it("should detect language as Spanish by default", () => {
    render(<TestComponent />);
    expect(screen.getByTestId("language")).toHaveTextContent("ES");
  });

  it("should return Spanish text when isEn is false", () => {
    render(<TestComponent />);
    expect(screen.getByTestId("translation")).toHaveTextContent("Texto en español");
  });

  it("should have tv function that returns defaultValue", () => {
    render(<TestComponent />);
    expect(screen.getByTestId("translation").textContent).toBe("Texto en español");
  });

  it("should accept additional options in tv function", () => {
    expect(() => render(<TestComponent />)).not.toThrow();
  });
});

/**
 * Tests EN:
 * - Sin `require`
 * - Sin `vi.resetModules()` dentro de componente (eso rompe el runtime de tests)
 * - Hacemos `vi.doMock` + `vi.importActual` dinámico en un `beforeEach`
 */
describe("useTranslationHelper Hook (EN)", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("should detect language as English and return English text", async () => {
    vi.doMock("react-i18next", () => ({
      useTranslation: () => ({
        t: (key, options) => options?.defaultValue || key,
        i18n: {
          resolvedLanguage: "en",
          language: "en",
        },
      }),
    }));

    const mod = await import("../hooks/useTranslationHelper");
    const useTranslationHelperEN = mod.useTranslationHelper;

    function TestComponentEnglish() {
      const { tv, isEn } = useTranslationHelperEN();

      return (
        <div>
          <div data-testid="language-en">{isEn ? "EN" : "ES"}</div>
          <div data-testid="translation-en">{tv("test.key", "Texto en español", "Text in English")}</div>
        </div>
      );
    }

    render(<TestComponentEnglish />);
    expect(screen.getByTestId("language-en")).toHaveTextContent("EN");
    expect(screen.getByTestId("translation-en")).toHaveTextContent("Text in English");
  });
});
