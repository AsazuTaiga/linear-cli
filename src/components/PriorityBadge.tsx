import React from "react";
import { Text } from "ink";

interface PriorityBadgeProps {
  priority: number | undefined;
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({ priority }) => {
  if (priority === undefined || priority === null) {
    return <Text color="gray">{'No Priority'.padEnd(11)}</Text>;
  }

  switch (priority) {
    case 0:
      return <Text color="red">{'Urgent'.padEnd(11)}</Text>;
    case 1:
      return <Text color="orange">{'High'.padEnd(11)}</Text>;
    case 2:
      return <Text color="yellow">{'Medium'.padEnd(11)}</Text>;
    case 3:
      return <Text color="blue">{'Low'.padEnd(11)}</Text>;
    default:
      return <Text color="gray">{'No Priority'.padEnd(11)}</Text>;
  }
};
