import * as Net from 'net';
import { workerData } from 'worker_threads';

import {getLogger} from '../utils/logger.js';


class MarabuNetworkClient{
    private readonly _remoteAddress: string;
    private readonly _remotePort: number;
    private readonly _socket: Net.Socket;
    private readonly _hostName: string;
    
    constructor(remoteAddress: string, remotePort: number, hostName: string){
        this._remoteAddress = remoteAddress;
        this._remotePort = remotePort;
        this._hostName = hostName;
        this._socket = new Net.Socket();
    }

    connectToServer(){
        this._socket.connect(this._remotePort, this._remoteAddress, () => {
            logger.info(`Connected to server ${this._remoteAddress}:${this._remotePort}`);

            // say hello to the server
            this.sendData('Hello, server!, I am ' + this._hostName)
        });
        
        this._socket.on('data', (data) => {
            logger.info(`Received data: ${data.toString()}`);
        });

        this._socket.on('close', () => {
            logger.info('Connection terminated');
        });
    }

    sendData(data: string){
        this._socket.write(data);
    }

    closeConnection(){
        this._socket.end();
    }

}

const logger = getLogger(workerData.nodeName);
logger.info(`Connecting to ${workerData.remoteAddress}:${workerData.remotePort}`);

const client = new MarabuNetworkClient(workerData.remoteAddress, workerData.remotePort, workerData.nodeName);
client.connectToServer();