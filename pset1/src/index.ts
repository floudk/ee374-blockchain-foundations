import * as winston from 'winston';
import {checkPortValid} from './utils/connection';
import { readHostLists } from './utils/config';
import { TcpClient } from './network/client';
import { TcpServer } from './network/server';
import path from 'path';

import { fileURLToPath } from 'url';



// check if the number of arguments is correct
if (process.argv.length !== 5) {
    console.error('Usage: node main.js <nodeName> <hostName> <port>');
    process.exit(1);
}
const nodeName = process.argv[2];
const hostName = process.argv[3];
const port = parseInt(process.argv[4]);

const logger = winston.createLogger({
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


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const yamlFile = path.resolve(__dirname, '../hosts.yaml');
const hostLists = readHostLists(yamlFile, nodeName);


let host_str = ''
for (const host of hostLists){
    host_str += host
    host_str += ' '
}
logger.info('Host lists: '+ host_str)


// create a server
const server = new TcpServer(port, nodeName, logger);


// connect to hosts after 2 seconds to ensure all servers are up
setTimeout(() => {
    for (const host of hostLists){
        const [hostName, port] = host.split(':');
        const client = new TcpClient(hostName, parseInt(port), nodeName, logger);
    }
}, 1000);


