/**
 * @file api/controllers/task.controller.js
 * @summary Task controller component
 * @module Server
 */

const db = require("../models")
const Task = db.task
require('dotenv').config()

/**
 * Save a user's task to the database.
 *
 * @param {Request} req - The Express request object.
 * @param {Response} res - The Express response object.
 */
exports.postTask = async (req, res) => {
	try {
		// Create a task model 
		const task = new Task({
			task: req.body.task,
			email: req.body.email,
			achievement: req.body.achievement
		})

		// Save task
		await task.save()
		res.status(200).json({})
		return
	}
	catch(err) {
		res.status(500).json({ message: "Error occurred, cannot proceed", })
		return
	}
}

/**
 * Retrieve all tasks for a specific user based on their email.
 *
 * @param {Request} req - The Express request object.
 * @param {Response} res - The Express response object.
 */
exports.allTasks = async (req, res) => {
	try {
		// Retrieve tasks from the database for the specified email
		const tasks = await Task.find({ email: req.query.email })

		// If no tasks were found, respond with an empty array
		if (!tasks) {
			res.status(200).json([])
			return
		}

		// Respond with the retrieved tasks
		res.status(200).json(tasks)
		return
	}
	catch (err) {
		// Handle any errors that occur during the database query
		res.status(500).json({ message: "Error occurred, cannot proceed" })
		return
	}
}

/**
 * Delete multiple tasks based on a filter.
 *
 * @param {Request} req - The Express request object.
 * @param {Response} res - The Express response object.
*/
exports.deleteManyTasks = async (req, res) => {
	try {
		await Task.deleteMany(req.body.filter)
		res.status(200).json({})
		return
	}
	catch (err) {
		res.status(500).json({ message: "Error occurred, cannot proceed", })
		return
	}
}

/**
 * Delete a specific task based on its ID.
 *
 * @param {Request} req - The Express request object.
 * @param {Response} res - The Express response object.
*/
exports.deleteTask = async (req, res) => {
	try {
		const task = await Task.findOneAndRemove({ _id: req.body.id })
		if (task) {
			res.status(200).json({})
			return
		} else {
			res.status(200).json({})
			return
		}
	}
	catch (err) {
		res.status(500).json({ message: "Error occurred, cannot proceed", })
		return
	}
}

/**
 * Update a specific task based on its ID.
 *
 * @param {Request} req - The Express request object.
 * @param {Response} res - The Express response object.
*/
exports.updateTask = async (req, res) => {
	try {
		const task = await Task.findOneAndUpdate(
			{ _id: req.body.id },
			{ task: req.body.task, achievement: req.body.achievement },
			{ new: true }
		)

		if (task) {
			res.status(200).json({})
			return
		} else {
			res.status(200).json({})
			return
		}
	} catch (err) {
		res.status(500).json({ message: "Error occurred, cannot proceed", })
		return
	}
}