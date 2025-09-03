export const getStatusSortOrder = (status: string): number => {
  const statusLower = status.toLowerCase();

  switch (statusLower) {
    case 'in progress':
    case 'in_progress':
      return 1;
    case 'in review':
    case 'in_review':
      return 2;
    case 'todo':
    case 'backlog':
      return 3;
    case 'done':
    case 'completed':
      return 4;
    case 'canceled':
    case 'cancelled':
      return 5;
    default:
      return 6;
  }
};

export const sortIssuesByStatus = (issues: any[]): any[] => {
  return [...issues].sort((a, b) => {
    const orderA = getStatusSortOrder(a.state?.name || '');
    const orderB = getStatusSortOrder(b.state?.name || '');

    // Sort by status first
    if (orderA !== orderB) {
      return orderA - orderB;
    }

    // If same status, sort by priority (higher priority first)
    const priorityA = a.priority ?? 999;
    const priorityB = b.priority ?? 999;

    return priorityA - priorityB;
  });
};
