import { render } from 'ink-testing-library';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { App } from '../App';

// Mock child components
vi.mock('../MyIssues', () => ({
  MyIssues: ({ mode, onSelectIssue }: any) => {
    return <>{`MyIssues: ${mode}`}</>;
  },
}));

vi.mock('../CycleIssues', () => ({
  CycleIssues: ({ onSelectIssue }: any) => {
    return <>CycleIssues</>;
  },
}));

vi.mock('../IssueDetail', () => ({
  IssueDetail: ({ issue }: any) => {
    return <>{`IssueDetail: ${issue.identifier}`}</>;
  },
}));

describe('App Component', () => {
  it('should render menu by default', () => {
    const { lastFrame } = render(<App />);
    expect(lastFrame()).toContain('What would you like to do?');
    expect(lastFrame()).toContain('My Issues (Current Cycle)');
    expect(lastFrame()).toContain('All My Issues');
    expect(lastFrame()).toContain('Team Cycle Issues');
    expect(lastFrame()).toContain('Exit');
  });

  it('should render my issues view when defaultView is mine', () => {
    const { lastFrame } = render(<App defaultView="mine" />);
    expect(lastFrame()).toContain('MyIssues: current-cycle');
  });

  it('should render all my issues view when defaultView is mine-all', () => {
    const { lastFrame } = render(<App defaultView="mine-all" />);
    expect(lastFrame()).toContain('MyIssues: all');
  });

  it('should render cycle issues view when defaultView is cycle', () => {
    const { lastFrame } = render(<App defaultView="cycle" />);
    expect(lastFrame()).toContain('CycleIssues');
  });

  it('should navigate back to menu on q key press', () => {
    const { lastFrame, stdin } = render(<App defaultView="mine" />);
    
    // Initially should show MyIssues
    expect(lastFrame()).toContain('MyIssues: current-cycle');
    
    // Press q to go back to menu
    stdin.write('q');
    expect(lastFrame()).toContain('What would you like to do?');
  });

  it('should navigate back to menu on escape key press', () => {
    const { lastFrame, stdin } = render(<App defaultView="cycle" />);
    
    // Initially should show CycleIssues
    expect(lastFrame()).toContain('CycleIssues');
    
    // Press escape to go back to menu
    stdin.write('\x1B'); // ESC character
    expect(lastFrame()).toContain('What would you like to do?');
  });
});