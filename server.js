/**
 * @file server.js
 * @summary The server main component
 * @module Server
 */

const express = require('express')
require('dotenv').config()
const corsMiddleware = require("./corsMiddleware")
const app = express()

app.use(corsMiddleware)

// add middleware before routes
app.use(express.json())

// parse requests of content-type - application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: true }))

const db = require("./api/models")

// Only schema format will be saved, preparing mongoose v7
db.mongoose.set('strictQuery', true)

db.mongoose
	.connect(process.env.MONGODBKEY, {
		useNewUrlParser: true,
		useUnifiedTopology: true
	})
	.then(() => {
		console.log("Successfully connect to MongoDB")
	})
	.catch(err => {
		console.error("Connection error", err)
		process.exit()
	})

app.get('/', (req,res) => {
	res.json({ message: "Welcome to the todo list application"})
})

//ROUTES
require("./api/routes/auth.routes")(app)
require("./api/routes/task.routes")(app)


// Error handling middleware for CORS errors
app.use((err, req, res, next) => {

	if (err) {
		res.status(403).json({ error: "Error occured, cannot proceed", })
	} else {
		next() // Pass the request to the next middleware if no CORS error occurred
	}
})

const PORT = process.env.PORT || 3000

app.listen(PORT, () => {
	console.log(String.raw`
===================================================
▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄ 
█▄▄ ▄▄██ ▄▄▄ ██ ▄▄▀██ ▄▄▄ ██ ████▄ ▄██ ▄▄▄ █▄▄ ▄▄██ 
███ ████ ███ ██ ██ ██ ███ ██ █████ ███▄▄▄▀▀███ ████ 
███ ████ ▀▀▀ ██ ▀▀ ██ ▀▀▀ ██ ▀▀ █▀ ▀██ ▀▀▀ ███ ████ 
▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀ 
▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
█████ ▄▄▀█ ▄▄▀██ ▄▄▀██ █▀▄██ ▄▄▄██ ▀██ ██ ▄▄▀██████
█████ ▄▄▀█ ▀▀ ██ █████ ▄▀███ ▄▄▄██ █ █ ██ ██ ██████
█████ ▀▀ █ ██ ██ ▀▀▄██ ██ ██ ▀▀▀██ ██▄ ██ ▀▀ ██████
▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀
===================================================
	`)
})