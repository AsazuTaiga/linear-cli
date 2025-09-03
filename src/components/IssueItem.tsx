import { Box, Text, useStdout } from 'ink';
import type React from 'react';
import { PriorityBadge } from './PriorityBadge.js';
import { StatusBadge } from './StatusBadge.js';

interface IssueItemProps {
  issue: any;
  showAssignee?: boolean;
}

export const IssueItem: React.FC<IssueItemProps> = ({ issue, showAssignee = false }) => {
  const { stdout } = useStdout();
  const terminalWidth = stdout.columns || 80;
  
  const assignee = showAssignee
    ? issue.assignee?.displayName || issue.assignee?.name || 'Unassigned'
    : null;

  // Calculate available width for title
  // identifier(8) + gap(1) + status(1) + gap(1) + priority(11) + gap(1) + selector(2) = 25
  const fixedWidth = 25;
  const assigneeWidth = assignee ? assignee.length + 3 : 0; // +3 for "[ ]"
  const availableWidth = Math.max(20, terminalWidth - fixedWidth - assigneeWidth);
  
  // Truncate title if it's too long
  const displayTitle = issue.title.length > availableWidth 
    ? `${issue.title.slice(0, availableWidth - 3)}...`
    : issue.title;

  return (
    <Box gap={1}>
      <Text>{issue.identifier.padEnd(8)}</Text>
      <StatusBadge status={issue.state?.name || 'Unknown'} />
      <PriorityBadge priority={issue.priority} />
      <Text>{displayTitle}</Text>
      {assignee && <Text color="dim">[{assignee}]</Text>}
    </Box>
  );
};
