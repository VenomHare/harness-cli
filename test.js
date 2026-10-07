import { exec as execCallback } from 'node:child_process';
import { promisify } from 'node:util';
const exec = promisify(execCallback);
const { stdout, stderr } = await exec(String("ls -R"));
if (stderr) {
    throw stderr
}
console.log("hello world");