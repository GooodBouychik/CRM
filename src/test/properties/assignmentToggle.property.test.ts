import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import type { ParticipantName } from '@/types';

/**
 * **Feature: team-crm, Property 7: Assignment Toggle Idempotence**
 * **Validates: Requirements 3.3**
 * 
 * For any participant and order, toggling assignment twice should return
 * the assignedTo list to its original state.
 */

// The toggle function - same logic as in OrderDetail page
function toggleAssignment(
  assignedTo: ParticipantName[],
  participant: ParticipantName
): ParticipantName[] {
  if (assignedTo.includes(participant)) {
    return assignedTo.filter((name) => name !== participant);
  }
  return [...assignedTo, participant];
}

// Generators
const participantNameArb: fc.Arbitrary<ParticipantName> = fc.constantFrom('Никита', 'Саня', 'Ксюша');

// Generate a valid assignedTo array (unique participants only)
const assignedToArb: fc.Arbitrary<ParticipantName[]> = fc.uniqueArray(participantNameArb, {
  maxLength: 3,
});

describe('Property 7: Assignment Toggle Idempotence', () => {
  it('toggling assignment twice returns to original state', () => {
    fc.assert(
      fc.property(
        assignedToArb,
        participantNameArb,
        (assignedTo, participant) => {
          // Toggle once
          const afterFirstToggle = toggleAssignment(assignedTo, participant);
          
          // Toggle again
          const afterSecondToggle = toggleAssignment(afterFirstToggle, participant);
          
          // Should be back to original state (same elements, possibly different order)
          const originalSet = new Set(assignedTo);
          const resultSet = new Set(afterSecondToggle);
          
          expect(resultSet).toEqual(originalSet);
          expect(afterSecondToggle.length).toBe(assignedTo.length);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('toggling adds participant if not present', () => {
    fc.assert(
      fc.property(
        assignedToArb,
        participantNameArb,
        (assignedTo, participant) => {
          // Only test when participant is NOT in the list
          fc.pre(!assignedTo.includes(participant));
          
          const afterToggle = toggleAssignment(assignedTo, participant);
          
          // Participant should now be in the list
          expect(afterToggle).toContain(participant);
          expect(afterToggle.length).toBe(assignedTo.length + 1);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('toggling removes participant if present', () => {
    fc.assert(
      fc.property(
        assignedToArb,
        participantNameArb,
        (assignedTo, participant) => {
          // Only test when participant IS in the list
          fc.pre(assignedTo.includes(participant));
          
          const afterToggle = toggleAssignment(assignedTo, participant);
          
          // Participant should no longer be in the list
          expect(afterToggle).not.toContain(participant);
          expect(afterToggle.length).toBe(assignedTo.length - 1);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('toggle preserves other participants', () => {
    fc.assert(
      fc.property(
        assignedToArb,
        participantNameArb,
        (assignedTo, participant) => {
          const afterToggle = toggleAssignment(assignedTo, participant);
          
          // All other participants should still be present
          const otherParticipants = assignedTo.filter((p) => p !== participant);
          for (const other of otherParticipants) {
            expect(afterToggle).toContain(other);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('multiple toggles of different participants are independent', () => {
    fc.assert(
      fc.property(
        assignedToArb,
        participantNameArb,
        participantNameArb,
        (assignedTo, participant1, participant2) => {
          // Only test when participants are different
          fc.pre(participant1 !== participant2);
          
          // Toggle participant1, then participant2, then participant1 again
          const step1 = toggleAssignment(assignedTo, participant1);
          const step2 = toggleAssignment(step1, participant2);
          const step3 = toggleAssignment(step2, participant1);
          
          // After toggling participant1 twice, their state should be same as original
          const originalHasP1 = assignedTo.includes(participant1);
          const finalHasP1 = step3.includes(participant1);
          expect(finalHasP1).toBe(originalHasP1);
          
          // participant2 should be toggled once from original
          const originalHasP2 = assignedTo.includes(participant2);
          const finalHasP2 = step3.includes(participant2);
          expect(finalHasP2).toBe(!originalHasP2);
        }
      ),
      { numRuns: 100 }
    );
  });
});
