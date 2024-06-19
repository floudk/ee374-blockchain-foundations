import { canonicalize } from 'json-canonicalize';

export interface HelloMessage {
    type: 'hello';
    nodeName: string;
}

export interface ErrorMessage {
    type: 'error';
    sendNode: string;
    error: string;
}

export interface TestMessage {
    type: 'test';
    test: string;
    data: string;
}

export type Message = HelloMessage | ErrorMessage;


export function encodeToCanonicalizeJson(msg:Message): string {
    return canonicalize(msg)
}

export function decodeFromCanonicalizeJson(data: string): Message {
    try {
        return JSON.parse(data) as Message;
    } catch (error) {
        console.error('Error parsing JSON:', error);
        throw error;
    }
}