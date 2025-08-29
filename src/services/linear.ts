import { LinearClient } from '@linear/sdk';
import { configService } from './config.js';

class LinearService {
  private client: LinearClient | null = null;

  async getClient(): Promise<LinearClient | null> {
    if (this.client) {
      return this.client;
    }

    const apiToken = await configService.getApiToken();
    if (!apiToken) {
      return null;
    }

    this.client = new LinearClient({ apiKey: apiToken });
    return this.client;
  }

  async validateToken(token: string): Promise<boolean> {
    try {
      const testClient = new LinearClient({ apiKey: token });
      await testClient.viewer;
      return true;
    } catch {
      return false;
    }
  }

  async getIssues(options?: {
    status?: string;
    assigneeId?: string;
    projectId?: string;
  }) {
    const client = await this.getClient();
    if (!client) {
      throw new Error('Linear client not initialized');
    }

    const filter: any = {};
    
    if (options?.status) {
      filter.state = { name: { eq: options.status } };
    }
    
    if (options?.assigneeId) {
      filter.assignee = { id: { eq: options.assigneeId } };
    }
    
    if (options?.projectId) {
      filter.project = { id: { eq: options.projectId } };
    }

    const issues = await client.issues({
      filter,
      includeArchived: false,
    });

    return issues.nodes;
  }

  async createIssue(data: {
    title: string;
    description?: string;
    projectId?: string;
    teamId?: string;
  }) {
    const client = await this.getClient();
    if (!client) {
      throw new Error('Linear client not initialized');
    }

    const config = await configService.getConfig();
    const teamId = data.teamId || config.defaultTeamId;
    
    if (!teamId) {
      throw new Error('Team ID is required');
    }

    return await client.createIssue({
      title: data.title,
      description: data.description,
      projectId: data.projectId || config.defaultProjectId,
      teamId,
    });
  }
}

export const linearClient = new LinearService();