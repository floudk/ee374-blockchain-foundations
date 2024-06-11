import * as winston from 'winston';

// store the logger in a variable
let logger: winston.Logger;

// 函数用于创建或检索 logger 实例
export function getLogger(nodeName?: string): winston.Logger {
    if (!logger && nodeName) {
        logger = winston.createLogger({
            level: 'info',
            format: winston.format.combine(
                winston.format.timestamp({
                    format: 'YYYY-MM-DD HH:mm:ss'
                }),
                winston.format.printf(info => `${info.timestamp}-${info.level}-${nodeName}: ${info.message}`)
            ),
            transports: [
                new winston.transports.File({ filename: `./logs/${nodeName}.log` })
            ]
        });
    } else if (!logger) {
        throw new Error("Logger has not been initialized with a nodeName");
    }
    return logger;
}

export { logger };