import React, { useState, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

interface Issue {
  id: string;
  identifier: string;
  title: string;
  description?: string;
  priority?: number;
  url: string;
  state: {
    name: string;
    color: string;
  };
  assignee?: {
    displayName: string;
  };
}

interface IssueDetailProps {
  issue: Issue;
  onBack: () => void;
}

export const IssueDetail: React.FC<IssueDetailProps> = ({ issue, onBack }) => {
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState<string | null>(null);

  useInput((input, key) => {
    if (input === 'q' || key.escape) {
      onBack();
    } else if (input === 'c') {
      copyToClipboard();
    } else if (input === 'o') {
      openInBrowser();
    }
  });

  const copyToClipboard = async () => {
    setCopied(false);
    setCopyError(null);
    
    try {
      // Issue内容を整形
      const issueContent = formatIssueForClaude(issue);
      
      // 一時ファイルを使ってpbcopyに渡す（特殊文字の問題を回避）
      const safeIdentifier = issue.identifier.replace(/[^a-zA-Z0-9-]/g, '_');
      const tmpFile = `/tmp/linear-issue-${safeIdentifier}.txt`;
      const fs = await import('fs/promises');
      await fs.writeFile(tmpFile, issueContent, 'utf-8');
      
      // pbcopyコマンドでクリップボードにコピー
      await execAsync(`pbcopy < ${tmpFile}`);
      
      // 一時ファイルを削除
      await fs.unlink(tmpFile);
      
      // 成功メッセージを表示
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (error) {
      setCopyError(error instanceof Error ? error.message : '不明なエラー');
      setTimeout(() => {
        setCopyError(null);
      }, 3000);
    }
  };

  const openInBrowser = async () => {
    try {
      await execAsync(`open "${issue.url}"`);
    } catch (error) {
      // エラーは無視（ブラウザが開けない環境の場合）
    }
  };

  const formatIssueForClaude = (issue: Issue): string => {
    const parts = [
      `Linear Issue: ${issue.identifier}`,
      `タイトル: ${issue.title}`,
      `ステータス: ${issue.state.name}`,
    ];

    if (issue.assignee) {
      parts.push(`担当者: ${issue.assignee.displayName}`);
    }

    if (issue.description) {
      parts.push('', '詳細:', issue.description);
    }

    parts.push('', `URL: ${issue.url}`);
    parts.push('', '---', 'このIssueに関連する作業を行ってください。');

    return parts.join('\n');
  };


  return (
    <Box flexDirection="column" paddingTop={1}>
      <Box marginBottom={1}>
        <Text bold color="cyan">{issue.identifier}</Text>
        <Text> - </Text>
        <Text bold>{issue.title}</Text>
      </Box>

      <Box marginBottom={1}>
        <Text>ステータス: </Text>
        <Text color="green">{issue.state.name}</Text>
        {issue.assignee && (
          <>
            <Text> | 担当者: </Text>
            <Text color="yellow">{issue.assignee.displayName}</Text>
          </>
        )}
      </Box>

      {issue.description && (
        <Box marginBottom={1} flexDirection="column">
          <Text dimColor>詳細:</Text>
          <Box paddingLeft={2}>
            <Text>{issue.description.slice(0, 500)}</Text>
            {issue.description.length > 500 && <Text dimColor>...</Text>}
          </Box>
        </Box>
      )}

      <Box marginTop={1} marginBottom={1}>
        <Text dimColor>URL: </Text>
        <Text color="blue">{issue.url}</Text>
      </Box>

      {copied && (
        <Box marginTop={1}>
          <Text color="green">✓ クリップボードにコピーしました！</Text>
        </Box>
      )}

      {copyError && (
        <Box marginTop={1}>
          <Text color="red">エラー: {copyError}</Text>
        </Box>
      )}

      <Box marginTop={2} flexDirection="column">
        <Text dimColor>操作:</Text>
        <Box paddingLeft={2} flexDirection="column">
          <Text><Text color="cyan">c</Text> - クリップボードにコピー</Text>
          <Text><Text color="cyan">o</Text> - ブラウザで開く</Text>
          <Text><Text color="cyan">q/Esc</Text> - 戻る</Text>
        </Box>
      </Box>
    </Box>
  );
};