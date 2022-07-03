/**
 * @file api/models/task.model.js
 * @summary Task model component
 * @module Server
 */

const mongoose = require("mongoose")

const Task = mongoose.model(
	"Task",
	new mongoose.Schema({
		task: String,
		achievement: Boolean,
		email: {
			type: String,
			required: true,
			index: true,
		}
	})
)

module.exports = Task