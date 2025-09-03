#!/usr/bin/env bun

import { Command } from 'commander';
import { render } from 'ink';
import { configCommand } from './commands/config.js';
import { App } from './components/App.js';

const program = new Command();

program.name('linear').description('Linear CLI - Issueの管理をターミナルから').version('0.1.0');

program.addCommand(configCommand);

program
  .command('mine')
  .description('自分のIssue（現在のサイクル）')
  .action(() => {
    if (process.stdin.isTTY) {
      render(<App defaultView="mine" />);
    } else {
      console.error('対話モードはTTY環境でのみ利用可能です。');
      process.exit(1);
    }
  });

program
  .command('mine-all')
  .description('自分のすべてのIssue')
  .action(() => {
    if (process.stdin.isTTY) {
      render(<App defaultView="mine-all" />);
    } else {
      console.error('対話モードはTTY環境でのみ利用可能です。');
      process.exit(1);
    }
  });

program
  .command('cycle')
  .description('チーム全体の現在のサイクルIssue')
  .action(() => {
    if (process.stdin.isTTY) {
      render(<App defaultView="cycle" />);
    } else {
      console.error('対話モードはTTY環境でのみ利用可能です。');
      process.exit(1);
    }
  });

if (process.argv.length === 2) {
  if (process.stdin.isTTY) {
    render(<App defaultView="mine" />);
  } else {
    console.log('対話モードはTTY環境でのみ利用可能です。コマンドを指定してください。');
    program.outputHelp();
  }
} else {
  program.parse(process.argv);
}
