/**
 * ESLint custom rule: Linear GraphQL API filter argument check
 * 
 * This rule checks:
 * 1. If GraphQL query has $filter parameter, $includeArchived parameter is also required
 * 2. When passing filter in rawRequest call, includeArchived is also required
 */

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Required check for Linear GraphQL API filter arguments',
      category: 'Possible Errors',
      recommended: true
    },
    fixable: 'code',
    schema: [],
    messages: {
      missingIncludeArchivedInQuery: 'GraphQL query has $filter but missing $includeArchived parameter definition',
      missingIncludeArchivedInCall: 'rawRequest call has filter but missing includeArchived',
      unusedParameter: 'Parameter "{{param}}" is defined but not used in the query'
    }
  },

  create(context) {
    // Store GraphQL query strings
    const graphqlQueries = new Map();

    return {
      // Detect GraphQL queries in template literals
      TemplateLiteral(node) {
        const parent = node.parent;
        
        // Detect const query = `...` pattern
        if (parent && parent.type === 'VariableDeclarator' && 
            parent.id && parent.id.name === 'query') {
          
          const queryString = node.quasis.map(q => q.value.raw).join('');
          
          // Parse GraphQL query parameters
          const queryMatch = queryString.match(/query\s+(\w+)\s*\(([^)]*)\)/);
          if (queryMatch) {
            const [, queryName, params] = queryMatch;
            const hasFilter = params.includes('$filter');
            const hasIncludeArchived = params.includes('$includeArchived');
            
            // If has $filter but no $includeArchived
            if (hasFilter && !hasIncludeArchived) {
              context.report({
                node,
                messageId: 'missingIncludeArchivedInQuery',
                fix(fixer) {
                  // Add $includeArchived to parameter list
                  const newParams = params.trim() + ', $includeArchived: Boolean';
                  const newQueryString = queryString.replace(
                    /query\s+\w+\s*\([^)]*\)/,
                    `query ${queryName}(${newParams})`
                  );
                  
                  // Also add includeArchived to query body
                  const issuesMatch = newQueryString.match(/issues\([^)]*\)/);
                  if (issuesMatch) {
                    const newIssuesCall = issuesMatch[0].replace(
                      /\)$/,
                      ', includeArchived: $includeArchived)'
                    );
                    const finalQuery = newQueryString.replace(issuesMatch[0], newIssuesCall);
                    
                    return fixer.replaceText(node, '`' + finalQuery + '`');
                  }
                }
              });
            }
            
            // Check if defined parameters are used in the query
            const paramList = params.split(',').map(p => {
              const match = p.trim().match(/\$(\w+):/);
              return match ? match[1] : null;
            }).filter(Boolean);
            
            paramList.forEach(param => {
              const queryBody = queryString.split('\n').slice(1).join('\n');
              const regex = new RegExp(`\\$${param}\\b`);
              if (!regex.test(queryBody)) {
                context.report({
                  node,
                  messageId: 'unusedParameter',
                  data: { param }
                });
              }
            });
            
            // Save query information
            graphqlQueries.set(queryName, {
              node,
              hasFilter,
              hasIncludeArchived
            });
          }
        }
      },

      // Detect rawRequest calls
      CallExpression(node) {
        if (node.callee && node.callee.property && 
            node.callee.property.name === 'rawRequest') {
          
          // Check second argument (variables)
          const variables = node.arguments[1];
          if (variables && variables.type === 'ObjectExpression') {
            let hasFilter = false;
            let hasIncludeArchived = false;
            
            variables.properties.forEach(prop => {
              if (prop.key && prop.key.name === 'filter') {
                hasFilter = true;
              }
              if (prop.key && prop.key.name === 'includeArchived') {
                hasIncludeArchived = true;
              }
            });
            
            // If has filter but no includeArchived
            if (hasFilter && !hasIncludeArchived) {
              context.report({
                node: variables,
                messageId: 'missingIncludeArchivedInCall',
                fix(fixer) {
                  // Add includeArchived: false
                  const lastProp = variables.properties[variables.properties.length - 1];
                  const insertPosition = lastProp.range[1];
                  return fixer.insertTextAfter(lastProp, ',\n      includeArchived: false');
                }
              });
            }
          }
        }
      }
    };
  }
};