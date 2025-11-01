import React from 'react';
import styles from './Table.module.css';

export interface TableColumn {
  key: string;
  label: string;
  width?: string;
  align?: 'left' | 'center' | 'right';
  render?: (value: any, row: any) => React.ReactNode;
}

export interface TableProps {
  columns: TableColumn[];
  data: any[];
  onRowClick?: (row: any) => void;
  loading?: boolean;
  emptyMessage?: string;
  className?: string;
}

export const Table: React.FC<TableProps> = ({
  columns,
  data,
  onRowClick,
  loading = false,
  emptyMessage = 'No data available',
  className = '',
}) => {
  const containerClasses = [styles.container, className].filter(Boolean).join(' ');
  
  // Safety check: ensure data is always an array
  const safeData = Array.isArray(data) ? data : [];

  return (
    <div className={containerClasses}>
      <table className={styles.table}>
        <thead className={styles.thead}>
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                className={`${styles.th} ${column.align ? styles[column.align] : ''}`}
                style={{ width: column.width }}
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className={styles.tbody}>
          {safeData.map((row, index) => (
            <tr
              key={index}
              className={onRowClick ? styles.clickable : ''}
              onClick={() => onRowClick && onRowClick(row)}
            >
              {columns.map((column) => (
                <td
                  key={column.key}
                  className={`${styles.td} ${column.align ? styles[column.align] : ''}`}
                >
                  {column.render ? column.render(row[column.key], row) : row[column.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {loading && (
        <div className={styles.loading}>
          <div className={styles.spinner} />
        </div>
      )}

      {!loading && safeData.length === 0 && (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>📭</div>
          <div>{emptyMessage}</div>
        </div>
      )}
    </div>
  );
};

