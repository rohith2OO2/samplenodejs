'use strict'

/**
/* Copyright (C) 2018 Actionable Science - All Rights Reserved
 * You may use, distribute and modify this code under the Terms of the license
 * 
 * author  Actionable Science
 * version 1.0, 16/05/2018
 * since   NodeJS 8.11.1
 */
import path from 'path'
let customLogger
let logger
let credential
let client
let config: any = {}
let resp = require('env-yaml').config({ path: path.join(__dirname, '../../.env.yml') })
if (resp.error) {
	if (process.env.NODE_ENV == 'local') throw resp.error
}

function setConfig(obj) {
	if (!obj) return
	config.env = obj.NODE_ENV || config.NODE_ENV || 'local'

	config.logger = {
		level: obj.LOG_LEVEL || (config.logger && config.logger.level) || 'info',
	}
	config.server = {
		port: obj.PORT || (config.server && config.server.port) || 3000,
		apiPrefix: obj.API_PREFIX || (config.server && config.server.apiPrefix),
	}

	config.health = {
		testSuccessTime: obj.HEALTH_SUCCESS_TIME ? parseInt(obj.HEALTH_SUCCESS_TIME) : 0,
		secret: obj.HEALTH_SECRET,
	}
	config.application = {
		// paramPaths: ['/sso-management/idp/', '/role-management/roles/','/role/users/','/role/users/change-password/','/role/tenant-roles/','/role/user-roles/','/role/tenant-role/', 'getTenant', 'lifecycle'],
		endPoint: obj.API_PREFIX || (config.application && config.application.endPoint) || '/api/v1',
		sessionSecret: obj.SESSION_SECRET || (config.application && config.application.sessionSecret) || 'randomSecret',
		syncDB: obj.SYNC_DB === 'true' ? true : config.application && config.application.syncDB,
		appName: (config.application && config.application.appName) || 'TenantService',
		routesToSkipAuthentication: [
			{ route: 'api-docs', methods: ['get'] },
			{ route: 'tenant', methods: ['get'] },
			{ route: 'tenant-role', methods: ['get'] },
			{ route: 'tenant', methods: ['get'] },
			{ route: 'locale', methods: ['get'] },
			{ route: 'users', methods: ['get'] },
		],
		jwtSecret: obj.JWT_SECRET || (config.application && config.application.jwtSecret) || 'secret',
		jwtAlgorithm: obj.ALGORTHIM || (config.application && config.application.jwtAlgorithm) || 'HS256',
		localTest: obj.LOCAL_TEST === 'true' ? true : false || (config.application && config.application.localTest) || false,
		cryptoSecret: obj.CRYPTO_SECRET || (config.application && config.application.cryptoSecret) || 'encryption secr',
		targetEnv: obj.targetEnv || (config.application && config.application.targetEnv) || '',
	}
	config.database = {
		databaseURL: obj.DATABASE_URL || (config.database && config.database.databaseURL),
		username: obj.DATABASE_USERNAME || (config.database && config.database.username) || 'postgres',
		password: obj.DATABASE_PASSWORD || (config.database && config.database.password) || 'postgres',
		name: obj.DATABASE_NAME || (config.database && config.database.name) || 'postgres',
		host: obj.DATABASE_HOST || (config.database && config.database.host) || 'localhost',
		port: obj.DATABASE_PORT || (config.database && config.database.port) || '5432',
		dialect: obj.DATABASE_DIALECT || (config.database && config.database.dialect) || 'postgres',
		schemaName: obj.DATABASE_SCHEMA || (config.database && config.database.schemaName) || 'emma_test',
		ssl: obj.DATABASE_SSL === 'false' ? false : obj.DATABASE_SSL || (config.database && config.database.ssl) || true,

		loggingEnabled: obj.DB_LOGGING_ENABLED != undefined ? JSON.parse(obj.DB_LOGGING_ENABLED) : config.database && config.database.loggingEnabled,
	}

	config.redis = {
		url: obj.REDISURL || (config.redis && config.redis.url) || 'localhost',
		port: obj.REDIS_PORT || (config.redis && config.redis.port) || '6379',
		password: obj.REDISPASS || (config.redis && config.redis.password),
		connect_timeout: (config.redis && config.redis.connect_timeout) || 3600000,
		serviceName: obj.serviceName || (config.redis && (config.redis.serviceName || config.redis.agentsKeys)),
	}
}
setConfig(process.env)
config.init = async () => {
	// initialize all the keyvault params here...
	if (logger) return // the init function was already called
	if (!customLogger) customLogger = require('../common-lib/middleware/logger').default
	if (!logger) logger = customLogger(path.basename(__filename))
}
module.exports = config
export default config
