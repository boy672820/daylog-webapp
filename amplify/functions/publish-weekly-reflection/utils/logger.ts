import { Logger } from '@aws-lambda-powertools/logger';
import { LoggerService } from '../types';

export class LoggerAdapter implements LoggerService {
  private logger: Logger;
  
  constructor(serviceName: string = 'publish-weekly-reflection') {
    this.logger = new Logger({
      logLevel: 'INFO',
      serviceName,
    });
  }
  
  info(message: string, context?: Record<string, unknown>): void {
    this.logger.info(message, context ? context : {});
  }
  
  error(message: string, context?: Record<string, unknown>): void {
    this.logger.error(message, context ? context : {});
  }
  
  warn(message: string, context?: Record<string, unknown>): void {
    this.logger.warn(message, context ? context : {});
  }

  debug(message: string, context?: Record<string, unknown>): void {
    this.logger.debug(message, context ? context : {});
  }
}