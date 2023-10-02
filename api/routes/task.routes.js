/**
 * @file api/routes/task.routes.js
 * @summary Task routes component
 * @module Server
 */

const { authJwt } = require("../middlewares")
const controller = require("../controllers/task.controller")

module.exports = function(app) {
	app.use(function(req, res, next) {
		res.header(
			"Access-Control-Allow-Headers",
			"x-access-token, Origin, Content-Type, Accept"
		)
		res.header('Access-Control-Allow-Credentials', true)
		res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE")
		next()
	})

	app.get("/api/tasks",		[authJwt.verifyToken],	controller.allTasks)
	app.delete("/api/tasks",	[authJwt.verifyToken],	controller.deleteManyTasks)
	app.post("/api/task",		[authJwt.verifyToken], 	controller.postTask)
	app.delete("/api/task",		[authJwt.verifyToken], 	controller.deleteTask)
	app.put("/api/task",		[authJwt.verifyToken], 	controller.updateTask)

}