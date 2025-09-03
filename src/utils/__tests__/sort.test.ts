import { describe, expect, it } from 'vitest';
import { getStatusSortOrder, sortIssuesByStatus } from '../sort';

describe('Sort Utilities', () => {
  describe('getStatusSortOrder', () => {
    it('should return correct sort order for different statuses', () => {
      expect(getStatusSortOrder('in progress')).toBe(1);
      expect(getStatusSortOrder('in_progress')).toBe(1);
      expect(getStatusSortOrder('in review')).toBe(2);
      expect(getStatusSortOrder('in_review')).toBe(2);
      expect(getStatusSortOrder('todo')).toBe(3);
      expect(getStatusSortOrder('backlog')).toBe(3);
      expect(getStatusSortOrder('done')).toBe(4);
      expect(getStatusSortOrder('completed')).toBe(4);
      expect(getStatusSortOrder('canceled')).toBe(5);
      expect(getStatusSortOrder('cancelled')).toBe(5);
      expect(getStatusSortOrder('unknown')).toBe(6);
    });

    it('should be case insensitive', () => {
      expect(getStatusSortOrder('IN PROGRESS')).toBe(1);
      expect(getStatusSortOrder('Todo')).toBe(3);
      expect(getStatusSortOrder('DONE')).toBe(4);
    });
  });

  describe('sortIssuesByStatus', () => {
    it('should sort issues by status order', () => {
      const issues = [
        { id: '1', state: { name: 'Done' } },
        { id: '2', state: { name: 'In Progress' } },
        { id: '3', state: { name: 'Todo' } },
        { id: '4', state: { name: 'In Review' } },
      ];

      const sorted = sortIssuesByStatus(issues);
      
      expect(sorted[0].id).toBe('2'); // In Progress
      expect(sorted[1].id).toBe('4'); // In Review
      expect(sorted[2].id).toBe('3'); // Todo
      expect(sorted[3].id).toBe('1'); // Done
    });

    it('should sort by priority within the same status', () => {
      const issues = [
        { id: '1', state: { name: 'In Progress' }, priority: 3 },
        { id: '2', state: { name: 'In Progress' }, priority: 1 },
        { id: '3', state: { name: 'In Progress' }, priority: 2 },
        { id: '4', state: { name: 'In Progress' }, priority: 0 },
      ];

      const sorted = sortIssuesByStatus(issues);
      
      expect(sorted[0].id).toBe('4'); // Priority 0 (Urgent)
      expect(sorted[1].id).toBe('2'); // Priority 1 (High)
      expect(sorted[2].id).toBe('3'); // Priority 2 (Medium)
      expect(sorted[3].id).toBe('1'); // Priority 3 (Low)
    });

    it('should handle issues without priority', () => {
      const issues = [
        { id: '1', state: { name: 'Todo' }, priority: 1 },
        { id: '2', state: { name: 'Todo' } }, // No priority
        { id: '3', state: { name: 'Todo' }, priority: 2 },
      ];

      const sorted = sortIssuesByStatus(issues);
      
      expect(sorted[0].id).toBe('1'); // Priority 1
      expect(sorted[1].id).toBe('3'); // Priority 2
      expect(sorted[2].id).toBe('2'); // No priority (treated as 999)
    });

    it('should handle issues without state', () => {
      const issues = [
        { id: '1', state: { name: 'In Progress' } },
        { id: '2' }, // No state
        { id: '3', state: { name: 'Todo' } },
      ];

      const sorted = sortIssuesByStatus(issues);
      
      expect(sorted[0].id).toBe('1'); // In Progress
      expect(sorted[1].id).toBe('3'); // Todo
      expect(sorted[2].id).toBe('2'); // No state (treated as unknown)
    });

    it('should not mutate the original array', () => {
      const issues = [
        { id: '1', state: { name: 'Done' } },
        { id: '2', state: { name: 'In Progress' } },
      ];
      
      const original = [...issues];
      const sorted = sortIssuesByStatus(issues);
      
      // Original array should not be changed
      expect(issues).toEqual(original);
      // Sorted array should be different
      expect(sorted).not.toBe(issues);
      expect(sorted[0].id).toBe('2');
      expect(sorted[1].id).toBe('1');
    });

    it('should handle empty array', () => {
      const sorted = sortIssuesByStatus([]);
      expect(sorted).toEqual([]);
    });

    it('should handle complex sorting scenario', () => {
      const issues = [
        { id: '1', state: { name: 'Done' }, priority: 1 },
        { id: '2', state: { name: 'In Progress' }, priority: 2 },
        { id: '3', state: { name: 'Todo' }, priority: 0 },
        { id: '4', state: { name: 'In Review' }, priority: 1 },
        { id: '5', state: { name: 'In Progress' }, priority: 0 },
        { id: '6', state: { name: 'Cancelled' }, priority: 3 },
        { id: '7', state: { name: 'Todo' }, priority: 2 },
      ];

      const sorted = sortIssuesByStatus(issues);
      
      // Expected order:
      // 1. In Progress (P0, P2)
      expect(sorted[0].id).toBe('5'); // In Progress P0
      expect(sorted[1].id).toBe('2'); // In Progress P2
      // 2. In Review (P1)
      expect(sorted[2].id).toBe('4'); // In Review P1
      // 3. Todo (P0, P2)
      expect(sorted[3].id).toBe('3'); // Todo P0
      expect(sorted[4].id).toBe('7'); // Todo P2
      // 4. Done (P1)
      expect(sorted[5].id).toBe('1'); // Done P1
      // 5. Cancelled (P3)
      expect(sorted[6].id).toBe('6'); // Cancelled P3
    });
  });
});