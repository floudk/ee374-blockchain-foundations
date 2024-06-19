import * as net from 'net';
import { canonicalize } from 'json-canonicalize';

// - name: "host1"
// port: 24600
// - name: "host2"
// port: 24601
// - name: "host3"
// port: 24602

declare global {
    namespace NodeJS {
        interface Global {
            test_case: string;
        }
    }
}

// 1. test normal connection
const host1 = 'localhost';
const port1 = 24600;


// 1.1 send non-json message

function sendNonJsonMessage() {
    console.log('sending non-json message');
    client.write('non-json message\n');
}

// 1.2 send first message not hello
// when global.test_case is '2.2', send a message that is not hello
function sendNonHelloMessage() {
    const message = {
        type: 'test',
        test: 'test',
        data: 'data'
    };
    client.write(canonicalize(message) + '\n');
}

// 1.3 send hello message with re-connect
function normalConnection() {
    // re-connect the closed connection
    client.connect({ host: host1, port: port1 });
    // send hello message
    const message = {
        type: 'hello',
        nodeName: 'test'
    };
    client.write(canonicalize(message) + '\n');

    // close the connection after 1 second
    setTimeout(() => {
        client.end();
    }, 1000);
}


client = net.createConnection({ host: host1, port: port1 }, () => {
    // console.log('Connected to', host1, port1);
    global.test_case = '1.1';
    console.log('1.1- check non-json message');
    sendNonJsonMessage();
});
client.on('data', (data) => {
    // console.log('test_case:', global.test_case, ' received data:', data.toString());
    if (global.test_case === '1.1') {
        // check if the response is {"error": "INVALID_FORMAT"}
        if (data.toString() === '{"error": "INVALID_FORMAT"}\n') {
            console.log('1.1- check non-json message passed');
        } else {
            console.error('1.1- check non-json message failed:', data.toString());
        }
    }else if (global.test_case === '1.2') {
        // check if the response is {"error": "INVALID_HANDSHAKE"}
        if (data.toString() !== '{"error": "INVALID_HANDSHAKE"}\n') {
            console.error('1.2- check first message not hello failed:', data.toString(), 'expected: {"error": "INVALID_HANDSHAKE"}');
        }
    }

    if (global.test_case === '1.1') {
        setTimeout(() => {
            global.test_case = '1.2';
            sendNonHelloMessage();
        }, 500);
    }

});

// check if the connection is closed, if not the test failed
client.on('error', (err) => {
    console.error('Error:', err);
});

client.on('end', () => {
    // console.log('Connection closed with test case:', global.test_case);
    if (global.test_case === '1.1') {
        console.error('1.2- check first message not hello failed');
    }else if (global.test_case === '1.2'){
        console.log('1.2- check first message not hello passed');
        setTimeout(() => {
            global.test_case = '1.3';
            normalConnection();
        }, 500);
    }else if (global.test_case === '1.3'){
        console.log('1.3- check normal connection passed');
    }

});

// 2. test packet sticking and packet fragmentation
client.removeAllListeners('data');
client.removeAllListeners('end');

const host2 = 'localhost'
const port2 = 24601;