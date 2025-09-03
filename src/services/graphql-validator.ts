/**
 * GraphQLクエリのパラメータバリデーター
 * SA/UA（Show Archived / Use Archived）フィルタの引数忘れを防止
 */

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

interface GraphQLQueryInfo {
  queryName: string;
  queryString: string;
  variables: Record<string, any>;
}

/**
 * GraphQLクエリのパラメータを検証する
 */
export class GraphQLQueryValidator {
  /**
   * クエリ文字列から定義されているパラメータを抽出
   */
  private static extractQueryParameters(queryString: string): Map<string, string> {
    const params = new Map<string, string>();
    const match = queryString.match(/query\s+\w+\s*\(([^)]+)\)/);

    if (!match) return params;

    const paramList = match[1];
    const paramRegex = /\$(\w+):\s*([^,\s]+)(!)?/g;
    let paramMatch;

    while ((paramMatch = paramRegex.exec(paramList)) !== null) {
      const [, paramName, paramType, isRequired] = paramMatch;
      params.set(paramName, paramType + (isRequired || ''));
    }

    return params;
  }

  /**
   * クエリ本文でパラメータが実際に使用されているかチェック
   */
  private static isParameterUsedInQuery(queryString: string, paramName: string): boolean {
    // クエリ定義行を除いた本文を取得
    const lines = queryString.split('\n');
    const queryBody = lines.slice(1).join('\n');

    // パラメータが使用されているかチェック
    const regex = new RegExp(`\\$${paramName}\\b`, 'g');
    return regex.test(queryBody);
  }

  /**
   * Linear API特有のバリデーションルール
   */
  private static validateLinearAPIRules(info: GraphQLQueryInfo): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const definedParams = GraphQLQueryValidator.extractQueryParameters(info.queryString);

    // ルール1: filterパラメータがある場合、includeArchivedパラメータも必須
    if (definedParams.has('filter')) {
      if (!definedParams.has('includeArchived')) {
        errors.push(
          `クエリ '${info.queryName}': $filterパラメータが定義されていますが、$includeArchivedパラメータが定義されていません`,
        );
      }

      // 変数チェック
      if (info.variables && 'filter' in info.variables) {
        if (!('includeArchived' in info.variables)) {
          errors.push(
            `クエリ '${info.queryName}': filter変数が提供されていますが、includeArchived変数が提供されていません`,
          );
        }
      }
    }

    // ルール2: 定義されたパラメータは実際に使用されているべき
    definedParams.forEach((_type, paramName) => {
      if (!GraphQLQueryValidator.isParameterUsedInQuery(info.queryString, paramName)) {
        warnings.push(
          `クエリ '${info.queryName}': $${paramName}パラメータが定義されていますが、クエリ内で使用されていません`,
        );
      }
    });

    // ルール3: includeArchivedのデフォルト値チェック
    if (info.variables && 'includeArchived' in info.variables) {
      if (info.variables.includeArchived === undefined || info.variables.includeArchived === null) {
        warnings.push(
          `クエリ '${info.queryName}': includeArchivedの値が明示的に設定されていません。デフォルト値(false)を推奨します`,
        );
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * GraphQLクエリとその変数を検証
   */
  public static validate(info: GraphQLQueryInfo): ValidationResult {
    const result = GraphQLQueryValidator.validateLinearAPIRules(info);

    // 開発環境でのみ警告を出力
    if (process.env.NODE_ENV === 'development') {
      if (result.errors.length > 0) {
        console.error('GraphQL Validation Errors:', result.errors);
      }
      if (result.warnings.length > 0) {
        console.warn('GraphQL Validation Warnings:', result.warnings);
      }
    }

    return result;
  }

  /**
   * 検証エラーがある場合は例外を投げる厳密な検証
   */
  public static validateStrict(info: GraphQLQueryInfo): void {
    const result = GraphQLQueryValidator.validate(info);

    if (!result.valid) {
      throw new Error(`GraphQL Validation Failed:\n${result.errors.join('\n')}`);
    }
  }
}

/**
 * GraphQLクエリの実行をラップして自動的に検証を行うヘルパー関数
 */
export function createValidatedGraphQLClient<T extends { rawRequest: Function }>(
  client: T,
  options?: { strict?: boolean },
): T {
  const originalRawRequest = client.rawRequest.bind(client);

  client.rawRequest = async (
    query: string,
    variables?: Record<string, any>,
    requestHeaders?: Record<string, string>,
  ) => {
    // クエリ名を抽出
    const queryNameMatch = query.match(/query\s+(\w+)/);
    const queryName = queryNameMatch ? queryNameMatch[1] : 'Unknown';

    // バリデーション実行
    const validationInfo: GraphQLQueryInfo = {
      queryName,
      queryString: query,
      variables: variables || {},
    };

    if (options?.strict) {
      GraphQLQueryValidator.validateStrict(validationInfo);
    } else {
      GraphQLQueryValidator.validate(validationInfo);
    }

    // オリジナルのメソッドを実行
    return originalRawRequest(query, variables, requestHeaders);
  };

  return client;
}

/**
 * デフォルトのLinear API用設定
 */
export const LINEAR_GRAPHQL_DEFAULTS = {
  includeArchived: false,
  filter: {},
};

/**
 * クエリ変数にデフォルト値を適用するヘルパー関数
 */
export function applyLinearDefaults(variables: Record<string, any>): Record<string, any> {
  return {
    ...LINEAR_GRAPHQL_DEFAULTS,
    ...variables,
    // filterが存在する場合、includeArchivedも確実に設定
    ...(variables.filter !== undefined && {
      includeArchived: variables.includeArchived ?? false,
    }),
  };
}
