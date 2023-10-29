/**
 * @file api/controllers/auth.controller.js
 * @summary Auth controller component
 * @module Server
*/

const db = require("../models")
const nodemailer = require("nodemailer")

const User = db.user
const RefreshToken = db.refreshToken
const EmailToken = db.emailToken
const PasswordToken = db.passwordToken

require('dotenv').config()

var jwt = require("jsonwebtoken")
var bcrypt = require("bcryptjs")


/**
 * Sends email to a user with an encoded token (account verification, reset password).
 *
 * @param {Object} user - The user object containing user information.
 * @param {string} encodedToken - The encoded token to be included in the verification link.
 * @param {string} endpoint - The endpoint where the user can verify their account.
 * @param {string} bodyMessage - The body message to include in the email body.
 * @returns {Promise<boolean>} A Promise that resolves to true if the email is sent successfully, or false if there is an error.
 */
async function sendMailWithVerificationLink(user, encodedToken, endpoint, sujectMessage, bodyMessage) {

	try{

		// create reusable transporter object using the default SMTP transport
		const transporter = nodemailer.createTransport({ 
			host: "smtpout.secureserver.net",  
			port: 587,
			secure: false, // true for 465, false for other ports
			auth: { 
				user: process.env.EMAIL_USERNAME, 
				pass: process.env.EMAIL_PASSWORD 
			},
		})

		const node_env = process.env.NODE_ENV
		const host = node_env == 'development' ? process.env.HOST_DEV_FRONT : process.env.HOST_PROD_FRONT
		const link = host + endpoint + encodeURIComponent(encodedToken)

		const mailOptions = {
			from: process.env.EMAIL_USERNAME, 
			to: user.email, 
			subject: sujectMessage, 
			text: bodyMessage + link + "\n\nThank You!\n" 
		}

		await transporter.sendMail(mailOptions)

		// Returns true if mail sent successfully
		return true

	}
	catch(err) {
		// False if error occured
		return false
	}
}


/**
 * Register a new user, send a confirmation email and handle errors.
 *
 * @param {Request} req - The Express request object.
 * @param {Response} res - The Express response object.
 * @returns {Promise<void>} - A promise that resolves when the signup process is complete.
 */
exports.signup = async (req, res) => {

	let savedEmailToken
	let savedUser

	try {

		const user = new User({
				email: req.body.email,
				password: bcrypt.hashSync(req.body.password,10)
		})

		// Save user to the database
		savedUser = await user.save()
		// Generate a token for email verification
		const token = bcrypt.genSaltSync(10)
		// Create an email token for the user
		const emailToken = new EmailToken({
			user:user._id.toHexString(),
			token: token,
		})

		// Save the email token to the database
		savedEmailToken = await emailToken.save()

		// Create an encoded token for JWT
		const encodedToken = jwt.sign({
			email: user.email,
			token: token,
		},
			process.env.SECRET_KEY
		)
		// Define the verification link endpoint and message
		const endpoint = "/verify?token="
		const sujectMessage = "Account Verification Link"
		const bodyMessage = "Hello,\n\n" + "Please verify your account by clicking the link: \n"
		// Send a confirmation email to the user
		const emailSent = await sendMailWithVerificationLink(user, encodedToken, endpoint, sujectMessage, bodyMessage)

		if(emailSent) {
			// Successfully create user in db, email sent, waiting for user email confirmation
			res.status(200).json({ message: "A verification link has been sent, please check you mail box." })
			return
		}
		else {
			// Handle the case when email was not sent successfully and delete the user and email token records
			await User.findByIdAndRemove(savedUser._id)
			await EmailToken.findByIdAndRemove(savedEmailToken._id)
			res.status(500).json({ message: "Error occured, cannot proceed" })
			return
		}
	}
	catch(err) {
		// Delete user and email token records if error occured
		if (savedUser) {
			await User.findByIdAndRemove(savedUser._id)
		}
		if (savedEmailToken) {
			await EmailToken.findByIdAndRemove(savedEmailToken._id)
		}
		
		res.status(500).json({ message: "Error occured, cannot proceed" })
		return 
	}
}


/**
 * Confirm a user's email address based on a verification token.
 *
 * @param {Request} req - The Express request object.
 * @param {Response} res - The Express response object.
 * @returns {Promise<void>} - A promise that resolves when the confirmation is complete or rejects on error.
 */
exports.confirmEmail = async (req, res) => {

	try {
		// Decode token with JWT
		const decoded = jwt.verify(decodeURIComponent(req.params.token), process.env.SECRET_KEY)
		// Find email token in the db
		const emailToken = await EmailToken.findOne({ token: decoded.token })

		// No token was found, user should click on resend link 
		if (!emailToken) {
			res.status(400).json({ message: "Your verification link may have expired. Please click on resend link to verify your email." })
			return
		}
		// Find user with email token and decoded email
		const user = await User.findOne({ _id: emailToken.user, email: decoded.email })
		// No user was found
		if (!user) {
			res.status(400).json({ message: "We were unable to find a user for this verification. Please sign up!" })
			return
		}
		// User email already verify
		if (user.isVerify) {
			res.status(200).json({ message: "User has already been verified. Please login." })
			return
		}
		// Confirm email in db and save it
		user.isVerify = true
		await user.save()

		res.status(200).json({ message: "Your account has been successfully verified" })
		return

	} catch (err) {
		res.status(500).json({ message: "Error occurred, cannot proceed" })
		return
	}
}


/**
 * Resends the email verification link to a user who has signed up but not yet verified their email address.
 *
 * @param {Request} req - The Express request object containing the user's email.
 * @param {Response} res - The Express response object for sending the response.
 * @returns {Promise<void>} - A promise that resolves when the email is resent or rejects on error.
 */
exports.resendLink = async (req, res) => {

	try {
		// Find the user by email
		const user = await User.findOne({ email: req.body.email })

		// If user not found, respond with an error message
		if (!user) {
			res.status(400).json({ message: "We were unable to find a user with that email. Make sure your email is correct or sign up again!" })
			return
		}

		// If user is already verified, respond accordingly
		if (user.isVerify) {
			res.status(200).json({ message: "This account has already been verified. Please log in." })
			return
		}

		// Generate a new verification token
		const token = bcrypt.genSaltSync(10)
		const encodedToken = jwt.sign(
			{
			email: user.email,
			token: token,
			},
			process.env.SECRET_KEY
		)

		// Find or create an EmailToken record
		let emailToken = await EmailToken.findOne({ user: user._id })


		if (!emailToken) {
			emailToken = new EmailToken({
			user: user._id.toHexString(),
			token: token,
			})
		}
		else {
			emailToken.token = token
		}

		// Save the EmailToken record
		await emailToken.save()

		// Define the verification link endpoint and message
		const endpoint = "/verify?token="
		const subjectMessage = "Account Verification Link"
		const bodyMessage = "Hello,\n\n" + "Please verify your account by clicking the link: \n"

		// Send the confirmation email and handle the result
		const emailSent = await sendMailWithVerificationLink(user, encodedToken, endpoint, subjectMessage, bodyMessage)

		if (emailSent) {
			// Email sent successfully
			res.status(200).json({ message: "A verification link has been sent, please verify your email box." })
			return
		}
		else {
			// Error occured when sending mail
			res.status(500).json({ message: "Error occurred, cannot proceed" })
			return

		}
	} catch (err) {
		res.status(500).json({ message: "Error occurred, cannot proceed" })
		return

	}
}



/**
 * Signs in a user, generates access and refresh tokens, and sets cookies.
 *
 * @param {Request} req - The Express request object containing user credentials.
 * @param {Response} res - The Express response object for sending the response.
 * @returns {Promise<void>} - A promise that resolves when the user is signed in or rejects on error.
 */
exports.signin = async (req, res) => {

	try {
		// Find the user by email
		const user = await User.findOne({ email: req.body.email })

		// If user not found, respond with an error message
		if (!user) {
			res.status(401).json({ message: "Invalid email or password" })
			return
		}

		// Check user passphrase
		const isPwdValid = bcrypt.compareSync(req.body.password, user.password)

		// Passphrase not valid
		if (!isPwdValid) {
			res.status(401).json({ message: "Invalid email or password" })
			return
		}

		// Check if the user is verified
		if (!user.isVerify) {
			res.status(401).json({ message: "Invalid email or password" })
			return
		}

		// Generate an access token
		const accessToken = jwt.sign(
		{
			id: user.id,
			exp: Math.floor(Date.now() / 1000) + parseInt(process.env.TOKEN_EXPIRATION), // Token expiration in seconds
		},
		process.env.SECRET_KEY
		)

		// Initialize tokens
		const tokens = {
			accessToken: undefined,
			refreshToken: undefined,
		}

		// Find or create a refresh token
		let refreshToken = await RefreshToken.findOne({ user: user })

		// Refresh token is expired or does not exist
		if (!refreshToken) {
			// Create a new refresh token
			refreshToken = await RefreshToken.createToken(user)
		}

		// Store new created tokens if a refresh token exists
		tokens.refreshToken = refreshToken.token
		tokens.accessToken = accessToken

		// Set the cookie with tokens
		res.cookie('myToken', JSON.stringify(tokens), {
			sameSite: process.env.NODE_ENV == "production" ? "lax" : "none",
			secure: true,
			httpOnly: true,
			domain: process.env.NODE_ENV == "production" ? process.env.DOMAIN : "",
		})

		// Send the JSON response
		res.status(200).json({
			id: user._id,
			email: user.email,
			isAuthenticated: true,
		})

		return

	} catch (err) {
		res.status(500).json({ message: "Error occurred, cannot proceed" })
		return
	}
}


/**
 * Refreshes the access token using a valid refresh token and sets the updated token in a cookie.
 *
 * @param {Object} req - The Express.js request object.
 * @param {Object} res - The Express.js response object.
 * @returns {void}
 */
exports.refreshToken = async (req, res) => {

	try {
		// Parse the cookie to get the tokens
		let accessToken = req.headers['cookie']
		let getCookie = new URLSearchParams(accessToken)

		const myToken = getCookie.get('myToken')

		// Get the object containing accessToken and refreshToken
		const tokens = JSON.parse(myToken)

		let requestToken

		if (tokens && typeof tokens === 'object' && tokens.refreshToken) {
			requestToken = tokens.refreshToken
		} 
		else {
			requestToken = null
		}

		if (requestToken === null) {
			res.status(403).json({ message: 'Refresh token is required' })
			return
		}

		// Find the refresh token in the database
		let refreshToken = await RefreshToken.findOne({ token: requestToken })

		if (!refreshToken) {
			res.status(403).json({ message: 'Refresh token is not in the database. Please make a new signin request', })
			return
		}

		// Verify if the refresh token has expired
		let verifyExpiration = await RefreshToken.verifyExpiration(refreshToken)

		if (verifyExpiration) {
			// Remove the expired refresh token from the database
			await RefreshToken.findByIdAndRemove(refreshToken._id, {
				useFindAndRemove: false,
			}).exec()

			res.status(403).json({ message: 'Refresh token was expired. Please make a new signin request', })
			return
		}

		// Generate a new access token
		let newAccessToken = jwt.sign(
		{
			id: refreshToken.user,
			exp:
			Math.floor(Date.now() / 1000) +
			parseInt(process.env.TOKEN_EXPIRATION),
		},
		process.env.SECRET_KEY
		)

		// Update the access token in the tokens object
		tokens.accessToken = newAccessToken

		// Serialize the updated tokens object
		const stgTokens = JSON.stringify(tokens)

		// Set the cookie with the new token
		res.cookie('myToken', stgTokens, {
			sameSite: process.env.NODE_ENV == 'production' ? 'lax' : 'none',
			secure: true,
			httpOnly: true,
			domain: process.env.NODE_ENV == 'production' ? process.env.DOMAIN : '',
		})

		// Respond with a 200 status code (no specific message for security)
		res.status(200).send()

		return

	} catch (err) {
		res.status(500).json({ message: 'Error occurred, cannot proceed' })
		return 
	}
}


/**
 * Sends a reset password link to a user's email.
 *
 * @param {Object} req - Express request object containing user's email.
 * @param {Object} res - Express response object to send HTTP response.
 */
exports.sendResetPasswordLink = async (req, res) => {

	try {
		// Find a user in the database based on the provided email address
		const user = await User.findOne({ email: req.body.email })

		// If the user is not found, return a response with a 400 status code and an error message
		if (!user) {
			res.status(400).json({ message: "We were unable to find a user with that email. Make sure your email is correct!" })
			return
		}
	
		// Generate a token for resetting the password
		const token = bcrypt.genSaltSync(10)
	
		// Create an encoded token using JWT
		const encodedToken = jwt.sign({
			email: user.email,
			token: token,
		}, process.env.SECRET_KEY)
	
		// Create a PasswordToken model and save it to the database
		const passwordToken = new PasswordToken({
			user: user._id.toHexString(),
			token: token,
		})

		await passwordToken.save()
	
		// Define the reset password link endpoint
		const endpoint = "/resetpassword?token="
		const subjectMessage = "Reset your password"
		// Create a header message for the reset password email
		const bodyMessage = "Hello,\n\n" + "Click on this link to reset your password: \n"
	
		// Attempt to send the reset password email
		const emailSent = await sendMailWithVerificationLink(user, encodedToken, endpoint, subjectMessage, bodyMessage)
	
		if (emailSent) {
			// Email sent successfully and password token created in the database
			res.status(200).json({ message: "A reset link has been sent to your email." })
			return
		}
		else {
			// Email sending failed you can handle this case here
			// For example, you might want to log the failure or respond with an error message
			res.status(500).json({ message: "Error occurred while sending the email." })
			return
		}

	}
	catch (err) {
		// Catch and handle any errors that occurred during execution
		res.status(500).json({ message: "An error occurred, cannot proceed." })
		return
	}
}

/**
 * Reset a user's password based on a provided token.
 *
 * @param {Object} req - Express request object containing token and new password.
 * @param {Object} res - Express response object to send HTTP response.
 */
exports.resetPassword = async (req, res) => {
	try {
		// Get the token from request parameters
		const token = req.params.token
	
		// Verify and decode the token using the SECRET_KEY
		const decoded = jwt.verify(token, process.env.SECRET_KEY)
	
		// Find the PasswordToken in the database based on the decoded token
		const passwordToken = await PasswordToken.findOne({ token: decoded.token })
	
		// If the token is not found in the database, it may have expired
		if (!passwordToken) {
			res.status(400).json({ message: "Your verification link may have expired. Please click on resend to verify your email." })
			return
		}

		// If the token is found, check if the associated user exists
		const user = await User.findOne({ _id: passwordToken.user })
	
		// If the user does not exist in the database, prompt them to sign up
		if (!user) {
			res.status(400).json({ message: "We were unable to find a user." })
			return
		}

		// Hash the new password
		const newPassword = bcrypt.hashSync(req.body.password, 10)

		// Update the user's password and save changes
		user.password = newPassword
		await user.save()

		// Password reset successful
		res.status(200).json({ message: "Your password has been reset." })
		return
	}
	catch (err) {
		// Handle any unexpected errors
		res.status(500).json({ message: "An error occurred, cannot proceed" })
		return
	}
}