import * as net from 'net';
import * as winston from 'winston';
import * as msg from './message';

class TcpClient {
    private client: net.Socket;
    private buffer: string = '';

    constructor(
        private host: string,
        private port: number,
        private nodeName: string, 
        private logger: winston.Logger){
        this.client = net.createConnection({ host, port }, () => this.onConnect());

        this.client.on('data', (data) => this.onData(data));
        this.client.on('end', () => this.onEnd());
        this.client.on('error', (err) => this.onError(err));
    }

    private onConnect(): void {
        this.logger.info(`Connected to ${this.host}:${this.port}`);
        const helloMessage = msg.createHelloMessage(this.nodeName);

        this.client.write(helloMessage + '\n');
    }


    private onData(data: Buffer): void {
        this.logger.info(`Received data: ${data.toString()}`);
        this.buffer += data.toString();
        this.processBuffer();
    }

    private processBuffer(): void {
        let boundary = this.buffer.indexOf('\n');
        while (boundary !== -1) {
            const rawMessage = this.buffer.substring(0, boundary);
            this.buffer = this.buffer.substring(boundary + 1);
            if (this.isValidJson(rawMessage)) {
                const message = JSON.parse(rawMessage);
                this.logger.info(`Received message: ${JSON.stringify(message, null, 2)}`);
                this.handleMessage(message);
            } else {
                this.handleError('INVALID_FORMAT', "Invalid json format")
            }
            boundary = this.buffer.indexOf('\n');
        }
    }
    
    private isValidJson(data: string): boolean {
        try {
            JSON.parse(data);
            return true;
        } catch (error) {
            return false;
        }
    }

    private handleMessage(jsonMsg : JSON): void{
        // process message
        console.log('handleMessage:', jsonMsg);
    }

    private handleError(error: string, desc:string): void {
        const errorMsg = msg.createErrorMessage(error,desc);
        
    }

    private onEnd(): void {
        this.logger.info(`Connection ${this.host}:${this.port} closed`);
    }

    private onError(err: Error): void {
        this.logger.error(`Connection error: ${err.message}`);
    }
}

export { TcpClient };