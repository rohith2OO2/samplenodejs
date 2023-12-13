'use strict'
import { logs } from '@opentelemetry/api-logs'
import config from '../../config'
import winston from 'winston'
const { createLogger, format, transports, Logger } = winston
import Transport  from 'winston-transport'
//import config from '../../config';
const moment = require('moment-timezone')

const { combine, label, printf } = format
const myFormat = printf(info => `${info.timestamp} [${info.level}]: ${info.label} - ${info.message}`)
const appendTimestamp = format((info, opts) => {
	if (opts.tz) info.timestamp = moment().tz(opts.tz).format()
	return info
})

const SERVICE_NAME = "node-autoinstumentation";

class CustomTransport extends Transport {
	constructor(opts) {
	  super(opts);
	}
	logger = logs.getLogger(SERVICE_NAME);
  
	log(msg, callback) {
	  this.logger.emit({ body: msg?.message, severityText: msg?.level || "info" });
	  callback();
	}
  }

const customLogger = module => {
	const logger = createLogger({
		//TODO: Need to read the level from config
		level: config.logger.level || 'info',
		// colorize: true,
		format: combine(label({ label: module }), appendTimestamp({ tz: 'Asia/Kolkata' }), myFormat),
		transports: [new transports.Console(), new CustomTransport({})],
	})

	logger.stream = {
		// @ts-ignore
		write: function (message, encoding) {
			// use the 'info' log level so the output will be picked up by both transports (file and console)
			logger.info(message)
		},
	}
	return logger
}

// create a stream object with a 'write' function that will be used by `morgan`

// module.exports = customLogger
export default customLogger
