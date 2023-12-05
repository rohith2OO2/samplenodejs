import path from 'path'
import uuid from 'uuid'
import config from '../../config'
import customLogger from './logger'
import { Redis } from './redis'

const logger = customLogger(path.basename(__filename))
export class RedisCache<T extends object> {
	constructor(private redisClient: Redis, private defaultTtl: number = Infinity) {}
	async set(key: string, value: T, ttl: number = -1) {
		if (!this.redisClient.initDone) throw new Error('redis client not initialized')
		let expiry = ttl

		if (expiry == -1) {
			expiry = this.defaultTtl
		}

		const strVal = JSON.stringify(value)

		const setReply = await this.redisClient.redis.set(key, strVal, { EX: expiry })

		if (setReply === null) {
			logger.error('failed to set item in cache for key =', key)
			throw new Error('failed to set item in cache')
		}
	}

	async get(key: string) {
		if (!this.redisClient.initDone) throw new Error('redis client not initialized')
		let val: any = null
		const tval = await this.redisClient.redis.get(key)
		if (tval) {
			val = tval
		} else return null
		return JSON.parse(val)
	}

	async unset(key: string) {
		await this.redisClient.redis.del(key)
	}
	async del(key: string) {
		await this.redisClient.redis.del(key)
	}
	async hset(key, field, value) {
		await this.redisClient.redis.hSet(key, field, value)
	}
	async keys(key) {
		return await this.redisClient.redis.keys(key)
	}
	async acquireLock(key, traceId, cb) {
		let existingLockTraceId = await this.redisClient.redis.get(key)
		if (existingLockTraceId && existingLockTraceId === traceId) {
			cb && cb()
			return true
		} else if (existingLockTraceId) {
			return
		}
		let reply = await this.redisClient.redis.set(key, traceId || uuid.v4(), { NX: true, EX: 10 })
		if (reply && cb) cb()
		return reply
	}
	async releaseLock(key, cb) {
		await this.redisClient.redis.del(key)
		cb && cb()
	}
}
const redisOptions: any = {
	url: `redis://${config.redis.url}:${config.redis.port}`,
	password: config.redis.password,
}
if (config.redis.port != 6379 && config.redis.port != '6379') redisOptions.socket = { tls: true }
export const redis = new Redis(redisOptions, logger)

export const init = (app, cb) => {
	Promise.resolve(redis.init()).then(() => {
		const cache = new RedisCache(redis, config.redis.defaultTTL || 86400)
		app.set('redisCache', cache)
		cb && cb()
	})
}
