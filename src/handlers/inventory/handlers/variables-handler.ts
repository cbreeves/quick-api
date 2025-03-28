// handlers/VariableHandler.ts
import { Request, Response } from 'express';
import { VariablesUtils } from '../../../sequelize/utils/VariableUtils';
import { BaseHandler } from '../../base-handler';

export class VariableHandler extends BaseHandler {
  async getByGroup(req: Request, res: Response) {
    try {
      const variables = await VariablesUtils.findByGroup(parseInt(req.params.groupId));
      res.json(variables);
    } catch (error) {
      this.handleError(res, error);
    }
  }

  async upsert(req: Request, res: Response) {
    try {
      const { groupId, name, value } = req.body;
      const variable = await VariablesUtils.upsert(groupId, name, value);
      res.json(variable);
    } catch (error) {
      this.handleError(res, error);
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const { groupId, name } = req.params;
      await VariablesUtils.delete(parseInt(groupId), name);
      res.status(204).send();
    } catch (error) {
      this.handleError(res, error);
    }
  }
}