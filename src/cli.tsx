#!/usr/bin/env bun

import { Command } from 'commander';
import { render } from 'ink';
import { configCommand } from './commands/config.js';
import { App } from './components/App.js';

const program = new Command();

program.name('linear').description('Linear CLI - Manage issues from the terminal').version('0.1.0');

program.addCommand(configCommand);

program
  .command('mine')
  .description('My issues (current cycle)')
  .action(() => {
    if (process.stdin.isTTY) {
      render(<App defaultView="mine" />);
    } else {
      console.error('Interactive mode is only available in TTY environments.');
      process.exit(1);
    }
  });

program
  .command('mine-all')
  .description('All my issues')
  .action(() => {
    if (process.stdin.isTTY) {
      render(<App defaultView="mine-all" />);
    } else {
      console.error('Interactive mode is only available in TTY environments.');
      process.exit(1);
    }
  });

program
  .command('cycle')
  .description('Current cycle issues for the entire team')
  .action(() => {
    if (process.stdin.isTTY) {
      render(<App defaultView="cycle" />);
    } else {
      console.error('Interactive mode is only available in TTY environments.');
      process.exit(1);
    }
  });

program
  .command('create')
  .description('Create a new issue')
  .action(() => {
    if (process.stdin.isTTY) {
      render(<App defaultView="create-issue" />);
    } else {
      console.error('Interactive mode is only available in TTY environments.');
      process.exit(1);
    }
  });

program
  .command('search')
  .description('Search for issues')
  .action(() => {
    if (process.stdin.isTTY) {
      render(<App defaultView="search" />);
    } else {
      console.error('Interactive mode is only available in TTY environments.');
      process.exit(1);
    }
  });

if (process.argv.length === 2) {
  if (process.stdin.isTTY) {
    render(<App defaultView="mine" />);
  } else {
    console.log('Interactive mode is only available in TTY environments. Please specify a command.');
    program.outputHelp();
  }
} else {
  program.parse(process.argv);
}
