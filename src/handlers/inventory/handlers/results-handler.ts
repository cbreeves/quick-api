// handlers/ResultHandler.ts
import { Request, Response } from 'express';
import { ResultUtils } from '../../../sequelize/utils/ResultUtils';
import { BaseHandler } from '../../base-handler';

export class ResultHandler extends BaseHandler {
  async getAll(req: Request, res: Response) {
    try {
      const results = await ResultUtils.findAll();
      res.json(results);
    } catch (error) {
      this.handleError(res, error);
    }
  }

  async getByName(req: Request, res: Response) {
    try {
      const result = await ResultUtils.findByName(req.params.name);
      if (!result) {
        return res.status(404).json({ error: 'Result not found' });
      }
      res.json(result);
    } catch (error) {
      this.handleError(res, error);
    }
  }

  async upsert(req: Request, res: Response) {
    try {
      const result = await ResultUtils.upsert(req.body);
      res.json(result);
    } catch (error) {
      this.handleError(res, error);
    }
  }

  async delete(req: Request, res: Response) {
    try {
      await ResultUtils.delete(req.params.name);
      res.status(204).send();
    } catch (error) {
      this.handleError(res, error);
    }
  }
}