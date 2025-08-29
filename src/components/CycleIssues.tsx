import React, { useEffect, useState } from 'react';
import { Box, Text, useApp, useInput } from 'ink';
import Spinner from 'ink-spinner';
import { linearClient } from '../services/linear.js';
import { IssueList } from './IssueListView.js';
import { StatusBadge } from './StatusBadge.js';
import { PriorityBadge } from './PriorityBadge.js';

export const CycleIssues: React.FC = () => {
  const [issues, setIssues] = useState<any[]>([]);
  const [cycleName, setCycleName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedIssue, setSelectedIssue] = useState<any>(null);

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
      const currentCycle = await linearClient.getCurrentCycle();
      if (currentCycle) {
        setCycleName(currentCycle.name || currentCycle.number?.toString() || '現在のサイクル');
      }
      const fetchedIssues = await linearClient.getCycleIssues();
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
        <Text> サイクルのIssue読み込み中...</Text>
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
        <Box marginTop={1}>
          <Text>担当者: {selectedIssue.assignee?.displayName || '未割当'}</Text>
        </Box>
        <Box marginTop={1}>
          <Text>ステータス: {selectedIssue.state?.name || '不明'}</Text>
        </Box>
        <Box marginTop={1}>
          <Text>優先度: {selectedIssue.priority || '未設定'}</Text>
        </Box>
        {selectedIssue.description && (
          <Box marginTop={1}>
            <Text>{selectedIssue.description}</Text>
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
        <Text>現在のサイクルにIssueはありません</Text>
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
          🔄 {cycleName} のIssue一覧 ({issues.length}件)
        </Text>
      </Box>
      <Text dimColor>↑↓で選択、Enterで詳細表示、qまたはEscで戻る</Text>
      <Box marginTop={1}>
        <IssueList issues={issues} onSelect={handleSelect} showAssignee={true} />
      </Box>
    </Box>
  );
};