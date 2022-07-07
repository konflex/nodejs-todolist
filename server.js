/**
 * @file server.js
 * @summary The server main component
 * @module Server
 */

const express = require('express')
require('dotenv').config()
const corsMiddleware = require("./corsMiddleware")
const app = express()

// preflight
app.options("*", corsMiddleware)

app.use(corsMiddleware)

// add middleware before routes
app.use(express.json())

// parse requests of content-type - application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: true }))

const db = require("./api/models")

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