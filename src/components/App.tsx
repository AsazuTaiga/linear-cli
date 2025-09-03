import { Box, Text, useApp, useInput } from 'ink';
import SelectInput from 'ink-select-input';
import type React from 'react';
import { useReducer } from 'react';
import { CreateIssue } from './CreateIssue.js';
import { CycleIssues } from './CycleIssues.js';
import { IssueDetail } from './IssueDetail.js';
import { MyIssues } from './MyIssues.js';
import { SearchIssues } from './SearchIssues.js';

interface AppProps {
  defaultView?: 'mine' | 'mine-all' | 'cycle' | 'create-issue' | 'search';
}

type ViewType = 'menu' | 'mine' | 'mine-all' | 'cycle' | 'issue-detail' | 'create-issue' | 'search';

interface AppState {
  currentView: ViewType;
  previousView: ViewType | null;
  selectedIssue: any | null;
}

type AppAction =
  | { type: 'SHOW_MENU' }
  | { type: 'SELECT_VIEW'; view: ViewType }
  | { type: 'SELECT_ISSUE'; issue: any; fromView: ViewType }
  | { type: 'GO_BACK' };

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SHOW_MENU':
      return { ...state, currentView: 'menu', previousView: null, selectedIssue: null };
    case 'SELECT_VIEW':
      return { ...state, currentView: action.view, previousView: 'menu' };
    case 'SELECT_ISSUE':
      return {
        ...state,
        currentView: 'issue-detail',
        previousView: action.fromView,
        selectedIssue: action.issue,
      };
    case 'GO_BACK':
      if (state.currentView === 'issue-detail' && state.previousView) {
        // Go back from issue detail to previous list view
        return {
          ...state,
          currentView: state.previousView,
          previousView: 'menu',
          selectedIssue: null,
        };
      } else if (state.currentView !== 'menu') {
        // Go back from issue list to menu
        return {
          ...state,
          currentView: 'menu',
          previousView: null,
          selectedIssue: null,
        };
      }
      return state;
    default:
      return state;
  }
}

export const App: React.FC<AppProps> = ({ defaultView = 'mine' }) => {
  const { exit } = useApp();
  const [state, dispatch] = useReducer(appReducer, {
    currentView: defaultView as ViewType,
    previousView: 'menu',
    selectedIssue: null,
  });

  useInput((input, key) => {
    if (input === 'q' || key.escape) {
      switch (state.currentView) {
        case 'menu':
          exit();
          break;
        case 'issue-detail':
        case 'mine':
        case 'mine-all':
        case 'cycle':
        case 'create-issue':
        case 'search':
          dispatch({ type: 'GO_BACK' });
          break;
      }
    }
  });

  const items = [
    { label: '📋 My Issues (Current Cycle)', value: 'mine' },
    { label: '📁 All My Issues', value: 'mine-all' },
    { label: '🔄 Team Cycle Issues', value: 'cycle' },
    { label: '🔍 Search Issues', value: 'search' },
    { label: '➕ Create New Issue', value: 'create-issue' },
    { label: '🚪 Exit', value: 'exit' },
  ];

  const handleSelect = (item: { label: string; value: string }) => {
    if (item.value === 'exit') {
      exit();
    } else {
      dispatch({ type: 'SELECT_VIEW', view: item.value as ViewType });
    }
  };

  const handleIssueSelect = (issue: any, fromView: ViewType) => {
    dispatch({ type: 'SELECT_ISSUE', issue, fromView });
  };

  const _handleBack = () => {
    dispatch({ type: 'GO_BACK' });
  };

  return (
    <Box flexDirection="column">
      {state.currentView === 'menu' && (
        <>
          <Text dimColor>What would you like to do? (↑↓ to select, Enter to confirm, q to exit)</Text>
          <Box marginTop={1}>
            <SelectInput items={items} onSelect={handleSelect} />
          </Box>
        </>
      )}

      {state.currentView === 'mine' && (
        <MyIssues
          mode="current-cycle"
          onSelectIssue={(issue) => handleIssueSelect(issue, 'mine')}
        />
      )}

      {state.currentView === 'mine-all' && (
        <MyIssues mode="all" onSelectIssue={(issue) => handleIssueSelect(issue, 'mine-all')} />
      )}

      {state.currentView === 'cycle' && (
        <CycleIssues onSelectIssue={(issue) => handleIssueSelect(issue, 'cycle')} />
      )}

      {state.currentView === 'issue-detail' && state.selectedIssue && (
        <IssueDetail issue={state.selectedIssue} />
      )}

      {state.currentView === 'create-issue' && (
        <CreateIssue
          onComplete={() => {
            dispatch({ type: 'SHOW_MENU' });
          }}
          onCancel={() => {
            dispatch({ type: 'GO_BACK' });
          }}
        />
      )}

      {state.currentView === 'search' && (
        <SearchIssues onSelectIssue={(issue) => handleIssueSelect(issue, 'search')} />
      )}
    </Box>
  );
};
