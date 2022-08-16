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

    origin: function (origin, callback) {
      // bypass the requests with no origin (like curl requests, mobile apps, etc )
      if (!origin) return callback(null, true);
   
      if (allowedDomains.indexOf(origin) === -1) {
        var msg = `This site ${origin} does not have an access. Only specific domains are allowed to access it.`;
        return callback(new Error(msg), false);
      }
      return callback(null, true);
    },


    credentials: true, // important 
}

module.exports = cors(corsOptions)