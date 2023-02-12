/**
 * @file api/models/passwordToken.model.js
 * @summary Password token model for reset
 * @module Server
 */

const mongoose = require("mongoose")

const halfAnHour = 30 * 60

const passwordTokenSchema = new mongoose.Schema({
	user: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'User',
		required: true,
	},
	token: {
		type: String,
		required: true,
	},
	expiryDate: {
		type: Date,
		expires: halfAnHour,
		default: Date.now(),
	},
})

const PasswordToken = mongoose.model(
	"PasswordToken",
	passwordTokenSchema,
)

module.exports = PasswordToken