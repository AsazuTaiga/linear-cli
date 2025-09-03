import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CacheService } from '../cache';

describe('CacheService', () => {
  let cacheService: CacheService;

  beforeEach(() => {
    cacheService = new CacheService();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('set and get', () => {
    it('should store and retrieve data', () => {
      const testData = { id: 1, name: 'Test Issue' };
      cacheService.set('test-key', testData);
      
      const retrieved = cacheService.get('test-key');
      expect(retrieved).toEqual(testData);
    });

    it('should return null for non-existent key', () => {
      const retrieved = cacheService.get('non-existent');
      expect(retrieved).toBeNull();
    });

    it('should respect custom TTL', () => {
      const testData = 'test-value';
      cacheService.set('test-key', testData, 1000); // 1 second TTL
      
      // Data should be available immediately
      expect(cacheService.get('test-key')).toBe(testData);
      
      // Advance time by 999ms - should still be available
      vi.advanceTimersByTime(999);
      expect(cacheService.get('test-key')).toBe(testData);
      
      // Advance time by 2ms more (total 1001ms) - should be expired
      vi.advanceTimersByTime(2);
      expect(cacheService.get('test-key')).toBeNull();
    });

    it('should use default TTL when not specified', () => {
      const testData = 'test-value';
      cacheService.set('test-key', testData);
      
      // Data should be available immediately
      expect(cacheService.get('test-key')).toBe(testData);
      
      // Advance time by 5 minutes minus 1ms - should still be available
      vi.advanceTimersByTime(5 * 60 * 1000 - 1);
      expect(cacheService.get('test-key')).toBe(testData);
      
      // Advance time by 2ms more - should be expired
      vi.advanceTimersByTime(2);
      expect(cacheService.get('test-key')).toBeNull();
    });
  });

  describe('delete', () => {
    it('should remove cached item', () => {
      cacheService.set('test-key', 'test-value');
      expect(cacheService.get('test-key')).toBe('test-value');
      
      cacheService.delete('test-key');
      expect(cacheService.get('test-key')).toBeNull();
    });

    it('should handle deleting non-existent key gracefully', () => {
      expect(() => cacheService.delete('non-existent')).not.toThrow();
    });
  });

  describe('clear', () => {
    it('should remove all cached items', () => {
      cacheService.set('key1', 'value1');
      cacheService.set('key2', 'value2');
      cacheService.set('key3', 'value3');
      
      expect(cacheService.get('key1')).toBe('value1');
      expect(cacheService.get('key2')).toBe('value2');
      expect(cacheService.get('key3')).toBe('value3');
      
      cacheService.clear();
      
      expect(cacheService.get('key1')).toBeNull();
      expect(cacheService.get('key2')).toBeNull();
      expect(cacheService.get('key3')).toBeNull();
    });
  });

  describe('cache expiration', () => {
    it('should automatically remove expired items on get', () => {
      cacheService.set('short-ttl', 'value1', 1000);
      cacheService.set('long-ttl', 'value2', 10000);
      
      // Advance time by 5 seconds
      vi.advanceTimersByTime(5000);
      
      // Short TTL item should be expired and removed
      expect(cacheService.get('short-ttl')).toBeNull();
      
      // Long TTL item should still be available
      expect(cacheService.get('long-ttl')).toBe('value2');
    });
  });
});