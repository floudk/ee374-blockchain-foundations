
export class UnknownMessageTypeError extends Error {
    constructor(type: string) {
        super(`Unknown message type: ${type}`);
        this.name = 'UnknownMessageTypeError';
    }
}

export class INVALID_HANDSHAKE extends Error {
    constructor(type: string) {
        super(`Invalid handshake: ${type}`);
        this.name = 'INVALID_HANDSHAKE';
    }
}

export class INVALID_FORMAT extends Error {
    constructor(type: string) {
        super(`Invalid format: ${type}`);
        this.name = 'INVALID_FORMAT';
    }
}