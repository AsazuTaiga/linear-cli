import { LinearClient, LinearGraphQLClient } from '@linear/sdk';
import { configService } from './config.js';
import { cacheService } from './cache.js';
import { GraphQLQueryValidator, applyLinearDefaults } from './graphql-validator.js';

interface IssueNode {
  id: string;
  identifier: string;
  title: string;
  description?: string;
  priority?: number;
  url: string;
  createdAt: string;
  updatedAt: string;
  state: {
    id: string;
    name: string;
    type: string;
    color: string;
  };
  assignee?: {
    id: string;
    name: string;
    displayName: string;
    email: string;
    avatarUrl?: string;
  };
  cycle?: {
    id: string;
    name: string;
    number: number;
    startsAt: string;
    endsAt: string;
  };
  attachments?: {
    nodes: Array<{
      id: string;
      title?: string;
      url: string;
      sourceType?: string;
    }>;
  };
}

interface IssuesResponse {
  issues: {
    nodes: IssueNode[];
  };
}

interface ViewerIssuesResponse {
  viewer: {
    id: string;
  };
  issues: {
    nodes: IssueNode[];
  };
}

interface Cycle {
  id: string;
  name: string;
  number: number;
  startsAt: string;
  endsAt: string;
}

class LinearService {
  private cycleCache: Cycle | null = null;
  private cycleCacheTimestamp: number = 0;
  private cycleCacheTTL = 10 * 60 * 1000; // 10分
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
  }): Promise<IssueNode[]> {
    const client = await this.getClient();
    if (!client) {
      throw new Error('Linear client not initialized');
    }

    const filter: Record<string, any> = {};
    
    if (options?.status) {
      filter.state = { name: { eq: options.status } };
    }
    
    if (options?.assigneeId) {
      filter.assignee = { id: { eq: options.assigneeId } };
    }
    
    if (options?.projectId) {
      filter.project = { id: { eq: options.projectId } };
    }

    const query = `
      query GetIssues($filter: IssueFilter, $includeArchived: Boolean) {
        issues(filter: $filter, includeArchived: $includeArchived) {
          nodes {
            id
            identifier
            title
            description
            priority
            url
            createdAt
            updatedAt
            state {
              id
              name
              type
              color
            }
            assignee {
              id
              name
              displayName
              email
              avatarUrl
            }
            cycle {
              id
              name
              number
              startsAt
              endsAt
            }
            attachments {
              nodes {
                id
                title
                url
                sourceType
              }
            }
          }
        }
      }
    `;

    const graphQLClient: LinearGraphQLClient = client.client;
    
    // GraphQLパラメータの検証
    const variables = applyLinearDefaults({ filter });
    GraphQLQueryValidator.validate({
      queryName: 'GetIssues',
      queryString: query,
      variables
    });
    
    const response = await graphQLClient.rawRequest<IssuesResponse, Record<string, any>>(query, variables);

    if (!response.data) {
      throw new Error('Failed to fetch issues');
    }

    return response.data.issues.nodes;
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
  }): Promise<IssueNode[]> {
    const cacheKey = `my-issues-${options?.inCurrentCycle ? 'cycle' : 'all'}-${options?.includeCompleted ? 'with-completed' : 'no-completed'}`;
    const cached = cacheService.get<IssueNode[]>(cacheKey);
    if (cached) {
      return cached;
    }

    const client = await this.getClient();
    if (!client) {
      throw new Error('Linear client not initialized');
    }

    const query = `
      query GetMyIssues($filter: IssueFilter, $includeArchived: Boolean) {
        viewer {
          id
        }
        issues(filter: $filter, includeArchived: $includeArchived) {
          nodes {
            id
            identifier
            title
            description
            priority
            url
            createdAt
            updatedAt
            state {
              id
              name
              type
              color
            }
            assignee {
              id
              name
              displayName
              email
              avatarUrl
            }
            cycle {
              id
              name
              number
              startsAt
              endsAt
            }
            attachments {
              nodes {
                id
                title
                url
                sourceType
              }
            }
          }
        }
      }
    `;

    const viewerResponse = await client.viewer;
    const filter: Record<string, any> = {
      assignee: { id: { eq: viewerResponse.id } },
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

    const graphQLClient: LinearGraphQLClient = client.client;
    
    // GraphQLパラメータの検証
    const variables = applyLinearDefaults({ filter });
    GraphQLQueryValidator.validate({
      queryName: 'GetMyIssues',
      queryString: query,
      variables
    });
    
    const response = await graphQLClient.rawRequest<ViewerIssuesResponse, Record<string, any>>(query, variables);

    if (!response.data) {
      throw new Error('Failed to fetch issues');
    }

    const issues = response.data.issues.nodes;
    cacheService.set(cacheKey, issues);
    return issues;
  }

  async getCurrentCycle(): Promise<Cycle | null> {
    const cacheKey = 'current-cycle';
    const cached = cacheService.get<Cycle>(cacheKey);
    if (cached) {
      return cached;
    }

    const client = await this.getClient();
    if (!client) {
      throw new Error('Linear client not initialized');
    }

    const config = await configService.getConfig();
    const teamId = config.defaultTeamId;
    
    // 現在の日付を取得
    const now = new Date();

    let cycle: Cycle | null = null;
    if (!teamId) {
      const teams = await client.teams();
      if (teams.nodes.length > 0) {
        const team = teams.nodes[0];
        // activeCycleを使用
        const activeCycle = await team.activeCycle;
        if (activeCycle) {
          cycle = {
            id: activeCycle.id,
            name: activeCycle.name || '',
            number: activeCycle.number,
            startsAt: activeCycle.startsAt instanceof Date ? activeCycle.startsAt.toISOString() : activeCycle.startsAt,
            endsAt: activeCycle.endsAt instanceof Date ? activeCycle.endsAt.toISOString() : activeCycle.endsAt,
          };
        }
      }
    } else {
      const team = await client.team(teamId);
      // activeCycleを使用
      const activeCycle = await team.activeCycle;
      if (activeCycle) {
        cycle = {
          id: activeCycle.id,
          name: activeCycle.name || '',
          number: activeCycle.number,
          startsAt: activeCycle.startsAt instanceof Date ? activeCycle.startsAt.toISOString() : activeCycle.startsAt,
          endsAt: activeCycle.endsAt instanceof Date ? activeCycle.endsAt.toISOString() : activeCycle.endsAt,
        };
      }
    }

    if (cycle) {
      cacheService.set(cacheKey, cycle, 10 * 60 * 1000); // 10分キャッシュ
    }
    return cycle;
  }

  async getCycleIssues(): Promise<IssueNode[]> {
    const cacheKey = 'cycle-issues';
    const cached = cacheService.get<IssueNode[]>(cacheKey);
    if (cached) {
      return cached;
    }

    const client = await this.getClient();
    if (!client) {
      throw new Error('Linear client not initialized');
    }

    const currentCycle = await this.getCurrentCycle();
    if (!currentCycle) {
      return [];
    }

    const query = `
      query GetCycleIssues($filter: IssueFilter, $includeArchived: Boolean) {
        issues(filter: $filter, includeArchived: $includeArchived) {
          nodes {
            id
            identifier
            title
            description
            priority
            url
            createdAt
            updatedAt
            state {
              id
              name
              type
              color
            }
            assignee {
              id
              name
              displayName
              email
              avatarUrl
            }
            cycle {
              id
              name
              number
              startsAt
              endsAt
            }
            attachments {
              nodes {
                id
                title
                url
                sourceType
              }
            }
          }
        }
      }
    `;

    const graphQLClient: LinearGraphQLClient = client.client;
    
    // GraphQLパラメータの検証
    const variables = applyLinearDefaults({
      filter: {
        cycle: { id: { eq: currentCycle.id } }
      }
    });
    GraphQLQueryValidator.validate({
      queryName: 'GetCycleIssues',
      queryString: query,
      variables
    });
    
    const response = await graphQLClient.rawRequest<IssuesResponse, Record<string, any>>(query, variables);

    if (!response.data) {
      throw new Error('Failed to fetch cycle issues');
    }

    const issues = response.data.issues.nodes;
    cacheService.set(cacheKey, issues);
    return issues;
  }

  async searchIssues(query: string) {
    const client = await this.getClient();
    if (!client) {
      throw new Error('Linear client not initialized');
    }

    const searchResults = await client.searchIssues(query);
    return searchResults.nodes;
  }

  async getTeams() {
    const client = await this.getClient();
    if (!client) {
      throw new Error('Linear client not initialized');
    }

    const teams = await client.teams();
    return teams.nodes;
  }
}

export const linearClient = new LinearService();