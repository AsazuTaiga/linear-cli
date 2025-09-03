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
  attachments?: {
    nodes: Array<{
      id: string;
      title?: string;
      url: string;
      sourceType?: string;
    }>;
  };
}

interface IssueDetailProps {
  issue: Issue;
}

export const IssueDetail: React.FC<IssueDetailProps> = ({ issue }) => {
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState<string | null>(null);
  const [selectedLinkIndex, setSelectedLinkIndex] = useState<number | null>(null);

  useInput((input, key) => {
    if (input === 'c') {
      copyToClipboard();
    } else if (/^[1-9]$/.test(input)) {
      const index = parseInt(input, 10) - 1;
      const links = getAllLinks();
      if (index < links.length) {
        openLink(links[index].url);
      }
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

  const openLink = async (url: string) => {
    try {
      await execAsync(`open "${url}"`);
    } catch (error) {
      // エラーは無視（ブラウザが開けない環境の場合）
    }
  };

  const getAllLinks = () => {
    const links: Array<{ title: string; url: string; type: string }> = [];
    
    // Linear Issue URLを最初に追加
    links.push({
      title: `${issue.identifier} (Linear)`,
      url: issue.url,
      type: 'linear'
    });
    
    // Attachmentsを追加（GitHub PRなど）
    if (issue.attachments?.nodes) {
      issue.attachments.nodes.forEach(attachment => {
        let title = attachment.title || 'リンク';
        // GitHub PRの場合は特別な表記
        if (attachment.sourceType === 'github' && attachment.url.includes('/pull/')) {
          const prMatch = attachment.url.match(/pull\/(\d+)/);
          if (prMatch) {
            title = `PR #${prMatch[1]} (GitHub)`;
          }
        } else if (attachment.sourceType === 'github') {
          title = `${title} (GitHub)`;
        }
        links.push({
          title,
          url: attachment.url,
          type: attachment.sourceType || 'other'
        });
      });
    }
    
    return links;
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

      <Box marginTop={1} marginBottom={1} flexDirection="column">
        <Text bold dimColor>リンク:</Text>
        {getAllLinks().map((link, index) => (
          <Box key={index} paddingLeft={2}>
            <Text color="cyan">[{index + 1}]</Text>
            <Text> </Text>
            <Text color={link.type === 'github' ? 'green' : 'blue'}>
              {link.title}
            </Text>
          </Box>
        ))}
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
          <Text><Text color="cyan">1-9</Text> - リンクを開く</Text>
          <Text><Text color="cyan">c</Text> - クリップボードにコピー</Text>
          <Text><Text color="cyan">q/Esc</Text> - 戻る</Text>
        </Box>
      </Box>
    </Box>
  );
};