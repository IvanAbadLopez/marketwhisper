/**
 * Tests for company entity utilities
 * @module entities/company
 */

import { describe, it, expect } from "vitest";
import { 
  formatMarketCap, 
  getSentimentColor, 
  getReliabilityColor, 
  getSentimentLabel,
  getGlobalScoreColor,
  getGlobalScoreLabelColor
} from "./utils";

describe("Company Utils", () => {
  describe("formatMarketCap", () => {
    it("should format trillion values", () => {
      expect(formatMarketCap(2_500_000_000_000)).toBe("$2.50T");
    });

    it("should format billion values", () => {
      expect(formatMarketCap(50_000_000_000)).toBe("$50.00B");
    });

    it("should format million values", () => {
      expect(formatMarketCap(500_000_000)).toBe("$500.00M");
    });

    it("should handle null values", () => {
      expect(formatMarketCap(null)).toBe("N/A");
    });
  });

  describe("getSentimentColor", () => {
    it("should return green for positive sentiment", () => {
      expect(getSentimentColor(0.5)).toBe("bg-green-500 dark:bg-green-600");
    });

    it("should return red for negative sentiment", () => {
      expect(getSentimentColor(-0.5)).toBe("bg-red-500 dark:bg-red-600");
    });

    it("should return gray for neutral sentiment", () => {
      expect(getSentimentColor(0.1)).toBe("bg-zinc-400 dark:bg-zinc-600");
    });

    it("should handle null values", () => {
      expect(getSentimentColor(null)).toBe("bg-zinc-300 dark:bg-zinc-700");
    });
  });

  describe("getReliabilityColor", () => {
    it("should return green for high reliability", () => {
      expect(getReliabilityColor(9)).toBe("bg-green-500 dark:bg-green-600");
    });

    it("should return yellow for medium reliability", () => {
      expect(getReliabilityColor(6)).toBe("bg-yellow-500 dark:bg-yellow-600");
    });

    it("should return red for low reliability", () => {
      expect(getReliabilityColor(3)).toBe("bg-red-500 dark:bg-red-600");
    });

    it("should handle null values", () => {
      expect(getReliabilityColor(null)).toBe("bg-zinc-300 dark:bg-zinc-700");
    });
  });

  describe("getSentimentLabel", () => {
    it("should return BULLISH for positive sentiment", () => {
      expect(getSentimentLabel(0.5)).toBe("BULLISH");
    });

    it("should return BEARISH for negative sentiment", () => {
      expect(getSentimentLabel(-0.5)).toBe("BEARISH");
    });

    it("should return NEUTRAL for neutral sentiment", () => {
      expect(getSentimentLabel(0.1)).toBe("NEUTRAL");
    });

    it("should handle null values", () => {
      expect(getSentimentLabel(null)).toBe("NEUTRAL");
    });
  });

  describe("getGlobalScoreColor", () => {
    it("should return green for high global score (>= 75)", () => {
      expect(getGlobalScoreColor(85)).toBe("bg-green-500 dark:bg-green-600");
      expect(getGlobalScoreColor(75)).toBe("bg-green-500 dark:bg-green-600");
    });

    it("should return blue for medium-high global score (>= 60)", () => {
      expect(getGlobalScoreColor(70)).toBe("bg-blue-500 dark:bg-blue-600");
      expect(getGlobalScoreColor(60)).toBe("bg-blue-500 dark:bg-blue-600");
    });

    it("should return amber for medium-low global score (>= 40)", () => {
      expect(getGlobalScoreColor(50)).toBe("bg-amber-500 dark:bg-amber-600");
      expect(getGlobalScoreColor(40)).toBe("bg-amber-500 dark:bg-amber-600");
    });

    it("should return red for low global score (< 40)", () => {
      expect(getGlobalScoreColor(30)).toBe("bg-red-500 dark:bg-red-600");
      expect(getGlobalScoreColor(0)).toBe("bg-red-500 dark:bg-red-600");
    });

    it("should handle null values", () => {
      expect(getGlobalScoreColor(null)).toBe("bg-zinc-300 dark:bg-zinc-700");
    });

    it("should handle edge cases at boundaries", () => {
      expect(getGlobalScoreColor(74.9)).toBe("bg-blue-500 dark:bg-blue-600");
      expect(getGlobalScoreColor(59.9)).toBe("bg-amber-500 dark:bg-amber-600");
      expect(getGlobalScoreColor(39.9)).toBe("bg-red-500 dark:bg-red-600");
    });
  });

  describe("getGlobalScoreLabelColor", () => {
    it("should return green for Strong label", () => {
      expect(getGlobalScoreLabelColor("Strong")).toBe("text-green-600 dark:text-green-400");
    });

    it("should return amber for Moderate label", () => {
      expect(getGlobalScoreLabelColor("Moderate")).toBe("text-amber-600 dark:text-amber-400");
    });

    it("should return blue for Neutral label", () => {
      expect(getGlobalScoreLabelColor("Neutral")).toBe("text-blue-600 dark:text-blue-400");
    });

    it("should return red for Weak label", () => {
      expect(getGlobalScoreLabelColor("Weak")).toBe("text-red-600 dark:text-red-400");
    });

    it("should handle null values", () => {
      expect(getGlobalScoreLabelColor(null)).toBe("text-zinc-600 dark:text-zinc-400");
    });

    it("should handle undefined values", () => {
      expect(getGlobalScoreLabelColor("")).toBe("text-zinc-600 dark:text-zinc-400");
    });

    it("should handle unknown label values", () => {
      expect(getGlobalScoreLabelColor("Unknown")).toBe("text-zinc-600 dark:text-zinc-400");
    });
  });
});
