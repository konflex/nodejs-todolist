/**
 * @file api/models/emailToken.model.js
 * @summary Email token model for verification
 * @module Server
 */

const mongoose = require("mongoose")

const halfAnHour = 30 * 60

// Mongoose schema
const emailTokenSchema = new mongoose.Schema({
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

const EmailToken = mongoose.model(
	"EmailToken",
	emailTokenSchema,
)

module.exports = EmailToken