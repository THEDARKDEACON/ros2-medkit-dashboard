import { memo, useMemo } from 'react';
import * as ReactWindow from 'react-window';

const List = (ReactWindow as any).FixedSizeList || (ReactWindow as any).default?.FixedSizeList;

interface VirtualizedListProps<T> {
  /**
   * Array of items to render
   */
  items: T[];
  /**
   * Height of each item in pixels
   */
  itemHeight: number;
  /**
   * Total height of the list container in pixels
   */
  height: number;
  /**
   * Width of the list container (default: '100%')
   */
  width?: string | number;
  /**
   * Render function for each item
   */
  renderItem: (item: T, index: number, style: React.CSSProperties) => React.ReactNode;
  /**
   * Optional className for the list container
   */
  className?: string;
  /**
   * Optional overscan count for better scrolling performance
   */
  overscanCount?: number;
}

/**
 * VirtualizedList - Efficiently render large lists using react-window
 * 
 * Only renders items that are visible in the viewport, significantly
 * improving performance for lists with hundreds or thousands of items.
 * 
 * @example
 * ```tsx
 * <VirtualizedList
 *   items={components}
 *   itemHeight={48}
 *   height={600}
 *   renderItem={(component, index, style) => (
 *     <div style={style}>
 *       {component.name}
 *     </div>
 *   )}
 * />
 * ```
 */
export const VirtualizedList = memo(function VirtualizedList<T>({
  items,
  itemHeight,
  height,
  width = '100%',
  renderItem,
  className,
  overscanCount = 5,
}: VirtualizedListProps<T>) {
  const Row = useMemo(
    () =>
      ({ index, style }: { index: number; style: React.CSSProperties }) => {
        return <>{renderItem(items[index], index, style)}</>;
      },
    [items, renderItem]
  );

  return (
    <List
      height={height}
      itemCount={items.length}
      itemSize={itemHeight}
      width={width}
      className={className}
      overscanCount={overscanCount}
    >
      {Row}
    </List>
  );
}) as <T>(props: VirtualizedListProps<T>) => React.ReactNode;
