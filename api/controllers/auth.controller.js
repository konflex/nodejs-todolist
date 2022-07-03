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
				return res.status(401).send({ message: "Invalid email or password"})

			} 

			var passwordIsValid = bcrypt.compareSync(
				req.body.password,
				user.password
			)

			if(!passwordIsValid) {
				return res.status(401).send({
					message: "Invalid email or password",
				})
			}

			 

			var token = jwt.sign({ 
				id: user.id,  
				exp: Math.floor(Date.now() / 1000) + parseInt(process.env.TOKEN_EXPIRATION),
			}, 
				process.env.SECRET_KEY
			)
			
			let refreshToken = await RefreshToken.createToken(user)

			res.cookie('myToken', token, {
				// expires: new Date(Date.now() + process.env.TOKEN_EXPIRATION*1000),
				secure: false,
				httpOnly: true,
			})

			res.status(200).send({
				id: user._id,
				username: user.username,
				email: user.email,
				isAuthenticated: true,
				refreshToken: refreshToken
			})

		})
}

exports.refreshToken = async (req, res) => {

	const { refreshToken: requestToken } = req.body

	if(requestToken == null) {
		return res.status(403).json({ message: "Refresh token is required"})
	} 

	try {
		let refreshToken = await RefreshToken.findOne({ token: requestToken })

		if(!refreshToken) {
			res.status(403).json({ message: "Refresh token is not in the database"})
			return
		}

		if(RefreshToken.verifyExpiration(refreshToken)) {
			RefreshToken.findByIdAndRemove(refreshToken._id, { useFindAndRemove: false}).exec()

			res.status(403).json({
				message: "Refresh token was expired. Please make a new signin request"
			})
			return
		}

		let newAccessToken = jwt.sign({ id: refreshToken.user._id}, process.env.SECRET_KEY, {
			expiresIn: process.env.TOKEN_EXPIRATION 
		})

		return res.status(200).json({
			accessToken: newAccessToken,
			refreshToken: refreshToken.token
		})
	}
	catch(err) {
		return res.status(500).send({ message: err })
	}
}