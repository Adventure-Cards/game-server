import http from 'http'
import { ApolloServer } from 'apollo-server-express'
import { ApolloServerPluginDrainHttpServer } from 'apollo-server-core'

import { schema } from '../gql/schema'
import { resolvers } from '../gql/resolvers'

export async function createGqlServer(server: http.Server): Promise<ApolloServer> {
  const gqlServer = new ApolloServer({
    typeDefs: schema,
    resolvers: resolvers,
    plugins: [ApolloServerPluginDrainHttpServer({ httpServer: server })],
  })

  await gqlServer.start()

  return gqlServer
}
