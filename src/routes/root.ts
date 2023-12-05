// Logging
import path from 'path'
import authentication from '../common-lib/helpers/authentication'
import { addToCache, checkCache } from '../common-lib/helpers/cache'
import customLogger from '../common-lib/middleware/logger'
import config from '../config'
const logger = customLogger(path.basename(__filename))
module.exports = app => {
	//:TODO need to secure these apis too.
	app.use(function (req, res, next) {
		req.realmName = req.headers.realmname
		req.redisKey = config.redis.serviceName
		// let url = req.url.toLowerCase()
		// let allowedUrl = config.application.routesToSkipAuthentication && config.application.routesToSkipAuthentication.filter(p =>{
		//   return url.includes(p.route);
		// })
		// if(allowedUrl && allowedUrl.length > 0 ) {
		//   next();
		// } else {
		authentication(req, res, next)
		// }
	})
	app.use(checkCache)
	app.get('/', (req, res, next) => {
		try {
			req.dbData = `Hello world!`
			addToCache(req, res, next)
			res.status(200).json(req.dbData).end()
		} catch (e) {
			logger.error(`Error in get ${e}`)
		}
	})
}
