import React, { useEffect, useState } from 'react';
import { Box, Text, useApp, useInput } from 'ink';
import Spinner from 'ink-spinner';
import { linearClient } from '../services/linear.js';
import { IssueList } from './IssueListView.js';
import { IssueDetail } from './IssueDetail.js';
import { StatusBadge } from './StatusBadge.js';
import { PriorityBadge } from './PriorityBadge.js';

interface Issue {
  id: string;
  identifier: string;
  title: string;
  description?: string;
  priority?: number;
  url: string;
  createdAt: string;
  updatedAt: string;
  state: {
    id: string;
    name: string;
    type: string;
    color: string;
  };
  assignee?: {
    id: string;
    name: string;
    displayName: string;
    email: string;
    avatarUrl?: string;
  };
  cycle?: {
    id: string;
    name: string;
    number: number;
    startsAt: string;
    endsAt: string;
  };
}

export const CycleIssues: React.FC = () => {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [cycleName, setCycleName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);

  const handleIssueSelect = (issue: Issue) => {
    setSelectedIssue(issue);
  };

  const handleBack = () => {
    setSelectedIssue(null);
  };

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
      const fetchedIssues = await linearClient.getCycleIssues();
      
      if (fetchedIssues.length > 0 && fetchedIssues[0].cycle) {
        setCycleName(fetchedIssues[0].cycle.name || fetchedIssues[0].cycle.number?.toString() || '現在のサイクル');
      }
      
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
    return <IssueDetail issue={selectedIssue} onBack={handleBack} />;
  }

  if (issues.length === 0) {
    return (
      <Box flexDirection="column">
        <Text>現在のサイクルにIssueはありません</Text>
        <Text dimColor>qまたはEscで戻る</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column">
      <Box marginBottom={1}>
        <Text bold color="cyan">
          🔄 {cycleName} のIssue一覧 ({issues.length}件)
        </Text>
      </Box>
      <Text dimColor>↑↓で選択、Enterで詳細表示、qまたはEscで戻る</Text>
      <Box marginTop={1}>
        <IssueList issues={issues} onSelect={handleIssueSelect} showAssignee={true} />
      </Box>
    </Box>
  );
};