import http from 'http'
import express from 'express'

import { loggerMiddleware, corsMiddleware } from '../lib/middleware'

import { createWebsocketServer, registerEventHandlers } from './socket'
import { createGqlServer } from './apollo'

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
    return res.send(`Adventure Cards API`)
  })

  const server = http.createServer(app)

  // attach websockets server
  const io = createWebsocketServer(server)
  registerEventHandlers(io)

  // attack gql server
  const gqlServer = await createGqlServer(server)
  gqlServer.applyMiddleware({ app: app, path: '/graphql' })

  return server
}

export async function start(): Promise<void> {
  if (!process.env.PORT) {
    throw new Error('env var not found: PORT')
  }

  const server = await createServer()
  server.listen(Number(process.env.PORT))
}
