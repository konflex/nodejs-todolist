/**
 * @file corsMiddleware.js
 * @summary CORS options
 * @module Server
 */

const cors = require('cors')
require('dotenv').config()

let allowedDomains

if (process.env.NODE_ENV === 'development') {
	allowedDomains = JSON.parse(process.env.LOCAL_URL)
}
else {
	allowedDomains = JSON.parse(process.env.DEPLOY_URL)
}

const corsOptions = {

		origin: function (origin, callback) {
			
			if (allowedDomains.indexOf(origin) === -1) {
				let msg = `This site ${origin} does not have an access. Only specific domains are allowed to access it.`
				return callback(new Error(msg), false)
			}

			return callback(null, true)
		},

		credentials: true, // indicating that the server can include credentials (like cookies) in CORS requests
}

module.exports = cors(corsOptions)