import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { exportToJSON, exportToTXT, exportToPDF } from '@/components/comments/CommentExport';
import type { Comment, ParticipantName, Reactions } from '@/types';

/**
 * **Feature: team-crm, Property 17: Export Format Validity**
 * **Validates: Requirements 6.5**
 * 
 * For any export operation in a given format (PDF, TXT, JSON), the output should be valid
 * according to that format's specification and contain all comments from the order.
 */

// Generators
const participantNameArb: fc.Arbitrary<ParticipantName> = fc.constantFrom('Никита', 'Саня', 'Ксюша');

const reactionsArb: fc.Arbitrary<Reactions> = fc.dictionary(
  fc.constantFrom('👍', '❤️', '😄', '🎉', '🤔', '👀'),
  fc.array(participantNameArb, { minLength: 0, maxLength: 3 })
);

const commentArb: fc.Arbitrary<Comment> = fc.record({
  id: fc.uuid(),
  orderId: fc.uuid(),
  subtaskId: fc.constant(null),
  author: participantNameArb,
  content: fc.string({ minLength: 1, maxLength: 500 }),
  isSystem: fc.boolean(),
  parentId: fc.option(fc.uuid(), { nil: null }),
  reactions: reactionsArb,
  attachments: fc.constant([]),
  createdAt: fc.date({ min: new Date('2024-01-01'), max: new Date('2025-12-31') }),
  updatedAt: fc.option(fc.date({ min: new Date('2024-01-01'), max: new Date('2025-12-31') }), { nil: null }),
  editedAt: fc.option(fc.date({ min: new Date('2024-01-01'), max: new Date('2025-12-31') }), { nil: null }),
});

const orderTitleArb = fc.string({ minLength: 1, maxLength: 100 });

describe('Property 17: Export Format Validity', () => {
  it('JSON export produces valid JSON containing all comments', () => {
    fc.assert(
      fc.property(
        fc.array(commentArb, { minLength: 0, maxLength: 20 }),
        orderTitleArb,
        (comments, orderTitle) => {
          const jsonOutput = exportToJSON(comments, orderTitle);
          
          // Should be valid JSON
          let parsed: unknown;
          expect(() => { parsed = JSON.parse(jsonOutput); }).not.toThrow();

          
          // Type assertion for parsed data
          const data = parsed as {
            orderTitle: string;
            exportedAt: string;
            totalComments: number;
            comments: Array<{ id: string; author: string; content: string }>;
          };
          
          // Should contain required fields
          expect(data).toHaveProperty('orderTitle', orderTitle);
          expect(data).toHaveProperty('exportedAt');
          expect(data).toHaveProperty('totalComments', comments.length);
          expect(data).toHaveProperty('comments');
          
          // Should contain all comments
          expect(data.comments.length).toBe(comments.length);
          
          // Each comment should have required fields
          const commentIds = new Set(comments.map(c => c.id));
          data.comments.forEach(exportedComment => {
            expect(commentIds.has(exportedComment.id)).toBe(true);
            expect(exportedComment).toHaveProperty('author');
            expect(exportedComment).toHaveProperty('content');
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  it('TXT export contains all comment content', () => {
    fc.assert(
      fc.property(
        fc.array(commentArb, { minLength: 1, maxLength: 20 }),
        orderTitleArb,
        (comments, orderTitle) => {
          const txtOutput = exportToTXT(comments, orderTitle);
          
          // Should contain order title
          expect(txtOutput).toContain(orderTitle);
          
          // Should contain total count
          expect(txtOutput).toContain(String(comments.length));
          
          // Should contain each comment's content
          comments.forEach(comment => {
            expect(txtOutput).toContain(comment.content);
          });
          
          // Should contain each author name (for non-system comments)
          comments.filter(c => !c.isSystem).forEach(comment => {
            expect(txtOutput).toContain(comment.author);
          });
          
          // System comments should be marked
          const systemComments = comments.filter(c => c.isSystem);
          if (systemComments.length > 0) {
            expect(txtOutput).toContain('[СИСТЕМА]');
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('PDF export produces valid HTML containing all comments', () => {
    fc.assert(
      fc.property(
        fc.array(commentArb, { minLength: 1, maxLength: 20 }),
        orderTitleArb,
        (comments, orderTitle) => {
          const pdfOutput = exportToPDF(comments, orderTitle);
          
          // Should be valid HTML structure
          expect(pdfOutput).toContain('<!DOCTYPE html>');
          expect(pdfOutput).toContain('<html');
          expect(pdfOutput).toContain('</html>');
          expect(pdfOutput).toContain('<head>');
          expect(pdfOutput).toContain('</head>');
          expect(pdfOutput).toContain('<body>');
          expect(pdfOutput).toContain('</body>');
          
          // Should contain total count
          expect(pdfOutput).toContain(String(comments.length));
          
          // Should contain each comment's content (HTML escaped)
          comments.forEach(comment => {
            // Content should be present (may be HTML escaped)
            const escapedContent = comment.content
              .replace(/&/g, '&amp;')
              .replace(/</g, '&lt;')
              .replace(/>/g, '&gt;')
              .replace(/"/g, '&quot;')
              .replace(/'/g, '&#039;');
            expect(pdfOutput).toContain(escapedContent);
          });
        }
      ),
      { numRuns: 100 }
    );
  });


  it('export preserves comment count across all formats', () => {
    fc.assert(
      fc.property(
        fc.array(commentArb, { minLength: 0, maxLength: 20 }),
        orderTitleArb,
        (comments, orderTitle) => {
          const jsonOutput = exportToJSON(comments, orderTitle);
          const parsed = JSON.parse(jsonOutput) as { totalComments: number; comments: unknown[] };
          
          // JSON should have correct count
          expect(parsed.totalComments).toBe(comments.length);
          expect(parsed.comments.length).toBe(comments.length);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('export handles empty comment list', () => {
    fc.assert(
      fc.property(
        orderTitleArb,
        (orderTitle) => {
          const emptyComments: Comment[] = [];
          
          // JSON export
          const jsonOutput = exportToJSON(emptyComments, orderTitle);
          const parsed = JSON.parse(jsonOutput) as { totalComments: number; comments: unknown[] };
          expect(parsed.totalComments).toBe(0);
          expect(parsed.comments.length).toBe(0);
          
          // TXT export
          const txtOutput = exportToTXT(emptyComments, orderTitle);
          expect(txtOutput).toContain(orderTitle);
          expect(txtOutput).toContain('0');
          
          // PDF export
          const pdfOutput = exportToPDF(emptyComments, orderTitle);
          expect(pdfOutput).toContain('<!DOCTYPE html>');
        }
      ),
      { numRuns: 50 }
    );
  });

  it('export handles special characters in content', () => {
    const specialCharsArb = fc.constantFrom(
      '<script>alert("xss")</script>',
      '& ampersand',
      '"quotes"',
      "it's apostrophe",
      '<tag>',
      '> greater than'
    );

    fc.assert(
      fc.property(
        specialCharsArb,
        participantNameArb,
        (specialContent, author) => {
          const comment: Comment = {
            id: 'test-id',
            orderId: 'order-id',
            subtaskId: null,
            author,
            content: specialContent,
            isSystem: false,
            parentId: null,
            reactions: {},
            attachments: [],
            createdAt: new Date(),
            updatedAt: null,
            editedAt: null,
          };
          
          // JSON should escape properly
          const jsonOutput = exportToJSON([comment], 'Test Order');
          expect(() => JSON.parse(jsonOutput)).not.toThrow();
          
          // PDF should escape HTML entities - verify no raw dangerous tags
          const pdfOutput = exportToPDF([comment], 'Test Order');
          
          // If content contains < or >, they should be escaped
          if (specialContent.includes('<')) {
            expect(pdfOutput).not.toContain(specialContent);
            expect(pdfOutput).toContain('&lt;');
          }
          if (specialContent.includes('>')) {
            expect(pdfOutput).toContain('&gt;');
          }
          if (specialContent.includes('&') && !specialContent.includes('&amp;')) {
            expect(pdfOutput).toContain('&amp;');
          }
        }
      ),
      { numRuns: 50 }
    );
  });
});
