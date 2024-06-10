
import * as fs from 'fs';
import * as yaml from 'js-yaml';

export function readHostLists(yamlFile: string, ownHostName: string): string[] {
    const fileContents = fs.readFileSync(yamlFile, 'utf8');
    const data = yaml.load(fileContents);
    // console.log(data);
    // hosts:
    // - name: "host1"
    //     port: 24600
    // - name: "host2"
    //     port: 24601
    // - name: "host3"
    //     port: 24602

    // return hosts and ports that are not the same as the current host
    const hostLists = [];
    for (const host of data.hosts) {
        if (host.name !== ownHostName) {
            const ip = '127.0.0.1';
            const port = host.port;
            hostLists.push(ip + ':' + port);
        }
    }
    return hostLists;
}