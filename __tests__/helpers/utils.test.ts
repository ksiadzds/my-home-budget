import { describe, it, expect } from "vitest";
import { cn } from "@/lib/utils";

/**
 * Testy jednostkowe dla funkcji pomocniczych
 */

describe("Utils", () => {
  describe("cn (classnames utility)", () => {
    it("łączy klasy CSS", () => {
      const result = cn("class1", "class2", "class3");
      expect(result).toContain("class1");
      expect(result).toContain("class2");
      expect(result).toContain("class3");
    });

    it("obsługuje warunkowe klasy", () => {
      const result = cn("base", false && "hidden", true && "visible");
      expect(result).toContain("base");
      expect(result).toContain("visible");
      expect(result).not.toContain("hidden");
    });

    it("obsługuje undefined i null", () => {
      const result = cn("base", undefined, null, "other");
      expect(result).toContain("base");
      expect(result).toContain("other");
    });

    it("merguje klasy Tailwind konfliktujące", () => {
      // tailwind-merge powinien rozwiązać konflikty
      const result = cn("p-4", "p-8");
      // Powinna zostać tylko ostatnia klasa padding
      expect(result).toBe("p-8");
    });
  });
});
