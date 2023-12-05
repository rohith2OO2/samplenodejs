'use strict'
import async from 'async'
import fs from 'fs'
import path from 'path'
import customLogger from './logger'
const logger = customLogger(path.basename(__filename))
const loadAsync = async (app, middlewares) => {
	try {
		if (!app || !middlewares) {
			logger.error(`no app or middlewares passed to load`)

			return
		}
		let fns = []
		for (const m of middlewares) {
			let fn
			if (fs.existsSync(path.join(__dirname, m + '.js'))) fn = path.join(__dirname, m)
			else if (fs.existsSync(path.join(__dirname, '../../src/middleware', m + '.js'))) fn = path.join(__dirname, '../../src/middleware', m)
			else if (fs.existsSync(path.join(__dirname, '../../middleware', m + '.js'))) fn = path.join(__dirname, '../../middleware', m)
			else {
				fns = []
				throw `${m} module not found'`
			}
			// fns.push(callback => {
			let x = new Promise((res1, rej1) => {
				let callback = (e, data) => {
					if (e) {
						rej1(e)
						return
					} else res1(null)
				}
				require(fn).init(app, callback)
			})
			await x
			// })
		}
	} catch (e) {
		logger.error(`Error in loading middlewares ${e}`)
	}
	// if (fns.length)
	// 	async.parallel(fns, async (err, r) => {
	// 		if (err) {
	// 			logger.error(`Error in loading : ${err}`)
	// 			return rej(err)
	// 		} else {
	// 			logger.info(`${middlewares.join(',')} modules loaded`)
	// 			return res()
	// 		}
	// 	})
	// else {
	// 	logger.error(`nothing to load`)
	// 	return res()
	// }
}

const load = (app, middlewares, cb) => {
	if (!app || !middlewares) {
		logger.error(`no app or middlewares passed to load`)
		return cb && Promise.resolve(cb())
	}
	let fns: any = []
	for (const m of middlewares) {
		// }
		// middlewares.pop &&
		// middlewares.map(async m => {
		// logger.info(`module ${m}`)
		let fn
		if (fs.existsSync(path.join(__dirname, m + '.js'))) fn = path.join(__dirname, m)
		else if (fs.existsSync(path.join(__dirname, '../../src/middleware', m + '.js'))) fn = path.join(__dirname, '../../src/middleware', m)
		else if (fs.existsSync(path.join(__dirname, '../../middleware', m + '.js'))) fn = path.join(__dirname, '../../middleware', m)
		else {
			fns = []
			return cb && Promise.reject(cb(`${m} module not found'`))
		}
		fns.push(callback => {
			require(fn).init(app, callback)
		})
		// })
	}
	if (fns.length)
		async.parallel(fns, async (err, r) => {
			if (err) {
				logger.error(`Error in loading : ${err}`)
				return cb && (await cb(err))
			} else {
				logger.info(`${middlewares.join(',')} modules loaded`)
				return cb && (await cb())
			}
		})
	else {
		logger.error(`nothing to load`)
		return cb && Promise.resolve(cb())
	}
}
export default { load, loadAsync }
