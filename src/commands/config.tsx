import { Command } from 'commander';
import { configService } from '../services/config.js';
import { linearClient } from '../services/linear.js';

export const configCommand = new Command('config').description('設定関連のコマンド');

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
      console.log(`Linear APIトークン: ****${config.apiToken.slice(-4)}`);
    } else {
      console.log('Linear APIトークンが設定されていません');
    }
    if (config.defaultTeamId) {
      console.log(`デフォルトチームID: ${config.defaultTeamId}`);
    } else {
      console.log('デフォルトチームが設定されていません');
    }
  });

configCommand
  .command('set-team')
  .description('デフォルトチームを設定')
  .action(async () => {
    try {
      const teams = await linearClient.getTeams();
      if (teams.length === 0) {
        console.log('チームが見つかりませんでした');
        return;
      }

      console.log('\n利用可能なチーム:');
      teams.forEach((team, index) => {
        console.log(`${index + 1}. ${team.name} (${team.key}) - ID: ${team.id}`);
      });

      // 簡易的な実装 - 後でインタラクティブにする
      console.log('\nチームIDを指定してください: linear config set-team-id <team-id>');
    } catch (error) {
      console.error('❌ チーム一覧の取得に失敗しました:', error);
      process.exit(1);
    }
  });

configCommand
  .command('set-team-id')
  .description('チームIDまたはキー（AME, OTH等）を指定')
  .argument('<teamIdOrKey>', 'チームIDまたはチームキー')
  .action(async (teamIdOrKey: string) => {
    try {
      // UUID形式かチェック
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        teamIdOrKey,
      );

      let teamId = teamIdOrKey;

      // UUIDでない場合は、チームキーとして扱い、実際のIDを検索
      if (!isUuid) {
        const teams = await linearClient.getTeams();
        const team = teams.find((t) => t.key.toUpperCase() === teamIdOrKey.toUpperCase());

        if (!team) {
          console.error(`❌ チームキー '${teamIdOrKey}' が見つかりませんでした`);
          console.log('\n利用可能なチームキー:');
          teams.forEach((t) => {
            console.log(`  ${t.key} - ${t.name}`);
          });
          process.exit(1);
        }

        teamId = team.id;
        console.log(`📝 チーム '${team.name}' (${team.key}) を選択しました`);
      }

      await configService.setDefaultTeam(teamId);
      console.log('✅ デフォルトチームを設定しました');
    } catch (error) {
      console.error('❌ チームの設定に失敗しました:', error);
      process.exit(1);
    }
  });
