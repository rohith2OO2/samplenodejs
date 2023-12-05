'use strict'
/**
/* Copyright (C) 2018 Actionable Science - All Rights Reserved
 * You may use, distribute and modify this code under the Terms of the license
 * 
 * author  Actionable Science
 * version 1.0, 16/05/2018
 * since   NodeJS 8.11.1
 */

/**
 * Dependancies
 */

import bodyParser from 'body-parser'
import compression from 'compression'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import express from 'express'
import session from 'express-session'
import fs from 'fs'
import morgan from 'morgan'
import path from 'path'
import customResponseHandler from './common-lib/helpers/responseHandler'
import middlewareLoader from './common-lib/middleware/loader'
import customLogger from './common-lib/middleware/logger'
import config from './config'

const MemoryStore = require('memorystore')(session)
var interceptor = require('express-interceptor')

const logger = customLogger(path.basename(__filename))
// Initialize Express
const app = express()
export default app // immediatly export to avoid circular dependencies
//const apiRoutes = new express.Router({ mergeParams: true });

/**
 * General Middlewares
 */
app.use(
	bodyParser.urlencoded({
		limit: '5mb',
		extended: true,
	})
)

app.use(
	morgan('combined', {
		stream: logger.stream,
		skip: (req, res) => res.statusCode < 400,
	})
)
app.use(cors())
app.use(cookieParser())
app.use(compression())
app.use(bodyParser.json({ limit: '5mb' }))
const unless = (path, middleware) => {
	return (req, res, next) => {
		if (req.url.includes(path)) {
			return next()
		} else {
			return middleware(req, res, next)
		}
	}
}
app.use(
	unless(
		'messages',
		session({
			cookie: { maxAge: 86400000 },
			store: new MemoryStore({
				checkPeriod: 86400000, // prune expired entries every 24h
			}),
			secret: config.application.sessionSecret,
			saveUninitialized: true,
			resave: false,
		})
	)
)

app.use(customResponseHandler())

// Add the interceptor middleware

/**
 * Custom Preload Middlewares
 */

const preloadMiddlewares = []

preloadMiddlewares.map(file => {
	require('./common-lib/middleware/' + file)(app)
})

/**
 * Custom Post Load Middlewares
 */
let controllers: any = {}
let serviceControllers: any = {}
let tenantConfigMap: any = {}

app.set('controllers', controllers)
let internalContollers: any = {}
//app.set('controllers', controllers)
let resources = {
	controllers,
}

if (config.env !== 'test') {
	let middlewares = ['server', 'redisCache', 'database']
	middlewareLoader.load(app, middlewares, (e, data) => {
		// require('./common-lib/schemas')
		// require('./common-lib/models').init()
		// require('./models').init()

		require('./routes/root.js')(app)

		// middlewares = [] // load botConfig last as it reads from db and models have to be intialized.

		// middlewareLoader.load(app, middlewares, async (e3, data3) => {
		if (e) {
			logger.error(`${e}`)
			return
		}
		if (config.application.syncDB) {
			const db = app.get('db')
			db &&
				db.sequelize
					.sync({ force: config.database.forceSync })
					.then(async () => {
						// controllers are loaded last since data may be loaded from db
						await newFunction()
						fs.readdirSync(path.join(__dirname, 'routes')).map(file => {
							if (file !== 'root.js' && file.endsWith('.js')) {
								require('./routes/' + file)(app)
							}
						})
					})
					.catch(e => {
						logger.warn(`Sequelize sync error: ${e.message}: ${e.sql}: ${e.stack}`)
					})
		} else {
			// await newFunction()
			fs.readdirSync(path.join(__dirname, 'routes')).map(file => {
				if (file !== 'root.js' && file.endsWith('.js')) {
					require('./routes/' + file)(app)
				}
			})
		}
	})
}
async function newFunction() {
	//
	// app.set('controllers', Object.assign(controllers, internalContollers));
}
