import React, { useReducer } from 'react';
import { Box, Text, useInput, useApp } from 'ink';
import SelectInput from 'ink-select-input';
import { MyIssues } from './MyIssues.js';
import { CycleIssues } from './CycleIssues.js';
import { IssueDetail } from './IssueDetail.js';

interface AppProps {
  defaultView?: 'mine' | 'mine-all' | 'cycle';
}

type ViewType = 'menu' | 'mine' | 'mine-all' | 'cycle' | 'issue-detail';

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
        selectedIssue: action.issue
      };
    case 'GO_BACK':
      if (state.currentView === 'issue-detail' && state.previousView) {
        // Issue詳細から前の一覧画面に戻る
        return {
          ...state,
          currentView: state.previousView,
          previousView: 'menu',
          selectedIssue: null
        };
      } else if (state.currentView !== 'menu') {
        // Issue一覧からメニューに戻る
        return {
          ...state,
          currentView: 'menu',
          previousView: null,
          selectedIssue: null
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
    selectedIssue: null
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
          dispatch({ type: 'GO_BACK' });
          break;
      }
    }
  });

  const items = [
    { label: '📋 自分のIssue（現在のサイクル）', value: 'mine' },
    { label: '📁 自分のすべてのIssue', value: 'mine-all' },
    { label: '🔄 チーム全体のサイクルIssue', value: 'cycle' },
    { label: '🚪 終了', value: 'exit' },
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

  const handleBack = () => {
    dispatch({ type: 'GO_BACK' });
  };

  return (
    <Box flexDirection="column">
      {state.currentView === 'menu' && (
        <>
          <Text dimColor>何をしますか？ (↑↓で選択、Enterで決定、qで終了)</Text>
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
        <MyIssues 
          mode="all" 
          onSelectIssue={(issue) => handleIssueSelect(issue, 'mine-all')}
        />
      )}
      
      {state.currentView === 'cycle' && (
        <CycleIssues 
          onSelectIssue={(issue) => handleIssueSelect(issue, 'cycle')}
        />
      )}
      
      {state.currentView === 'issue-detail' && state.selectedIssue && (
        <IssueDetail 
          issue={state.selectedIssue}
        />
      )}
    </Box>
  );
};