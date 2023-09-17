/**
 * @file api/controllers/task.controller.js
 * @summary Task controller component
 * @module Server
 */

const db = require("../models")
const Task = db.task

require('dotenv').config()

exports.postTask = (req, res) => {

	const task = new Task({
		task: req.body.task,
		email: req.body.email,
		achievement: req.body.achievement
	})

	task.save((err, task) => {
		if(err) {
			res.status(500).json({ message: err })
			return
		}

		res.status(200).json({ message: "Task was recorded successfully"})
		return
	})
}

exports.allTasks = (req, res) => {

	Task.find({
		email: req.query.email
	})
		.exec((err, tasks) => {
			if(err) {
				res.status(500).json({ message: err })
				return
			}

			if(!tasks){
				res.status(200).json([])
				return 
			} 

			res.status(200).json(tasks)
			return
		})
}

exports.deleteManyTasks = (req, res) => {

	Task.deleteMany(req.body.filter).exec()

	res.send({ 
		message: "All todos deleted successfully", 
	})
	return
}

exports.deleteTask = (req, res) => {

	Task.findOneAndRemove({
		_id: req.body.id
	}, function(err, task) {
		if(!err && task) {
			res.status(200).json({message: "Task successfully deleted" })
			return 
		}
		else {
			res.status(500).json({ message: err })
			return
		}
	})

}

exports.updateTask = (req, res) => {

	Task.findOneAndUpdate({
		_id: req.body.id
	}, { 
		task: req.body.task,
		achievement: req.body.achievement }, { new: true }, function(err, task){
		if(err) {
			res.status(500).json({ message: err })
			return
		}
		else if(!err && !task) {
			res.status(200).json({ message: "No task was found"})
			return
		}
		else {
			res.status(200).json({ message: "Task successfully updated"})
			return
		}
	})
}
