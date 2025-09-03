/**
 * ESLintカスタムルール: Linear GraphQL APIのフィルタ引数チェック
 * 
 * このルールは以下をチェックします:
 * 1. GraphQLクエリに$filterパラメータがある場合、$includeArchivedパラメータも必須
 * 2. rawRequest呼び出し時にfilterを渡す場合、includeArchivedも必須
 */

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Linear GraphQL APIのフィルタ引数の必須チェック',
      category: 'Possible Errors',
      recommended: true
    },
    fixable: 'code',
    schema: [],
    messages: {
      missingIncludeArchivedInQuery: 'GraphQLクエリに$filterがありますが、$includeArchivedパラメータが定義されていません',
      missingIncludeArchivedInCall: 'rawRequest呼び出しでfilterが渡されていますが、includeArchivedが渡されていません',
      unusedParameter: 'パラメータ "{{param}}" が定義されていますが、クエリ内で使用されていません'
    }
  },

  create(context) {
    // GraphQLクエリ文字列を保持
    const graphqlQueries = new Map();

    return {
      // テンプレートリテラルでGraphQLクエリを検出
      TemplateLiteral(node) {
        const parent = node.parent;
        
        // const query = `...` のパターンを検出
        if (parent && parent.type === 'VariableDeclarator' && 
            parent.id && parent.id.name === 'query') {
          
          const queryString = node.quasis.map(q => q.value.raw).join('');
          
          // GraphQLクエリのパラメータを解析
          const queryMatch = queryString.match(/query\s+(\w+)\s*\(([^)]*)\)/);
          if (queryMatch) {
            const [, queryName, params] = queryMatch;
            const hasFilter = params.includes('$filter');
            const hasIncludeArchived = params.includes('$includeArchived');
            
            // $filterがあるが$includeArchivedがない場合
            if (hasFilter && !hasIncludeArchived) {
              context.report({
                node,
                messageId: 'missingIncludeArchivedInQuery',
                fix(fixer) {
                  // パラメータリストに$includeArchivedを追加
                  const newParams = params.trim() + ', $includeArchived: Boolean';
                  const newQueryString = queryString.replace(
                    /query\s+\w+\s*\([^)]*\)/,
                    `query ${queryName}(${newParams})`
                  );
                  
                  // クエリ本文にもincludeArchivedを追加
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
            
            // 定義されたパラメータがクエリ内で使用されているかチェック
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
            
            // クエリ情報を保存
            graphqlQueries.set(queryName, {
              node,
              hasFilter,
              hasIncludeArchived
            });
          }
        }
      },

      // rawRequest呼び出しを検出
      CallExpression(node) {
        if (node.callee && node.callee.property && 
            node.callee.property.name === 'rawRequest') {
          
          // 第2引数（variables）を確認
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
            
            // filterがあるがincludeArchivedがない場合
            if (hasFilter && !hasIncludeArchived) {
              context.report({
                node: variables,
                messageId: 'missingIncludeArchivedInCall',
                fix(fixer) {
                  // includeArchived: false を追加
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