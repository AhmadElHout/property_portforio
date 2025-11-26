import React from 'react';
import './Table.css';

interface Column<T> {
    header: string;
    accessor: keyof T | ((item: T) => React.ReactNode);
    width?: string;
    sortable?: boolean;
}

interface TableProps<T> {
    data: T[];
    columns: Column<T>[];
    onRowClick?: (item: T) => void;
    loading?: boolean;
    emptyMessage?: string;
}

function Table<T extends { id: number | string }>({
    data,
    columns,
    onRowClick,
    loading = false,
    emptyMessage = 'No data available'
}: TableProps<T>) {

    // Loading skeleton
    if (loading) {
        return (
            <div className="table-container">
                <table className="table">
                    <thead className="table-header">
                        <tr>
                            {columns.map((col, index) => (
                                <th key={index} className="table-header-cell">
                                    {col.header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {[...Array(5)].map((_, rowIndex) => (
                            <tr key={rowIndex}>
                                {columns.map((_, colIndex) => (
                                    <td key={colIndex} className="table-cell">
                                        <div className="skeleton" style={{ height: '16px', width: '80%' }}></div>
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    }

    return (
        <div className="table-container">
            <table className="table">
                <thead className="table-header">
                    <tr>
                        {columns.map((col, index) => (
                            <th
                                key={index}
                                className={`table-header-cell ${col.sortable ? 'sortable' : ''}`}
                                style={{ width: col.width }}
                            >
                                {col.header}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="table-body">
                    {data.length === 0 ? (
                        <tr>
                            <td colSpan={columns.length} className="table-empty">
                                <div className="empty-state">
                                    <span className="empty-icon">📭</span>
                                    <p className="empty-message">{emptyMessage}</p>
                                </div>
                            </td>
                        </tr>
                    ) : (
                        data.map((item, rowIndex) => (
                            <tr
                                key={item.id}
                                className={`table-row ${onRowClick ? 'clickable' : ''}`}
                                onClick={() => onRowClick && onRowClick(item)}
                                style={{ animationDelay: `${rowIndex * 0.05}s` }}
                            >
                                {columns.map((col, colIndex) => (
                                    <td key={colIndex} className="table-cell">
                                        {typeof col.accessor === 'function'
                                            ? col.accessor(item)
                                            : (item[col.accessor] as React.ReactNode)}
                                    </td>
                                ))}
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
}

export default Table;
