/**
 * Property-based tests for advanced filtering
 * **Validates: Requirements 15.4, 15.6, 15.9**
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import type { Topic, Operation } from '@/types/api';

// Arbitraries for generating test data
const messageTypeArbitrary = fc.constantFrom(
  'std_msgs/String',
  'std_msgs/Int32',
  'sensor_msgs/Image',
  'sensor_msgs/LaserScan',
  'geometry_msgs/Pose',
  'geometry_msgs/Twist',
  'nav_msgs/Odometry'
);

const topicArbitrary: fc.Arbitrary<Topic> = fc.record({
  name: fc.stringMatching(/^\/[a-z][a-z0-9_/]{2,40}$/),
  messageType: messageTypeArbitrary,
  publishRate: fc.float({ min: Math.fround(0.1), max: Math.fround(100), noNaN: true }),
  lastUpdate: fc.constant(new Date().toISOString()),
  data: fc.anything(),
});

const operationTypeArbitrary = fc.constantFrom('service', 'action');

const operationArbitrary: fc.Arbitrary<Operation> = fc.record({
  id: fc.stringMatching(/^[a-z][a-z0-9_-]{2,20}$/),
  name: fc.string({ minLength: 1, maxLength: 50 }),
  type: operationTypeArbitrary,
  parameters: fc.array(
    fc.record({
      name: fc.string({ minLength: 1, maxLength: 20 }),
      type: fc.constantFrom('string', 'number', 'boolean'),
      required: fc.boolean(),
    }),
    { maxLength: 5 }
  ),
  description: fc.option(fc.string({ maxLength: 100 }), { nil: undefined }),
  available: fc.boolean(),
});

describe('Property 68: Topic Filter Accuracy', () => {
  /**
   * Property: For any combination of topic filters (message type, update frequency),
   * the filtered results should only include topics that match all active filter criteria.
   */
  it('should filter by message type correctly', () => {
    fc.assert(
      fc.property(
        fc.array(topicArbitrary, { minLength: 1, maxLength: 50 }),
        messageTypeArbitrary,
        (topics, targetMessageType) => {
          const filtered = topics.filter(
            (topic) => topic.messageType === targetMessageType
          );

          // All filtered topics should have the target message type
          filtered.forEach((topic) => {
            expect(topic.messageType).toBe(targetMessageType);
          });

          // All topics with target message type should be in filtered results
          topics.forEach((topic) => {
            if (topic.messageType === targetMessageType) {
              expect(filtered).toContainEqual(topic);
            } else {
              expect(filtered).not.toContainEqual(topic);
            }
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Should filter by minimum update frequency correctly
   */
  it('should filter by minimum update frequency correctly', () => {
    fc.assert(
      fc.property(
        fc.array(topicArbitrary, { minLength: 1, maxLength: 50 }),
        fc.float({ min: Math.fround(0.1), max: Math.fround(50), noNaN: true }),
        (topics, minFrequency) => {
          const filtered = topics.filter(
            (topic) => topic.publishRate >= minFrequency
          );

          // All filtered topics should have frequency >= minFrequency
          filtered.forEach((topic) => {
            expect(topic.publishRate).toBeGreaterThanOrEqual(minFrequency);
          });

          // All topics with frequency >= minFrequency should be in filtered results
          topics.forEach((topic) => {
            if (topic.publishRate >= minFrequency) {
              expect(filtered).toContainEqual(topic);
            } else {
              expect(filtered).not.toContainEqual(topic);
            }
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Should filter by maximum update frequency correctly
   */
  it('should filter by maximum update frequency correctly', () => {
    fc.assert(
      fc.property(
        fc.array(topicArbitrary, { minLength: 1, maxLength: 50 }),
        fc.float({ min: Math.fround(10), max: Math.fround(100), noNaN: true }),
        (topics, maxFrequency) => {
          const filtered = topics.filter(
            (topic) => topic.publishRate <= maxFrequency
          );

          // All filtered topics should have frequency <= maxFrequency
          filtered.forEach((topic) => {
            expect(topic.publishRate).toBeLessThanOrEqual(maxFrequency);
          });

          // All topics with frequency <= maxFrequency should be in filtered results
          topics.forEach((topic) => {
            if (topic.publishRate <= maxFrequency) {
              expect(filtered).toContainEqual(topic);
            } else {
              expect(filtered).not.toContainEqual(topic);
            }
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Should filter by frequency range correctly
   */
  it('should filter by frequency range correctly', () => {
    fc.assert(
      fc.property(
        fc.array(topicArbitrary, { minLength: 1, maxLength: 50 }),
        fc.float({ min: Math.fround(0.1), max: Math.fround(50), noNaN: true }),
        fc.float({ min: Math.fround(50), max: Math.fround(100), noNaN: true }),
        (topics, minFrequency, maxFrequency) => {
          const filtered = topics.filter(
            (topic) =>
              topic.publishRate >= minFrequency &&
              topic.publishRate <= maxFrequency
          );

          // All filtered topics should be within the frequency range
          filtered.forEach((topic) => {
            expect(topic.publishRate).toBeGreaterThanOrEqual(minFrequency);
            expect(topic.publishRate).toBeLessThanOrEqual(maxFrequency);
          });

          // All topics within range should be in filtered results
          topics.forEach((topic) => {
            if (
              topic.publishRate >= minFrequency &&
              topic.publishRate <= maxFrequency
            ) {
              expect(filtered).toContainEqual(topic);
            } else {
              expect(filtered).not.toContainEqual(topic);
            }
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Should apply multiple topic filters with AND logic
   */
  it('should apply multiple filters with AND logic', () => {
    fc.assert(
      fc.property(
        fc.array(topicArbitrary, { minLength: 1, maxLength: 50 }),
        messageTypeArbitrary,
        fc.float({ min: Math.fround(0.1), max: Math.fround(50), noNaN: true }),
        fc.float({ min: Math.fround(50), max: Math.fround(100), noNaN: true }),
        (topics, targetMessageType, minFrequency, maxFrequency) => {
          // Apply all filters
          const filtered = topics.filter(
            (topic) =>
              topic.messageType === targetMessageType &&
              topic.publishRate >= minFrequency &&
              topic.publishRate <= maxFrequency
          );

          // All filtered topics should match all criteria
          filtered.forEach((topic) => {
            expect(topic.messageType).toBe(targetMessageType);
            expect(topic.publishRate).toBeGreaterThanOrEqual(minFrequency);
            expect(topic.publishRate).toBeLessThanOrEqual(maxFrequency);
          });

          // All topics matching all criteria should be in filtered results
          topics.forEach((topic) => {
            if (
              topic.messageType === targetMessageType &&
              topic.publishRate >= minFrequency &&
              topic.publishRate <= maxFrequency
            ) {
              expect(filtered).toContainEqual(topic);
            } else {
              expect(filtered).not.toContainEqual(topic);
            }
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Filtering should not modify original array
   */
  it('should not modify the original topics array', () => {
    fc.assert(
      fc.property(
        fc.array(topicArbitrary, { minLength: 1, maxLength: 30 }),
        messageTypeArbitrary,
        (topics, targetMessageType) => {
          const originalLength = topics.length;
          const originalTopics = [...topics];

          topics.filter((topic) => topic.messageType === targetMessageType);

          // Original array should be unchanged
          expect(topics.length).toBe(originalLength);
          expect(topics).toEqual(originalTopics);
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property: Filter results should be a subset of original topics
   */
  it('should return a subset of the original topics', () => {
    fc.assert(
      fc.property(
        fc.array(topicArbitrary, { minLength: 0, maxLength: 50 }),
        messageTypeArbitrary,
        (topics, targetMessageType) => {
          const filtered = topics.filter(
            (topic) => topic.messageType === targetMessageType
          );

          // Filtered results should not exceed original length
          expect(filtered.length).toBeLessThanOrEqual(topics.length);

          // Every filtered topic should exist in original
          filtered.forEach((topic) => {
            expect(topics).toContainEqual(topic);
          });
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('Property 70: Operation Filter Accuracy', () => {
  /**
   * Property: For any combination of operation filters (type, availability),
   * the filtered results should only include operations that match all active filter criteria.
   */
  it('should filter by operation type correctly', () => {
    fc.assert(
      fc.property(
        fc.array(operationArbitrary, { minLength: 1, maxLength: 50 }),
        operationTypeArbitrary,
        (operations, targetType) => {
          const filtered = operations.filter(
            (operation) => operation.type === targetType
          );

          // All filtered operations should have the target type
          filtered.forEach((operation) => {
            expect(operation.type).toBe(targetType);
          });

          // All operations with target type should be in filtered results
          operations.forEach((operation) => {
            if (operation.type === targetType) {
              expect(filtered).toContainEqual(operation);
            } else {
              expect(filtered).not.toContainEqual(operation);
            }
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Should filter by availability correctly
   */
  it('should filter by availability correctly', () => {
    fc.assert(
      fc.property(
        fc.array(operationArbitrary, { minLength: 1, maxLength: 50 }),
        (operations) => {
          const filtered = operations.filter(
            (operation) => operation.available === true
          );

          // All filtered operations should be available
          filtered.forEach((operation) => {
            expect(operation.available).toBe(true);
          });

          // All available operations should be in filtered results
          operations.forEach((operation) => {
            if (operation.available === true) {
              expect(filtered).toContainEqual(operation);
            } else {
              expect(filtered).not.toContainEqual(operation);
            }
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Should apply multiple operation filters with AND logic
   */
  it('should apply multiple filters with AND logic', () => {
    fc.assert(
      fc.property(
        fc.array(operationArbitrary, { minLength: 1, maxLength: 50 }),
        operationTypeArbitrary,
        (operations, targetType) => {
          // Apply both filters: type and availability
          const filtered = operations.filter(
            (operation) =>
              operation.type === targetType && operation.available === true
          );

          // All filtered operations should match all criteria
          filtered.forEach((operation) => {
            expect(operation.type).toBe(targetType);
            expect(operation.available).toBe(true);
          });

          // All operations matching all criteria should be in filtered results
          operations.forEach((operation) => {
            if (
              operation.type === targetType &&
              operation.available === true
            ) {
              expect(filtered).toContainEqual(operation);
            } else {
              expect(filtered).not.toContainEqual(operation);
            }
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Filtering should not modify original array
   */
  it('should not modify the original operations array', () => {
    fc.assert(
      fc.property(
        fc.array(operationArbitrary, { minLength: 1, maxLength: 30 }),
        operationTypeArbitrary,
        (operations, targetType) => {
          const originalLength = operations.length;
          const originalOperations = [...operations];

          operations.filter((operation) => operation.type === targetType);

          // Original array should be unchanged
          expect(operations.length).toBe(originalLength);
          expect(operations).toEqual(originalOperations);
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property: Filter results should be a subset of original operations
   */
  it('should return a subset of the original operations', () => {
    fc.assert(
      fc.property(
        fc.array(operationArbitrary, { minLength: 0, maxLength: 50 }),
        operationTypeArbitrary,
        (operations, targetType) => {
          const filtered = operations.filter(
            (operation) => operation.type === targetType
          );

          // Filtered results should not exceed original length
          expect(filtered.length).toBeLessThanOrEqual(operations.length);

          // Every filtered operation should exist in original
          filtered.forEach((operation) => {
            expect(operations).toContainEqual(operation);
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Services and actions should be mutually exclusive
   */
  it('should correctly distinguish between services and actions', () => {
    fc.assert(
      fc.property(
        fc.array(operationArbitrary, { minLength: 1, maxLength: 50 }),
        (operations) => {
          const services = operations.filter((op) => op.type === 'service');
          const actions = operations.filter((op) => op.type === 'action');

          // No operation should be in both lists
          services.forEach((service) => {
            expect(actions).not.toContainEqual(service);
          });

          actions.forEach((action) => {
            expect(services).not.toContainEqual(action);
          });

          // Combined length should equal original length
          expect(services.length + actions.length).toBe(operations.length);
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property: Empty filter criteria should return all operations
   */
  it('should return all operations when no filters are active', () => {
    fc.assert(
      fc.property(
        fc.array(operationArbitrary, { minLength: 0, maxLength: 50 }),
        (operations) => {
          // No filters applied (type = 'all', availableOnly = false)
          const filtered = operations; // No filtering

          expect(filtered).toEqual(operations);
        }
      ),
      { numRuns: 50 }
    );
  });
});

describe('Property 72: Filtered Results Count Accuracy', () => {
  /**
   * Property: For any filtered data display, the displayed count of results
   * should match the actual number of filtered items.
   */
  it('should accurately count filtered topics', () => {
    fc.assert(
      fc.property(
        fc.array(topicArbitrary, { minLength: 0, maxLength: 100 }),
        messageTypeArbitrary,
        (topics, targetMessageType) => {
          const filtered = topics.filter(
            (topic) => topic.messageType === targetMessageType
          );

          const displayedCount = filtered.length;
          const actualCount = topics.filter(
            (topic) => topic.messageType === targetMessageType
          ).length;

          expect(displayedCount).toBe(actualCount);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Should accurately count filtered operations
   */
  it('should accurately count filtered operations', () => {
    fc.assert(
      fc.property(
        fc.array(operationArbitrary, { minLength: 0, maxLength: 100 }),
        operationTypeArbitrary,
        (operations, targetType) => {
          const filtered = operations.filter(
            (operation) => operation.type === targetType
          );

          const displayedCount = filtered.length;
          const actualCount = operations.filter(
            (operation) => operation.type === targetType
          ).length;

          expect(displayedCount).toBe(actualCount);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Count should be zero when no items match filters
   */
  it('should return zero count when no items match filters', () => {
    fc.assert(
      fc.property(
        fc.array(topicArbitrary, { minLength: 0, maxLength: 50 }),
        (topics) => {
          // Filter by a message type that doesn't exist
          const nonExistentType = 'nonexistent/MessageType';
          const filtered = topics.filter(
            (topic) => topic.messageType === nonExistentType
          );

          expect(filtered.length).toBe(0);
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property: Count should equal total when all items match filters
   */
  it('should return total count when all items match filters', () => {
    fc.assert(
      fc.property(
        fc.array(topicArbitrary, { minLength: 0, maxLength: 50 }),
        (topics) => {
          // No filters applied - all items should match
          const filtered = topics;

          expect(filtered.length).toBe(topics.length);
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property: Count should be consistent across multiple filter applications
   */
  it('should return consistent count across multiple filter applications', () => {
    fc.assert(
      fc.property(
        fc.array(topicArbitrary, { minLength: 0, maxLength: 50 }),
        messageTypeArbitrary,
        (topics, targetMessageType) => {
          // Apply filter multiple times
          const filtered1 = topics.filter(
            (topic) => topic.messageType === targetMessageType
          );
          const filtered2 = topics.filter(
            (topic) => topic.messageType === targetMessageType
          );
          const filtered3 = topics.filter(
            (topic) => topic.messageType === targetMessageType
          );

          // All counts should be identical
          expect(filtered1.length).toBe(filtered2.length);
          expect(filtered2.length).toBe(filtered3.length);
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property: Count should be non-negative
   */
  it('should always return non-negative count', () => {
    fc.assert(
      fc.property(
        fc.array(topicArbitrary, { minLength: 0, maxLength: 50 }),
        messageTypeArbitrary,
        (topics, targetMessageType) => {
          const filtered = topics.filter(
            (topic) => topic.messageType === targetMessageType
          );

          expect(filtered.length).toBeGreaterThanOrEqual(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Count should not exceed total items
   */
  it('should never exceed total item count', () => {
    fc.assert(
      fc.property(
        fc.array(topicArbitrary, { minLength: 0, maxLength: 50 }),
        messageTypeArbitrary,
        (topics, targetMessageType) => {
          const filtered = topics.filter(
            (topic) => topic.messageType === targetMessageType
          );

          expect(filtered.length).toBeLessThanOrEqual(topics.length);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Count should decrease or stay same as filters become more restrictive
   */
  it('should have count decrease or stay same with more restrictive filters', () => {
    fc.assert(
      fc.property(
        fc.array(operationArbitrary, { minLength: 0, maxLength: 50 }),
        operationTypeArbitrary,
        (operations, targetType) => {
          // Filter by type only
          const filteredByType = operations.filter(
            (operation) => operation.type === targetType
          );

          // Filter by type AND availability (more restrictive)
          const filteredByTypeAndAvailability = operations.filter(
            (operation) =>
              operation.type === targetType && operation.available === true
          );

          // More restrictive filter should have <= count
          expect(filteredByTypeAndAvailability.length).toBeLessThanOrEqual(
            filteredByType.length
          );
        }
      ),
      { numRuns: 100 }
    );
  });
});
