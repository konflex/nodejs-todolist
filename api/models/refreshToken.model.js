const mongoose = require('mongoose')
const { v4: uuidv4 } = require('uuid')
require('dotenv').config()

const RefreshTokenSchema = new mongoose.Schema({
	token: String,
	user: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'User',
	},
	expiryDate: Date,
})

RefreshTokenSchema.statics.createToken = async function(user) {
	let expiredAt = new Date()

	expiredAt.setSeconds(
		expiredAt.getSeconds() + process.env.EXPIRATION_REFRESH_TOKEN // expiredRefreshToken in seconds
	)

	let _token = uuidv4()
	
	let _object = new this({
		token: _token,
		user: user.id,
		expiredAt: expiredAt.getTime()
	})

	// console.log(_object)

	let refreshToken = await _object.save()

	return refreshToken.token

}

RefreshTokenSchema.statics.verifyExpiration = (token) => {
	return token.expiryDate.getTime() < new Date().getTime()
}

const RefreshToken = mongoose.model('RefreshToken', RefreshTokenSchema)

module.exports = RefreshToken