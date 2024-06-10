import { Worker } from 'worker_threads';
import * as Net from 'net';

class MarabuNetworkServer {

    private readonly _hostName: string; // Hostname
    private readonly _port: number; // Port

    constructor(hostName: string, port: number) {
        this._hostName = hostName;
        this._port = port;
    }

    startServer() {
        // boss for only listening to new client connections
        const server = new Net.Server();
        server.listen(this._port, this._hostName, () => {
            console.log(`Server listening on port ${this._port}, waiting for new connection requests...`);
        });
        server.on('connection', (socket) => {
            console.log('New connection established');
            this.handleConnection(socket);
        });
    }

    private handleConnection(socket: Net.Socket) {
        console.log('New connection: ${socket.remoteAddress}:${socket.remotePort} established');   
        socket.on('data', (data) => {
            console.log(`Received data: ${data.toString()}`);
        });
        socket.on('close', () => {
            console.log('Connection: ${socket.remoteAddress}:${socket.remotePort} terminated');
        });
    }
}

