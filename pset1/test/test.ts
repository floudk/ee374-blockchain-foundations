import * as net from 'net';
import { strict as assert } from 'assert';
import { canonicalize } from 'json-canonicalize';

interface Message {
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
    try {
        return JSON.parse(data) as Message;
    } catch (error) {
        console.error('Error parsing JSON:', error);
        throw error;
    }
}


const agentPort = 18000;

// test 1: normally connect and disconnect
// test 2: disconnect and connect again
function test1() {
    return new Promise((resolve, reject) => {
        let checkCase = 0;
        const client1 = new net.Socket();
        client1.connect(agentPort, () => {
            const helloMessage = createMessage('hello', { agent: 'test', version: '0.0.1' });
            client1.write(helloMessage + '\n');
            const getPeerMessage = createMessage('getpeers', {});
            client1.write(getPeerMessage + '\n');
        });

        let buffer = '';
        client1.on('data', (data) => {
            buffer += data.toString();
            let boundary = buffer.indexOf('\n');
            while (boundary !== -1) {
                const raw = buffer.substring(0, boundary);
                buffer = buffer.substring(boundary + 1);
                if (checkCase == 0) {
                    assert(raw.includes('hello'), "no hello message, test 1 failed")
                    checkCase = 1;
                } else if (checkCase == 1) {
                    assert(raw.includes('getpeers'), "no get peer message, test 1 failed")
                    checkCase = 2;
                } else if (checkCase == 2) {
                    assert(raw.includes('peers'), "not peers message, test 1 failed")
                    checkCase = 3;
                }
                boundary = buffer1.indexOf('\n');
            }
        });
        client1.setTimeout(5000);
        client1.on('timeout', () => {
            // assert(checkCase == 3, "Test 1: Normal Connection Failed")
            // console.log('Test 1: Normal Connection Passed');
            // client1.end();
            if (checkCase == 3) {
                console.log('Test 1: Normal Connection Passed');
                resolve();
            } else {
                reject('Test 1: Normal Connection Failed');
            }
            client1.end();
        });
    });
}

// test 2: connect with INVALID_FORMAT, INVALID_HANDSHAKE, and packet split
function test2() {
    return new Promise((resolve, reject) => {
        let checkCase = 0;
        const client2 = new net.Socket();
        client2.connect(agentPort, () => {
        });
        let buffer = '';
        client2.on('data', (data) => {

            console.log('Received data:', data.toString());
            buffer += data.toString();
            let boundary = buffer.indexOf('\n');
            while (boundary !== -1) {
                let raw = buffer.slice(0, boundary);
                buffer = buffer.slice(boundary + 1);
                let msg = decodeFromCanonicalizeJson(raw);

                // ignoring hello and getpeers message
                if (msg.type == 'hello' || msg.type == 'getpeers') {
                    boundary = buffer.indexOf('\n');
                    continue;
                }

                if (checkCase == 0) {
                    assert(msg.type == 'error' && msg.name == 'INVALID_FORMAT', "no invalid format message, test 2 failed")
                    checkCase = 1;
                } else if (checkCase == 1) {
                    assert(msg.type == 'error' && msg.name == 'INVALID_HANDSHAKE', "no invalid handshake message, test 2 failed")
                    checkCase = 2;
                } else if (checkCase == 2) {
                    assert(msg.type == 'peers', "not peers message, test 2 failed")
                    checkCase = 3;
                }
                boundary = buffer.indexOf('\n');
            }
        });
        client2.on('error', (err) => {
        });

        client2.write('hello' + '\n'); // invalid format
        client2.write('{"type": "getpeers"}' + '\n');  // invalid handshake: message before hello
        const helloMessage = createMessage('hello', { agent: 'test', version: '0.0.1' });
        let split1 = helloMessage.slice(0, 5);
        let split2 = helloMessage.slice(5);
        client2.write(split1);
        client2.write(split2 + '\n');
        client2.write(createMessage('getpeers', {}) + '\n');

        client2.setTimeout(5000);
        client2.on('timeout', () => {
            if (checkCase == 3) {
                console.log('Test 2: Connection with INVALID_FORMAT, INVALID_HANDSHAKE, and packet split Passed');
                resolve();
            } else {
                reject('Test 2: Connection with INVALID_FORMAT, INVALID_HANDSHAKE, and packet split Failed');
            }
            client2.end();
        });
    });
}

// test1().then(test2);
test2()
