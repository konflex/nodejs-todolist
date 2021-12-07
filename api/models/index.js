const mongoose = require("mongoose")
mongoose.Promise = global.Promise

const db = {}

db.mongoose = mongoose

db.user = require("./user.model")
db.task = require("./task.model")
db.refreshToken = require("./refreshToken.model")

module.exports = db