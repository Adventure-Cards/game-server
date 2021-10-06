import express from 'express'
import http from 'http'

import { loggerMiddleware, corsMiddleware } from '../lib/middleware'
import { createWebsocketServer, registerEventHandlers } from './sockets'

export async function createServer(): Promise<http.Server> {
  const app = express()

  if (process.env.NODE_ENV === 'production') {
    app.set('trust proxy', true)
  }

  app.use(express.json())
  app.use(express.urlencoded({ extended: true }))

  app.use(loggerMiddleware)
  app.use(corsMiddleware)

  app.get('/', (_, res) => {
    return res.send(`Quest API`)
  })

  const server = http.createServer(app)

  const io = createWebsocketServer(server)

  registerEventHandlers(io)

  return server
}

export async function start(): Promise<void> {
  if (!process.env.PORT) {
    throw new Error('env var not found: PORT')
  }

  const server = await createServer()
  server.listen(Number(process.env.PORT))
}
