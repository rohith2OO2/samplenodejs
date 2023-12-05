import { RedisClientType, createClient } from 'redis'
// import path from 'path'
// import customLogger from './logger'

// const logger = customLogger(path.basename(__filename))

export class Redis {
	redis: RedisClientType
	public initDone: boolean
	constructor(
		config: {
			url: string
			password: string
			socket?: {
				tls: boolean
			}
		},
		private logger: any
	) {
		this.logger.debug(`config for redis: ${JSON.stringify(config)} `)
		this.redis = createClient(config)
		this.initDone = false
	}

	async init(): Promise<void> {
		if (this.initDone) return
		try {
			await this.redis.connect()
			this.redis.on('error', e => {
				this.logger.error('redis error :', e)
			})
			this.redis.on('reconnecting', () => {
				this.logger.error('redis client reconnecting')
			})
		} catch (e) {
			this.logger.error('Error occured when trying to connect to redis', e)
			throw e
		}
		this.initDone = true
	}
}
