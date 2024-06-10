export function checkPortValid(port: number) {
    checkArgument(port > 0 && port < 65536, 'Invalid port number: '+port);
}

export function checkArgument(argument: boolean, desc: string) {
    if (!argument) {
        console.error(desc);
        process.exit(1);
    }
    return true;
}

