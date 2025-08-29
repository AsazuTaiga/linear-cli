export const getStatusColor = (status: string): string => {
  const statusLower = status.toLowerCase();
  
  switch (statusLower) {
    case 'todo':
    case 'backlog':
      return 'gray';
    case 'in progress':
    case 'in_progress':
      return 'yellow';
    case 'in review':
    case 'in_review':
      return 'cyan';
    case 'done':
    case 'completed':
    case 'canceled':
    case 'cancelled':
      return 'green';
    default:
      return 'white';
  }
};

export const getStatusEmoji = (status: string): string => {
  const statusLower = status.toLowerCase();
  
  switch (statusLower) {
    case 'todo':
    case 'backlog':
      return '📝';
    case 'in progress':
    case 'in_progress':
      return '🔄';
    case 'in review':
    case 'in_review':
      return '👀';
    case 'done':
    case 'completed':
      return '✅';
    case 'canceled':
    case 'cancelled':
      return '❌';
    default:
      return '❓';
  }
};

export const getPriorityLabel = (priority: number | undefined): string => {
  if (priority === undefined || priority === null) return '';
  
  switch (priority) {
    case 0:
      return '🔴 Urgent';
    case 1:
      return '🟠 High';
    case 2:
      return '🟡 Medium';
    case 3:
      return '🔵 Low';
    case 4:
      return '⚪ None';
    default:
      return '';
  }
};

export const formatIssueLabel = (issue: any): string => {
  const status = issue.state?.name || 'Unknown';
  const emoji = getStatusEmoji(status);
  const priority = issue.priority !== undefined ? ` P${issue.priority}` : '';
  
  return `${issue.identifier} ${emoji}${priority} ${issue.title}`;
};