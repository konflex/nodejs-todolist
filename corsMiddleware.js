/**
 * @file corsMiddleware.js
 * @summary CORS options
 * @module Server
 */

const cors = require('cors')
require('dotenv').config()

let corsUrl

if (process.env.NODE_ENV === 'development') {
  corsUrl = process.env.LOCAL_URL
} else if (process.env.NODE_ENV === 'production') {
  corsUrl = process.env.DEPLOY_URL
}

const corsOptions = {
    origin: corsUrl,
    credentials: true, // important 
}

module.exports = cors(corsOptions)