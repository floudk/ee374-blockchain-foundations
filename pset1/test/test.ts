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
        console.error('Error parsing JSON of:', data, ', try to parse:', error);
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
    const Promise1 = new Promise((resolve, reject) => {
        // test 2.1 INVALID_FORMAT, expect error message and disconnect
        let client = new net.Socket();
        client.connect(agentPort, () => {
        });
        let buffer = '';
        client.on('data', (data) => {
            buffer += data.toString();
        });
        client.on('error', (err) => {
        });
        client.write('hello' + '\n'); // invalid format
        client.on('close', () => {
            // check only 3 message in buffer: hello, getpeers, and INVALID_FORMAT
            let boundary = buffer.indexOf('\n');
            let count = 0;
            let messages = [];
            while (boundary !== -1) {
                count++;
                messages.push(buffer.slice(0, boundary));
                boundary = buffer.indexOf('\n', boundary + 1);
            }
            assert(count == 3, "Test 2.1: Connection with INVALID_FORMAT Failed: buffer contains", count, "messages");
            assert(messages[0].includes('hello'), "Test 2.1: no hello message");
            assert(messages[1].includes('getpeers'), "Test 2.1: no getpeers message");
            assert(messages[2].includes('error') && messages[2].includes('INVALID_FORMAT'), "Test 2.1: no INVALID_FORMAT message");
            resolve();
        });
    });
    const Promise2 = new Promise((resolve, reject) => {
        // test 2.2 INVALID_HANDSHAKE, expect error message and disconnect
        let client = new net.Socket();
        client.connect(agentPort, () => {
        });
        let buffer = '';
        client.on('data', (data) => {
            buffer += data.toString();
        });
        client.on('error', (err) => {
        });
        client.write('{"type": "getpeers"}' + '\n');  // invalid handshake: message before hello
        client.on('close', () => {
            // check only 3 message in buffer: hello, getpeers, and INVALID_HANDSHAKE
            let boundary = buffer.indexOf('\n');
            let count = 0;
            let messages = [];
            while (boundary !== -1) {
                count++;
                messages.push(buffer.slice(0, boundary));
                boundary = buffer.indexOf('\n', boundary + 1);
            }
            assert(count == 3, "Test 2.2: Connection with INVALID_HANDSHAKE Failed: buffer contains", count, "messages");
            assert(messages[0].includes('hello'), "Test 2.2: no hello message");
            assert(messages[1].includes('getpeers'), "Test 2.2: no getpeers message");
            assert(messages[2].includes('error') && messages[2].includes('INVALID_HANDSHAKE'), "Test 2.2: no INVALID_HANDSHAKE message");

            resolve();
        });
    });

    const Promise3 = new Promise((resolve, reject) => {
        // test 2.3 mismatched version, expect direct disconnect
        let client = new net.Socket();
        client.connect(agentPort, () => {
        });
        let buffer = '';
        client.on('data', (data) => {
            // console.log('Received data:', data.toString());
            buffer += data.toString();
        });
        client.on('error', (err) => {
        });
        client.write(createMessage('hello', {}) + '\n');
        client.on('close', () => {
            // check buffer, the message in buffer should not exceed 2: hello and getpeers
            let boundary = buffer.indexOf('\n');
            let count = 0;
            while (boundary !== -1) {
                count++;
                boundary = buffer.indexOf('\n', boundary + 1);
            }
            if (count > 2) {
                reject('Test 2: Connection with mismatched version Failed: buffer contains', count, 'messages');
            }
            console.log('Test 2: INVALID_FORMAT, INVALID_HANDSHAKE, and mismatched version Passed');
            resolve();
        });
    });


    return Promise1.then(Promise2).then(Promise3);
}

// test 3: packet split and re-get-peers
function test3() {
    return new Promise((resolve, reject) => {
        let client = new net.Socket();
        client.connect(agentPort, () => {
        });
        let buffer = '';
        let randomIP = 'test3';
        let randomPort = Math.floor(Math.random() * 10000);
        let peersCount = 0;
        let success = false;

        client.on('data', (data) => {
            buffer += data.toString();
            let boundary = buffer.indexOf('\n');
            while (boundary !== -1) {
                let raw = buffer.slice(0, boundary);
                buffer = buffer.slice(boundary + 1);
                let msg = decodeFromCanonicalizeJson(raw);
                if (msg.type == 'hello') {
                    //    console.log('Received hello message');
                } else if (msg.type == 'getpeers') {
                    // console.log('Received getpeers message');
                    let peersMessage = createMessage('peers', {
                        peers: [
                            randomIP + ':' + randomPort
                        ]
                    });
                    let psplit1 = peersMessage.slice(0, 5);
                    let psplit2 = peersMessage.slice(5);
                    client.write(psplit1)
                    client.write(psplit2 + '\n');
                    // after a while, send getpeers message again
                    setTimeout(() => {
                        // console.log('Re-get-peers');
                        client.write(createMessage('getpeers', {}) + '\n');
                    }, 1000);
                } else if (msg.type == 'peers') {
                    // console.log('Received peers message:', msg.peers);
                    if (peersCount == 0) {
                        peersCount++;
                    } else {
                        assert(msg.peers.includes(randomIP + ':' + randomPort), "Test 3: Packet split and re-get-peers Failed");
                        success = true;
                        client.end();
                    }
                }
                boundary = buffer.indexOf('\n');
            }
        });
        client.on('error', (err) => {
        });
        client.on('close', () => {
            // console.log('Connection closed');
            if (success) {
                console.log('Test 3: Packet split and re-get-peers Passed');
                resolve();
            } else {
                reject('Test 3: Packet split and re-get-peers Failed');
            }
        });
        let helloMessage = createMessage('hello', { agent: 'test', version: '0.0.1' });
        let getPeerMessage = createMessage('getpeers', {});
        let hsplit1 = helloMessage.slice(0, 5);
        let hsplit2 = helloMessage.slice(5);
        // console.log('hsplit1:', hsplit1, 'hsplit2:', hsplit2);
        client.write(hsplit1);
        client.write(hsplit2 + '\n');
        let gsplit1 = getPeerMessage.slice(0, 5);
        let gsplit2 = getPeerMessage.slice(5);
        // console.log('gsplit1:', gsplit1, 'gsplit2:', gsplit2);
        client.write(gsplit1);
        client.write(gsplit2 + '\n');

    });
}

// test 4: Test simultaneous connections
function test4() {
    return new Promise((resolve, reject) => {
        const client1 = new net.Socket();
        const client2 = new net.Socket();
        let buffer1 = '';
        let buffer2 = '';
        let success1 = false;
        let success2 = false;
        let close = 0;

        client1.connect(agentPort, () => {});
        client2.connect(agentPort, () => {});

        client1.write(createMessage('hello', { agent: 'test1', version: '0.0.1' }) + '\n');
        client2.write(createMessage('hello', { agent: 'test2', version: '0.0.1' }) + '\n');
        client1.write(createMessage('getpeers', {}) + '\n');
        client2.write(createMessage('getpeers', {}) + '\n');

        // each should receive 3 messages: hello, getpeers, and peers, then close connection
        client1.on('data', (data) => {
            // console.log('client1 receive data:', data.toString());
            buffer1 += data.toString();
            // console.log("buffer1 current length:", buffer1.length);
            let boundary = buffer1.indexOf('\n');
            // console.log('boundary:', boundary);
            while (boundary !== -1) {
                let raw = buffer1.slice(0, boundary);
                buffer1 = buffer1.slice(boundary + 1);
                // console.log("buffer1 current length:", buffer1.length);
                // console.log('client1 try to decode:', raw);
                let msg = decodeFromCanonicalizeJson(raw);
                if (msg.type == 'hello' || msg.type == 'getpeers') {
                } else if (msg.type == 'peers') {
                    success1 = true;
                    client1.end();
                    if (close == 0) {
                        close++;
                    } else {
                        if (success1 && success2) {
                            console.log('Test 4: Simultaneous connections Passed');
                            resolve();
                        }
                        else {
                            reject('Test 4: Simultaneous connections Failed');
                        }
                    }
                }
                boundary = buffer1.indexOf('\n');
                // console.log('boundary:', boundary);
            }
        });
        client2.on('data', (data) => {
            // console.log('client2 receive data:', data.toString());
            buffer2 += data.toString();
            let boundary = buffer2.indexOf('\n');
            while (boundary !== -1) {
                let raw = buffer2.slice(0, boundary);
                buffer2 = buffer2.slice(boundary + 1);
                // console.log('client2 try to decode:', raw);
                let msg = decodeFromCanonicalizeJson(raw);
                if (msg.type == 'hello' || msg.type == 'getpeers') {

                } else if (msg.type == 'peers') {
                    success2 = true;
                    client2.end();
                    if (close == 0) {
                        close++;
                    } else {
                        if (success1 && success2) {
                            console.log('Test 4: Simultaneous connections Passed');
                            resolve();
                        }
                        else {
                            reject('Test 4: Simultaneous connections Failed');
                        }
                    }
                }
                boundary = buffer2.indexOf('\n');
            }
        });
    });

    client1.on('close', () => {
        // agent close connection, fail the test
        reject('Test 4: Simultaneous connections Failed');
    });
    client2.on('close', () => {
        reject('Test 4: Simultaneous connections Failed');
    });


    client1.on('error', (err) => {
        console.error('Error:', err);
    });
    client2.on('error', (err) => {
        console.error('Error:', err);
    });
}


// test1().then(test2);
test4()
