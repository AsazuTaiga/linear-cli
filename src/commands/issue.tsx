import { Command } from 'commander';
import React from 'react';
import { render } from 'ink';
// import { IssueList } from '../components/IssueList.js';
import { linearClient } from '../services/linear.js';

export const issueCommand = new Command('issue')
  .description('Issue関連のコマンド');

issueCommand
  .command('list')
  .description('Issue一覧を表示')
  .option('-s, --status <status>', 'ステータスでフィルタ (todo, in_progress, done)')
  .option('-a, --assignee <assignee>', '担当者でフィルタ')
  .option('-p, --project <project>', 'プロジェクトでフィルタ')
  .action(async (options) => {
    const client = await linearClient.getClient();
    if (!client) {
      console.error('Linear APIトークンが設定されていません。`linear config set-token`を実行してください。');
      process.exit(1);
    }

    // render(<IssueList options={options} />);
    console.log('Issue list機能は準備中です');
  });

issueCommand
  .command('create')
  .description('新しいIssueを作成')
  .requiredOption('-t, --title <title>', 'Issueのタイトル')
  .option('-d, --description <description>', 'Issueの説明')
  .option('-p, --project <project>', 'プロジェクトID')
  .action(async (options) => {
    const client = await linearClient.getClient();
    if (!client) {
      console.error('Linear APIトークンが設定されていません。`linear config set-token`を実行してください。');
      process.exit(1);
    }

    console.log('Issue作成中...', options);
  });