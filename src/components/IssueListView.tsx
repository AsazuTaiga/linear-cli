import React, { useState, useEffect, useMemo } from 'react';
import { Box, Text, useInput, useStdout } from 'ink';
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
  const { stdout } = useStdout();
  
  // ターミナルの高さを取得し、表示可能な行数を計算
  const terminalHeight = stdout.rows || 20;
  // ヘッダーやその他のUI要素のために余裕を持たせる
  const maxVisibleItems = Math.max(5, terminalHeight - 10);
  
  // 表示範囲を計算
  const visibleRange = useMemo(() => {
    const halfVisible = Math.floor(maxVisibleItems / 2);
    let start = Math.max(0, selectedIndex - halfVisible);
    let end = Math.min(sortedIssues.length, start + maxVisibleItems);
    
    // 最後の方で表示項目が少なくなる場合は、開始位置を調整
    if (end - start < maxVisibleItems && start > 0) {
      start = Math.max(0, end - maxVisibleItems);
    }
    
    return { start, end };
  }, [selectedIndex, sortedIssues.length, maxVisibleItems]);
  
  const visibleIssues = sortedIssues.slice(visibleRange.start, visibleRange.end);

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
      {/* スクロールインジケーター（上） */}
      {visibleRange.start > 0 && (
        <Box marginBottom={1}>
          <Text dimColor>↑ {visibleRange.start}件のIssueがあります</Text>
        </Box>
      )}
      
      {/* Issue一覧 */}
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
      
      {/* スクロールインジケーター（下） */}
      {visibleRange.end < sortedIssues.length && (
        <Box marginTop={1}>
          <Text dimColor>↓ {sortedIssues.length - visibleRange.end}件のIssueがあります</Text>
        </Box>
      )}
    </Box>
  );
};