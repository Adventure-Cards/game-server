import { Handler } from 'express'
import cors from 'cors'

export const loggerMiddleware: Handler = (req, _, next) => {
  if (req.method !== 'OPTIONS') {
    console.log('________________________________________________\n')
    console.log(
      `${req.method.padEnd(8, ' ')}${req.path.padEnd(24, ' ')}${JSON.stringify(req.query)}`
    )
    console.log('IP:    ', req.ip || 'None')
  }
  next()
}

export const corsMiddleware = cors({
  credentials: true,
  origin: (origin, callback) => {
    if (!process.env.ALLOWED_ORIGINS) {
      throw new Error('env var not found: ALLOWED_ORIGINS')
    }
    if (!origin || process.env.ALLOWED_ORIGINS === '*') {
      return callback(null, true)
    }
    if (process.env.ALLOWED_ORIGINS.indexOf(origin) === -1) {
      return callback(
        new Error("This server's CORS policy does not allow access from the specified origin."),
        false
      )
    }
    return callback(null, true)
  },
})
