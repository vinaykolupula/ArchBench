import { EvaluationContext, FitnessTest, ArchitectureFinding } from "./types.js";
import { unmappedRequirementsTest } from "./rules/requirement-coverage/unmapped-requirements.js";
import { unmeasurableNFRsTest } from "./rules/requirement-coverage/unmeasurable-nfrs.js";
import { synchronousCallDepthTest } from "./rules/structure/synchronous-call-depth.js";
import { statefulOwnershipTest } from "./rules/structure/stateful-ownership.js";
import { queueCapacityBalanceTest } from "./rules/scalability/queue-capacity-balance.js";
import { boundedRetriesTest } from "./rules/reliability/bounded-retries.js";
import { atLeastOnceIdempotencyTest } from "./rules/reliability/at-least-once-idempotency.js";
import { deadLetterQueueTest } from "./rules/reliability/dead-letter-queue.js";
import { singlePointOfFailureTest } from "./rules/reliability/single-point-of-failure.js";
import { dualWriteCheckTest } from "./rules/data-consistency/dual-write-check.js";

export * from "./types.js";
export * from "./rules/requirement-coverage/unmapped-requirements.js";
export * from "./rules/requirement-coverage/unmeasurable-nfrs.js";
export * from "./rules/structure/synchronous-call-depth.js";
export * from "./rules/structure/stateful-ownership.js";
export * from "./rules/scalability/queue-capacity-balance.js";
export * from "./rules/reliability/bounded-retries.js";
export * from "./rules/reliability/at-least-once-idempotency.js";
export * from "./rules/reliability/dead-letter-queue.js";
export * from "./rules/reliability/single-point-of-failure.js";
export * from "./rules/data-consistency/dual-write-check.js";

export const BUILTIN_FITNESS_TESTS: FitnessTest[] = [
  unmappedRequirementsTest,
  unmeasurableNFRsTest,
  synchronousCallDepthTest,
  statefulOwnershipTest,
  queueCapacityBalanceTest,
  boundedRetriesTest,
  atLeastOnceIdempotencyTest,
  deadLetterQueueTest,
  singlePointOfFailureTest,
  dualWriteCheckTest,
];

export interface RunFitnessOptions {
  categories?: string[];
  testIds?: string[];
}

export function runFitnessTests(
  context: EvaluationContext,
  options: RunFitnessOptions = {}
): ArchitectureFinding[] {
  const findings: ArchitectureFinding[] = [];

  for (const test of BUILTIN_FITNESS_TESTS) {
    if (options.categories && options.categories.length > 0) {
      if (!options.categories.includes(test.category)) continue;
    }
    if (options.testIds && options.testIds.length > 0) {
      if (!options.testIds.includes(test.id)) continue;
    }

    const testFindings = test.evaluate(context);
    findings.push(...testFindings);
  }

  return findings;
}

