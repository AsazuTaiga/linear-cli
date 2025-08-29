import React, { useState } from 'react';
import { Box, Text, useInput, useApp } from 'ink';
import SelectInput from 'ink-select-input';
import { MyIssues } from './MyIssues.js';
import { CycleIssues } from './CycleIssues.js';

export const App: React.FC = () => {
  const { exit } = useApp();
  const [selectedAction, setSelectedAction] = useState<string | null>(null);

  useInput((input, key) => {
    if (input === 'q' || key.escape) {
      exit();
    }
  });

  const items = [
    { label: '📋 自分のIssue（現在のサイクル）', value: 'my-issues-current' },
    { label: '📁 自分のすべてのIssue', value: 'my-issues-all' },
    { label: '🔄 現在のサイクルのIssue', value: 'cycle-issues' },
    { label: '➕ Issue作成', value: 'create-issue' },
    { label: '🔍 Issue検索', value: 'search-issues' },
    { label: '📊 プロジェクト一覧', value: 'list-projects' },
    { label: '⚙️  設定', value: 'config' },
    { label: '🚪 終了', value: 'exit' },
  ];

  const handleSelect = (item: { label: string; value: string }) => {
    if (item.value === 'exit') {
      exit();
    }
    setSelectedAction(item.value);
  };

  return (
    <Box flexDirection="column" paddingY={1}>
      <Box marginBottom={1}>
        <Text bold color="cyan">
          🚀 Linear CLI
        </Text>
      </Box>
      
      {!selectedAction ? (
        <>
          <Text dimColor>何をしますか？ (↑↓で選択、Enterで決定、qで終了)</Text>
          <Box marginTop={1}>
            <SelectInput items={items} onSelect={handleSelect} />
          </Box>
        </>
      ) : (
        <>
          {selectedAction === 'my-issues-current' && <MyIssues mode="current-cycle" />}
          {selectedAction === 'my-issues-all' && <MyIssues mode="all" />}
          {selectedAction === 'cycle-issues' && <CycleIssues />}
          {(selectedAction === 'create-issue' || 
            selectedAction === 'search-issues' || 
            selectedAction === 'list-projects' || 
            selectedAction === 'config') && (
            <Box flexDirection="column">
              <Text>🚧 {items.find(i => i.value === selectedAction)?.label} (実装中...)</Text>
              <Box marginTop={1}>
                <Text dimColor>qまたはEscで戻る</Text>
              </Box>
            </Box>
          )}
        </>
      )}
    </Box>
  );
};