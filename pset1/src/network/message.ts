import { canonicalize } from 'json-canonicalize';
import { INVALID_FORMAT } from '../error';

interface Message{
    type: string;
    [key: string]: any;
}


export function createMessage(type: string, data: any): string {
    var msg: Message = {
        type,
        ...data
    };
    return canonicalize(msg)
}


export function decodeFromCanonicalizeJson(data: string): Message {
    try {
        // console.log('Decoding:', data);
        return JSON.parse(data) as Message;
    } catch (error) {
        throw new INVALID_FORMAT('Invalid JSON');
    }
}