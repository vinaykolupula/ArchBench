import { describe, it, expect } from "vitest";
import { getLearningCard, listLearningConcepts, formatLearningCard } from "../src/index.js";

describe("Learning Mode & Pedagogical Engine", () => {
  it("should list all curated architectural concepts", () => {
    const concepts = listLearningConcepts();
    expect(concepts.length).toBeGreaterThanOrEqual(8);
  });

  it("should retrieve a learning card by ID or concept keyword", () => {
    const backpressureCard = getLearningCard("backpressure");
    expect(backpressureCard).toBeDefined();
    expect(backpressureCard?.concept).toContain("Backpressure");
    expect(backpressureCard?.mitigationOptions.length).toBeGreaterThan(0);

    const idempotencyCard = getLearningCard("concept-idempotency");
    expect(idempotencyCard).toBeDefined();
    expect(idempotencyCard?.concept).toContain("Idempotency");
  });

  it("should format learning cards in guided and quick modes", () => {
    const card = getLearningCard("outbox")!;
    const guidedText = formatLearningCard(card, "guided");
    expect(guidedText).toContain("# Architecture Learning Card");
    expect(guidedText).toContain("Real-World Production Failure Scenario");

    const quickText = formatLearningCard(card, "quick");
    expect(quickText).toContain("### Transactional Outbox Pattern");
    expect(quickText).toContain("**Actionable Advice:**");
  });
});
