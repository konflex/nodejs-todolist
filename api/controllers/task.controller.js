const db = require("../models")
const Task = db.task

const jwt = require("jsonwebtoken")
require('dotenv').config()

exports.postTask = (req, res) => {

	const task = new Task({
		task: req.body.task,
		email: req.body.email,
		achievement: req.body.achievement
	})

	task.save((err, task) => {
		if(err) {
			res.status(500).send({ message: err })
			return
		}

		res.status(200).send({ message: "Task was recorded successfully"})
	
	})
}

exports.allTasks = (req, res) => {

	Task.find({
		email: req.query.email
	})
		.exec((err, tasks) => {
			if(err) {
				res.status(500).send({ message: err })
				return
			}

			if(!tasks){
				return res.status(200).send([])

			} 

			res.status(200).send(tasks)
		})

}

exports.deleteManyTasks = (req, res) => {

	Task.deleteMany(req.body.filter).exec()

	res.send({ 
		message: "All todos deleted successfully", 
	})

}

exports.deleteTask = (req, res) => {

	Task.findOneAndRemove({
		_id: req.body.id
	}, function(err, task) {
		if(!err && task) {
			res.status(200).send({message: "Task successfully deleted" })
			return 
		}
		else {
			res.status(500).send({ message: err })
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
			res.status(500).send({ message: err })
			return
		}
		else if(!err && !task) {
			res.status(200).send({ message: "No task was found"})
		}
		else {
			res.status(200).send({ message: "Task successfully updated"})
		}
	})

}
