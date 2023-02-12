/**
 * @file api/models/index.js
 * @summary Main models component
 * @module Server
 */

const mongoose = require("mongoose")
mongoose.Promise = global.Promise

const db = {}

db.mongoose = mongoose

db.user = require("./user.model")
db.task = require("./task.model")
db.refreshToken = require("./refreshToken.model")
db.emailToken = require("./emailToken.model")
db.passwordToken = require("./passwordToken.model")

module.exports = db