import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Inventory } from '../../typings';
import InventorySlot from './InventorySlot';
import { getTotalWeight, isItemMatch } from '../../helpers';
import { useAppSelector } from '../../store';
import { useIntersection } from '../../hooks/useIntersection';
import { Weight } from 'lucide-react';

const PAGE_SIZE = 30;

const formatMass = (value: number) => (value / 1000).toFixed(1);

const InventoryGrid: React.FC<{ inventory: Inventory; compact?: boolean; search?: string }> = ({ inventory, compact, search = '' }) => {
  const weight = useMemo(
    () => (inventory.maxWeight !== undefined ? Math.floor(getTotalWeight(inventory.items) * 1000) / 1000 : 0),
    [inventory.maxWeight, inventory.items]
  );
  const [page, setPage] = useState(0);
  const containerRef = useRef(null);
  const { ref, entry } = useIntersection({ threshold: 0.5 });
  const isBusy = useAppSelector((state) => state.inventory.isBusy);
  useEffect(() => {
    if (entry && entry.isIntersecting) {
      setPage((prev) => ++prev);
    }
  }, [entry]);
  return (
    <div className="subgrid-wrapper" style={{ pointerEvents: isBusy ? 'none' : 'auto' }}>
      <div className="subgrid-header">
        <span className="subgrid-title">{inventory.label || inventory.type}</span>
        {inventory.maxWeight !== undefined && (
          <span className="subgrid-weight">
            <Weight size={12} color="#fff" />
            <span>{formatMass(weight)}/{formatMass(inventory.maxWeight)}</span>
          </span>
        )}
      </div>
      <div className={`inventory-grid-container is-scrollable${compact ? ' is-drop' : ' is-storage'}`} ref={containerRef} style={{ ['--cols' as string]: 10 }}>
        {inventory.items.slice(0, (page + 1) * PAGE_SIZE).map((item, index) => (
          <div key={`${inventory.type}-${inventory.id}-${item.slot}`} className={`inventory-slot-cell${isItemMatch(item, search) ? '' : ' is-dimmed'}`}>
            <InventorySlot
              item={item}
              ref={index === (page + 1) * PAGE_SIZE - 1 ? ref : null}
              inventoryType={inventory.type}
              inventoryGroups={inventory.groups}
              inventoryId={inventory.id}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default InventoryGrid;
