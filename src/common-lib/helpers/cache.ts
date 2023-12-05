import mainapp from '../../app'
import customLogger from '../middleware/logger'
const app = mainapp.container || mainapp
const path = require('path')
let logger = customLogger(path.basename(__filename))
const request = require('request')

/**
 *
 * @param {*} req
 * @param {*} res
 * @param {*} next
 *
 * @todo Either add username to header or exclude from this authentication check in routes root.js
 */
let redisPool
let rClient
async function checkCache(req, res, next) {
	// for now only get methods with no req body... to use this.
	if (req.method && !['GET', 'get'].includes(req.method)) {
		next && next()
		return
	}
	try {
		rClient = app.get('redisCache')
		if (!rClient) {
			next && next()
			return
		}

		if (!rClient) {
			next && next()
			return
		}
		// let tenantId = (req.user && req.user.tenantId) || (req.realmName && getTenantByDomain(req.realmName))

		let resp
		try {
			resp = await rClient.get(`cache-${req.redisKey || ''}-${''}-${req.originalUrl}`)
			// rClient && redisPool.isBorrowedResource(rClient) && redisPool.release(rClient)
		} catch (e) {
			// redisPool.destroy(rClient)
			// rClient = null
			next && next()
			return
		}

		if (resp) res.status(200).type('json').send(resp)
		else next && next()
		// rClient && redisPool.isBorrowedResource(rClient) && redisPool.release(rClient)
	} catch (e) {
		logger.error(`Error in cache check for ${req.path}: ${e}`)
		// res.error.Forbidden("Invalid token received");
	}
}

async function clearCacheKeys(redisKey, tenantId, resources) {
	if (!resources || !resources.length || !resources.pop) return
	try {
		rClient = redisPool || app.get('redisCache')
		if (!rClient) {
			return
		}

		if (!rClient) {
			return
		}
		try {
			resources.forEach(async r => {
				if (r.includes('***')) {
					try {
						let key = `cache-${redisKey || ''}-${tenantId || ''}-${r.replace('***', '*')}`
						let res = await rClient.keys(key)
						if (res && res.length) await rClient.del(res)
					} catch (e) {
						logger.warn(`Error in clearing keys for ${r} ${e}`)
					}
				} else await rClient.del(`cache-${redisKey || ''}-${tenantId || ''}-${r}`)
			})
		} catch (e) {
			// redisPool.destroy(rClient)
			// rClient = null
			return
		}

		// redisPool.release(rClient)
	} catch (e) {
		logger.error(`Error in clearing cache ${e}`)
	}
}

async function addToCache(req, res, next) {
	try {
		if (!req.dbData) {
			next && next()
			return
		}
		if (req.method && ['get', 'GET'].includes(req.method)) {
			rClient = app.get('redisCache')
			if (!rClient) {
				next && next()
				return
			}
			// let rClient = await redisPool.acquire()
			if (!rClient) {
				next && next()
				return
			}
			let tenantId = (req.user && req.user.tenantId) || (req.realmName && getTenantByDomain(req.realmName))

			let resp
			try {
				await rClient.set(`cache-${req.redisKey || ''}-${tenantId || ''}-${req.originalUrl}`, JSON.stringify(req.dbData), 3600)
			} catch (e) {
				// redisPool.destroy(rClient)
				// rClient = null
				next && next()
				return
			}
			// redisPool.release(rClient)
			next && next()
		} else next && next()
	} catch (e) {
		logger.error(`Error in clearing cache ${e}`)
	}
}

async function addToCacheByKey({ serviceName, tenantId, realmName, redisKey, data }) {
	let rClient
	try {
		if (!data) {
			return
		}
		rClient = app.get('redisCache')
		if (!rClient) {
			return
		}
		// rClient = await redisPool.acquire()
		if (!rClient) {
			return
		}
		let tenant = tenantId || getTenantByDomain(realmName)
		try {
			await rClient.set(`cache-${serviceName}-${redisKey || ''}-${tenant || ''}`, JSON.stringify(data), 3600)
			// let cv = await rClient.get(`cache-${redisKey || ''}-${tenant || ''}`);
			// console.log(`Cache values ${cv}`)
		} catch (e) {
			// redisPool.destroy(rClient)
			rClient = null
			return
		}
		// redisPool.release(rClient)
	} catch (e) {
		rClient && redisPool.release(rClient)
		logger.error(`Error in clearing cache ${e}`)
	}
}

async function getFromCacheByKeys({ serviceName, tenantId, realmName, redisKeys }) {
	let rClient
	try {
		rClient = redisPool || app.get('redisCache')
		if (!rClient) {
			return
		}
		// rClient = await redisPool.acquire()
		if (!rClient) {
			return
		}
		let tenant = tenantId || getTenantByDomain(realmName)

		let resp = {}
		try {
			for (let redisKey of redisKeys) {
				let cacheValue = await rClient.get(`cache-${serviceName}-${redisKey || ''}-${tenant || ''}`)
				if (cacheValue) resp[redisKey] = JSON.parse(cacheValue)
			}
		} catch (e) {
			// redisPool.destroy(rClient)
			rClient = null
			return
		}

		// rClient && redisPool.isBorrowedResource(rClient) && redisPool.release(rClient)
		if (resp) return resp
	} catch (e) {
		logger.error(`Error in cache check for ${tenantId}, ${realmName}, ${JSON.stringify(redisKeys)}: ${e}`)
		// rClient && redisPool.isBorrowedResource(rClient) && redisPool.release(rClient)
	}
}

function getTenantByDomain(domainName) {
	let returnTenant

	return returnTenant
}

export { addToCache, addToCacheByKey, checkCache, clearCacheKeys, getFromCacheByKeys }
