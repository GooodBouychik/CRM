import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';

/**
 * **Feature: team-crm, Property 12: Reaction Toggle Symmetry**
 * **Validates: Requirements 5.4**
 * 
 * For any participant and comment, toggling a reaction adds the participant 
 * to the reaction list if not present, or removes them if present. 
 * Toggling twice returns to the original state.
 */

type ParticipantName = 'Никита' | 'Саня' | 'Ксюша';
type Reactions = Record<string, ParticipantName[]>;

interface Comment {
  id: string;
  orderId: string;
  author: ParticipantName;
  content: string;
  isSystem: boolean;
  parentId: string | null;
  reactions: Reactions;
  createdAt: Date;
  updatedAt: Date | null;
  editedAt: Date | null;
}

interface ToggleReactionInput {
  emoji: string;
  participant: ParticipantName;
}

class CommentStore {
  private comments: Map<string, Comment> = new Map();

  reset() {
    this.comments.clear();
  }

  createComment(orderId: string, author: ParticipantName, content: string): Comment {
    const comment: Comment = {
      id: crypto.randomUUID(),
      orderId,
      author,
      content,
      isSystem: false,
      parentId: null,
      reactions: {},
      createdAt: new Date(),
      updatedAt: null,
      editedAt: null,
    };
    this.comments.set(comment.id, comment);
    return { ...comment, reactions: { ...comment.reactions } };
  }


  getComment(id: string): Comment | null {
    const comment = this.comments.get(id);
    if (!comment) return null;
    // Deep copy reactions
    const reactionsCopy: Reactions = {};
    for (const [emoji, participants] of Object.entries(comment.reactions)) {
      reactionsCopy[emoji] = [...participants];
    }
    return { ...comment, reactions: reactionsCopy };
  }

  toggleReaction(id: string, input: ToggleReactionInput): Comment | null {
    const comment = this.comments.get(id);
    if (!comment) return null;

    const { emoji, participant } = input;

    // Initialize emoji array if it doesn't exist
    if (!comment.reactions[emoji]) {
      comment.reactions[emoji] = [];
    }

    // Toggle the participant's reaction
    const participantIndex = comment.reactions[emoji].indexOf(participant);
    if (participantIndex === -1) {
      // Add reaction
      comment.reactions[emoji].push(participant);
    } else {
      // Remove reaction
      comment.reactions[emoji].splice(participantIndex, 1);
      // Clean up empty emoji arrays
      if (comment.reactions[emoji].length === 0) {
        delete comment.reactions[emoji];
      }
    }

    comment.updatedAt = new Date();
    
    // Return deep copy
    const reactionsCopy: Reactions = {};
    for (const [e, participants] of Object.entries(comment.reactions)) {
      reactionsCopy[e] = [...participants];
    }
    return { ...comment, reactions: reactionsCopy };
  }
}

// Generators
const participantNameArb = fc.constantFrom('Никита', 'Саня', 'Ксюша') as fc.Arbitrary<ParticipantName>;
const validContentArb = fc.string({ minLength: 1, maxLength: 200 }).filter(s => s.trim().length > 0);
const emojiArb = fc.constantFrom('👍', '👎', '❤️', '😂', '😮', '😢', '🎉', '🔥');
const orderIdArb = fc.uuid();

describe('Property 12: Reaction Toggle Symmetry', () => {
  let store: CommentStore;

  beforeEach(() => {
    store = new CommentStore();
  });

  it('toggling adds participant if not present', () => {
    fc.assert(
      fc.property(
        orderIdArb,
        participantNameArb,
        validContentArb,
        emojiArb,
        participantNameArb,
        (orderId, author, content, emoji, reactor) => {
          store.reset();
          const comment = store.createComment(orderId, author, content);
          
          // Initially no reactions
          expect(comment.reactions[emoji]).toBeUndefined();
          
          // Toggle reaction
          const updated = store.toggleReaction(comment.id, { emoji, participant: reactor });
          
          // Participant should now be in the reaction list
          expect(updated).not.toBeNull();
          expect(updated!.reactions[emoji]).toContain(reactor);
        }
      ),
      { numRuns: 100 }
    );
  });


  it('toggling removes participant if already present', () => {
    fc.assert(
      fc.property(
        orderIdArb,
        participantNameArb,
        validContentArb,
        emojiArb,
        participantNameArb,
        (orderId, author, content, emoji, reactor) => {
          store.reset();
          const comment = store.createComment(orderId, author, content);
          
          // Add reaction first
          store.toggleReaction(comment.id, { emoji, participant: reactor });
          
          // Toggle again to remove
          const updated = store.toggleReaction(comment.id, { emoji, participant: reactor });
          
          // Participant should no longer be in the reaction list
          expect(updated).not.toBeNull();
          const reactors = updated!.reactions[emoji] ?? [];
          expect(reactors).not.toContain(reactor);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('toggling twice returns to original state', () => {
    fc.assert(
      fc.property(
        orderIdArb,
        participantNameArb,
        validContentArb,
        emojiArb,
        participantNameArb,
        (orderId, author, content, emoji, reactor) => {
          store.reset();
          const comment = store.createComment(orderId, author, content);
          
          // Get original reactions state (empty)
          const originalReactions = { ...comment.reactions };
          
          // Toggle twice
          store.toggleReaction(comment.id, { emoji, participant: reactor });
          const afterDoubleToggle = store.toggleReaction(comment.id, { emoji, participant: reactor });
          
          // Should be back to original state
          expect(afterDoubleToggle).not.toBeNull();
          
          // Compare reactions - both should be empty or equivalent
          const originalEmojis = Object.keys(originalReactions).sort();
          const finalEmojis = Object.keys(afterDoubleToggle!.reactions).sort();
          expect(finalEmojis).toEqual(originalEmojis);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('different participants can react with same emoji independently', () => {
    fc.assert(
      fc.property(
        orderIdArb,
        participantNameArb,
        validContentArb,
        emojiArb,
        (orderId, author, content, emoji) => {
          store.reset();
          const comment = store.createComment(orderId, author, content);
          
          // All three participants react
          store.toggleReaction(comment.id, { emoji, participant: 'Никита' });
          store.toggleReaction(comment.id, { emoji, participant: 'Саня' });
          const updated = store.toggleReaction(comment.id, { emoji, participant: 'Ксюша' });
          
          // All three should be in the list
          expect(updated).not.toBeNull();
          expect(updated!.reactions[emoji]).toContain('Никита');
          expect(updated!.reactions[emoji]).toContain('Саня');
          expect(updated!.reactions[emoji]).toContain('Ксюша');
          expect(updated!.reactions[emoji].length).toBe(3);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('removing one participant does not affect others', () => {
    fc.assert(
      fc.property(
        orderIdArb,
        participantNameArb,
        validContentArb,
        emojiArb,
        (orderId, author, content, emoji) => {
          store.reset();
          const comment = store.createComment(orderId, author, content);
          
          // Two participants react
          store.toggleReaction(comment.id, { emoji, participant: 'Никита' });
          store.toggleReaction(comment.id, { emoji, participant: 'Саня' });
          
          // Remove one
          const updated = store.toggleReaction(comment.id, { emoji, participant: 'Никита' });
          
          // Only Саня should remain
          expect(updated).not.toBeNull();
          expect(updated!.reactions[emoji]).not.toContain('Никита');
          expect(updated!.reactions[emoji]).toContain('Саня');
          expect(updated!.reactions[emoji].length).toBe(1);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('different emojis are tracked independently', () => {
    fc.assert(
      fc.property(
        orderIdArb,
        participantNameArb,
        validContentArb,
        participantNameArb,
        (orderId, author, content, reactor) => {
          store.reset();
          const comment = store.createComment(orderId, author, content);
          
          // React with two different emojis
          store.toggleReaction(comment.id, { emoji: '👍', participant: reactor });
          const updated = store.toggleReaction(comment.id, { emoji: '❤️', participant: reactor });
          
          // Both emojis should have the reactor
          expect(updated).not.toBeNull();
          expect(updated!.reactions['👍']).toContain(reactor);
          expect(updated!.reactions['❤️']).toContain(reactor);
        }
      ),
      { numRuns: 100 }
    );
  });
});
