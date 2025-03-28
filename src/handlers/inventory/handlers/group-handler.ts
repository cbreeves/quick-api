// handlers/GroupHandler.ts
import { Request, Response } from 'express';
import { GroupUtils } from '../../../sequelize/utils/GroupUtils';
import { BaseHandler } from '../../base-handler';
import { Group } from '../../../sequelize/models/Group';

export class GroupHandler extends BaseHandler {
  /**
   * Get all groups with their relationships
   */
  async getAll(req: Request, res: Response) {
    try {
      const groups = await GroupUtils.findAll();
      res.json(groups);
    } catch (error) {
      this.handleError(res, error);
    }
  }

  /**
   * Get a specific group by name
   */
  async getByName(req: Request, res: Response) {
    try {
      const group = await GroupUtils.findByName(req.params.name);
      if (!group) {
        return res.status(404).json({ error: 'Group not found' });
      }
      res.json(group);
    } catch (error) {
      this.handleError(res, error);
    }
  }

  /**
   * Create or update a group with variables
   */
  async upsert(req: Request, res: Response) {
    try {
      const { name, variables } = req.body;
      const group = await GroupUtils.upsertWithVariables(new Group(name), variables);
      res.json(group);
    } catch (error) {
      this.handleError(res, error);
    }
  }

  /**
   * Delete a group
   */
  async delete(req: Request, res: Response) {
    try {
      await GroupUtils.delete(req.params.name);
      res.status(204).send();
    } catch (error) {
      this.handleError(res, error);
    }
  }
}