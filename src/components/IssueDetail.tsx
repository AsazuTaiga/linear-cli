import React, { useState, useEffect } from 'react';
import { Box, Text, useInput, useStdout } from 'ink';
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
  const [scrollOffset, setScrollOffset] = useState(0);
  const { stdout } = useStdout();

  useInput((input, key) => {
    if (input === 'c') {
      copyToClipboard();
    } else if (/^[1-9]$/.test(input)) {
      const index = parseInt(input, 10) - 1;
      const links = getAllLinks();
      if (index < links.length) {
        openLink(links[index].url);
      }
    } else if (key.upArrow || input === 'k') {
      setScrollOffset(prev => Math.max(0, prev - 1));
    } else if (key.downArrow || input === 'j') {
      setScrollOffset(prev => prev + 1);
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


  // 表示可能な行数を計算
  const terminalHeight = stdout.rows || 20;
  const contentHeight = Math.max(5, terminalHeight - 5); // コマンド行とスクロールインジケーター分の余裕

  // 説明文を行単位で分割（簡易的な実装）
  const descriptionLines = issue.description ? 
    issue.description.split('\n').flatMap(line => {
      const maxWidth = 80; // 一行の最大幅
      const lines = [];
      for (let i = 0; i < line.length; i += maxWidth) {
        lines.push(line.slice(i, i + maxWidth));
      }
      return lines.length > 0 ? lines : [''];
    }) : [];

  // コンテンツ全体を構成
  const allContent = [];
  
  // ヘッダー情報
  allContent.push({ type: 'header', content: `${issue.identifier} - ${issue.title}` });
  allContent.push({ type: 'status', content: `ステータス: ${issue.state.name}${issue.assignee ? ` | 担当者: ${issue.assignee.displayName}` : ''}` });
  
  // 説明（空行なしで直接表示）
  if (descriptionLines.length > 0) {
    allContent.push({ type: 'label', content: '詳細:' });
    descriptionLines.forEach(line => {
      allContent.push({ type: 'description', content: line });
    });
  }
  
  // リンク（説明がある場合のみ空行を挿入）
  const links = getAllLinks();
  if (links.length > 0) {
    if (descriptionLines.length > 0) {
      allContent.push({ type: 'empty', content: '' });
    }
    allContent.push({ type: 'label', content: 'リンク:' });
    links.forEach((link, index) => {
      allContent.push({ type: 'link', content: `[${index + 1}] ${link.title}` });
    });
  }
  
  // スクロール範囲を計算
  const visibleContent = allContent.slice(scrollOffset, scrollOffset + contentHeight);
  const hasMoreAbove = scrollOffset > 0;
  const hasMoreBelow = scrollOffset + contentHeight < allContent.length;

  return (
    <Box flexDirection="column">
      {hasMoreAbove && (
        <Text dimColor>↑ スクロール可能</Text>
      )}
      
      {visibleContent.map((item, index) => {
        switch (item.type) {
          case 'header':
            return (
              <Box key={index}>
                <Text bold color="cyan">{item.content}</Text>
              </Box>
            );
          case 'status':
            return (
              <Box key={index}>
                <Text>{item.content}</Text>
              </Box>
            );
          case 'label':
            return (
              <Box key={index}>
                <Text bold dimColor>{item.content}</Text>
              </Box>
            );
          case 'description':
            return (
              <Box key={index} paddingLeft={2}>
                <Text>{item.content}</Text>
              </Box>
            );
          case 'link':
            return (
              <Box key={index} paddingLeft={2}>
                <Text color="blue">{item.content}</Text>
              </Box>
            );
          case 'empty':
            return <Box key={index} />;
          default:
            return null;
        }
      })}
      
      {hasMoreBelow && (
        <Text dimColor>↓ スクロール可能</Text>
      )}


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

      <Box marginTop={1}>
        <Text dimColor>
          [↑↓/jk] スクロール  [1-9] リンクを開く  [c] クリップボードにコピー  [q/Esc] 戻る
        </Text>
      </Box>
    </Box>
  );
};