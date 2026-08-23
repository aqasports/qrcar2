export type ErrorCode =
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'PLAN_LIMIT_EXCEEDED'
  | 'VALIDATION_ERROR'
  | 'TENANCY_VIOLATION'
  | 'SCOPE_VIOLATION'
  | 'RATE_LIMIT_EXCEEDED'
  | 'CONFLICT'
  | 'INTERNAL_SERVER_ERROR';

export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly metadata?: Record<string, any>;

  constructor(
    message: string,
    code: ErrorCode = 'INTERNAL_SERVER_ERROR',
    statusCode: number = 500,
    metadata?: Record<string, any>
  ) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.isOperational = true;
    this.metadata = metadata;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class AuthError extends AppError {
  constructor(message: string = 'Authentication required', metadata?: Record<string, any>) {
    super(message, 'UNAUTHORIZED', 401, metadata);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Access denied for this resource', metadata?: Record<string, any>) {
    super(message, 'FORBIDDEN', 403, metadata);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource', metadata?: Record<string, any>) {
    super(`${resource} not found`, 'NOT_FOUND', 404, metadata);
  }
}

export class PlanLimitError extends AppError {
  constructor(message: string, metadata?: Record<string, any>) {
    super(message, 'PLAN_LIMIT_EXCEEDED', 402, metadata);
  }
}

export class ValidationError extends AppError {
  constructor(message: string = 'Invalid input parameters', metadata?: Record<string, any>) {
    super(message, 'VALIDATION_ERROR', 400, metadata);
  }
}

export class TenancyViolationError extends AppError {
  constructor(message: string = 'Cross-tenant boundary violation detected', metadata?: Record<string, any>) {
    super(message, 'TENANCY_VIOLATION', 403, metadata);
  }
}

export class ScopeViolationError extends AppError {
  constructor(requiredScope: string, metadata?: Record<string, any>) {
    super(`Missing required API scope: ${requiredScope}`, 'SCOPE_VIOLATION', 403, {
      requiredScope,
      ...metadata,
    });
  }
}

export class RateLimitError extends AppError {
  public readonly retryAfterSeconds: number;

  constructor(retryAfterSeconds: number = 60, metadata?: Record<string, any>) {
    super('Rate limit exceeded. Please throttle your requests.', 'RATE_LIMIT_EXCEEDED', 429, {
      retryAfterSeconds,
      ...metadata,
    });
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

export function formatErrorResponse(error: unknown) {
  if (error instanceof AppError) {
    return {
      success: false,
      error: {
        code: error.code,
        message: error.message,
        metadata: error.metadata,
      },
    };
  }

  const genericMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
  return {
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: genericMessage,
    },
  };
}
