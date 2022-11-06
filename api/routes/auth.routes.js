/**
 * @file api/routes/auth.routes.js
 * @summary Auth routes component
 * @module Server
 */

const { verifySignUp, } = require("../middlewares")
const controller = require("../controllers/auth.controller")

module.exports = function(app) {

	app.use(function(req, res, next) {
		res.header(
			"Access-Control-Allow-Headers",
			"x-access-token, Origin, Content-Type, Accept"
		)
		res.header("Access-Control-Allow-Credentials", true)
		res.header("Access-Control-Allow-Methods", "GET,POST")
		next()
	})

	app.post("/api/auth/signup",
		[
			verifySignUp.checkDuplicateEmail,
		],
		controller.signup,
	)

	app.post("/api/auth/signin",controller.signin)

	app.get("/api/auth/refreshtoken", controller.refreshToken)
	
}