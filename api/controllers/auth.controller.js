/**
 * @file api/controllers/auth.controller.js
 * @summary Auth controller component
 * @module Server
*/

const db = require("../models")
const nodemailer = require("nodemailer");

const User = db.user
const RefreshToken = db.refreshToken
const EmailToken = db.emailToken
const PasswordToken = db.passwordToken

require('dotenv').config()

var jwt = require("jsonwebtoken")
var bcrypt = require("bcryptjs")


/**
 * 
 * @param {*} user 
 * @param {*} encodedToken 
 * @param {*} res 
 * @param {*} endpoint 
 * @param {*} headerMessage 
 * @returns 
 */
function sendConfirmationEmail(user, encodedToken, endpoint, headerMessage) {

	try{

		// Send email
		const transporter = nodemailer.createTransport({ 
			host: "smtpout.secureserver.net",  
			port: 587,
			auth: { user: process.env.EMAIL_USERNAME, pass: process.env.EMAIL_PASSWORD },
		})

		const node_env = process.env.NODE_ENV
		const host = node_env == 'development' ? process.env.HOST_DEV_FRONT : process.env.HOST_PROD_FRONT
		const link = host + endpoint + encodeURIComponent(encodedToken)

		const mailOptions = {
			from: process.env.EMAIL_USERNAME, 
			to: user.email, 
			subject: "Account Verification Link", 
			text: headerMessage + 
			link + 
			"\n\nThank You!\n" 
		}

		transporter.sendMail(mailOptions, function (err) {
			// Error occured
			if (err) { 
				return false
			}
			else {
				return true
			}
		})
	}
	catch(err) {
		return false
	}
}

exports.signup = (req, res) => {

	try {

		const user = new User({
				email: req.body.email,
				password: bcrypt.hashSync(req.body.password,10)
		})

		user.save((err, user) => {
			// Error occured
			if(err) {
				res.status(500).json({ message: "Error occured, cannot proceed" })
				return 
			}

			const token = bcrypt.genSaltSync(10)

			// Generate token model and save
			const emailToken = new EmailToken({
				user:user._id.toHexString(),
				token: token,
			})

			const encodedToken = jwt.sign({
				email: user.email,				
				token: token,
				// TODO: add expiration date
			}, 
				process.env.SECRET_KEY
			)

			emailToken.save((err) => {

				const endpoint = "/verify?token="
				const headerMessage = "Hello,\n\n" + "Please verify your account by clicking the link: \n"

				sendConfirmationEmail(user, encodedToken, endpoint, headerMessage)

				// Error occured
				if(err) {
					res.status(500).json({ message: "Error occured, cannot proceed" })
					return 
				}

			})

			// Successfully create user in db, email sent, waiting for user email confirmation
			res.status(200).json({ message: "A verification link has been sent to "+ user.email + ", please verify your email." })
			return 

		})
	}
	catch(err) {
		res.status(500).json({ message: "Error occured, cannot proceed" })
		return 
	}
}


exports.confirmEmail = function (req, res) {

	try {

		const decoded = jwt.verify(decodeURIComponent(req.params.token), process.env.SECRET_KEY)
		
		EmailToken.findOne({ token: decoded.token })
			.exec(async (err, emailToken) => {
				// Error occured
				if(err) {
					res.status(500).json({ message: "Error occured, cannot proceed" })
					return 
				}
				// token is not found into database i.e. token may have expired 
				if (!emailToken){
					res.status(400).json({message: "Your verification link may have expired. Please click on resend for verify your Email." })
					return 
				}
				// if token is found then check valid user 
				else{

					User.findOne({ _id: emailToken.user, email: decoded.email })
						.exec(async (err, user) => {
						// Error occured
						if(err) {
							res.status(500).json({ message: "Error occured, cannot proceed" })
							return 
						}
						// User is not in the db, he must sign up
						if (!user){
							res.status(400).json({message: "We were unable to find a user for this verification. Please sign up!"})
							return 
						} 
						// User is already verified
						else if (user.isVerify){
							res.status(200).json({ message: "User has been already verified. Please Login" })
							return 
						}
						// verify user
						else{
							// change isVerify to true
							user.isVerify = true
							user.save(function (err) {
								// error occur
								if(err){
									res.status(500).json({message: "Error occured, cannot proceed" })
									return 
								}
								// account successfully verified
								else{
									res.status(200).json({ message: "Your account has been successfully verified" })
									return
								}
							})
						}
					})
				}
		})
	}
	catch(err) {
		res.status(500).json({ message: "Error occured, cannot proceed" })
		return
	}
}


exports.resendLink = function (req, res) {

	try {

		User.findOne({ email: req.body.email })
			.exec(async (err, user) => {
			// Error occured
			if(err) {
				res.status(500).json({ message: "Error occured, cannot proceed" })
				return
			}
			// user is not found into database
			if (!user){
				res.status(400).json({ message: "We were unable to find a user with that email. Make sure your email is correct or sign up again!", })
				return
			}
			// user has been already verified
			else if (user.isVerify){
				res.status(200).json({ message: "This account has been already verified. Please log in.", })
				return
			} 
			// resend verification link
			else{

				EmailToken.findOne({ user: user._id })
				.exec(async (err, emailToken) => {
					// Error occured
					if(err) {
						res.status(500).json({ message: "Error occured, cannot proceed" })
						return
					}

					const token = bcrypt.genSaltSync(10)
					const encodedToken = jwt.sign({
						email: user.email,				
						token: token,
						// TODO: add expiration date
					}, 
						process.env.SECRET_KEY
					)

					if(emailToken) {

						emailToken.token = encodedToken

						emailToken.save((err) => {
							// Error occured
							if(err) {
								res.status(500).json({ message: "Error occured, cannot proceed" })
								return
							}

							const endpoint = "/verify?token="

							// emailToken updated and new email sent to user
							const headerMessage = "Hello,\n\n" + "Please verify your account by clicking the link: \n"

							sendConfirmationEmail(user, encodedToken, endpoint, headerMessage)

						})

						// Successfully create user in db, email sent, waiting for user email confirmation
						res.status(200).json({ message: "A verification link has been sent to "+ user.email + ", please verify your email." })
						return

					}

					else {
						// generate token model and save
						const emailToken = new EmailToken({
							user:user._id.toHexString(),
							token: encodedToken,
						})

						emailToken.save((err) => {
							// Error occured
							if(err) {
								res.status(500).json({ message: "Error occured, cannot proceed" })
								return
							}

							const endpoint = "/verify?token="

							// emailToken updated and new email sent to user
							const headerMessage = "Hello,\n\n" + "Please verify your account by clicking the link: \n"

							sendConfirmationEmail(user, encodedToken, endpoint, headerMessage)
						})

						// Successfully create user in db, email sent, waiting for user email confirmation
						res.status(200).json({ message: "A verification link has been sent to "+ user.email + ", please verify your email." })
						return

					}
				})
			}
		})
	}
	catch(err) {
		res.status(500).json({ message: "Error occured, cannot proceed" })
		return
	}
}


exports.sendResetPasswordLink = function (req, res) {

	try {

		User.findOne({ email: req.body.email })
			.exec(async (err, user) => {
			// Error occured
			if(err) {
				res.status(500).json({ message: "Error occured, cannot proceed" })
				return 
			}
			// user is not found into database
			if (!user){
				res.status(400).json({ message: "We were unable to find a user with that email. Make sure your email is correct !", })
				return 
			}
			// resend verification link
			else{

				const token = bcrypt.genSaltSync(10)

				const encodedToken = jwt.sign({
					email: user.email,				
					token: token,
					// TODO: add expiration date
				}, 
					process.env.SECRET_KEY
				)

				// generate password token model and save
				const passwordToken = new PasswordToken({
					user:user._id.toHexString(),
					token: token,
				})

				passwordToken.save((err) => {
					// Error occured
					if(err) {
						res.status(500).json({ message: "Error occured, cannot proceed" })
						return 
					}

					const endpoint = "/resetpassword?token="

					// passwordToken updated and new email sent to user
					const headerMessage = "Hello,\n\n" + "Click on this link to reset your password: \n"

					sendConfirmationEmail(user, encodedToken, endpoint, headerMessage)
				})

				// Successfully create user in db, email sent, waiting for user email confirmation
				res.status(200).json({ message: "A reset link has been sent to "+ user.email + "." })
				return 

			}
		})
	}
	catch(err) {
		res.status(500).json({ message: "Error occured, cannot proceed" })
		return 
	}
}


exports.resetPassword = function (req, res) {

	try {

		const token = req.params.token
		const decoded = jwt.verify(token, process.env.SECRET_KEY)

		PasswordToken.findOne({ token: decoded.token })
			.exec(async (err, passwordToken) => {
				// Error occured
				if(err) {
					res.status(500).json({ message: "Error occured, cannot proceed" })
					return 
				}
				// token is not found into database i.e. token may have expired 
				if (!passwordToken){
					res.status(400).json({message: "Your verification link may have expired. Please click on resend for verify your Email." })
					return 
				}
				// if token is found then check valid user 
				else{

					User.findOne({ _id: passwordToken.user, })
						.exec(async (err, user) => {
						// Error occured
						if(err) {
							res.status(500).json({ message: "Error occured, cannot proceed" })
							return 
						}
						// User is not in the db, he must sign up
						if (!user){
							res.status(400).json({message: "We were unable to find a user."})
							return 
						} 
						// verify user
						else{

							const newPassword = bcrypt.hashSync(req.body.password,10)
							
							// change isVerify to true
							user.password = newPassword
							user.save(function (err) {
								// error occur
								if(err){
									res.status(500).json({message: "Error occured, cannot proceed" })
									return 
								}
								// account successfully verified
								else{
									res.status(200).json({ message: "Your password resetted" })
									return 
								}
							})
						}

					})
				}
		})
	}
	catch(err) {
		res.status(500).json({ message: "Error occured, cannot proceed" })
		return 
	}
}

exports.signin = (req, res) => {

	try {
		// Find user
		User.findOne({
			email: req.body.email
		})
			.exec(async (err, user) => {
				// Error occureed
				if(err) {
					res.status(500).json({ message: "Error occured, cannot proceed" })
					return 
				}
				// Didn't find user
				if(!user){
					res.status(401).json({ message: "Invalid email or password"})
					return 
				}

				// Check user passphrase
				const isPwdValid = bcrypt.compareSync(
					req.body.password,
					user.password
				)
				// Passphrase not valid
				if(!isPwdValid) {
					res.status(401).json({ message: "Invalid email or password", })
					return 
				}
				// check user is verified or not
				else if (!user.isVerify){
					res.status(401).json({ message: "Your email has not been verified.", })
					return 
				}

				const accessToken = jwt.sign({ 
					id: user.id,
					exp: Math.floor(Date.now() / 1000) + parseInt(process.env.TOKEN_EXPIRATION),
				}, 
					process.env.SECRET_KEY
				)

				const tokens = {
					accessToken: undefined,
					refreshToken: undefined,
				}

				// Get refresh token 
				let refreshToken = await RefreshToken.findOne({ user: user })

				// Refresh token is expired
				if(!refreshToken) {
					// Renew refresh token
					refreshToken = await RefreshToken.createToken(user)
					// Store new created tokens 
					if(refreshToken && refreshToken.token) {
						tokens.refreshToken = refreshToken.token
						tokens.accessToken = accessToken
					}
				}

				// Refresh token is not expired
				else {

					if(refreshToken.token) {
						tokens.refreshToken = refreshToken.token
						tokens.accessToken = accessToken
					}
				}

				res.status(200)
				.cookie('myToken', JSON.stringify(tokens), {
					sameSite: process.env.NODE_ENV == "production" ? "lax" : "none",
					secure: true,
					httpOnly: true,
					domain: process.env.NODE_ENV == "production" ? process.env.DOMAIN : ""
				})
				.json({
					// TODO: to dig
					id: user._id,
					email: user.email,					
					isAuthenticated: true 
				})

				return 
			})
	}
	catch(err) {
		res.status(500).json({ message: "Error occured, cannot proceed" })
		return 
	}
}

exports.refreshToken = async (req, res) => {
	try {

		let accessToken = req.headers["cookie"]
		let getCookie = new URLSearchParams(accessToken)
		const myToken = getCookie.get('myToken')

		// get the object containing accessToken and refreshToken 
		const tokens = JSON.parse(myToken)

		let requestToken 

		if(tokens && typeof tokens === 'object' && tokens.refreshToken) requestToken = tokens.refreshToken
		else requestToken = null

		if(requestToken == null) {
			res.status(403).json({ message: "Refresh token is required" })
			return 
		} 

		let refreshToken = await RefreshToken.findOne({ token: requestToken })

		if(!refreshToken) {

			res.status(403).json({ message: "Refresh token is not in the database. Please make a new signin request" })
			return 
		}

		let verifyExpiration = await RefreshToken.verifyExpiration(refreshToken)

		if(verifyExpiration) {

			RefreshToken.findByIdAndRemove(refreshToken._id.valueOf(), { useFindAndRemove: false, }).exec()

			res.status(403).json({ message: "Refresh token was expired. Please make a new signin request" })
			return 

		}

		let newAccessToken = jwt.sign({ 
			id: refreshToken.user.valueOf(), 
			exp: Math.floor(Date.now() / 1000) + parseInt(process.env.TOKEN_EXPIRATION), }, 
			process.env.SECRET_KEY
		)

		tokens.accessToken = newAccessToken
		
		const stgTokens = JSON.stringify(tokens)
		
		// set the cookie with the new token
		res.status(200)
		.cookie('myToken', stgTokens, {
			sameSite: process.env.NODE_ENV == "production" ? "lax" : "none",
			secure: true,
			httpOnly: true,
			domain: process.env.NODE_ENV == "production" ? process.env.DOMAIN : ""
		})
		.json({ message: "New token has been created" })

		return 
	}

	catch(err) {
		res.status(500).json({ message: "Error occured, cannot proceed" })
		return 
	}
}