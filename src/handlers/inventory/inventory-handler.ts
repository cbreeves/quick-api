// routes/inventory.ts
import express, { Request, Response } from 'express';
import { GroupHandler } from './handlers/group-handler';
import { HostHandler } from './handlers/host-handler';
import { ResultHandler } from './handlers/results-handler';
import { VariableHandler } from './handlers/variables-handler';


const inventoryHandler = express.Router();
const groupHandler = new GroupHandler();
const hostHandler = new HostHandler();
const resultHandler = new ResultHandler();
const variableHandler = new VariableHandler();

// Group routes
inventoryHandler.get('/groups', async (req: Request, res: Response): Promise<any> => { groupHandler.getAll(req, res) } );


inventoryHandler.get('/groups/:name', async (req: Request, res: Response): Promise<any> => { groupHandler.getByName(req, res) });
inventoryHandler.put('/groups',  async (req: Request, res: Response): Promise<any> => { groupHandler.upsert(req, res) });
inventoryHandler.delete('/groups/:name',  async (req: Request, res: Response): Promise<any> => { groupHandler.delete(req, res) });

// Host routes
inventoryHandler.get('/hosts',  async (req: Request, res: Response): Promise<any> => { hostHandler.getAll(req, res) });
inventoryHandler.get('/hosts/:name', async (req: Request, res: Response): Promise<any> => { hostHandler.getByName(req, res) });
inventoryHandler.put('/hosts',async (req: Request, res: Response): Promise<any> => { hostHandler.upsert(req, res) });
inventoryHandler.delete('/hosts/:name',async (req: Request, res: Response): Promise<any> => { hostHandler.delete(req, res) });

// Result routes
inventoryHandler.get('/results', async (req: Request, res: Response): Promise<any> => { resultHandler.getAll(req, res) });
inventoryHandler.get('/results/:name',  async (req: Request, res: Response): Promise<any> => { resultHandler.getByName(req, res) });
inventoryHandler.put('/results', async (req: Request, res: Response): Promise<any> => { resultHandler.upsert(req, res) });
inventoryHandler.delete('/results/:name', async (req: Request, res: Response): Promise<any> => { resultHandler.delete(req, res) });

// Variable routes
inventoryHandler.get('/groups/:groupId/variables',  async (req: Request, res: Response): Promise<any> => { variableHandler.getByGroup(req, res) });
inventoryHandler.put('/variables',  async (req: Request, res: Response): Promise<any> => { resultHandler.upsert(req, res) });
inventoryHandler.delete('/groups/:groupId/variables/:name',  async (req: Request, res: Response): Promise<any> => { resultHandler.delete(req, res) });

export default inventoryHandler;
