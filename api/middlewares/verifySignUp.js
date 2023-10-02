/**
 * @file api/middlewares/verifySignUp.js
 * @summary Requirement to create a user in the db (email address needs to be unique)
 * @module Server
 */

const db = require("../models")
const User = db.user

checkDuplicateEmail = (req, res, next) => {

	try {
		// Find user account
		User.findOne({
			email: req.body.email
		}).exec((err, user) => {
			// Error occured
			if(err) {
				res.status(500).send({ message: "Error occured, cannot proceed" })
				return 
			}

			// Email address already in db
			if(user) {
				res.status(400).send({ message: "This email address is already associated with another account."})
				return 
			}

			next()
		})

	}
	catch(err) {
		res.status(500).send({ message: "Error occured, cannot proceed" })
		return 
	}

}

const verifySignUp = {
	checkDuplicateEmail,
}

module.exports = verifySignUp