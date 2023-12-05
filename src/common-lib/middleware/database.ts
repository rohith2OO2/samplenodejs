'use strict'
import decamelize from 'decamelize'
import Sequelize from 'sequelize'
import config from '../../config'
import customLogger from './logger'
const cls = require('continuation-local-storage')
//import config from '../config';
const path = require('path')
//import models from '../../src/models'
const db: any = {}
const logger = customLogger(path.basename(__filename))

const init = (app, cb) => {
	if (db.sequelize) {
		cb && cb()
		return db // preventing creating a connection again and again. Singleton pattern
	}
	// need to revisit if multiple db connections are required with different config params.
	let sequelize
	let dbInit = () => {
		// console.log(`ssl for db is ${config.database.ssl}`)
		// @ts-ignore
		sequelize = new Sequelize(config.database.name, config.database.username, config.database.password, {
			host: config.database.host,
			dialect: config.database.dialect,
			// operatorsAliases: false,
			logging: !config.database.loggingEnabled ? false : console.log,
			dialectOptions: {
				ssl:
					// rejectUnauthorized: false,
					config.database.ssl != undefined ? JSON.parse(config.database.ssl) : false,
			},
			pool: {
				max: config.database.poolSize || 15,
				min: 0,
				acquire: 40000,
				idle: 10000,
				maxUses: 100,
			},
			define: {
				underscored: true,
				freezeTableName: true,
				schema: config.database.schemaName,
				charset: 'utf8',
				collate: 'utf8_general_ci',
			},
		})

		sequelize.addHook('beforeDefine', (attributes, options) => {
			options.tableName = options.tableName || decamelize(options.modelName)
			Object.keys(attributes).forEach(key => {
				if (typeof attributes[key] !== 'function') {
					attributes[key].field = attributes[key].field || decamelize(key)
				}
			})
		})
		db.sequelize = sequelize
		db.Sequelize = Sequelize
		logger.info(`Sequelize initialized for database "${config.database.name}" at host "${config.database.host}" successfully.`)
		app.set('db', db)
		cb && cb()
		return db
	}
	try {
		let namespace = cls.createNamespace('transName')
		// @ts-ignore
		Sequelize.useCLS(namespace)
		if (config.init) {
			config
				.init()
				.then(() => {
					return dbInit()
				})
				.catch(err => {
					logger.error(`Error in db initialize: ${err.stack}`)
				})
		} else return dbInit()
	} catch (err: any) {
		logger.error(err)
		cb && cb(err)
		return db
	}

	function transaction(task) {
		return cls.getNamespace('transName').get('transaction') ? task() : sequelize.transaction(task)
	}
}
module.exports = { default: init, init }
