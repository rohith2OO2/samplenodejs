import jwt from 'jsonwebtoken'
import mainapp from '../../app'
import config from '../../config'
import customLogger from '../middleware/logger'
const app = mainapp.container || mainapp
const path = require('path')
let logger = customLogger(path.basename(__filename))
const request = require('request')

app.set('paramRoutes', [])
/**
 *
 * @param {*} req
 * @param {*} res
 * @param {*} next
 *
 * @todo Either add username to header or exclude from this authentication check in routes root.js
 */

async function isAuthenticated(req, res, next) {
	try {
		let db = app && app.get && app.get('db')
		if (!db || !db.sequelize) {
			logger.error(`No database connection found for initializing bot models`)
			res.error.ServerError('Unable to connect with db')
			return
		}
		let paramRoutes = app.get('paramRoutes')
		let action = req.method.toLowerCase()
		if (req.path.includes('socketio') || (action === 'get' && (req.path.includes('Locale') || req.path.includes('api-docs')))) {
			next()
			return
		}
		if ((req.headers.authorization && req.path.includes('/messages')) || (req.path.includes('/messages') && action === 'post')) {
			next()
			return
		}
		let userPayload: any = {}
		let pCtrl = app.get('controllers') && app.get('controllers').Permission && app.get('controllers').Permission.controller
		let permission
		if (req.path === '/healthz') {
			next()
			return
		}
		let routes, path1
		if (pCtrl) {
			path1 = req.path

			// if (Object.keys(req.params).length) {
			//   path1 = req.route && req.route.path.replace(/\/\:[^\/]*(\/)?/g, '/$1')
			// }

			let m = path1

			//backup if path replaced by params
			//m.substring(0, m.lastIndexOf(v)) + m.substring(m.lastIndexOf(v)+ v.length, m.length)

			path1 = m.replace('api/v1/', '')
			// just in case the api/v1 is still in basePath, stripping them off
			// config.application.paramPaths && config.application.paramPaths.forEach(p => {
			//   if (path1.includes(p)) path1 = `${path1.split(p)[0]}${p}`
			// })
			permission = await pCtrl.canPermission(['public', '*'], path1, req.method.toLowerCase(), req)
			if (permission && permission.granted) {
				req.permission = permission
				if (req.headers['x-tenantid'] && !req.user) req.user = { tenantId: req.headers['x-tenantid'] }
				next()
				return
			}
		}
		// logger.warn(`x-userpaylaod: ${req.headers['x-user-payload'] || ''} caps: ${req.headers['X-USER-PAYLOAD'] || ''} auth: ${req.headers.Authorization || ''} auth2: ${req.headers.authorization || ''}` )
		// let bearer = req.headers['x-user-payload'] || req.headers['X-USER-PAYLOAD'] || req.headers.Authorization || req.headers.authorization
		next()
	} catch (e) {
		logger.error(`Error in authentication for ${req.path}: ${e}`)
		res.error.Forbidden('Invalid token received')
	}
}

export function getSchemaForTenant(tenantId) {
	let returnSchema = config.database.schemaName

	return returnSchema
}

function getTenantByDomain(domainName) {
	let returnTenant

	return returnTenant
}

function getCheckAPIRealmToken(req, res, next) {
	try {
		const keycloakHost = config.idp.url
		const realmName = config.idp.realmName
		let apiTokenMap = app.get('apiTokenMap')
		// assumes bearer token is passed as an authorization header
		let tokenHeader = req.headers['x-api-authorization']
		if (!tokenHeader) {
			logger.warn(`Token is not present and request will be rejected. User : ${JSON.stringify(req.user)}, from IP : ${req.headers['x-custom-clientip']}`)
			// there is no token, don't process request further
			res.status(401).json({
				error: `unauthorized`,
			})
			res.end()
			return false
		}

		if (tokenHeader.startsWith('Bearer ')) {
			// Remove Bearer from string
			tokenHeader = tokenHeader.slice(7, tokenHeader.length)
		}

		let tokenFromCache = apiTokenMap[`${req.user.tenantId}-${req.user.username}`]
		if (tokenFromCache && tokenFromCache === tokenHeader) {
			let decoded = jwt.decode(tokenFromCache)
			var dateNow = new Date()
			// @ts-ignore
			let decodedObj = JSON.parse(decoded)
			var dateExp = new Date(decodedObj.exp * 1000)
			if (dateExp < dateNow) {
				delete apiTokenMap[`${req.user.tenantId}-${req.user.username}`]
				res.status(401).json({
					error: `Token is expired.`,
				})
				return false
			}
			return true
		}
		//Else it might be new token, need to validate with keycloak
		// configure the request to your keycloak server
		const options = {
			method: 'GET',
			url: `${keycloakHost}/auth/realms/${realmName}/protocol/openid-connect/userinfo`,
			headers: {
				// add the token you received to the userinfo request, sent to keycloak
				Authorization: req.headers['x-api-authorization'],
			},
		}

		// send a request to the userinfo endpoint on keycloak
		request(options, (error, response, body) => {
			if (error) {
				logger.warn(`Unable to connect to IDP Server. Err : ${JSON.stringify(error)}`)
				res.end()
				throw new Error(error)
			}
			// if the request status isn't "OK", the token is invalid
			if (response.statusCode !== 200) {
				logger.warn(`Token is rejected by IDP, status code : ${response.statusCode}. User Info : ${JSON.stringify(req.user)}, from IP : ${req.headers['x-custom-clientip']}`)
				res.status(401).json({
					error: `unauthorized`,
				})
				return false
			}
			// the token is valid pass request onto your next function
			else {
				apiTokenMap[`${req.user.tenantId}-${req.user.username}`] = tokenHeader
				logger.info(`Token is valid and will be persisted in cache`)
				next()
				return true
			}
		})
	} catch (err: any) {
		logger.warn(`Error caught while checking the Realm token, for user ${req.user.username}, Err : ${err.message || err.stack}`)
		res.status(401).json({
			error: `unauthorized`,
		})
		res.end()
		return false
	}
}

export default isAuthenticated
