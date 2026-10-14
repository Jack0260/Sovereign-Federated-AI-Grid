import { useState, useMemo } from 'react';
import { cn } from '@/lib/cn';
import { ChevronUp, ChevronDown, Search } from 'lucide-react';

export interface Column<T> {
  key: string;
  label: string;
  render?: (row: T) => React.ReactNode;
  sortValue?: (row: T) => string | number;
  className?: string;
  width?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  rowKey: (row: T) => string;
  searchable?: boolean;
  searchPlaceholder?: string;
  emptyMessage?: string;
  maxHeight?: string;
  onRowClick?: (row: T) => void;
}

export function DataTable<T>({
  columns,
  data,
  rowKey,
  searchable,
  searchPlaceholder = 'Search...',
  emptyMessage = 'No data available',
  maxHeight = '400px',
  onRowClick,
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [search, setSearch] = useState('');

  const sortedData = useMemo(() => {
    let result = [...data];
    if (search) {
      const lower = search.toLowerCase();
      result = result.filter((row) =>
        columns.some((col) => {
          const val = col.sortValue ? col.sortValue(row) : (row as Record<string, unknown>)[col.key];
          return String(val).toLowerCase().includes(lower);
        })
      );
    }
    if (sortKey) {
      const col = columns.find((c) => c.key === sortKey);
      if (col?.sortValue) {
        result.sort((a, b) => {
          const aVal = col.sortValue!(a);
          const bVal = col.sortValue!(b);
          const cmp = typeof aVal === 'number' && typeof bVal === 'number'
            ? aVal - bVal
            : String(aVal).localeCompare(String(bVal));
          return sortDir === 'asc' ? cmp : -cmp;
        });
      }
    }
    return result;
  }, [data, columns, sortKey, sortDir, search]);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  return (
    <div className="flex flex-col">
      {searchable && (
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={searchPlaceholder}
            className="input-base pl-9"
            aria-label="Search table"
          />
        </div>
      )}
      <div className="overflow-auto" style={{ maxHeight }}>
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-secondary-50 dark:bg-secondary-900 z-10">
            <tr className="border-b border-secondary-200 dark:border-secondary-800">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    'text-left px-3 py-2 text-xs font-medium uppercase tracking-wider text-secondary-500 dark:text-secondary-400',
                    col.sortValue && 'cursor-pointer hover:text-secondary-700 dark:hover:text-secondary-200',
                    col.width,
                    col.className
                  )}
                  onClick={() => col.sortValue && handleSort(col.key)}
                >
                  <span className="inline-flex items-center gap-1">
                    {col.label}
                    {col.sortValue && sortKey === col.key && (
                      sortDir === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="text-center py-8 text-secondary-400 text-sm">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              sortedData.map((row) => (
                <tr
                  key={rowKey(row)}
                  className={cn(
                    'border-b border-secondary-100 dark:border-secondary-800/50 transition-colors',
                    onRowClick && 'cursor-pointer hover:bg-secondary-50 dark:hover:bg-secondary-800/50'
                  )}
                  onClick={() => onRowClick?.(row)}
                >
                  {columns.map((col) => (
                    <td key={col.key} className={cn('px-3 py-2.5 text-secondary-700 dark:text-secondary-300', col.className)}>
                      {col.render ? col.render(row) : String((row as Record<string, unknown>)[col.key] ?? '')}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
