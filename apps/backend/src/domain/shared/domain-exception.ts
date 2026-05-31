/**
 * Base class for domain-layer exceptions.
 */
export class DomainException extends Error {
  constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

/**
 * Exception raised when a value violates a domain validation rule.
 */
export class ValidationException extends DomainException {}

/**
 * Exception raised when a requested entity cannot be found.
 */
export class EntityNotFoundException extends DomainException {
  constructor(entityName: string, id: string) {
    super(`${entityName} was not found: ${id}`);
  }
}
