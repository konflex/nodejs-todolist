const mongoose = require("mongoose")

const User = mongoose.model(
	"User",
	new mongoose.Schema({
		username: String,
		email: {
			type: String,
			required: true,
			index: true,
		},
		password: String
	})
)

module.exports = User