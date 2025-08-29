import React, { useState } from 'react';
import { Box, Text, useInput, useApp } from 'ink';
import SelectInput from 'ink-select-input';

export const App: React.FC = () => {
  const { exit } = useApp();
  const [selectedAction, setSelectedAction] = useState<string | null>(null);

  useInput((input, key) => {
    if (input === 'q' || key.escape) {
      exit();
    }
  });

  const items = [
    { label: 'Issue一覧を見る', value: 'list-issues' },
    { label: 'Issue作成', value: 'create-issue' },
    { label: 'プロジェクト一覧', value: 'list-projects' },
    { label: '設定', value: 'config' },
    { label: '終了', value: 'exit' },
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
        <Text>選択: {selectedAction} (実装中...)</Text>
      )}
    </Box>
  );
};