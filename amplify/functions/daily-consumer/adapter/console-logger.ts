// 로깅 구현
import { Logger as AWSLogger } from '@aws-lambda-powertools/logger';
import { Logger } from '../port/logger';

export class ConsoleLogger implements Logger {
  private logger: AWSLogger;
  
  constructor(serviceName: string = 'daily-consumer') {
    this.logger = new AWSLogger({
      logLevel: 'INFO',
      serviceName,
    });
  }
  
  info(message: string, context?: Record<string, unknown>): void {
    this.logger.info(message, context || {});
  }
  
  error(message: string, context?: Record<string, unknown>): void {
    this.logger.error(message, context || {});
  }
  
  warn(message: string, context?: Record<string, unknown>): void {
    this.logger.warn(message, context || {});
  }
  
  debug(message: string, context?: Record<string, unknown>): void {
    this.logger.debug(message, context || {});
  }
}