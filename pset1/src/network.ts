import * as net from 'net';
import * as winston from 'winston';

class Network{
    private server: net.Server;
    private clients: net.Socket[] = []
    
    private timeout: NodeJS.Timeout | null = null;
    private activeConnections: number = 0;
    private readonly timeoutDuration: number = 10000;

    private readonly maxRetries: number = 5;
    private readonly retryInterval: number = 5000;
    

    constructor(
        private host:string, 
        private port: number,
        private nodeName: string, 
        private logger: winston.Logger){

        this.server = new net.Server();
        this.server.listen(port, host);
        
        this.setTimeout();

        this.server.on('connection', (socket: net.Socket) =>{
            this.logger.info('New connection: ' + socket.remoteAddress + ':' + socket.remotePort + ' established');
            
            this.clearTimeout();
            this.activeConnections++;

            socket.on('data', (data) => {
                console.log(data.toString());
            });
            socket.on('close', () => {
                this.logger.info('Connection: ' + socket.remoteAddress + ':' + socket.remotePort + ' closed');
                this.activeConnections--;
                if(this.activeConnections === 0){
                    this.setTimeout();
                }
            });
        });
    }

    private setTimeout() {
        this.timeout = setTimeout(() => {
            console.log('No connections within " + this.timeoutDuration/1000 + " seconds, closing server');
            this.server.close();
        }, this.timeoutDuration);
    }

    private clearTimeout() {
        if (this.timeout) {
            clearTimeout(this.timeout);
            this.timeout = null;
        }
    }

    connect(host: string, port: number){
        const client = new net.Socket();

        // Retry connection
        let retries = 0;

        
        const connectWithRetry = () => {
            client.connect(port, host, () => {
                this.logger.info('Connected to ' + host + ':' + port);
                this.clients.push(client);
            });

            client.on('error', (error) => {
                this.logger.error('Connection error: ' + error.message);
                if (retries >= this.maxRetries) {
                    this.logger.error('Max retries reached, closing connection');
                    client.destroy();
                    return;
                }
                retries++;
                setTimeout(connectWithRetry, this.retryInterval);
            });
        }

        connectWithRetry();

        client.on('data', (data) => {
            this.logger.info(`Received data: ${data.toString()}`);
        });

        client.on('close', () => {
            this.logger.info('Connection ' + host + ':' + port + ' closed');
        });
    }


}

export { Network };