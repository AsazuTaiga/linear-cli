import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import { Box, Text, useInput, useStdout } from 'ink';
import type React from 'react';
import { useState } from 'react';

const execAsync = promisify(exec);

interface Issue {
  id: string;
  identifier: string;
  title: string;
  description?: string;
  priority?: number;
  url: string;
  state: {
    name: string;
    color: string;
  };
  assignee?: {
    displayName: string;
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

interface IssueDetailProps {
  issue: Issue;
}

export const IssueDetail: React.FC<IssueDetailProps> = ({ issue }) => {
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState<string | null>(null);
  const [_selectedLinkIndex, _setSelectedLinkIndex] = useState<number | null>(null);
  const [scrollOffset, setScrollOffset] = useState(0);
  const { stdout } = useStdout();

  useInput((input, key) => {
    if (input === 'c') {
      copyToClipboard();
    } else if (/^[1-9]$/.test(input)) {
      const index = parseInt(input, 10) - 1;
      const links = getAllLinks();
      if (index < links.length) {
        openLink(links[index].url);
      }
    } else if (key.upArrow || input === 'k') {
      setScrollOffset((prev) => Math.max(0, prev - 1));
    } else if (key.downArrow || input === 'j') {
      setScrollOffset((prev) => prev + 1);
    }
  });

  const copyToClipboard = async () => {
    setCopied(false);
    setCopyError(null);

    try {
      // Format issue content
      const issueContent = formatIssueForClaude(issue);

      // Use temporary file to pass to pbcopy (avoid special character issues)
      const safeIdentifier = issue.identifier.replace(/[^a-zA-Z0-9-]/g, '_');
      const tmpFile = `/tmp/linear-issue-${safeIdentifier}.txt`;
      const fs = await import('node:fs/promises');
      await fs.writeFile(tmpFile, issueContent, 'utf-8');

      // Copy to clipboard with pbcopy command
      await execAsync(`pbcopy < ${tmpFile}`);

      // Delete temporary file
      await fs.unlink(tmpFile);

      // Show success message
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (error) {
      setCopyError(error instanceof Error ? error.message : 'Unknown error');
      setTimeout(() => {
        setCopyError(null);
      }, 3000);
    }
  };

  const openLink = async (url: string) => {
    try {
      await execAsync(`open "${url}"`);
    } catch (_error) {
      // Ignore error (for environments where browser cannot be opened)
    }
  };

  const getAllLinks = () => {
    const links: Array<{ title: string; url: string; type: string }> = [];

    // Add Linear Issue URL first
    links.push({
      title: `${issue.identifier} (Linear)`,
      url: issue.url,
      type: 'linear',
    });

    // Add attachments (GitHub PRs, etc.)
    if (issue.attachments?.nodes) {
      issue.attachments.nodes.forEach((attachment) => {
        let title = attachment.title || 'Link';
        // Special notation for GitHub PRs
        if (attachment.sourceType === 'github' && attachment.url.includes('/pull/')) {
          const prMatch = attachment.url.match(/pull\/(\d+)/);
          if (prMatch) {
            title = `PR #${prMatch[1]} (GitHub)`;
          }
        } else if (attachment.sourceType === 'github') {
          title = `${title} (GitHub)`;
        }
        links.push({
          title,
          url: attachment.url,
          type: attachment.sourceType || 'other',
        });
      });
    }

    return links;
  };

  const formatIssueForClaude = (issue: Issue): string => {
    const parts = [
      `Linear Issue: ${issue.identifier}`,
      `Title: ${issue.title}`,
      `Status: ${issue.state.name}`,
    ];

    if (issue.assignee) {
      parts.push(`Assignee: ${issue.assignee.displayName}`);
    }

    if (issue.description) {
      parts.push('', 'Details:', issue.description);
    }

    parts.push('', `URL: ${issue.url}`);
    parts.push('', '---', 'Please work on tasks related to this issue.');

    return parts.join('\n');
  };

  // Calculate displayable line count
  const terminalHeight = stdout.rows || 20;
  const contentHeight = Math.max(5, terminalHeight - 5); // Margin for command line and scroll indicators

  // Split description text by lines (simple implementation)
  const descriptionLines = issue.description
    ? issue.description.split('\n').flatMap((line) => {
        const maxWidth = 80; // Maximum line width
        const lines = [];
        for (let i = 0; i < line.length; i += maxWidth) {
          lines.push(line.slice(i, i + maxWidth));
        }
        return lines.length > 0 ? lines : [''];
      })
    : [];

  // Compose entire content
  const allContent = [];

  // Header information
  allContent.push({ type: 'header', content: `${issue.identifier} - ${issue.title}` });
  allContent.push({
    type: 'status',
    content: `Status: ${issue.state.name}${issue.assignee ? ` | Assignee: ${issue.assignee.displayName}` : ''}`,
  });

  // Description (display directly without blank lines)
  if (descriptionLines.length > 0) {
    allContent.push({ type: 'label', content: 'Details:' });
    descriptionLines.forEach((line) => {
      allContent.push({ type: 'description', content: line });
    });
  }

  // Links (insert blank line only if description exists)
  const links = getAllLinks();
  if (links.length > 0) {
    if (descriptionLines.length > 0) {
      allContent.push({ type: 'empty', content: '' });
    }
    allContent.push({ type: 'label', content: 'Links:' });
    links.forEach((link, index) => {
      allContent.push({ type: 'link', content: `[${index + 1}] ${link.title}` });
    });
  }

  // Calculate scroll range
  const visibleContent = allContent.slice(scrollOffset, scrollOffset + contentHeight);
  const hasMoreAbove = scrollOffset > 0;
  const hasMoreBelow = scrollOffset + contentHeight < allContent.length;

  return (
    <Box flexDirection="column">
      {hasMoreAbove && <Text dimColor>↑ More above</Text>}

      {visibleContent.map((item, index) => {
        switch (item.type) {
          case 'header':
            return (
              <Box key={index}>
                <Text bold color="cyan">
                  {item.content}
                </Text>
              </Box>
            );
          case 'status':
            return (
              <Box key={index}>
                <Text>{item.content}</Text>
              </Box>
            );
          case 'label':
            return (
              <Box key={index}>
                <Text bold dimColor>
                  {item.content}
                </Text>
              </Box>
            );
          case 'description':
            return (
              <Box key={index} paddingLeft={2}>
                <Text>{item.content}</Text>
              </Box>
            );
          case 'link':
            return (
              <Box key={index} paddingLeft={2}>
                <Text color="blue">{item.content}</Text>
              </Box>
            );
          case 'empty':
            return <Box key={index} />;
          default:
            return null;
        }
      })}

      {hasMoreBelow && <Text dimColor>↓ More below</Text>}

      {copied && (
        <Box marginTop={1}>
          <Text color="green">✓ Copied to clipboard!</Text>
        </Box>
      )}

      {copyError && (
        <Box marginTop={1}>
          <Text color="red">Error: {copyError}</Text>
        </Box>
      )}

      <Box marginTop={1}>
        <Text dimColor>
          [↑↓/jk] Scroll [1-9] Open link [c] Copy to clipboard [q/Esc] Back
        </Text>
      </Box>
    </Box>
  );
};
