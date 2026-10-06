import React from 'react';
import { getStatusBadgeConfig } from '../utils/formatters';

const StatusBadge = ({ status, size = 'normal' }) => {
  const config = getStatusBadgeConfig(status);

  const sizeClasses = size === 'small' 
    ? 'px-2 py-0.5 text-xs' 
    : 'px-2.5 py-1 text-xs font-semibold';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border transition-all ${config.bgClass} ${sizeClasses}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dotClass}`} />
      <span>{config.label}</span>
    </span>
  );
};

export default StatusBadge;
