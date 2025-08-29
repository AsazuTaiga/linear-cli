#!/usr/bin/env bun

import React from 'react';
import { render } from 'ink';
import { Command } from 'commander';
import { App } from './components/App.js';
import { issueCommand } from './commands/issue.js';
import { configCommand } from './commands/config.js';

const program = new Command();

program
  .name('linear')
  .description('Linear CLI - Issueの管理をターミナルから')
  .version('0.1.0');

program.addCommand(issueCommand);
program.addCommand(configCommand);

if (process.argv.length === 2) {
  if (process.stdin.isTTY) {
    render(<App />);
  } else {
    console.log('対話モードはTTY環境でのみ利用可能です。コマンドを指定してください。');
    program.outputHelp();
  }
} else {
  program.parse(process.argv);
}