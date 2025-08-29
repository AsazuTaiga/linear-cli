import React from "react";
import { Text } from "ink";

interface PriorityBadgeProps {
  priority: number | undefined;
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({ priority }) => {
  if (priority === undefined || priority === null) {
    return null;
  }

  switch (priority) {
    case 0:
      return <Text color="red">Urgent</Text>;
    case 1:
      return <Text color="orange">High</Text>;
    case 2:
      return <Text color="yellow">Medium</Text>;
    case 3:
      return <Text color="blue">Low</Text>;
    default:
      return <Text color="gray">(No priorirty)</Text>;
  }
};
