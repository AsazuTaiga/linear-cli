import { Box, Text } from 'ink';
import Spinner from 'ink-spinner';
import type React from 'react';
import { useEffect, useState } from 'react';
import { linearClient } from '../services/linear.js';
import { IssueList } from './IssueListView.js';

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
  attachments?: {
    nodes: Array<{
      id: string;
      title?: string;
      url: string;
      sourceType?: string;
    }>;
  };
}

interface MyIssuesProps {
  mode: 'current-cycle' | 'all';
  onSelectIssue: (issue: Issue) => void;
}

export const MyIssues: React.FC<MyIssuesProps> = ({ mode, onSelectIssue }) => {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cycleName, setCycleName] = useState<string>('');

  const handleIssueSelect = (issue: Issue) => {
    onSelectIssue(issue);
  };

  useEffect(() => {
    loadIssues();
  }, []);

  const loadIssues = async () => {
    try {
      const fetchedIssues = await linearClient.getMyIssues({
        inCurrentCycle: mode === 'current-cycle',
        includeCompleted: false,
      });

      if (mode === 'current-cycle' && fetchedIssues.length > 0 && fetchedIssues[0].cycle) {
        setCycleName(
          fetchedIssues[0].cycle.name || fetchedIssues[0].cycle.number?.toString() || '',
        );
      }

      setIssues(fetchedIssues);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
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
        <Text> Loading my issues...</Text>
      </Box>
    );
  }

  if (error) {
    return (
      <Box flexDirection="column">
        <Text color="red">❌ Error: {error}</Text>
      </Box>
    );
  }

  if (issues.length === 0) {
    return (
      <Box flexDirection="column">
        <Text>
          {mode === 'current-cycle'
            ? 'No issues assigned to me in current cycle'
            : 'No issues assigned to me'}
        </Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column">
      <Box marginBottom={1}>
        <Text bold color="cyan">
          📋{' '}
          {mode === 'current-cycle'
            ? `My Issues (${cycleName || 'Current Cycle'})`
            : 'All My Issues'}{' '}
          ({issues.length} items)
        </Text>
      </Box>
      <Text dimColor>Use ↑↓ to select, Enter to view details, q or Esc to go back</Text>
      <Box marginTop={1}>
        <IssueList issues={issues} onSelect={handleIssueSelect} />
      </Box>
    </Box>
  );
};
