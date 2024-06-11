import { Worker } from 'worker_threads';
import * as Net from 'net';
import * as winston from 'winston';


class MarabuNetworkServer {

    private readonly _hostName: string; // Hostname
    private readonly _port: number; // Port
    private readonly _logger: winston.Logger;

    constructor(hostName: string, port: number, logger: winston.Logger) {
        this._hostName = hostName;
        this._port = port;
        this._logger = logger;
        this.startServer();
    }

    startServer() {
        // boss for only listening to new client connections
        const server = new Net.Server();
        server.listen(this._port, this._hostName, () => {
            this._logger.info(`Server listening on port ${this._port}, waiting for new connection requests...`);
        });
        server.on('connection', (socket) => {
            this.handleConnection(socket);
        });
    }

    private handleConnection(socket: Net.Socket) {
        this._logger.info('New connection: ${socket.remoteAddress}:${socket.remotePort} established');
        socket.on('data', (data) => {
            this._logger.info(`Received data: ${data.toString()}`);
        });
        socket.on('close', () => {
            this._logger.info('Connection: ${socket.remoteAddress}:${socket.remotePort} terminated');
        });
    }
}

export { MarabuNetworkServer };