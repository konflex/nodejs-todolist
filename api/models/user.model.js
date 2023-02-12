/**
 * @file api/models/user.model.js
 * @summary User model component
 * @module Server
 */

const mongoose = require("mongoose")

const oneHour = 60 * 60

let userSchema = new mongoose.Schema({
	email: {
		type: String,
		required: true,
		index: true,
		unique: true,
	},
	password: {
		type: String,
		required: true,
	},
	isVerify: {
		type: Boolean,
		default: false,
	},
	createdAt: {
		type: Date,
		default: Date.now(),
	}
})

userSchema.index({createdAt: 1}, {
	expireAfterSeconds: oneHour, // 1 hour
	partialFilterExpression: { isVerify: false, },
	},
)

const User = mongoose.model(
	"User",
	userSchema,
)

module.exports = User