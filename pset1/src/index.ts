
import {checkPortValid} from './utils/connection';
import { loadConfig } from './utils/config';
import { getLogger } from './utils/logging';
import { Agent } from './agent';
import path from 'path';
import { fileURLToPath } from 'url';

const env = loadConfig('config.yaml');

const agentName = env.get('agentName');
const logger = getLogger(path.resolve(env.get('logDir'), `${agentName}.log`));
logger.info('Agent name: ' + agentName + ', version: ' + env.get('version') + ' started...');

const marabuAgent = new Agent(env, logger);


let resolveKeepAlive: () => void;

const keepAlive = new Promise<void>((resolve) => {
    resolveKeepAlive = resolve;
});

keepAlive.then(() => {
    logger.info('Agent stopped');
    marabuAgent.close();
    process.exit(0);
});

process.on('SIGINT', () => {
    logger.info('Received SIGINT, stopping agent...');
    resolveKeepAlive();
});