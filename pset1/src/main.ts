import {checkPortValid} from './utils/connection.js';
import { readHostLists } from './utils/config.js';
import { Worker } from 'worker_threads';
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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const yamlFile = path.resolve(__dirname, '../hosts.yaml');
const hostLists = readHostLists(yamlFile, nodeName);
console.log('Host lists: ', hostLists);

// check if the port number is valid
checkPortValid(port);

// if one of the arguments is missing, print an error message and exit



console.log(`Node ${nodeName} is listening on ${hostName}:${port}`);


const workerPath = path.resolve(__dirname, './network/server/server.js');

const networkServer = new Worker(workerPath, { workerData: { hostName, port } });
// const client = new Worker('./src/network/client/client.ts', { workerData: { hostName, port } });