/**
 * GraphQL query parameter validator
 * Prevent missing SA/UA (Show Archived / Use Archived) filter arguments
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
 * Validate GraphQL query parameters
 */
export class GraphQLQueryValidator {
  /**
   * Extract defined parameters from query string
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
   * Check if parameter is actually used in query body
   */
  private static isParameterUsedInQuery(queryString: string, paramName: string): boolean {
    // Get body excluding query definition line
    const lines = queryString.split('\n');
    const queryBody = lines.slice(1).join('\n');

    // Check if parameter is used
    const regex = new RegExp(`\\$${paramName}\\b`, 'g');
    return regex.test(queryBody);
  }

  /**
   * Linear API specific validation rules
   */
  private static validateLinearAPIRules(info: GraphQLQueryInfo): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const definedParams = GraphQLQueryValidator.extractQueryParameters(info.queryString);

    // Rule 1: If filter parameter exists, includeArchived parameter is also required
    if (definedParams.has('filter')) {
      if (!definedParams.has('includeArchived')) {
        errors.push(
          `Query '${info.queryName}': $filter parameter is defined but $includeArchived parameter is not defined`,
        );
      }

      // Variable check
      if (info.variables && 'filter' in info.variables) {
        if (!('includeArchived' in info.variables)) {
          errors.push(
            `Query '${info.queryName}': filter variable is provided but includeArchived variable is not provided`,
          );
        }
      }
    }

    // Rule 2: Defined parameters should actually be used
    definedParams.forEach((_type, paramName) => {
      if (!GraphQLQueryValidator.isParameterUsedInQuery(info.queryString, paramName)) {
        warnings.push(
          `Query '${info.queryName}': $${paramName} parameter is defined but not used in the query`,
        );
      }
    });

    // Rule 3: Check includeArchived default value
    if (info.variables && 'includeArchived' in info.variables) {
      if (info.variables.includeArchived === undefined || info.variables.includeArchived === null) {
        warnings.push(
          `Query '${info.queryName}': includeArchived value is not explicitly set. Default value (false) is recommended`,
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
   * Validate GraphQL query and its variables
   */
  public static validate(info: GraphQLQueryInfo): ValidationResult {
    const result = GraphQLQueryValidator.validateLinearAPIRules(info);

    // Output warnings only in development environment
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
   * Strict validation that throws exception if there are validation errors
   */
  public static validateStrict(info: GraphQLQueryInfo): void {
    const result = GraphQLQueryValidator.validate(info);

    if (!result.valid) {
      throw new Error(`GraphQL Validation Failed:\n${result.errors.join('\n')}`);
    }
  }
}

/**
 * Helper function that wraps GraphQL query execution with automatic validation
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
    // Extract query name
    const queryNameMatch = query.match(/query\s+(\w+)/);
    const queryName = queryNameMatch ? queryNameMatch[1] : 'Unknown';

    // Execute validation
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

    // Execute original method
    return originalRawRequest(query, variables, requestHeaders);
  };

  return client;
}

/**
 * Default settings for Linear API
 */
export const LINEAR_GRAPHQL_DEFAULTS = {
  includeArchived: false,
  filter: {},
};

/**
 * Helper function to apply default values to query variables
 */
export function applyLinearDefaults(variables: Record<string, any>): Record<string, any> {
  return {
    ...LINEAR_GRAPHQL_DEFAULTS,
    ...variables,
    // If filter exists, ensure includeArchived is also set
    ...(variables.filter !== undefined && {
      includeArchived: variables.includeArchived ?? false,
    }),
  };
}
