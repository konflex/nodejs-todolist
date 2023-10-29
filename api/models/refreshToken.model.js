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
		expiredAt.getSeconds() + process.env.EXPIRATION_REFRESH_TOKEN // Expiration refresh token in seconds
	)

	let _token = uuidv4()
	
	let _object = new this({
		token: _token,
		user: user.id,
		expiryDate: expiredAt.getTime()
	})

	const refreshToken = await _object.save()

	const token = refreshToken.token

	return token 

}

RefreshTokenSchema.statics.verifyExpiration = (token) => {

	let expiryDate = token.expiryDate.getTime() 
	let actualDate = new Date().getTime()

	return expiryDate < actualDate
}

const RefreshToken = mongoose.model('RefreshToken', RefreshTokenSchema)

module.exports = RefreshToken