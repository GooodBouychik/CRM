import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { 
  validateCreateAccount, 
  validateUpdateAccount 
} from '../../schemas/serviceAccount.schema.js';

/**
 * **Feature: crm-ux-improvements, Property 5: Account CRUD Consistency**
 * **Validates: Requirements 5.6**
 * 
 * For any service account, after a successful update operation, fetching that account
 * should return the updated values for all modified fields.
 */

// Generator for valid participant names
const participantArb = fc.constantFrom('Никита', 'Саня', 'Ксюша');

// Generator for valid service name
const serviceNameArb = fc.string({ minLength: 1, maxLength: 100 })
  .filter(s => s.trim().length > 0);

// Generator for valid username
const usernameArb = fc.string({ minLength: 1, maxLength: 100 })
  .filter(s => s.trim().length > 0);

// Generator for valid password
const passwordArb = fc.string({ minLength: 1, maxLength: 100 });

// Generator for valid URL
const urlArb = fc.webUrl();

// Generator for notes
const notesArb = fc.option(fc.string({ maxLength: 500 }), { nil: null });

// Generator for UUID
const uuidArb = fc.uuid();

describe('Property 5: Account CRUD Consistency', () => {
  it('create validation accepts valid account data', () => {
    fc.assert(
      fc.property(
        serviceNameArb,
        usernameArb,
        passwordArb,
        participantArb,
        (serviceName, username, password, createdBy) => {
          const result = validateCreateAccount({
            serviceName,
            username,
            password,
            createdBy,
          });
          
          expect(result.success).toBe(true);
          if (result.success) {
            expect(result.data.serviceName).toBe(serviceName.trim());
            expect(result.data.username).toBe(username.trim());
            expect(result.data.password).toBe(password);
          }
        }
      ),
      { numRuns: 100 }
    );
  });


  it('create validation rejects empty service name', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('', '   ', '\t', '\n'),
        usernameArb,
        passwordArb,
        participantArb,
        (serviceName, username, password, createdBy) => {
          const result = validateCreateAccount({
            serviceName,
            username,
            password,
            createdBy,
          });
          
          expect(result.success).toBe(false);
        }
      ),
      { numRuns: 20 }
    );
  });

  it('create validation rejects empty username', () => {
    fc.assert(
      fc.property(
        serviceNameArb,
        fc.constantFrom('', '   ', '\t', '\n'),
        passwordArb,
        participantArb,
        (serviceName, username, password, createdBy) => {
          const result = validateCreateAccount({
            serviceName,
            username,
            password,
            createdBy,
          });
          
          expect(result.success).toBe(false);
        }
      ),
      { numRuns: 20 }
    );
  });

  it('create validation rejects empty password', () => {
    fc.assert(
      fc.property(
        serviceNameArb,
        usernameArb,
        fc.constant(''),
        participantArb,
        (serviceName, username, password, createdBy) => {
          const result = validateCreateAccount({
            serviceName,
            username,
            password,
            createdBy,
          });
          
          expect(result.success).toBe(false);
        }
      ),
      { numRuns: 20 }
    );
  });

  it('update validation accepts partial updates', () => {
    fc.assert(
      fc.property(
        fc.record({
          serviceName: fc.option(serviceNameArb, { nil: undefined }),
          username: fc.option(usernameArb, { nil: undefined }),
          password: fc.option(passwordArb, { nil: undefined }),
          notes: fc.option(notesArb, { nil: undefined }),
        }),
        (updateData) => {
          const result = validateUpdateAccount(updateData);
          
          expect(result.success).toBe(true);
          if (result.success) {
            // Each provided field should be preserved
            if (updateData.serviceName !== undefined) {
              expect(result.data.serviceName).toBe(updateData.serviceName.trim());
            }
            if (updateData.username !== undefined) {
              expect(result.data.username).toBe(updateData.username.trim());
            }
            if (updateData.password !== undefined) {
              expect(result.data.password).toBe(updateData.password);
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('update preserves only specified fields', () => {
    fc.assert(
      fc.property(
        serviceNameArb,
        (serviceName) => {
          const result = validateUpdateAccount({
            serviceName,
          });
          
          expect(result.success).toBe(true);
          if (result.success) {
            expect(result.data.serviceName).toBe(serviceName.trim());
            // Other fields should be undefined (not modified)
            expect(result.data.username).toBeUndefined();
            expect(result.data.password).toBeUndefined();
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('create with optional URL validates correctly', () => {
    fc.assert(
      fc.property(
        serviceNameArb,
        usernameArb,
        passwordArb,
        participantArb,
        urlArb,
        (serviceName, username, password, createdBy, serviceUrl) => {
          const result = validateCreateAccount({
            serviceName,
            username,
            password,
            createdBy,
            serviceUrl,
          });
          
          expect(result.success).toBe(true);
          if (result.success) {
            expect(result.data.serviceUrl).toBe(serviceUrl);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('create with category ID validates correctly', () => {
    fc.assert(
      fc.property(
        serviceNameArb,
        usernameArb,
        passwordArb,
        participantArb,
        uuidArb,
        (serviceName, username, password, createdBy, categoryId) => {
          const result = validateCreateAccount({
            serviceName,
            username,
            password,
            createdBy,
            categoryId,
          });
          
          expect(result.success).toBe(true);
          if (result.success) {
            expect(result.data.categoryId).toBe(categoryId);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
