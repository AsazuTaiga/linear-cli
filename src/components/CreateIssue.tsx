import { Box, Text, useInput } from 'ink';
import TextInput from 'ink-text-input';
import type React from 'react';
import { useState } from 'react';
import { linearClient } from '../services/linear.js';

interface CreateIssueProps {
  onComplete: () => void;
  onCancel: () => void;
}

export const CreateIssue: React.FC<CreateIssueProps> = ({ onComplete, onCancel }) => {
  const [step, setStep] = useState<'title' | 'description' | 'priority' | 'creating'>('title');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    setStep('creating');
    setError(null);

    try {
      const priorityNumber = priority ? parseInt(priority, 10) : undefined;
      await linearClient.createIssue({
        title: title.trim(),
        description: description.trim() || undefined,
        priority: priorityNumber,
      });

      onComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create issue');
      setStep('title');
    }
  };

  useInput((_input, key) => {
    if (key.escape) {
      onCancel();
    }
  });

  if (step === 'creating') {
    return (
      <Box flexDirection="column">
        <Text color="cyan">Creating issue...</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column">
      <Text bold color="cyan">Create New Issue</Text>
      
      <Box marginTop={1}>
        <Text>Title: </Text>
        {step === 'title' ? (
          <TextInput
            value={title}
            onChange={setTitle}
            onSubmit={() => {
              if (title.trim()) {
                setStep('description');
              }
            }}
            placeholder="Enter issue title..."
          />
        ) : (
          <Text>{title}</Text>
        )}
      </Box>

      {(step === 'description' || step === 'priority') && (
        <Box marginTop={1}>
          <Text>Description: </Text>
          {step === 'description' ? (
            <TextInput
              value={description}
              onChange={setDescription}
              onSubmit={() => setStep('priority')}
              placeholder="Enter description (optional)..."
            />
          ) : (
            <Text>{description || '(none)'}</Text>
          )}
        </Box>
      )}

      {step === 'priority' && (
        <Box marginTop={1}>
          <Text>Priority (0=Urgent, 1=High, 2=Medium, 3=Low, 4=None): </Text>
          <TextInput
            value={priority}
            onChange={setPriority}
            onSubmit={handleSubmit}
            placeholder="Enter priority (optional)..."
          />
        </Box>
      )}

      {error && (
        <Box marginTop={1}>
          <Text color="red">Error: {error}</Text>
        </Box>
      )}

      <Box marginTop={1}>
        <Text dimColor>
          Press Enter to continue, Escape to cancel
        </Text>
      </Box>
    </Box>
  );
};