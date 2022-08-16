/**
 * @file corsMiddleware.js
 * @summary CORS options
 * @module Server
 */

const cors = require('cors')
require('dotenv').config()

let allowedDomains

if (process.env.NODE_ENV === 'development') {
  allowedDomains = process.env.LOCAL_URL
} else if (process.env.NODE_ENV === 'production') {
  allowedDomains = JSON.parse(process.env.DEPLOY_URL)
}

const corsOptions = {
    origin: allowedDomains,
    credentials: true, // important 
}

module.exports = cors(corsOptions)