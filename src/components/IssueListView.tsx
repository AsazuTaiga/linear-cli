import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { IssueItem } from './IssueItem.js';
import { sortIssuesByStatus } from '../utils/sort.js';

interface IssueListProps {
  issues: any[];
  onSelect: (issue: any) => void;
  showAssignee?: boolean;
}

export const IssueList: React.FC<IssueListProps> = ({ issues, onSelect, showAssignee = false }) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const sortedIssues = sortIssuesByStatus(issues);

  useInput((input, key) => {
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
      {sortedIssues.map((issue, index) => (
        <Box key={issue.id}>
          <Text color={index === selectedIndex ? 'cyan' : undefined}>
            {index === selectedIndex ? '❯ ' : '  '}
          </Text>
          <IssueItem issue={issue} showAssignee={showAssignee} />
        </Box>
      ))}
    </Box>
  );
};