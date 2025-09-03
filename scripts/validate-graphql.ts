#!/usr/bin/env bun
/**
 * GraphQL query validation script
 * Check for missing SA/UA filter arguments in Linear API
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
    
    // Search for GraphQL queries
    const queryRegex = /const query = `([^`]+)`/g;
    let match;
    
    while ((match = queryRegex.exec(content)) !== null) {
      const queryString = match[1];
      const lineNumber = content.substring(0, match.index).split('\n').length;
      
      this.validateQuery(filePath, queryString, lineNumber);
    }
    
    // Search for rawRequest calls
    this.validateRawRequestCalls(filePath, content);
  }

  private validateQuery(file: string, queryString: string, line: number): void {
    // Extract query name and parameters
    const queryMatch = queryString.match(/query\s+(\w+)\s*\(([^)]*)\)/);
    if (!queryMatch) return;
    
    const [, queryName, params] = queryMatch;
    
    // Parse parameters
    const hasFilter = params.includes('$filter');
    const hasIncludeArchived = params.includes('$includeArchived');
    
    // Rule 1: If filter exists, includeArchived is also required
    if (hasFilter && !hasIncludeArchived) {
      this.errors.push({
        file,
        line,
        message: `Query "${queryName}": Has $filter parameter but missing $includeArchived parameter definition`,
        severity: 'error'
      });
    }
    
    // Rule 2: Check if defined parameters are used
    const paramList = this.extractParameters(params);
    const queryBody = queryString.split('\n').slice(1).join('\n');
    
    paramList.forEach(param => {
      const regex = new RegExp(`\\$${param}\\b`);
      if (!regex.test(queryBody)) {
        this.warnings.push({
          file,
          line,
          message: `Query "${queryName}": Parameter "$${param}" is defined but not used`,
          severity: 'warning'
        });
      }
    });
    
    // Rule 3: Check if includeArchived is used in issues query
    if (hasIncludeArchived && queryBody.includes('issues(')) {
      if (!queryBody.includes('includeArchived: $includeArchived')) {
        this.warnings.push({
          file,
          line,
          message: `Query "${queryName}": $includeArchived parameter is defined but not used in issues query`,
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
    
    // Search for rawRequest calls
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
          message: 'rawRequest call has filter but missing includeArchived',
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
      console.log('✅ All GraphQL queries are properly configured!\n');
      return;
    }
    
    if (this.errors.length > 0) {
      console.log('❌ Errors:');
      this.errors.forEach(error => {
        console.log(`  ${error.file}:${error.line}`);
        console.log(`    ${error.message}\n`);
      });
    }
    
    if (this.warnings.length > 0) {
      console.log('⚠️  Warnings:');
      this.warnings.forEach(warning => {
        console.log(`  ${warning.file}:${warning.line}`);
        console.log(`    ${warning.message}\n`);
      });
    }
    
    console.log('📊 Summary:');
    console.log(`  Errors: ${this.errors.length}`);
    console.log(`  Warnings: ${this.warnings.length}\n`);
  }

  hasErrors(): boolean {
    return this.errors.length > 0;
  }
}

// Main process
async function main() {
  const analyzer = new GraphQLQueryAnalyzer();
  
  // Analyze src directory
  await analyzer.analyzeDirectory('./src');
  
  // Output report
  analyzer.printReport();
  
  // Exit with non-zero code if there are errors
  if (analyzer.hasErrors()) {
    process.exit(1);
  }
}

// Execute
if (import.meta.main) {
  main().catch(error => {
    console.error('❌ Error occurred during validation:', error);
    process.exit(1);
  });
}