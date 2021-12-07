const jwt = require("jsonwebtoken")
require('dotenv').config()

const { TokenExpiredError } = jwt;

const catchError = (err, res) => {
  if (err instanceof TokenExpiredError) {
    return res.status(401).send({ message: "Unauthorized! Access Token was expired!" });
  }

  return res.sendStatus(401).send({ message: "Unauthorized!" });
}

const verifyToken = (req, res, next) => {
	let cookie = req.headers["cookie"]
	
	let getCookie = new URLSearchParams(cookie)

	const token = getCookie.get('myToken')

	if(!token) {
		return res.status(403).send({ message: "No token provided", isAuthenticated: false})
	}

	jwt.verify(token, process.env.SECRET_KEY, (err, decoded) => {
		if(err) {
			return catchError(err,res)
		}

		req.userId = decoded.id

		next()
	})
}

const authJwt = {
	verifyToken,
}

module.exports = authJwt