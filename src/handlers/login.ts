import express, {  Request, Response } from 'express'
import { LoginRequest } from './schemas/LoginRequest'
import { LoginResponse } from './schemas/LoginResponse'
import { SecurityService } from '../services/securityservice'

export const loginRouter = express.Router()

loginRouter.post('/login', async (req: Request, resp: Response) => {
  console.log('Login.handleRequest', req.body)
  const request: LoginRequest = req.body as LoginRequest;
  try{
    const token: string = await SecurityService.login(request.uid, request.pwd);
    resp.appendHeader('QRDTOKEN', token);
    console.log('Login.handleRequest: token: ', token);
    resp.status(200).end();
  }
  catch(e){
    resp.status(401).send(e)
  }

})
