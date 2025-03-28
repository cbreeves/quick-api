import express, { Request, Response } from 'express'
import { SecurityService } from '../services/securityservice'

interface HostnameIP {
  name: string
  ipAddress: string
}

export const dnsHandler = express.Router()
const dns = require('node:dns')

dnsHandler.get('/', async (req: Request, resp: Response) => {
  console.log('validateHostDNSRouter.handleRequest', req.query);
  if (req.query.action == 'reverse') {
    const ip = req.query.ip;
    try {
      dns.reverse(ip, (err: any, hostnames: any[]) => {
        console.log('hostnames: %j', hostnames)
        resp.status(200).send(hostnames);
      })
    } catch (e) {
      resp.status(401).send(e)
    }
  }
  else {
    resp.status(400).send();
  }
})
