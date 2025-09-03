import React from 'react';
import { Box, Text } from 'ink';
import { StatusBadge } from './StatusBadge.js';
import { PriorityBadge } from './PriorityBadge.js';

interface IssueItemProps {
  issue: any;
  showAssignee?: boolean;
}

export const IssueItem: React.FC<IssueItemProps> = ({ issue, showAssignee = false }) => {
  const assignee = showAssignee ? (issue.assignee?.displayName || issue.assignee?.name || '未割当') : null;
  
  return (
    <Box gap={1}>
      <Text>{issue.identifier.padEnd(8)}</Text>
      <StatusBadge status={issue.state?.name || 'Unknown'} />
      <PriorityBadge priority={issue.priority} />
      <Text>{issue.title}</Text>
      {assignee && <Text color="dim">[{assignee}]</Text>}
    </Box>
  );
};