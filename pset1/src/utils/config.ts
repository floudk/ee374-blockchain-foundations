
import * as fs from 'fs';
import * as yaml from 'js-yaml';

export function loadConfig(yamlFile: string): Map<string, any> {
    const fileContents = fs.readFileSync(yamlFile, 'utf8');
    const data = yaml.load(fileContents);
    const env = new Map<string, any>();
    // console.log(data);
    env.set("bootstrapFile", data.bootstraps);
    env.set("agentName", data.agent.name);
    env.set("version", data.agent.version);
    env.set("logDir", data.logdir);
    env.set("port", data.agent.port);

    env.set("bootstrapServers", data.bootstraps);
    env.set("peerfile", data.peerfile);

    // console.log(env);
    return env;
}
