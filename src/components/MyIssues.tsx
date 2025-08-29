import React, { useEffect, useState } from 'react';
import { Box, Text, useApp, useInput } from 'ink';
import SelectInput from 'ink-select-input';
import Spinner from 'ink-spinner';
import { linearClient } from '../services/linear.js';

interface MyIssuesProps {
  mode: 'current-cycle' | 'all';
}

export const MyIssues: React.FC<MyIssuesProps> = ({ mode }) => {
  const { exit } = useApp();
  const [issues, setIssues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedIssue, setSelectedIssue] = useState<any>(null);

  useInput((input, key) => {
    if (input === 'q' || key.escape) {
      if (selectedIssue) {
        setSelectedIssue(null);
      } else {
        exit();
      }
    }
  });

  useEffect(() => {
    loadIssues();
  }, []);

  const loadIssues = async () => {
    try {
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
        <Text>
          {mode === 'current-cycle' 
            ? '現在のサイクルに自分のIssueはありません' 
            : '自分のIssueが見つかりませんでした'}
        </Text>
        <Text dimColor>qまたはEscで戻る</Text>
      </Box>
    );
  }

  const items = issues.map((issue) => ({
    label: `${issue.identifier} [${issue.state?.name || '?'}] ${issue.title}`,
    value: issue,
  }));

  const handleSelect = (item: { value: any }) => {
    setSelectedIssue(item.value);
  };

  return (
    <Box flexDirection="column">
      <Box marginBottom={1}>
        <Text bold color="cyan">
          📋 {mode === 'current-cycle' ? '自分のIssue（現在のサイクル）' : '自分のすべてのIssue'} ({issues.length}件)
        </Text>
      </Box>
      <Text dimColor>↑↓で選択、Enterで詳細表示、qまたはEscで戻る</Text>
      <Box marginTop={1}>
        <SelectInput items={items} onSelect={handleSelect} />
      </Box>
    </Box>
  );
};