import { describe, expect, it, vi } from 'vitest';
import { linearClient } from '../linear';

// GraphQLクエリのフィルタ引数チェック用のテスト
describe('Linear GraphQL Query Filter Arguments', () => {
  describe('フィルタ引数の必須チェック', () => {
    // GraphQLクエリ文字列からパラメータを抽出するヘルパー関数
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

    // クエリ内でパラメータが使用されているか確認するヘルパー関数
    const isParameterUsedInQuery = (queryString: string, paramName: string): boolean => {
      // クエリ定義行を除いた部分で、$paramNameが使用されているかチェック
      const queryBody = queryString.split('\n').slice(1).join('\n');
      const regex = new RegExp(`\\$${paramName}\\b`, 'g');
      return regex.test(queryBody);
    };

    // すべてのGraphQLクエリをチェックするテスト
    it('すべてのクエリで$includeArchivedパラメータが宣言され、使用されていること', async () => {
      const sourceCode = await import('node:fs').then((fs) =>
        fs.promises.readFile('/Users/asazu/work/linear-cli/src/services/linear.ts', 'utf-8'),
      );

      // GraphQLクエリ文字列を抽出
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

        // $filterパラメータがある場合、$includeArchivedも必須
        if (parameters.includes('filter')) {
          if (!parameters.includes('includeArchived')) {
            errors.push(
              `Line ${lineNumber}: クエリに$filterがありますが、$includeArchivedパラメータがありません`,
            );
          } else {
            // $includeArchivedが宣言されているが使用されていない場合もチェック
            if (!isParameterUsedInQuery(query, 'includeArchived')) {
              errors.push(
                `Line ${lineNumber}: $includeArchivedパラメータが宣言されていますが、クエリ内で使用されていません`,
              );
            }
          }
        }
      });

      if (errors.length > 0) {
        throw new Error(`GraphQLクエリのパラメータエラー:\n${errors.join('\n')}`);
      }
    });

    it('rawRequestの呼び出しで必要なパラメータが渡されていること', async () => {
      const sourceCode = await import('node:fs').then((fs) =>
        fs.promises.readFile('/Users/asazu/work/linear-cli/src/services/linear.ts', 'utf-8'),
      );

      // rawRequest呼び出しを検索
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
        // filterが渡されている場合、includeArchivedも必須
        if (params.includes('filter')) {
          if (!params.includes('includeArchived')) {
            errors.push(
              `Line ${lineNumber}: rawRequestにfilterが渡されていますが、includeArchivedが渡されていません`,
            );
          }
        }
      });

      if (errors.length > 0) {
        throw new Error(`rawRequest呼び出しのパラメータエラー:\n${errors.join('\n')}`);
      }
    });
  });

  describe('実行時チェック', () => {
    it('getIssuesメソッドが適切なパラメータでGraphQLを呼び出すこと', async () => {
      const mockClient = {
        client: {
          rawRequest: vi.fn().mockResolvedValue({
            data: { issues: { nodes: [] } },
          }),
        },
      };

      // モックを設定
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

    it('getMyIssuesメソッドが適切なパラメータでGraphQLを呼び出すこと', async () => {
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

    it('getCycleIssuesメソッドが適切なパラメータでGraphQLを呼び出すこと', async () => {
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

      // configServiceのモック
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

// パラメータ検証用のヘルパー関数を別途エクスポート
export const validateGraphQLParameters = (
  queryString: string,
  variables: Record<string, any>,
): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  // クエリ文字列からパラメータを抽出
  const match = queryString.match(/query\s+\w+\s*\(([^)]+)\)/);
  if (!match) {
    return { valid: true, errors: [] };
  }

  const params = match[1];
  const requiredParams: string[] = [];

  // 必須パラメータを解析
  params.split(',').forEach((param) => {
    const paramMatch = param.trim().match(/\$(\w+):\s*([^,\s]+)(!)?/);
    if (paramMatch) {
      const [, paramName, , isRequired] = paramMatch;
      if (isRequired || paramName === 'includeArchived') {
        requiredParams.push(paramName);
      }
    }
  });

  // 必須パラメータの存在チェック
  requiredParams.forEach((param) => {
    if (!(param in variables)) {
      errors.push(`必須パラメータ '${param}' が提供されていません`);
    }
  });

  // filterがある場合、includeArchivedも必須
  if ('filter' in variables && !('includeArchived' in variables)) {
    errors.push('filterパラメータが提供されている場合、includeArchivedパラメータも必須です');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};
