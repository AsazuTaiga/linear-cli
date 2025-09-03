import { describe, expect, it, vi } from 'vitest';
import { linearClient } from '../linear';

// Test for GraphQL query filter arguments check
describe('Linear GraphQL Query Filter Arguments', () => {
  describe('Required filter argument checks', () => {
    // Helper function to extract parameters from GraphQL query string
    const extractQueryParameters = (queryString: string): string[] => {
      const match = queryString.match(/query\s+\w+\s*\(([^)]+)\)/);
      if (!match) return [];

      const params = match[1];
      const paramNames = params
        .split(',')
        .map((param) => {
          const paramMatch = param.trim().match(/\$(\w+):/);
          return paramMatch ? paramMatch[1] : null;
        })
        .filter(Boolean) as string[];

      return paramNames;
    };

    // Helper function to check if parameter is used in query
    const isParameterUsedInQuery = (queryString: string, paramName: string): boolean => {
      // Check if $paramName is used in query body excluding definition line
      const queryBody = queryString.split('\n').slice(1).join('\n');
      const regex = new RegExp(`\\$${paramName}\\b`, 'g');
      return regex.test(queryBody);
    };

    // Test to check all GraphQL queries
    it('should declare and use $includeArchived parameter in all queries', async () => {
      const sourceCode = await import('node:fs').then((fs) =>
        fs.promises.readFile('/Users/asazu/work/linear-cli/src/services/linear.ts', 'utf-8'),
      );

      // Extract GraphQL query strings
      const queryRegex = /const query = `([^`]+)`/g;
      const queries: { query: string; lineNumber: number }[] = [];
      let match;

      while ((match = queryRegex.exec(sourceCode)) !== null) {
        const lines = sourceCode.substring(0, match.index).split('\n');
        queries.push({
          query: match[1],
          lineNumber: lines.length,
        });
      }

      const errors: string[] = [];

      queries.forEach(({ query, lineNumber }) => {
        const parameters = extractQueryParameters(query);

        // If $filter parameter exists, $includeArchived is also required
        if (parameters.includes('filter')) {
          if (!parameters.includes('includeArchived')) {
            errors.push(
              `Line ${lineNumber}: Query has $filter but missing $includeArchived parameter`,
            );
          } else {
            // Also check if $includeArchived is declared but not used
            if (!isParameterUsedInQuery(query, 'includeArchived')) {
              errors.push(
                `Line ${lineNumber}: $includeArchived parameter is declared but not used in query`,
              );
            }
          }
        }
      });

      if (errors.length > 0) {
        throw new Error(`GraphQL query parameter errors:\n${errors.join('\n')}`);
      }
    });

    it('should pass required parameters in rawRequest calls', async () => {
      const sourceCode = await import('node:fs').then((fs) =>
        fs.promises.readFile('/Users/asazu/work/linear-cli/src/services/linear.ts', 'utf-8'),
      );

      // Search for rawRequest calls
      const rawRequestRegex = /rawRequest[^(]*\([^,]+,\s*\{([^}]+)\}/g;
      const calls: { params: string; lineNumber: number }[] = [];
      let match;

      while ((match = rawRequestRegex.exec(sourceCode)) !== null) {
        const lines = sourceCode.substring(0, match.index).split('\n');
        calls.push({
          params: match[1],
          lineNumber: lines.length,
        });
      }

      const errors: string[] = [];

      calls.forEach(({ params, lineNumber }) => {
        // If filter is passed, includeArchived is also required
        if (params.includes('filter')) {
          if (!params.includes('includeArchived')) {
            errors.push(
              `Line ${lineNumber}: rawRequest has filter but missing includeArchived`,
            );
          }
        }
      });

      if (errors.length > 0) {
        throw new Error(`rawRequest call parameter errors:\n${errors.join('\n')}`);
      }
    });
  });

  describe('Runtime checks', () => {
    it('getIssues method should call GraphQL with proper parameters', async () => {
      const mockClient = {
        client: {
          rawRequest: vi.fn().mockResolvedValue({
            data: { issues: { nodes: [] } },
          }),
        },
      };

      // Set up mocks
      vi.spyOn(linearClient, 'getClient').mockResolvedValue(mockClient as any);

      await linearClient.getIssues({ status: 'In Progress' });

      expect(mockClient.client.rawRequest).toHaveBeenCalledWith(
        expect.stringContaining('$includeArchived'),
        expect.objectContaining({
          filter: expect.any(Object),
          includeArchived: false,
        }),
      );
    });

    it('getMyIssues method should call GraphQL with proper parameters', async () => {
      const mockClient = {
        viewer: { id: 'user-123' },
        client: {
          rawRequest: vi.fn().mockResolvedValue({
            data: {
              viewer: { id: 'user-123' },
              issues: { nodes: [] },
            },
          }),
        },
      };

      vi.spyOn(linearClient, 'getClient').mockResolvedValue(mockClient as any);

      await linearClient.getMyIssues({ includeCompleted: false });

      expect(mockClient.client.rawRequest).toHaveBeenCalledWith(
        expect.stringContaining('$includeArchived'),
        expect.objectContaining({
          filter: expect.any(Object),
          includeArchived: false,
        }),
      );
    });

    it('getCycleIssues method should call GraphQL with proper parameters', async () => {
      const mockClient = {
        client: {
          rawRequest: vi.fn().mockResolvedValue({
            data: { issues: { nodes: [] } },
          }),
        },
        team: vi.fn().mockResolvedValue({
          activeCycle: {
            id: 'cycle-123',
            name: 'Sprint 1',
            number: 1,
            startsAt: '2024-01-01',
            endsAt: '2024-01-14',
          },
        }),
      };

      vi.spyOn(linearClient, 'getClient').mockResolvedValue(mockClient as any);

      // Mock configService
      const { configService } = await import('../config');
      vi.spyOn(configService, 'getConfig').mockResolvedValue({
        apiToken: 'test-token',
        defaultTeamId: 'team-123',
      } as any);

      await linearClient.getCycleIssues();

      expect(mockClient.client.rawRequest).toHaveBeenCalledWith(
        expect.stringContaining('$includeArchived'),
        expect.objectContaining({
          filter: expect.any(Object),
          includeArchived: false,
        }),
      );
    });
  });
});

// Export helper function for parameter validation
export const validateGraphQLParameters = (
  queryString: string,
  variables: Record<string, any>,
): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  // Extract parameters from query string
  const match = queryString.match(/query\s+\w+\s*\(([^)]+)\)/);
  if (!match) {
    return { valid: true, errors: [] };
  }

  const params = match[1];
  const requiredParams: string[] = [];

  // Parse required parameters
  params.split(',').forEach((param) => {
    const paramMatch = param.trim().match(/\$(\w+):\s*([^,\s]+)(!)?/);
    if (paramMatch) {
      const [, paramName, , isRequired] = paramMatch;
      if (isRequired || paramName === 'includeArchived') {
        requiredParams.push(paramName);
      }
    }
  });

  // Check existence of required parameters
  requiredParams.forEach((param) => {
    if (!(param in variables)) {
      errors.push(`Required parameter '${param}' is not provided`);
    }
  });

  // If filter exists, includeArchived is also required
  if ('filter' in variables && !('includeArchived' in variables)) {
    errors.push('When filter parameter is provided, includeArchived parameter is also required');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};
