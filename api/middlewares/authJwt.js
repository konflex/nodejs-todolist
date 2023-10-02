const jwt = require("jsonwebtoken")
require('dotenv').config()

const { TokenExpiredError, } = jwt;

const catchError = (err, res) => {
	if (err instanceof TokenExpiredError) {
		res.status(401).json({ message: "Unauthorized! Access Token was expired!" })
	}
	else {
		res.sendStatus(401).json({ message: "Unauthorized!" })
	}
}

const verifyToken = (req, res, next) => {

	let cookie = req.headers["cookie"]
	let getCookie = new URLSearchParams(cookie)
	const token = getCookie.get('myToken')

	if(!token) {
		res.status(403).json({ message: "No token provided", isAuthenticated: false, })
		return 
	}

	const accessToken = JSON.parse(token).accessToken
	
	jwt.verify(accessToken, process.env.SECRET_KEY, (err, decoded) => {
		if(err) {
			catchError(err,res)
			return 
		}

		req.userId = decoded.id
		next()
	})
}

const authJwt = {
	verifyToken,
}

module.exports = authJwt