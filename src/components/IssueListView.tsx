import { Box, Text, useInput, useStdout } from 'ink';
import type React from 'react';
import { useMemo, useState } from 'react';
import { sortIssuesByStatus } from '../utils/sort.js';
import { IssueItem } from './IssueItem.js';

interface IssueListProps {
  issues: any[];
  onSelect: (issue: any) => void;
  showAssignee?: boolean;
}

export const IssueList: React.FC<IssueListProps> = ({ issues, onSelect, showAssignee = false }) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const sortedIssues = sortIssuesByStatus(issues);
  const { stdout } = useStdout();

  // Get terminal height and calculate visible lines
  const terminalHeight = stdout.rows || 20;
  // Add margin for headers and other UI elements (more conservative)
  const maxVisibleItems = Math.max(3, Math.min(terminalHeight - 8, 30));

  // Calculate visible range
  const visibleRange = useMemo(() => {
    const halfVisible = Math.floor(maxVisibleItems / 2);
    let start = Math.max(0, selectedIndex - halfVisible);
    const end = Math.min(sortedIssues.length, start + maxVisibleItems);

    // Adjust start position if fewer items are visible at the end
    if (end - start < maxVisibleItems && start > 0) {
      start = Math.max(0, end - maxVisibleItems);
    }

    return { start, end };
  }, [selectedIndex, sortedIssues.length, maxVisibleItems]);

  const visibleIssues = sortedIssues.slice(visibleRange.start, visibleRange.end);

  useInput((_input, key) => {
    if (key.upArrow) {
      setSelectedIndex((prev) => Math.max(0, prev - 1));
    } else if (key.downArrow) {
      setSelectedIndex((prev) => Math.min(sortedIssues.length - 1, prev + 1));
    } else if (key.return) {
      onSelect(sortedIssues[selectedIndex]);
    }
  });

  return (
    <Box flexDirection="column">
      {/* Scroll indicator (top) */}
      {visibleRange.start > 0 && (
        <Box marginBottom={1}>
          <Text dimColor>↑ {visibleRange.start} more issues</Text>
        </Box>
      )}

      {/* Issue list */}
      {visibleIssues.map((issue, visibleIndex) => {
        const actualIndex = visibleRange.start + visibleIndex;
        return (
          <Box key={issue.id}>
            <Text color={actualIndex === selectedIndex ? 'cyan' : undefined}>
              {actualIndex === selectedIndex ? '❯ ' : '  '}
            </Text>
            <IssueItem issue={issue} showAssignee={showAssignee} />
          </Box>
        );
      })}

      {/* Scroll indicator (bottom) */}
      {visibleRange.end < sortedIssues.length && (
        <Box marginTop={1}>
          <Text dimColor>↓ {sortedIssues.length - visibleRange.end} more issues</Text>
        </Box>
      )}
    </Box>
  );
};
