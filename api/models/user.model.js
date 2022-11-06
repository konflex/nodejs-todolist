/**
 * @file api/models/user.model.js
 * @summary User model component
 * @module Server
 */

const mongoose = require("mongoose")

const User = mongoose.model(
	"User",
	new mongoose.Schema({
		email: {
			type: String,
			required: true,
			index: true,
		},
		password: String
	})
)

module.exports = User