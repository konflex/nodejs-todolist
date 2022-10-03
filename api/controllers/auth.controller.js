/**
 * @file api/controllers/auth.controller.js
 * @summary Auth controller component
 * @module Server
*/

const db = require("../models")
const User = db.user

require('dotenv').config()

var jwt = require("jsonwebtoken")
var bcrypt = require("bcryptjs")
const RefreshToken = require("../models/refreshToken.model")


exports.signup = (req, res) => {
	const user = new User({
		username: req.body.username,
		email: req.body.email,
		password: bcrypt.hashSync(req.body.password,10)
	})

	user.save((err, user) => {
		if(err) {
			res.status(500).send({ message: err })
			return
		}

		res.status(200).send({ message: "User was registered successfully"})
	
	})
}

exports.signin = (req, res) => {
	User.findOne({
		email: req.body.email
	})
		.exec(async (err, user) => {
			


			if(err) {
				res.status(500).send({ message: err })
				return
			}



			if(!user){
				res.status(401).send({ message: "Invalid email or password"})
				return 
			} 

			var passwordIsValid = bcrypt.compareSync(
				req.body.password,
				user.password
			)



			if(!passwordIsValid) {
				res.status(401).send({
					message: "Invalid email or password",
				})

				return 
			}

			let token = jwt.sign({ 
				id: user.id,  
				exp: Math.floor(Date.now() / 1000) + parseInt(process.env.TOKEN_EXPIRATION),
			}, 
				process.env.SECRET_KEY
			)
			

			let refreshTokenObj = await RefreshToken.findOne({ user: user })

			let cookies = {
				accessToken: undefined,
				refreshToken: undefined,
			}

			if(!refreshTokenObj) {
				refreshTokenObj = await RefreshToken.createToken(user)

				cookies.refreshToken = refreshTokenObj?.refreshToken?.token
				cookies.accessToken = token
			}
			else {
				cookies.refreshToken = refreshTokenObj?.token
				cookies.accessToken = token
			}

			res.status(200)
			.cookie('myToken', JSON.stringify(cookies), {
				sameSite: process.env.NODE_ENV == "production" ? "lax" : "none",
				secure: true,
				httpOnly: true,
				domain: process.env.NODE_ENV == "production" ? process.env.DOMAIN : ""
			})
			

			.send({
				id: user._id,
				username: user.username,
				email: user.email,
				isAuthenticated: true,
			})

		})
}

exports.refreshToken = async (req, res) => {

	let cookie = req.headers["cookie"]
	let getCookie = new URLSearchParams(cookie)
	const myToken = getCookie.get('myToken')


	// get the object containing accessToken and refreshToken 
	const tokenObject = JSON.parse(myToken)

	let requestToken 
	
	if(tokenObject && typeof tokenObject === 'object') requestToken = tokenObject.refreshToken
	else requestToken = null

	if(requestToken == null) {
		return res.status(403).json({ message: "Refresh token is required", })
		 
	} 

	try {

		let refreshToken = await RefreshToken.findOne({ token: requestToken })

		if(!refreshToken) {

			res.status(403).json({ message: "Refresh token is not in the database. \
			Please make a new signin request", })
			
			return
		}

		let verifyExpiration = await RefreshToken.verifyExpiration(refreshToken)

		if(verifyExpiration) {
			RefreshToken.findByIdAndRemove(refreshToken._id.valueOf(), { useFindAndRemove: false, }).exec()

			res.status(403).json({
					message: "Refresh token was expired. Please make a new signin request",
			})

			return 
		}


		let newAccessToken = jwt.sign({ 
			id: refreshToken.user.valueOf(), 
			exp: Math.floor(Date.now() / 1000) + parseInt(process.env.TOKEN_EXPIRATION), }, 
			process.env.SECRET_KEY
		)


		tokenObject.accessToken = newAccessToken
		
		const stgToken = JSON.stringify(tokenObject)

		return res.status(200)
		
		// set the cookie with the new token
		.cookie('myToken', stgToken, {
			sameSite: process.env.NODE_ENV == "production" ? "lax" : "none",
			secure: true,
			httpOnly: true,
			domain: process.env.NODE_ENV == "production" ? process.env.DOMAIN : ""
		})

		.send({
			message: "New token has been created",
		})
	}

	catch(err) {
	
		return res.status(500).send({ message: err, })
	}
}