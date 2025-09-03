import { Command } from 'commander';
// import { IssueList } from '../components/IssueList.js';
import { linearClient } from '../services/linear.js';

export const issueCommand = new Command('issue').description('Issue-related commands');

issueCommand
  .command('list')
  .description('Display issue list')
  .option('-s, --status <status>', 'Filter by status (todo, in_progress, done)')
  .option('-a, --assignee <assignee>', 'Filter by assignee')
  .option('-p, --project <project>', 'Filter by project')
  .action(async (_options) => {
    const client = await linearClient.getClient();
    if (!client) {
      console.error(
        'Linear API token is not configured. Please run `linear config set-token`.',
      );
      process.exit(1);
    }

    // render(<IssueList options={options} />);
    console.log('Issue list feature is under development');
  });

issueCommand
  .command('create')
  .description('Create new issue')
  .requiredOption('-t, --title <title>', 'Issue title')
  .option('-d, --description <description>', 'Issue description')
  .option('-p, --project <project>', 'Project ID')
  .action(async (options) => {
    const client = await linearClient.getClient();
    if (!client) {
      console.error(
        'Linear API token is not configured. Please run `linear config set-token`.',
      );
      process.exit(1);
    }

    console.log('Creating issue...', options);
  });
