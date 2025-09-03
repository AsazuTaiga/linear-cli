#!/usr/bin/env bun
/**
 * GraphQLクエリ検証スクリプト
 * Linear APIのSA/UAフィルタ引数忘れをチェック
 */

import { readFile } from 'fs/promises';
import { join } from 'path';
import { glob } from 'glob';

interface ValidationError {
  file: string;
  line: number;
  message: string;
  severity: 'error' | 'warning';
}

class GraphQLQueryAnalyzer {
  private errors: ValidationError[] = [];
  private warnings: ValidationError[] = [];

  async analyzeFile(filePath: string): Promise<void> {
    const content = await readFile(filePath, 'utf-8');
    const lines = content.split('\n');
    
    // GraphQLクエリを検索
    const queryRegex = /const query = `([^`]+)`/g;
    let match;
    
    while ((match = queryRegex.exec(content)) !== null) {
      const queryString = match[1];
      const lineNumber = content.substring(0, match.index).split('\n').length;
      
      this.validateQuery(filePath, queryString, lineNumber);
    }
    
    // rawRequest呼び出しを検索
    this.validateRawRequestCalls(filePath, content);
  }

  private validateQuery(file: string, queryString: string, line: number): void {
    // クエリ名とパラメータを抽出
    const queryMatch = queryString.match(/query\s+(\w+)\s*\(([^)]*)\)/);
    if (!queryMatch) return;
    
    const [, queryName, params] = queryMatch;
    
    // パラメータを解析
    const hasFilter = params.includes('$filter');
    const hasIncludeArchived = params.includes('$includeArchived');
    
    // ルール1: filterがある場合、includeArchivedも必須
    if (hasFilter && !hasIncludeArchived) {
      this.errors.push({
        file,
        line,
        message: `Query "${queryName}": $filterパラメータがありますが、$includeArchivedパラメータが定義されていません`,
        severity: 'error'
      });
    }
    
    // ルール2: 定義されたパラメータが使用されているか
    const paramList = this.extractParameters(params);
    const queryBody = queryString.split('\n').slice(1).join('\n');
    
    paramList.forEach(param => {
      const regex = new RegExp(`\\$${param}\\b`);
      if (!regex.test(queryBody)) {
        this.warnings.push({
          file,
          line,
          message: `Query "${queryName}": パラメータ "$${param}" が定義されていますが使用されていません`,
          severity: 'warning'
        });
      }
    });
    
    // ルール3: issuesクエリでincludeArchivedが使用されているか
    if (hasIncludeArchived && queryBody.includes('issues(')) {
      if (!queryBody.includes('includeArchived: $includeArchived')) {
        this.warnings.push({
          file,
          line,
          message: `Query "${queryName}": $includeArchivedパラメータが定義されていますが、issuesクエリで使用されていません`,
          severity: 'warning'
        });
      }
    }
  }

  private extractParameters(params: string): string[] {
    const paramRegex = /\$(\w+):/g;
    const result: string[] = [];
    let match;
    
    while ((match = paramRegex.exec(params)) !== null) {
      result.push(match[1]);
    }
    
    return result;
  }

  private validateRawRequestCalls(file: string, content: string): void {
    const lines = content.split('\n');
    
    // rawRequest呼び出しを検索
    const rawRequestRegex = /\.rawRequest[^(]*\([^,]+,\s*\{([^}]+)\}/g;
    let match;
    
    while ((match = rawRequestRegex.exec(content)) !== null) {
      const variables = match[1];
      const lineNumber = content.substring(0, match.index).split('\n').length;
      
      const hasFilter = variables.includes('filter');
      const hasIncludeArchived = variables.includes('includeArchived');
      
      if (hasFilter && !hasIncludeArchived) {
        this.errors.push({
          file,
          line: lineNumber,
          message: 'rawRequest呼び出しでfilterが渡されていますが、includeArchivedが渡されていません',
          severity: 'error'
        });
      }
    }
  }

  async analyzeDirectory(dir: string): Promise<void> {
    const pattern = join(dir, '**/*.{ts,tsx}');
    const files = await glob(pattern, {
      ignore: ['**/node_modules/**', '**/dist/**', '**/*.test.ts', '**/*.test.tsx']
    });
    
    for (const file of files) {
      await this.analyzeFile(file);
    }
  }

  printReport(): void {
    console.log('🔍 GraphQL Query Validation Report\n');
    
    if (this.errors.length === 0 && this.warnings.length === 0) {
      console.log('✅ すべてのGraphQLクエリが正しく設定されています！\n');
      return;
    }
    
    if (this.errors.length > 0) {
      console.log('❌ エラー:');
      this.errors.forEach(error => {
        console.log(`  ${error.file}:${error.line}`);
        console.log(`    ${error.message}\n`);
      });
    }
    
    if (this.warnings.length > 0) {
      console.log('⚠️  警告:');
      this.warnings.forEach(warning => {
        console.log(`  ${warning.file}:${warning.line}`);
        console.log(`    ${warning.message}\n`);
      });
    }
    
    console.log('📊 サマリー:');
    console.log(`  エラー: ${this.errors.length}件`);
    console.log(`  警告: ${this.warnings.length}件\n`);
  }

  hasErrors(): boolean {
    return this.errors.length > 0;
  }
}

// メイン処理
async function main() {
  const analyzer = new GraphQLQueryAnalyzer();
  
  // srcディレクトリを解析
  await analyzer.analyzeDirectory('./src');
  
  // レポートを出力
  analyzer.printReport();
  
  // エラーがある場合は非ゼロのexit codeで終了
  if (analyzer.hasErrors()) {
    process.exit(1);
  }
}

// 実行
if (import.meta.main) {
  main().catch(error => {
    console.error('❌ 検証中にエラーが発生しました:', error);
    process.exit(1);
  });
}