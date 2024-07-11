import { canonicalize } from 'json-canonicalize';

interface Message{
    type: string;
    [key: string]: any;
}

export function createHelloMessage(agent: string): string {
    var msg: Message = {
        type: 'hello',
        version: '1.0',
        agent
    };
    return canonicalize(msg)
}

export function createErrorMessage(name: string, description: string): string {
    var msg: Message = {
        type: 'error',
        name,
        description
    };
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