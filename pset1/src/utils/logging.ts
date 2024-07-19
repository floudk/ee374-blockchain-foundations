import * as winston from 'winston';
import * as fs from 'fs';

export function getLogger(logfile: string): winston.Logger {

    // re-create the file if it exists
    if (fs.existsSync(logfile)) {
        fs.unlinkSync(logfile);
    }

    return winston.createLogger({
        level: 'info',
        format: winston.format.combine(
            winston.format.timestamp({
                format: 'YYYY-MM-DD HH:mm:ss'
            }),
            winston.format.printf(info => `${info.timestamp}-${info.level}-${info.message}`)
        ),
        transports: [
            new winston.transports.File({ filename: logfile })
        ]
    });
}