import * as net from 'net';
import * as winston from 'winston';
import * as msg from './network/message';
import * as err from './error';
import { setPeerFile,getPeers,updatePeers } from './network/peers';

export class Agent {
    private server: net.Server;
    private name: string;
    private version: string;

    private connectingSockets: Set<net.Socket> = new Set<net.Socket>();
    private initialingSockets: Map<net.Socket, int> = new Map<net.Socket, int>(); // sockets that only connected but not received hello message and getpeers message
    private receivedBuffer: Map<net.Socket, string> = new Map<string, string>();

    

    constructor(env: Map<string, any>, private logger: winston.Logger) {
        this.name = env.get('agentName');
        this.version = env.get('version');

        setPeerFile(env.get('peerfile'));

        // create a tcp server listening on the port
        this.server = net.createServer((socket) => this.handleIncomingConnection(socket));
        this.server.listen(env.get('port'), () => {
            this.logger.info('Server started on port ' + env.get('port'));
        })
        this.server.on('error', (err) => this.onError(err));

        // connect to bootstrap servers
        env.get('bootstrapServers').forEach((bootstrap: { server: string; port: number }) => {
            this.connectTo(bootstrap.server, bootstrap.port);
        });
        
        // connect to peers
        // for (let peer of getPeers()) {
        //     console.log(peer);
        //     let [server, port] = peer.split(':');
        //     this.connectTo( server, parseInt(port));
        // }
    }


    // --------------------------- network fields ---------------------------

    // handle incoming connection as tcp server
    private handleIncomingConnection(socket: net.Socket) {
        socket.on('data', (data) => this.onData(data, socket));
        socket.on('end', () => this.onEnd());
        socket.on('error', (err) => this.onError(err));
        this.onConnect(socket);
    }

    // handle outgoing connection as tcp client
    private connectTo(server: string, port: number) {
        this.logger.info(`Connecting to ${server}:${port}...`);
        const client = net.createConnection({ host: server, port }, () => this.onConnect(client));
        client.on('data', (data) => this.onData(data, client));
        client.on('end', () => this.onEnd());
        client.on('error', (err) => this.onError(err));
    }
    private onConnect(socket: net.Socket) {
        this.logger.info(`Try establishing connection with ${socket.remoteAddress}:${socket.remotePort}`);

        this.initialingSockets.set(socket, 0);
        this.receivedBuffer.set(socket, '');
        const helloMessage = msg.createMessage('hello', { name: this.name, version: this.version });
        socket.write(helloMessage + '\n');
        const getPeerMessage = msg.createMessage('getpeers', {});
        socket.write(getPeerMessage + '\n');

        this.initialingSockets.set(socket,1);
         
    }


    private onData(data: Buffer, socket: net.Socket) {
        this.logger.info(`Received data: ${data.toString()} from ${socket.remoteAddress}:${socket.remotePort}`);
        this.receivedBuffer.set(socket, this.receivedBuffer.get(socket) + data.toString());
        this.processPackets(socket);
    }


    private onEnd() {
        this.logger.info('Connection ended');
    }
    private onError(err: Error) {
        // this.logger.error('Error: ' + err.message);
        console.log('Error: ' + err.message);
    }

    private onLocalError(socket: net.Socket, e: Error) {
        this.logger.error('Local error: ' + e.message);
        let errorMsg: string;
        if (e instanceof err.UnknownMessageTypeError) {

        }else if (e instanceof err.INVALID_HANDSHAKE) {
            errorMsg = msg.createMessage('error', {name : "INVALID_HANDSHAKE", description: e.message});
        }else if (e instanceof err.INVALID_FORMAT) {
            errorMsg = msg.createMessage('error', {name : "INVALID_FORMAT", description: e.message});
        }
        socket.write(errorMsg + '\n');
    }

    // ------------------------------------------------------------------------

    private async processPackets(socket :net.Socket){
        let buffer = this.receivedBuffer.get(socket);
        // process buffer
        let boundary = buffer.indexOf('\n');
        while (boundary !== -1) {
            const raw = buffer.substring(0, boundary);
            buffer = buffer.substring(boundary + 1);
            try {
                await this.processMessage(socket, msg.decodeFromCanonicalizeJson(raw));
            } catch (e) {
                this.onLocalError(socket, e);
            }
            boundary = buffer.indexOf('\n');
        }
        this.receivedBuffer.set(socket, buffer);
    }
    
    private async processHandshakeMessage(socket: net.Socket, message: msg.Message) {
        let currentState = this.initialingSockets.get(socket);
        // if currentState is 0, then the socket has not sent hello message
        while (currentState === 0) {
            await new Promise(resolve => setTimeout(resolve, 500));
            currentState = this.initialingSockets.get(socket);
        }

        this.logger.info(`Processing handshake message: ${message.type} from ${socket.remoteAddress}:${socket.remotePort} with state ${currentState}`);

        if (currentState === 1 && message.type === 'hello') {
            this.initialingSockets.set(socket, 2);
            return;
        }else if (currentState === 1 && message.type !== 'hello') {
            throw new err.INVALID_HANDSHAKE("Message " + message.type + " before hello message"); 
        }
        
        if (currentState === 2 && message.type === 'getpeers') {
            this.initialingSockets.delete(socket);
            this.connectingSockets.add(socket); // add to connectingSockets
            this.logger.info(`Connected to ${socket.remoteAddress}:${socket.remotePort} Successfully`);
            socket.write(msg.createMessage('peers', {peers: getPeers()}) + '\n');
            return
        }else if (currentState === 2 && message.type !== 'getpeers') {
            throw new err.INVALID_HANDSHAKE("Message " + message.type + " directly after hello message, instead of getpeers message");
        }
    }


    private async processMessage(socket: net.Socket, message: msg.Message) {
        if (!this.connectingSockets.has(socket)) {
            await this.processHandshakeMessage(socket, message);
            return;
        }

        switch (message.type) {
            case 'getpeers':
                console.log('Received getpeers message:', message);
                if (this.initialingSockets.get(socket) === 2) {
                    this.initialingSockets.delete(socket);
                    this.connectingSockets.add(socket); // add to connectingSockets
                    this.processPackets(socket); // process pending packets if any
                    this.logger.info(`Connected to ${socket.remoteAddress}:${socket.remotePort} Successfully`);
                }else{
                    this.logger.error('Received getpeers message from a socket that has not sent hello message');
                    throw new INVALID_HANDSHAKE("no hello message before getpeers message");
                }

                const peerMsg = msg.createMessage(
                    "peers", {peers: getPeers()}
                )
                socket.write(peerMsg +'\n')
                break;
            case 'peers':
                console.log('Received peers message:', message);
                updatePeers(message.peers);
                break;
            case 'error':
                console.log('Received error message:', message);
                break;
            case 'getobject':
                console.log('Received getobject message:', message);
                break;
            case 'ihaveobject':
                console.log('Received ihaveobject message:', message);
                break;
            case 'object':
                console.log('Received object message:', message);
                break;
            case 'getmempool':
                console.log('Received getmempool message:', message);
                break;
            case 'mempool':
                console.log('Received mempool message:', message);
                break;
            case 'getchaintip':
                console.log('Received getchaintip message:', message);
                break;
            case 'chaintip':
                console.log('Received chaintip message:', message);
                break;

            default:
                console.log('Received unknown message:', message);
                // throw an error for unknown message
                throw new err.UnknownMessageTypeError(message.type);
        }
    }


    public close() {
        console.log('Closing agent...');
        this.server.close();
    }
}
