import React, { useEffect, useState } from 'react';
import { Box, Text, useApp } from 'ink';
import SelectInput from 'ink-select-input';
import Spinner from 'ink-spinner';
import { linearClient } from '../services/linear.js';

interface IssueListProps {
  options: {
    status?: string;
    assignee?: string;
    project?: string;
  };
}

export const IssueList: React.FC<IssueListProps> = ({ options }) => {
  const { exit } = useApp();
  const [issues, setIssues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadIssues();
  }, []);

  const loadIssues = async () => {
    try {
      const fetchedIssues = await linearClient.getIssues({
        status: options.status,
        projectId: options.project,
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
        <Text> Issue読み込み中...</Text>
      </Box>
    );
  }

  if (error) {
    return (
      <Box flexDirection="column">
        <Text color="red">❌ エラー: {error}</Text>
        <Text dimColor>Enterで終了</Text>
      </Box>
    );
  }

  if (issues.length === 0) {
    return (
      <Box flexDirection="column">
        <Text>Issueが見つかりませんでした</Text>
        <Text dimColor>Enterで終了</Text>
      </Box>
    );
  }

  const items = issues.map((issue) => ({
    label: `${issue.identifier} - ${issue.title}`,
    value: issue.id,
  }));

  const handleSelect = () => {
    exit();
  };

  return (
    <Box flexDirection="column">
      <Box marginBottom={1}>
        <Text bold color="cyan">
          📋 Issue一覧 ({issues.length}件)
        </Text>
      </Box>
      <Text dimColor>↑↓で選択、Enterで詳細表示</Text>
      <Box marginTop={1}>
        <SelectInput items={items} onSelect={handleSelect} />
      </Box>
    </Box>
  );
};