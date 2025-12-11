import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { detectMentions } from '@/components/comments/CommentInput';
import type { ParticipantName } from '@/types';

/**
 * **Feature: team-crm, Property 15: Mention Detection Accuracy**
 * **Validates: Requirements 5.7**
 * 
 * For any comment content containing @name patterns where name is a valid participant name,
 * the system should identify all mentions and return the correct list of mentioned participants.
 */

const VALID_PARTICIPANTS: ParticipantName[] = ['Никита', 'Саня', 'Ксюша'];

// Generator for participant names
const participantArb: fc.Arbitrary<ParticipantName> = fc.constantFrom(...VALID_PARTICIPANTS);

// Generator for text without mentions
const textWithoutMentionsArb: fc.Arbitrary<string> = fc.string({ maxLength: 100 })
  .filter(s => !s.includes('@'));

// Generator for a single mention
const mentionArb: fc.Arbitrary<string> = participantArb.map(name => `@${name}`);

describe('Property 15: Mention Detection Accuracy', () => {
  it('detects all valid @mentions in content', () => {
    fc.assert(
      fc.property(
        fc.array(participantArb, { minLength: 1, maxLength: 5 }),
        textWithoutMentionsArb,
        (participants, prefix) => {
          // Build content with mentions
          const mentions = participants.map(p => `@${p}`);
          const content = `${prefix} ${mentions.join(' ')} some text`;
          
          const detected = detectMentions(content);
          
          // All mentioned participants should be detected (unique)
          const uniqueParticipants = Array.from(new Set(participants));
          expect(detected.sort()).toEqual(uniqueParticipants.sort());
        }
      ),
      { numRuns: 100 }
    );
  });

  it('returns empty array when no mentions present', () => {
    fc.assert(
      fc.property(
        textWithoutMentionsArb,
        (content) => {
          const detected = detectMentions(content);
          expect(detected).toEqual([]);
        }
      ),
      { numRuns: 100 }
    );
  });


  it('returns unique participants even with duplicate mentions', () => {
    fc.assert(
      fc.property(
        participantArb,
        fc.integer({ min: 2, max: 5 }),
        (participant, repeatCount) => {
          // Create content with repeated mentions of same participant
          const mentions = Array(repeatCount).fill(`@${participant}`).join(' ');
          const content = `Hello ${mentions} world`;
          
          const detected = detectMentions(content);
          
          // Should return only one instance of the participant
          expect(detected).toEqual([participant]);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('does not detect invalid participant names after @', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 20 }).filter(s => 
          !VALID_PARTICIPANTS.includes(s as ParticipantName) && 
          !s.includes(' ') && 
          !s.includes('@')
        ),
        (invalidName) => {
          const content = `Hello @${invalidName} world`;
          const detected = detectMentions(content);
          
          // Should not detect invalid names
          expect(detected).toEqual([]);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('detects mentions at different positions in text', () => {
    fc.assert(
      fc.property(
        participantArb,
        fc.constantFrom('start', 'middle', 'end'),
        (participant, position) => {
          let content: string;
          switch (position) {
            case 'start':
              content = `@${participant} is here`;
              break;
            case 'middle':
              content = `Hello @${participant} world`;
              break;
            case 'end':
              content = `Message for @${participant}`;
              break;
          }
          
          const detected = detectMentions(content);
          expect(detected).toContain(participant);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('detects multiple different participants in same content', () => {
    fc.assert(
      fc.property(
        fc.shuffledSubarray(VALID_PARTICIPANTS, { minLength: 2, maxLength: 3 }),
        (participants) => {
          const content = participants.map(p => `@${p}`).join(' and ');
          
          const detected = detectMentions(content);
          
          // All unique participants should be detected
          expect(detected.sort()).toEqual([...participants].sort());
        }
      ),
      { numRuns: 100 }
    );
  });

  it('handles mentions with surrounding punctuation', () => {
    fc.assert(
      fc.property(
        participantArb,
        fc.constantFrom(',', '.', '!', '?', ':', ';'),
        (participant, punctuation) => {
          const content = `Hello @${participant}${punctuation} how are you`;
          
          const detected = detectMentions(content);
          expect(detected).toContain(participant);
        }
      ),
      { numRuns: 100 }
    );
  });
});
