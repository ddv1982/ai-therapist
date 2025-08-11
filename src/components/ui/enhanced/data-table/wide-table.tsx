/**
 * Wide Table Component System (5+ Columns)
 * Advanced responsive patterns for complex therapeutic data
 */

import React, { createContext, useContext, useState, useEffect, useCallback, forwardRef } from 'react';
import { cn } from '@/lib/utils/utils';
import {
  WideTableProps,
  WideTableStrategy,
  WideColumnDefinition,
  ColumnVisibilityState,
  ColumnManagerProps,
  WideTableContext,
  ColumnPriority,
  DEFAULT_WIDE_TABLE_CONFIG,
  DEFAULT_PRIORITY_CONFIG,
} from './table-types';
import {
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableHeader,
} from './table';

// Create context for wide table state
const WideTableContextProvider = createContext<WideTableContext | null>(null);

/**
 * Hook to access wide table context
 */
export function useWideTableContext() {
  const context = useContext(WideTableContextProvider);
  if (!context) {
    throw new Error('useWideTableContext must be used within a WideTable');
  }
  return context;
}

/**
 * Column Manager Component - Allows users to show/hide columns
 */
export function ColumnManager({
  columns,
  visibilityState,
  onVisibilityChange,
  onOrderChange: _onOrderChange,
  onReset,
  className,
}: ColumnManagerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleToggleColumn = useCallback((columnId: string) => {
    const currentState = visibilityState[columnId];
    onVisibilityChange(columnId, !currentState?.visible);
  }, [visibilityState, onVisibilityChange]);

  return (
    <div className={cn('column-manager', className)}>
      <button
        type="button"
        className="column-toggle-button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-label="Manage table columns"
      >
        Columns ({Object.values(visibilityState).filter(col => col.visible).length}/{columns.length})
      </button>
      
      {isOpen && (
        <div className="column-dropdown" role="menu">
          <div className="column-dropdown-header" style={{ padding: '0.5rem', borderBottom: '1px solid var(--table-border)' }}>
            <button
              type="button"
              onClick={onReset}
              className="text-sm opacity-70 hover:opacity-100"
            >
              Reset to default
            </button>
          </div>
          
          {columns.map((column) => {
            const isVisible = visibilityState[column.id]?.visible ?? true;
            const canToggle = !column.alwaysVisible;
            
            return (
              <label
                key={column.id}
                className={cn(
                  'column-option',
                  !canToggle && 'opacity-50 cursor-not-allowed'
                )}
              >
                <input
                  type="checkbox"
                  checked={isVisible}
                  onChange={() => canToggle && handleToggleColumn(column.id)}
                  disabled={!canToggle}
                  aria-describedby={`column-${column.id}-priority`}
                />
                <span className="flex-1">
                  {column.header}
                  {column.priority && (
                    <span
                      id={`column-${column.id}-priority`}
                      className="ml-2 text-xs opacity-60"
                    >
                      ({column.priority})
                    </span>
                  )}
                </span>
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
}

/**
 * Auto-detect optimal strategy based on table metrics
 */
function detectOptimalStrategy(
  columnCount: number,
  _containerWidth: number,
  _averageColumnWidth: number
): WideTableStrategy {
  if (columnCount <= 4) {
    return 'priority-plus';
  }
  
  // With the 5-column rule, WideTable components are only used for special cases
  // Most 6+ column data is handled by alternative views in markdown processor
  if (columnCount <= 6) {
    return 'priority-plus';
  }
  
  return 'column-toggle';
}

/**
 * Calculate column priorities based on content and position
 */
function calculateColumnPriority(
  column: WideColumnDefinition,
  index: number,
  totalColumns: number
): ColumnPriority {
  if (column.priority) {
    return column.priority;
  }
  
  // Auto-calculate priority based on position and type
  const positionScore = (totalColumns - index) / totalColumns; // Left columns get higher score
  const typeScore = DEFAULT_PRIORITY_CONFIG.dataTypeWeights[column.type || 'default'];
  const combinedScore = positionScore * DEFAULT_PRIORITY_CONFIG.positionWeight + 
                       typeScore * DEFAULT_PRIORITY_CONFIG.semanticWeight;
  
  if (combinedScore >= 0.7) return 'high';
  if (combinedScore >= 0.4) return 'medium';
  return 'low';
}

/**
 * Initialize column visibility state
 */
function initializeColumnVisibility(
  columns: WideColumnDefinition[],
  maxVisible: number,
  strategy: WideTableStrategy
): ColumnVisibilityState {
  const state: ColumnVisibilityState = {};
  
  // Calculate priorities for all columns
  const columnsWithPriority = columns.map((col, index) => ({
    ...col,
    calculatedPriority: calculateColumnPriority(col, index, columns.length),
    originalIndex: index,
  }));
  
  // Sort by priority (high -> medium -> low) and position
  columnsWithPriority.sort((a, b) => {
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    const aPriority = priorityOrder[a.calculatedPriority];
    const bPriority = priorityOrder[b.calculatedPriority];
    
    if (aPriority !== bPriority) {
      return bPriority - aPriority; // Higher priority first
    }
    
    return a.originalIndex - b.originalIndex; // Original order for same priority
  });
  
  // Set visibility based on strategy
  columnsWithPriority.forEach((col, index) => {
    let visible = true;
    
    if (strategy === 'priority-plus' || strategy === 'auto') {
      // Show always visible columns and top priority columns up to maxVisible
      visible = col.alwaysVisible || index < maxVisible;
    } else if (strategy === 'column-toggle') {
      // Show by default unless marked as hidden
      visible = !col.hiddenByDefault;
    }
    // horizontal-scroll and adaptive-cards show all columns by default
    
    state[col.id] = {
      visible,
      order: col.originalIndex,
      width: col.width,
    };
  });
  
  return state;
}

/**
 * Wide Table Component - Main component for handling 5+ column tables
 */
export const WideTable = forwardRef<HTMLTableElement, WideTableProps>(
  ({
    columns,
    children,
    strategy = 'auto',
    maxVisibleColumns = DEFAULT_WIDE_TABLE_CONFIG.maxVisibleColumns,
    _stickyFirstColumn = true,
    allowColumnManagement = true,
    showColumnManager = true,
    persistColumnPreferences = false,
    enableKeyboardNavigation = true,
    initialColumnVisibility,
    onColumnVisibilityChange,
    onColumnOrderChange,
    onColumnResize: _onColumnResize,
    columnNavigationLabel = 'Navigate table columns',
    hiddenColumnsAnnouncement,
    className,
    ...props
  }, ref) => {
    // State management
    const [columnVisibility, setColumnVisibility] = useState<ColumnVisibilityState>(() => 
      initialColumnVisibility || 
      initializeColumnVisibility(columns, maxVisibleColumns, strategy)
    );
    
    const [actualStrategy, setActualStrategy] = useState<WideTableStrategy>(strategy);
    const [containerWidth] = useState(0);

    // Calculate metrics
    const columnCount = columns.length;
    const visibleColumnCount = Object.values(columnVisibility).filter(col => col.visible).length;
    const isWide = columnCount >= 5;

    // Auto-detect strategy if set to 'auto'
    useEffect(() => {
      if (strategy === 'auto') {
        const optimalStrategy = detectOptimalStrategy(columnCount, containerWidth, 200);
        setActualStrategy(optimalStrategy);
      } else {
        setActualStrategy(strategy);
      }
    }, [strategy, columnCount, containerWidth]);

    // Handle column visibility changes
    const handleColumnVisibilityChange = useCallback((columnId: string, visible: boolean) => {
      setColumnVisibility(prev => ({
        ...prev,
        [columnId]: {
          ...prev[columnId],
          visible,
        },
      }));
      
      onColumnVisibilityChange?.(columnId, visible);
      
      // Persist preferences if enabled
      if (persistColumnPreferences) {
        localStorage.setItem(
          `table-columns-${columns[0]?.id || 'default'}`,
          JSON.stringify(columnVisibility)
        );
      }
    }, [columnVisibility, columns, onColumnVisibilityChange, persistColumnPreferences]);

    // Reset to defaults
    const handleResetColumns = useCallback(() => {
      const defaultState = initializeColumnVisibility(columns, maxVisibleColumns, actualStrategy);
      setColumnVisibility(defaultState);
    }, [columns, maxVisibleColumns, actualStrategy]);

    // Get table CSS classes based on strategy
    const getTableClasses = useCallback(() => {
      const baseClasses = ['therapeutic-table'];
      
      switch (actualStrategy) {
        case 'priority-plus':
          baseClasses.push('table-priority-plus');
          break;
        // horizontal-scroll removed - using 5-column rule instead
        case 'adaptive-cards':
          baseClasses.push('table-adaptive-cards');
          break;
        case 'column-toggle':
          baseClasses.push('table-column-toggle');
          break;
      }
      
      return baseClasses.join(' ');
    }, [actualStrategy]);

    // Get container classes
    const getContainerClasses = useCallback(() => {
      const baseClasses = ['table-container', 'table-system'];
      
      if (isWide) {
        baseClasses.push('wide-table-container');
      }
      
      // Removed scrollable-x - no horizontal scrolling with 5-column rule
      
      return baseClasses.join(' ');
    }, [isWide]);

    // Filter visible columns
    const visibleColumns = columns.filter(col => columnVisibility[col.id]?.visible !== false);

    // Sort columns by order
    const sortedColumns = [...visibleColumns].sort((a, b) => {
      const aOrder = columnVisibility[a.id]?.order ?? 0;
      const bOrder = columnVisibility[b.id]?.order ?? 0;
      return aOrder - bOrder;
    });

    // Context value
    const contextValue: WideTableContext = {
      strategy: actualStrategy,
      columnCount,
      visibleColumnCount,
      isWide,
      columnVisibility,
      setColumnVisibility,
    };

    return (
      <WideTableContextProvider.Provider value={contextValue}>
        <div className="relative">
          {/* Column Manager */}
          {showColumnManager && allowColumnManagement && (
            <ColumnManager
              columns={columns}
              visibilityState={columnVisibility}
              onVisibilityChange={handleColumnVisibilityChange}
              onOrderChange={onColumnOrderChange || (() => {})}
              onReset={handleResetColumns}
            />
          )}

          {/* Table Container */}
          <div 
            className={getContainerClasses()}
            data-keyboard-nav={enableKeyboardNavigation}
            aria-label={columnNavigationLabel}
          >
            <Table
              ref={ref}
              className={cn(getTableClasses(), className)}
              {...props}
            >
              {children || (
                <>
                  <TableHead>
                    <TableRow>
                      {sortedColumns.map((column, index) => (
                        <TableHeader
                          key={column.id}
                          columnType={column.type}
                          data-priority={column.priority || calculateColumnPriority(column, index, columns.length)}
                          // data-sticky removed - no sticky columns with 5-column rule
                          style={{
                            width: columnVisibility[column.id]?.width,
                          }}
                        >
                          {column.header}
                        </TableHeader>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {/* Empty body - content would be rendered by parent component */}
                    <></>
                  </TableBody>
                </>
              )}
            </Table>

            {/* Hidden columns announcement for screen readers */}
            {hiddenColumnsAnnouncement && (
              <div className="sr-only" aria-live="polite">
                {hiddenColumnsAnnouncement}
              </div>
            )}
          </div>
        </div>
      </WideTableContextProvider.Provider>
    );
  }
);

WideTable.displayName = 'WideTable';

/**
 * Priority Plus Indicator - Shows hidden column count
 */
export function PriorityPlusIndicator({
  hiddenCount,
  hiddenColumns,
  onShowHidden,
  className,
}: {
  hiddenCount: number;
  hiddenColumns: WideColumnDefinition[];
  onShowHidden: () => void;
  className?: string;
}) {
  if (hiddenCount === 0) return null;

  return (
    <button
      type="button"
      className={cn(
        'priority-plus-indicator',
        'px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded border',
        className
      )}
      onClick={onShowHidden}
      aria-label={`Show ${hiddenCount} hidden columns: ${hiddenColumns.map(col => col.header).join(', ')}`}
    >
      +{hiddenCount} more
    </button>
  );
}

export default WideTable;