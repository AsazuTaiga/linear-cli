import Conf from 'conf';

interface Config {
  apiToken?: string;
  defaultProjectId?: string;
  defaultTeamId?: string;
}

class ConfigService {
  private config: Conf<Config>;

  constructor() {
    this.config = new Conf<Config>({
      projectName: 'linear-cli',
      encryptionKey: 'linear-cli-encryption-key',
    });
  }

  async getConfig(): Promise<Config> {
    return {
      apiToken: this.config.get('apiToken'),
      defaultProjectId: this.config.get('defaultProjectId'),
      defaultTeamId: this.config.get('defaultTeamId'),
    };
  }

  async setApiToken(token: string): Promise<void> {
    this.config.set('apiToken', token);
  }

  async getApiToken(): Promise<string | undefined> {
    return this.config.get('apiToken');
  }

  async setDefaultProject(projectId: string): Promise<void> {
    this.config.set('defaultProjectId', projectId);
  }

  async setDefaultTeam(teamId: string): Promise<void> {
    this.config.set('defaultTeamId', teamId);
  }
}

export const configService = new ConfigService();