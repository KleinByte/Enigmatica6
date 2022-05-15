// This script is responsible for relaying logs from the Minecraft server instance to the console.

const fsp = require('fs/promises');
const { spawn } = require('child_process');

const child = spawn(process.argv[2], [process.argv[3]], {shell: true});

let exit_code = 0;

child.stderr.on('data', (data) => {
    process.stdout.write(`${data}`);
});

const exits = [
    '[minecraft/DedicatedServer]: Done (',
    '[minecraft/MinecraftServer]: Exception stopping the server'
];

child.stdout.on('data', (data) => {
    const line = data.toString();
    process.stdout.write(line);

    // forge starting, at this point either serverstarter or instancesync made sure the kubejs common config exists.
    if(line.includes('[cp.mo.mo.Launcher/MODLAUNCHER]: ModLauncher running')) {
        fsp.readFile('kubejs/config/common.properties').then(data => {
            fsp.writeFile('kubejs/config/common.properties', data.toString().replace('debugInfo=false', 'debugInfo=true'))
        })
    }

    if(line.includes('[minecraft/DedicatedServer]: Done (')) {
        child.stdin.write("stop\n"); // fuck off node
    }

    exits.forEach((exit, code) => {
        if (line.includes(exit)) {
            child.kill(9);
            console.log(`nodejs: process.exit(${code})`);
            exit_code = code;
        }
    });
});

child.on('exit', (code, signal) => {
    console.log('child exited!');
});

child.on('close', (code, signal) => {
    console.log('child closed!');
    process.exit(exit_code);
});
