import { describe, expect, it } from 'vitest';
import { formatIssueLabel, getPriorityLabel, getStatusColor, getStatusEmoji } from '../format';

describe('Format Utilities', () => {
  describe('getStatusColor', () => {
    it('should return correct colors for different statuses', () => {
      expect(getStatusColor('todo')).toBe('gray');
      expect(getStatusColor('backlog')).toBe('gray');
      expect(getStatusColor('in progress')).toBe('yellow');
      expect(getStatusColor('in_progress')).toBe('yellow');
      expect(getStatusColor('in review')).toBe('cyan');
      expect(getStatusColor('in_review')).toBe('cyan');
      expect(getStatusColor('done')).toBe('green');
      expect(getStatusColor('completed')).toBe('green');
      expect(getStatusColor('canceled')).toBe('green');
      expect(getStatusColor('cancelled')).toBe('green');
      expect(getStatusColor('unknown')).toBe('white');
    });

    it('should be case insensitive', () => {
      expect(getStatusColor('TODO')).toBe('gray');
      expect(getStatusColor('In Progress')).toBe('yellow');
      expect(getStatusColor('DONE')).toBe('green');
    });
  });

  describe('getStatusEmoji', () => {
    it('should return correct emojis for different statuses', () => {
      expect(getStatusEmoji('todo')).toBe('⚪');
      expect(getStatusEmoji('backlog')).toBe('⚪');
      expect(getStatusEmoji('in progress')).toBe('🟡');
      expect(getStatusEmoji('in_progress')).toBe('🟡');
      expect(getStatusEmoji('in review')).toBe('🔵');
      expect(getStatusEmoji('in_review')).toBe('🔵');
      expect(getStatusEmoji('done')).toBe('🟣');
      expect(getStatusEmoji('completed')).toBe('🟣');
      expect(getStatusEmoji('canceled')).toBe('⚫');
      expect(getStatusEmoji('cancelled')).toBe('⚫');
      expect(getStatusEmoji('unknown')).toBe('⚪');
    });

    it('should be case insensitive', () => {
      expect(getStatusEmoji('TODO')).toBe('⚪');
      expect(getStatusEmoji('In Progress')).toBe('🟡');
      expect(getStatusEmoji('DONE')).toBe('🟣');
    });
  });

  describe('getPriorityLabel', () => {
    it('should return correct labels for different priorities', () => {
      expect(getPriorityLabel(0)).toBe('🔴 Urgent');
      expect(getPriorityLabel(1)).toBe('🟠 High');
      expect(getPriorityLabel(2)).toBe('🟡 Medium');
      expect(getPriorityLabel(3)).toBe('🔵 Low');
      expect(getPriorityLabel(4)).toBe('⚪ None');
    });

    it('should return empty string for undefined or null', () => {
      expect(getPriorityLabel(undefined)).toBe('');
      expect(getPriorityLabel(null as any)).toBe('');
    });

    it('should return empty string for unknown priority values', () => {
      expect(getPriorityLabel(5)).toBe('');
      expect(getPriorityLabel(-1)).toBe('');
      expect(getPriorityLabel(999)).toBe('');
    });
  });

  describe('formatIssueLabel', () => {
    it('should format issue with all fields', () => {
      const issue = {
        identifier: 'TASK-123',
        title: 'Fix bug',
        priority: 1,
        state: { name: 'In Progress' },
      };
      
      const result = formatIssueLabel(issue);
      expect(result).toBe('TASK-123 🟡 P1 Fix bug');
    });

    it('should format issue without priority', () => {
      const issue = {
        identifier: 'TASK-456',
        title: 'New feature',
        state: { name: 'Todo' },
      };
      
      const result = formatIssueLabel(issue);
      expect(result).toBe('TASK-456 ⚪ New feature');
    });

    it('should handle missing state gracefully', () => {
      const issue = {
        identifier: 'TASK-789',
        title: 'Another task',
        priority: 2,
      };
      
      const result = formatIssueLabel(issue);
      expect(result).toBe('TASK-789 ⚪ P2 Another task');
    });

    it('should format issue with priority 0', () => {
      const issue = {
        identifier: 'URGENT-1',
        title: 'Critical issue',
        priority: 0,
        state: { name: 'In Progress' },
      };
      
      const result = formatIssueLabel(issue);
      expect(result).toBe('URGENT-1 🟡 P0 Critical issue');
    });
  });
});