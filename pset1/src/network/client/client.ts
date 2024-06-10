import * as Net from 'net';

class MarabuNetworkClient{
    private readonly _remoteAddress: string;
    private readonly _remotePort: number;
    private readonly _socket: Net.Socket;
    private readonly _hostName: string;
    
    constructor(remoteAddress: string, remotePort: number, hostName: string){
        this._remoteAddress = remoteAddress;
        this._remotePort = remotePort;
        this._socket = new Net.Socket();
    }

    connectToServer(){
        this._socket.connect(this._remotePort, this._remoteAddress, () => {
            console.log(`Connected to server ${this._remoteAddress}:${this._remotePort}`);

            // say hello to the server
            this.sendData('Hello, server!');
        });
        
        this._socket.on('data', (data) => {
            console.log(`Received data: ${data.toString()}`);
        });

        this._socket.on('close', () => {
            console.log('Connection terminated');
        });
    }

    sendData(data: string){
        this._socket.write(data);
    }

    closeConnection(){
        this._socket.end();
    }

}