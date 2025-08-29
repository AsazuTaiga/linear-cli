import React from "react";
import { Text } from "ink";

interface StatusBadgeProps {
  status: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const statusLower = status.toLowerCase();

  switch (statusLower) {
    case "todo":
      return <Text color="white">◯</Text>;
    case "backlog":
      return <Text color="gray">ー</Text>;
    case "in_progress":
    case "in progress":
    case "inprogress":
      return <Text color="yellow">⬤</Text>;
    case "in_review":
    case "in review":
    case "inreview":
      return <Text color="green">⬤</Text>;
    case "done":
    case "completed":
      return <Text color="magenta">⬤</Text>;
    case "canceled":
    case "cancelled":
      return <Text color="gray">⬤</Text>;
    default:
      return <Text>{statusLower}</Text>;
  }
};
