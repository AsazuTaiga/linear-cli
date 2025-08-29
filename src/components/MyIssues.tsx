import React, { useEffect, useState } from 'react';
import { Box, Text, useApp, useInput } from 'ink';
import Spinner from 'ink-spinner';
import { linearClient } from '../services/linear.js';
import { IssueList } from './IssueListView.js';
import { StatusBadge } from './StatusBadge.js';
import { PriorityBadge } from './PriorityBadge.js';

interface MyIssuesProps {
  mode: 'current-cycle' | 'all';
}

export const MyIssues: React.FC<MyIssuesProps> = ({ mode }) => {
  const [issues, setIssues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedIssue, setSelectedIssue] = useState<any>(null);
  const [cycleName, setCycleName] = useState<string>('');

  useInput((input, key) => {
    if (input === 'q' || key.escape) {
      if (selectedIssue) {
        setSelectedIssue(null);
      }
    }
  });

  useEffect(() => {
    loadIssues();
  }, []);

  const loadIssues = async () => {
    try {
      if (mode === 'current-cycle') {
        const currentCycle = await linearClient.getCurrentCycle();
        if (currentCycle) {
          setCycleName(currentCycle.name || currentCycle.number?.toString() || '');
        }
      }
      const fetchedIssues = await linearClient.getMyIssues({
        inCurrentCycle: mode === 'current-cycle',
        includeCompleted: false,
      });
      setIssues(fetchedIssues);
    } catch (err) {
      setError(err instanceof Error ? err.message : '不明なエラー');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box>
        <Text color="cyan">
          <Spinner type="dots" />
        </Text>
        <Text> 自分のIssue読み込み中...</Text>
      </Box>
    );
  }

  if (error) {
    return (
      <Box flexDirection="column">
        <Text color="red">❌ エラー: {error}</Text>
        <Text dimColor>qまたはEscで戻る</Text>
      </Box>
    );
  }

  if (selectedIssue) {
    return (
      <Box flexDirection="column" paddingY={1}>
        <Text bold color="cyan">{selectedIssue.identifier}: {selectedIssue.title}</Text>
        <Box marginTop={1} gap={1}>
          <Text>ステータス:</Text>
          <StatusBadge status={selectedIssue.state?.name || '不明'} />
        </Box>
        <Box marginTop={1} gap={1}>
          <Text>優先度:</Text>
          <PriorityBadge priority={selectedIssue.priority} />
        </Box>
        {selectedIssue.assignee && (
          <Box marginTop={1}>
            <Text>担当者: {selectedIssue.assignee.displayName || selectedIssue.assignee.name}</Text>
          </Box>
        )}
        {selectedIssue.description && (
          <Box marginTop={1}>
            <Text wrap="wrap">{selectedIssue.description}</Text>
          </Box>
        )}
        {selectedIssue.url && (
          <Box marginTop={1}>
            <Text dimColor>URL: {selectedIssue.url}</Text>
          </Box>
        )}
        <Box marginTop={2}>
          <Text dimColor>qまたはEscで一覧に戻る</Text>
        </Box>
      </Box>
    );
  }

  if (issues.length === 0) {
    return (
      <Box flexDirection="column">
        <Text>
          {mode === 'current-cycle' 
            ? '現在のサイクルに自分のIssueはありません' 
            : '自分のIssueが見つかりませんでした'}
        </Text>
        <Text dimColor>qまたはEscで戻る</Text>
      </Box>
    );
  }

  const handleSelect = (issue: any) => {
    setSelectedIssue(issue);
  };

  return (
    <Box flexDirection="column">
      <Box marginBottom={1}>
        <Text bold color="cyan">
          📋 {mode === 'current-cycle' 
            ? `自分のIssue（${cycleName || '現在のサイクル'}）` 
            : '自分のすべてのIssue'} ({issues.length}件)
        </Text>
      </Box>
      <Text dimColor>↑↓で選択、Enterで詳細表示、qまたはEscで戻る</Text>
      <Box marginTop={1}>
        <IssueList issues={issues} onSelect={handleSelect} />
      </Box>
    </Box>
  );
};