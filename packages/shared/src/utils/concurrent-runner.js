#!/usr/bin/env node
/**
 * Lightweight concurrent workspace runner for EquiWage Analytics Monorepo.
 * Runs @equiwage/backend and @equiwage/frontend in parallel with colored output prefixes.
 */
import { spawn } from 'node:child_process';

const isWindows = process.platform === 'win32';
const npmCmd = isWindows ? 'npm.cmd' : 'npm';

const tasks = [
  {
    name: 'BACKEND',
    color: '\x1b[36m', // Cyan
    args: ['run', 'dev', '--workspace=@equiwage/backend'],
  },
  {
    name: 'FRONTEND',
    color: '\x1b[33m', // Orange/Yellow
    args: ['run', 'dev', '--workspace=@equiwage/frontend'],
  },
];

const resetColor = '\x1b[0m';
const children = [];

function prefixStream(stream, prefix, target) {
  let buffer = '';
  stream.on('data', (chunk) => {
    buffer += chunk.toString();
    const lines = buffer.split(/\r?\n/);
    buffer = lines.pop() ?? '';
    for (const line of lines) {
      target.write(`${prefix} ${line}\n`);
    }
  });
  stream.on('end', () => {
    if (buffer.length > 0) {
      target.write(`${prefix} ${buffer}\n`);
    }
  });
}

for (const task of tasks) {
  const prefix = `${task.color}[${task.name}]${resetColor}`;
  const child = spawn(npmCmd, task.args, {
    stdio: ['inherit', 'pipe', 'pipe'],
    shell: isWindows,
    env: { ...process.env, FORCE_COLOR: '1' },
  });

  prefixStream(child.stdout, prefix, process.stdout);
  prefixStream(child.stderr, prefix, process.stderr);

  child.on('exit', (code) => {
    if (code && code !== 0) {
      console.error(`${prefix} exited with code ${code}`);
    }
  });

  children.push(child);
}

function shutdown() {
  for (const child of children) {
    if (!child.killed) {
      child.kill('SIGINT');
    }
  }
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
