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

interface CycleIssuesProps {
  onSelectIssue: (issue: Issue) => void;
}

export const CycleIssues: React.FC<CycleIssuesProps> = ({ onSelectIssue }) => {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [cycleName, setCycleName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleIssueSelect = (issue: Issue) => {
    onSelectIssue(issue);
  };

  useEffect(() => {
    loadIssues();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadIssues = async () => {
    try {
      const fetchedIssues = await linearClient.getCycleIssues();

      if (fetchedIssues.length > 0 && fetchedIssues[0].cycle) {
        setCycleName(
          fetchedIssues[0].cycle.name ||
            fetchedIssues[0].cycle.number?.toString() ||
            'Current Cycle',
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
        <Text> Loading cycle issues...</Text>
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
        <Text>No issues in the current cycle</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column">
      <Box marginBottom={1}>
        <Text bold color="cyan">
          🔄 {cycleName} Issues ({issues.length} items)
        </Text>
      </Box>
      <Text dimColor>Use ↑↓ to select, Enter to view details, q or Esc to go back</Text>
      <Box marginTop={1}>
        <IssueList issues={issues} onSelect={handleIssueSelect} showAssignee={true} />
      </Box>
    </Box>
  );
};
