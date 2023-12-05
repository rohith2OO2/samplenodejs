'use strict'
import path from 'path'
import config from '../../config'
import customLogger from './logger'
const logger = customLogger(path.basename(__filename))

function init(app, cb) {
	let port = config.env === 'test' ? config.server.testport : config.server.devport || config.server.port
	// logger.info(`Port ${port}`)
	let server = app.get('server')
	const shutdown = () => {
		console.log('\nGracefully shutting down from SIGINT (Ctrl-C)')
		// some other closing procedures go here
		let nrp = app.get('nrp')
		if (nrp)
			Object.keys(nrp).forEach(n => {
				nrp[n].quit()
			})
		app.get('db') && app.get('db').sequelize && app.get('db').sequelize.close()
		app.get('redisPool') && app.get('redisPool').drain()
		app.get('TimerStore') && app.get('TimerStore').quit()
		process.exit(1)
	}
	if (!server) {
		server =
			app.listen &&
			app.listen(port, err => {
			if (err) {
				logger.error(err, `Connection error on port`)
				process.exit(1)
			}
			logger.info(`Application is now running on port ${config.server.port} in ${config.env} mode`)
			/**
			 * Custom Post Load Middlewares
			 */
			process.on('SIGINT', shutdown)
			process.on('SIGTERM', shutdown)
			process.on('unhandledRejection', (reason :any, promise) => {
				console.log('Unhandled Rejection at:', reason.stack || reason)
				// Recommended: send the information to sentry.io
				// or whatever crash reporting service you use
			})
			// Promise.reject(new Error('This is fine')) // test here
		})
		server && app.set('server', server)
	}
	cb && cb()
}

module.exports = { init }
