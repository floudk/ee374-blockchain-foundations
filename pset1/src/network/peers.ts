import fs from 'fs';
import * as path from 'path';

var peerFile: string;

export function setPeerFile(file: string) {
    peerFile = file;
}

export function getPeers(): string[] {
    if (!peerFile) {
        throw new Error('Peer file not set');
    }
    
    const dir = path.dirname(peerFile);

    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }

    if (!fs.existsSync(peerFile)) {
        fs.writeFileSync(peerFile, JSON.stringify({ peers: [] }));
        return [];
    }

    const data = fs.readFileSync(peerFile, 'utf8');
    const json = JSON.parse(data);

    return json.peers || [];
}

export function updatePeers(peers: string[]) {
    if (!peerFile) {
        throw new Error('Peer file not set');
    }

    let currentPeers = getPeers();
    let newPeers = peers.filter(peer => !currentPeers.includes(peer));

    if (newPeers.length === 0) {
        return;
    }

    currentPeers = currentPeers.concat(newPeers);

    const data = JSON.stringify({ peers: currentPeers }, null, 2);
    fs.writeFileSync(peerFile, data);
}