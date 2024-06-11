import { getLogger  } from './utils/logger.js';
import {checkPortValid} from './utils/connection.js';
import { readHostLists } from './utils/config.js';
import { Worker } from 'worker_threads';
import path from 'path';

import { fileURLToPath } from 'url';
import { MarabuNetworkServer } from './network/server.js';



// check if the number of arguments is correct
if (process.argv.length !== 5) {
    console.error('Usage: node main.js <nodeName> <hostName> <port>');
    process.exit(1);
}
const nodeName = process.argv[2];
const hostName = process.argv[3];
const port = parseInt(process.argv[4]);
const logger = getLogger(nodeName);




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

// check if the port number is valid
checkPortValid(port);

// if one of the arguments is missing, print an error message and exit

const server = new MarabuNetworkServer(hostName, port, logger);
logger.info(`Node ${nodeName} is listening on ${hostName}:${port}`);

const workerPath = path.resolve(__dirname, './network/client.js');

// sleep for 1 second to wait for the server to start

setTimeout(() => {
    for (const host of hostLists) {
        const [remoteAddress, remotePort] = host.split(':');
        const client = new Worker(workerPath, { workerData: { remoteAddress, remotePort, nodeName } });
    }
    
}, 2000);

