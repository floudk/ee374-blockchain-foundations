import * as net from 'net';
import { canonicalize } from 'json-canonicalize';

class TcpServer{
    private server: net.Server;

    private timeout: NodeJS.Timeout | null = null;
    private readonly timeoutDuration: number = 10000;

    private connectionState: Map<net.Socket, boolean>;

    constructor(
        private port: number,
        private nodeName: string,
        private logger: winston.Logger) {
        this.server = net.createServer((socket) => this.handleConnection(socket));
        this.server.on('error', (err) => this.handleError(err));

        this.connectionState = new Map<net.Socket, boolean>();

        this.server.listen(this.port, () => {
            this.logger.info('Server started on port ' + this.port);
        });

        this.setTimeout();
    }

    private handleConnection(socket: net.Socket): void {
        this.connectionState.set(socket, false);
        this.clearTimeout();

        let buffer = '';

        let address = socket.remoteAddress + ':' + socket.remotePort;

        socket.on('data', (data) => {
            buffer += data.toString();
            buffer = this.processBuffer(socket, buffer);
        });

        socket.on('end', () => {
            this.logger.info('Connection closed: ' + address);
            this.connectionState.delete(socket);
            if (this.connectionState.size === 0) {
                this.setTimeout();
            }
        });
    }

    private processBuffer(socket: net.Socket, buffer: string): string {
        let boundary = buffer.indexOf('\n');
        this.logger.info('current buffer: ' + buffer);
        while (boundary !== -1) {
            const rawMessage = buffer.substring(0, boundary);
            buffer = buffer.substring(boundary + 1);
            if (this.isValidJson(rawMessage)) {
                const message = JSON.parse(rawMessage) as Message;
                // this.logger.info(`Received message: ${JSON.stringify(message, null, 2)}`);
                this.handleMessage(socket, message);
            } else {
                this.logger.info('handle invalid message:' + JSON.stringify(rawMessage));
                this.handleError(socket, 'INVALID_FORMAT');
            }
            boundary = buffer.indexOf('\n');
        }
        return buffer;
    }

    private isValidJson(data: string): boolean {
        try {
            JSON.parse(data);
            return true;
        } catch (error) {
            return false;
        }
    }

    private handleMessage(socket: net.Socket, message: any): void {

        if (!this.connectionState.get(socket) && message.type !== 'hello') {
            this.handleError(socket, 'INVALID_HANDSHAKE');
            socket.end();
            return;
        }

        if (message.type === 'hello') {
            this.connectionState.set(socket, true);
            this.logger.info('Received hello message from ' + message.nodeName);
            return;
        }
        
        // process other messages

    }
    private handleError(socket: net.Socket, error: string): void {
        const errorMessage = `{"error": "${error}"}`;
        this.logger.error('sending error message to ' + socket.remoteAddress + ':' + socket.remotePort + ': ' + errorMessage);
        socket.write(errorMessage + '\n');
    }
    

    private setTimeout() {
        this.timeout = setTimeout(() => {
            this.logger.info('No connections within ' + this.timeoutDuration/1000 + ' seconds, closing server');
            this.server.close();
        }, this.timeoutDuration);
    }

    private clearTimeout() {
        if (this.timeout) {
            clearTimeout(this.timeout);
            this.timeout = null;
        }
    }
}

export { TcpServer };