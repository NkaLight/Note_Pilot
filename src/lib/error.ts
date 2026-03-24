export enum ServiceType {
  AI_GENERATION = 'AI_GENERATION',
  CHAT_AI = 'CHAT_LLM_QUERY',
  USER_ACC = 'USER_ACCOUNT_MANAGEMENT'
  
}

export class AppError extends Error {
  constructor(public message: string, public status: number = 500) {
    super(message);
    this.name = this.constructor.name;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * ServiceError remains agnostic to the provider but 
 * specific about which functional part of the app failed.
 */
export class ServiceError extends AppError {
  constructor(
    message: string, 
    public type: ServiceType, 
    status: number = 502
  ) {
    super(message, status);
  }
}

export class DbError extends AppError {
  constructor(message: string, status: number = 500) {
    super(message, status);
  }
}