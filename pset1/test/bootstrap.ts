import * as net from 'net';
import { canonicalize } from 'json-canonicalize';

interface Message{
    type: string;
    [key: string]: any;
}

function createMessage(type: string, data: any): string {
    var msg: Message = {
        type,
        ...data
    };
    return canonicalize(msg)
}

function decodeFromCanonicalizeJson(data: string): Message {
    // console.log('Decoding:', data);
    try {
        return JSON.parse(data) as Message;
    } catch (error) {
        console.error('Error parsing JSON:', error);
        throw error;
    }
}

// listen to the 19000 port
const PORT = 19000;
var initialState = 0;

async function processMessage(socket: net.Socket, message: Message) {
    while (initialState === 0) {
        await new Promise(resolve => setTimeout(resolve, 500));
    }
    switch (message.type) {
        case 'hello':
            console.log('Received hello message:', message);
            break;
        case 'getpeers':
            console.log('Received getpeers message:', message);
            // send peers message
            let msg = createMessage('peers', {peers: ['127.0.0.1:18001']});
            socket.write(msg + '\n');
            break;
        case 'peers':
            console.log('Received peers message:', message);
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
            throw new UnknownMessageTypeError(message.type);
    }
}

const server = net.createServer( (socket) => {
    console.log('Client connected:', socket.remoteAddress, socket.remotePort);
    let buffer = '';

    socket.on('data', (data) => {
        // console.log('Received data:', data.toString());
        buffer += data.toString();
        let boundary = buffer.indexOf('\n');
        while (boundary !== -1) {
            let raw = buffer.slice(0, boundary);
            buffer = buffer.slice(boundary + 1);
            let msg = decodeFromCanonicalizeJson(raw);
            processMessage(socket, msg);
            boundary = buffer.indexOf('\n');
        }
    });
    socket.on('close', () => {
        console.log('Client disconnected:', socket.remoteAddress, socket.remotePort);
    });

    // send hello and getpeers message
    const helloMessage = createMessage('hello', { agent: 'bootstrap', version: '0.0.1'});
    socket.write(helloMessage + '\n');
    const getPeersMessage = createMessage('getpeers', {});
    socket.write(getPeersMessage + '\n');

    initialState++;
});

server.listen(PORT, () => {
    console.log('Server started on port:', PORT);
});