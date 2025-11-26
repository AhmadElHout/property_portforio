import React from 'react';
import './StatusBadge.css';

type StatusType =
    | 'active' | 'on_hold' | 'hold' | 'archived' | 'in_progress' | 'closed'
    | 'new' | 'in_review' | 'needs_fix' | 'ready'
    | 'success' | 'warning' | 'error' | 'info' | 'neutral';

interface StatusBadgeProps {
    status: StatusType;
    label?: string;
}

const STATUS_CONFIG: Record<StatusType, { label: string; className: string }> = {
    // Property Status
    active: { label: 'Active', className: 'status-active' },
    on_hold: { label: 'On Hold', className: 'status-hold' },
    hold: { label: 'On Hold', className: 'status-hold' },
    archived: { label: 'Archived', className: 'status-archived' },
    in_progress: { label: 'In Progress', className: 'status-in-progress' },
    closed: { label: 'Closed', className: 'status-closed' },

    // Content Status
    new: { label: 'New', className: 'status-new' },
    in_review: { label: 'In Review', className: 'status-review' },
    needs_fix: { label: 'Needs Fix', className: 'status-fix' },
    ready: { label: 'Ready', className: 'status-ready' },

    // Generic
    success: { label: 'Success', className: 'status-success' },
    warning: { label: 'Warning', className: 'status-warning' },
    error: { label: 'Error', className: 'status-error' },
    info: { label: 'Info', className: 'status-info' },
    neutral: { label: 'Neutral', className: 'status-neutral' },
};

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, label }) => {
    const config = STATUS_CONFIG[status] || STATUS_CONFIG.neutral;
    const displayLabel = label || config.label;

    return (
        <span className={`status-badge ${config.className}`}>
            <span className="status-dot"></span>
            {displayLabel}
        </span>
    );
};

export default StatusBadge;
