import { Box, Text } from 'ink';
import Spinner from 'ink-spinner';
import TextInput from 'ink-text-input';
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

interface SearchIssuesProps {
  onSelectIssue: (issue: Issue) => void;
}

export const SearchIssues: React.FC<SearchIssuesProps> = ({ onSelectIssue }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      return;
    }

    setIsSearching(true);
    setError(null);
    setSearched(true);

    try {
      const results = await linearClient.searchIssues(searchQuery.trim());
      // Map Linear SDK results to our Issue type
      const mappedIssues = results.map((result: any) => ({
        id: result.id,
        identifier: result.identifier,
        title: result.title,
        description: result.description,
        priority: result.priority,
        url: result.url,
        createdAt: result.createdAt instanceof Date ? result.createdAt.toISOString() : result.createdAt,
        updatedAt: result.updatedAt instanceof Date ? result.updatedAt.toISOString() : result.updatedAt,
        state: result.state,
        assignee: result.assignee,
        cycle: result.cycle,
        attachments: result.attachments,
      }));
      setIssues(mappedIssues);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setIsSearching(false);
    }
  };

  // Auto-search after user stops typing for 1 second
  useEffect(() => {
    if (searchQuery.length > 2) {
      const timer = setTimeout(() => {
        handleSearch();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [searchQuery]);

  return (
    <Box flexDirection="column">
      <Box marginBottom={1}>
        <Text bold color="cyan">
          🔍 Search Issues
        </Text>
      </Box>

      <Box marginBottom={1}>
        <Text>Search: </Text>
        <TextInput
          value={searchQuery}
          onChange={setSearchQuery}
          onSubmit={handleSearch}
          placeholder="Enter search query..."
        />
      </Box>

      {isSearching && (
        <Box>
          <Text color="cyan">
            <Spinner type="dots" />
          </Text>
          <Text> Searching...</Text>
        </Box>
      )}

      {error && (
        <Box>
          <Text color="red">❌ Error: {error}</Text>
        </Box>
      )}

      {!isSearching && searched && issues.length === 0 && (
        <Box>
          <Text dimColor>No issues found matching "{searchQuery}"</Text>
        </Box>
      )}

      {!isSearching && issues.length > 0 && (
        <>
          <Text dimColor>
            Found {issues.length} issue{issues.length !== 1 ? 's' : ''}. Use ↑↓ to select, Enter to view details, q or Esc to go back
          </Text>
          <Box marginTop={1}>
            <IssueList issues={issues} onSelect={onSelectIssue} showAssignee={true} />
          </Box>
        </>
      )}

      {!isSearching && !searched && (
        <Box marginTop={1}>
          <Text dimColor>
            Enter a search query and press Enter to search, or wait for auto-search
          </Text>
        </Box>
      )}
    </Box>
  );
};