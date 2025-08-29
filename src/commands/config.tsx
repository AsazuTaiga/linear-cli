import { Command } from 'commander';
import { configService } from '../services/config.js';

export const configCommand = new Command('config')
  .description('設定関連のコマンド');

configCommand
  .command('set-token')
  .description('Linear APIトークンを設定')
  .argument('<token>', 'Linear APIトークン')
  .action(async (token: string) => {
    try {
      await configService.setApiToken(token);
      console.log('✅ Linear APIトークンを保存しました');
    } catch (error) {
      console.error('❌ トークンの保存に失敗しました:', error);
      process.exit(1);
    }
  });

configCommand
  .command('show')
  .description('現在の設定を表示')
  .action(async () => {
    const config = await configService.getConfig();
    if (config.apiToken) {
      console.log('Linear APIトークン: ****' + config.apiToken.slice(-4));
    } else {
      console.log('Linear APIトークンが設定されていません');
    }
  });