import jwt from 'jsonwebtoken'
import config from '../../config'

export const StringUtil = {
	padZero: (padSize, num) => {
		if (!padSize) padSize = 0
		if (!num) num = 0
		let s = '0'.repeat(padSize) + num
		let cut = padSize > ('' + num).length ? padSize : ('' + num).length
		return s.substr(s.length - cut)
	},
	hashCode: str => {
		let hash = 0,
			i,
			chr
		if (!str || str.length === 0 || typeof str !== 'string') return hash
		for (i = 0; i < str.length; i++) {
			chr = str.charCodeAt(i)
			hash = (hash << 5) - hash + chr
			hash |= 0 // Convert to 32bit integer
		}
		return hash
	},
}

export const jwtUtil = {
	sign: payload => {
		if (payload && config.application.jwtSecret) {
			let token = jwt.sign(payload, config.application.jwtSecret, {
				algorithm: config.application.jwtAlgorithm,
			})
			return `Bearer ${token}`
		}
	},
	signWithSecret: (payload, secret) => {
		if (payload && secret) {
			let token = jwt.sign(payload, secret, {
				algorithm: config.application.jwtAlgorithm,
			})
			return `Bearer ${token}`
		}
	},
	verify: token => {
		return jwt.verify(token.replace(/Bearer\s+/, ''), config.application.jwtSecret, { algorithms: [config.application.jwtAlgorithm] })
	},
}
