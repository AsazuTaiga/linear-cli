import { Command } from 'commander';
import { configService } from '../services/config.js';
import { linearClient } from '../services/linear.js';

export const configCommand = new Command('config').description('Configuration-related commands');

configCommand
  .command('set-token')
  .description('Set Linear API token')
  .argument('<token>', 'Linear API token')
  .action(async (token: string) => {
    try {
      await configService.setApiToken(token);
      console.log('✅ Linear API token saved successfully');
    } catch (error) {
      console.error('❌ Failed to save token:', error);
      process.exit(1);
    }
  });

configCommand
  .command('show')
  .description('Show current configuration')
  .action(async () => {
    const config = await configService.getConfig();
    if (config.apiToken) {
      console.log(`Linear API Token: ****${config.apiToken.slice(-4)}`);
    } else {
      console.log('Linear API token is not configured');
    }
    if (config.defaultTeamId) {
      console.log(`Default Team ID: ${config.defaultTeamId}`);
    } else {
      console.log('Default team is not configured');
    }
  });

configCommand
  .command('set-team')
  .description('Set default team')
  .action(async () => {
    try {
      const teams = await linearClient.getTeams();
      if (teams.length === 0) {
        console.log('No teams found');
        return;
      }

      console.log('\nAvailable teams:');
      teams.forEach((team, index) => {
        console.log(`${index + 1}. ${team.name} (${team.key}) - ID: ${team.id}`);
      });

      // Simple implementation - make interactive later
      console.log('\nPlease specify a team ID: linear config set-team-id <team-id>');
    } catch (error) {
      console.error('❌ Failed to fetch teams:', error);
      process.exit(1);
    }
  });

configCommand
  .command('set-team-id')
  .description('Specify team ID or key (AME, OTH, etc.)')
  .argument('<teamIdOrKey>', 'Team ID or team key')
  .action(async (teamIdOrKey: string) => {
    try {
      // Check if it's in UUID format
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        teamIdOrKey,
      );

      let teamId = teamIdOrKey;

      // If not UUID, treat as team key and search for actual ID
      if (!isUuid) {
        const teams = await linearClient.getTeams();
        const team = teams.find((t) => t.key.toUpperCase() === teamIdOrKey.toUpperCase());

        if (!team) {
          console.error(`❌ Team key '${teamIdOrKey}' not found`);
          console.log('\nAvailable team keys:');
          teams.forEach((t) => {
            console.log(`  ${t.key} - ${t.name}`);
          });
          process.exit(1);
        }

        teamId = team.id;
        console.log(`📝 Selected team '${team.name}' (${team.key})`);
      }

      await configService.setDefaultTeam(teamId);
      console.log('✅ Default team configured successfully');
    } catch (error) {
      console.error('❌ Failed to configure team:', error);
      process.exit(1);
    }
  });
