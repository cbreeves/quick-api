// handlers/BaseHandler.ts
import { Request, Response } from 'express';

/**
 * Base handler class with common error handling
 */
export abstract class BaseHandler {
  protected handleError(res: Response, error: any) {
    console.error('Error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message
    });
  }
}