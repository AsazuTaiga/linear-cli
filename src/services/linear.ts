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

  async getMyIssues(options?: {
    inCurrentCycle?: boolean;
    includeCompleted?: boolean;
  }) {
    const client = await this.getClient();
    if (!client) {
      throw new Error('Linear client not initialized');
    }

    const viewer = await client.viewer;
    const filter: any = {
      assignee: { id: { eq: viewer.id } },
    };

    if (!options?.includeCompleted) {
      filter.state = { type: { neq: 'completed' } };
    }

    if (options?.inCurrentCycle) {
      const currentCycle = await this.getCurrentCycle();
      if (currentCycle) {
        filter.cycle = { id: { eq: currentCycle.id } };
      }
    }

    const issues = await client.issues({
      filter,
      includeArchived: false,
    });

    return issues.nodes;
  }

  async getCurrentCycle() {
    const client = await this.getClient();
    if (!client) {
      throw new Error('Linear client not initialized');
    }

    const config = await configService.getConfig();
    const teamId = config.defaultTeamId;

    if (!teamId) {
      const teams = await client.teams();
      if (teams.nodes.length > 0) {
        const team = teams.nodes[0];
        const cycles = await team.cycles({
          filter: { isActive: { eq: true } }
        });
        return cycles.nodes[0];
      }
      return null;
    }

    const team = await client.team(teamId);
    const cycles = await team.cycles({
      filter: { isActive: { eq: true } }
    });
    
    return cycles.nodes[0];
  }

  async getCycleIssues() {
    const client = await this.getClient();
    if (!client) {
      throw new Error('Linear client not initialized');
    }

    const currentCycle = await this.getCurrentCycle();
    if (!currentCycle) {
      return [];
    }

    const issues = await client.issues({
      filter: {
        cycle: { id: { eq: currentCycle.id } }
      },
      includeArchived: false,
    });

    return issues.nodes;
  }

  async searchIssues(query: string) {
    const client = await this.getClient();
    if (!client) {
      throw new Error('Linear client not initialized');
    }

    const searchResults = await client.searchIssues(query);
    return searchResults.nodes;
  }
}

export const linearClient = new LinearService();