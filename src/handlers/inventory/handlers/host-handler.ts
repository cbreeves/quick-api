// handlers/HostHandler.ts
import { Request, Response } from 'express';
import { HostUtils } from '../../../sequelize/utils/HostUtils';
import { BaseHandler } from '../../base-handler';

export class HostHandler extends BaseHandler {
  async getAll(req: Request, res: Response) {
    try {
      const hosts = await HostUtils.findAll();
      res.json(hosts);
    } catch (error) {
      this.handleError(res, error);
    }
  }

  async getByName(req: Request, res: Response) {
    try {
      const host = await HostUtils.findByName(req.params.name);
      if (!host) {
        return res.status(404).json({ error: 'Host not found' });
      }
      res.json(host);
    } catch (error) {
      this.handleError(res, error);
    }
  }

  async upsert(req: Request, res: Response) {
    try {
      const host = await HostUtils.upsert(req.body);
      res.json(host);
    } catch (error) {
      this.handleError(res, error);
    }
  }

  async delete(req: Request, res: Response) {
    try {
      await HostUtils.delete(req.params.name);
      res.status(204).send();
    } catch (error) {
      this.handleError(res, error);
    }
  }
}