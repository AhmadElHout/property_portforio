import React from 'react';
import './Pills.css';

interface Pill {
    id: string;
    label: string;
}

interface PillsProps {
    items: Pill[];
    activeIds: string[];
    onChange: (id: string) => void;
}

const Pills = ({ items, activeIds, onChange }: PillsProps) => {
    return (
        <div className="pills-container">
            {items.map((item, index) => {
                const isActive = activeIds.includes(item.id);
                return (
                    <button
                        key={item.id}
                        type="button"
                        onClick={() => onChange(item.id)}
                        className={`pill ${isActive ? 'active' : ''}`}
                        style={{ animationDelay: `${index * 0.05}s` }}
                    >
                        {item.label}
                        {isActive && <span className="pill-check">✓</span>}
                    </button>
                );
            })}
        </div>
    );
};

export default Pills;
