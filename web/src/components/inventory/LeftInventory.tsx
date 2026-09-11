import React, { useEffect, useMemo, useState } from 'react';
import { useAppSelector } from '../../store';
import { selectInventoryMode, selectLeftInventory } from '../../store/inventory';
import { Inventory, Slot } from '../../typings';
import InventorySlot from './InventorySlot';
import { isItemMatch } from '../../helpers';
import useNuiEvent from '../../hooks/useNuiEvent';
import { Weight } from 'lucide-react';
import qIcon from '../../../public/kenney_icons/keyboard_q.png';
import eIcon from '../../../public/kenney_icons/keyboard_e.png';

const getTotalWeight = (items: Slot[]) =>
  items.reduce((total, item) => total + (item.weight || 0) * (item.count || 1), 0);

const formatMass = (value: number) => (value / 1000).toFixed(1);

const FILTERS = [
  { id: 0, icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/></svg> },
  { id: 1, icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg> },
  { id: 2, icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg> },
  { id: 3, icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z"/></svg> },
  { id: 4, icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/></svg> },
  { id: 5, icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a8 8 0 0 1-15.24 4.65l-2.07-4.14A2 2 0 0 1 3.56 12H5"/><path d="M22 14v-2h-3a2 2 0 0 0 0 4h3Z"/></svg> },
];

const SubGrid: React.FC<{ items: Slot[]; title: string; maxWeight?: number; cols: number; inventory: Inventory; search: string; activeFilter: number }> = ({ items, title, maxWeight, cols, inventory, search, activeFilter }) => {
  const weight = useMemo(() => Math.floor(getTotalWeight(items) * 1000) / 1000, [items]);
  const isBusy = useAppSelector((state) => state.inventory.isBusy);
  return (
    <div className="subgrid-wrapper" style={{ pointerEvents: isBusy ? 'none' : 'auto' }}>
      <div className="subgrid-header">
        <span className="subgrid-title">{title}</span>
        {maxWeight !== undefined && (
          <span className="subgrid-weight">
            <Weight size={12} color="#fff" />
            <span>{formatMass(weight)}/{formatMass(maxWeight)}</span>
          </span>
        )}
      </div>
      <div className="inventory-grid-container" style={{ ['--cols' as string]: cols }}>
        {items.map((item) => (
          <div key={`${inventory.id}-${item.slot}`} className={`inventory-slot-cell${isItemMatch(item, search, activeFilter) ? '' : ' is-dimmed'}`}>
            <InventorySlot
              item={item}
              inventoryId={inventory.id}
              inventoryType={inventory.type}
              inventoryGroups={inventory.groups}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

const LeftInventory: React.FC<{ search: string }> = ({ search }) => {
  const leftInventory = useAppSelector(selectLeftInventory);
  const mode = useAppSelector(selectInventoryMode);
  const isQuick = mode === 'quick';
  const items = leftInventory.items;
  const [activeFilter, setActiveFilter] = useState(0);
  const cycleFilter = (dir: number) => {
    setActiveFilter((prev) => {
      let next = prev + dir;
      if (next < 0) next = 5;
      if (next > 5) next = 0;
      return next;
    });
  };
  useNuiEvent<number>('cycleFilter', cycleFilter);
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.repeat) return;
      const tag = (event.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (event.code === 'KeyQ') {
        event.preventDefault();
        cycleFilter(-1);
        return;
      }
      if (event.code === 'KeyE') {
        event.preventDefault();
        cycleFilter(1);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  const pockets = items.filter((item) => item.slot >= 1 && item.slot <= 15);
  const backpack = items.filter((item) => item.slot >= 16 && item.slot <= 40);
  const body = isQuick ? [] : Array.from({ length: 8 }, (_, i) => {
    const slotNum = 41 + i;
    return items.find((item) => item.slot === slotNum) || { slot: slotNum };
  });
  const accessories = isQuick ? [] : Array.from({ length: 4 }, (_, i) => {
    const slotNum = 49 + i;
    return items.find((item) => item.slot === slotNum) || { slot: slotNum };
  });
  return (
    <>
      <div className="inventory-brand">
        <span className="inventory-brand-title">INVENTORY</span>
        <span className="inventory-brand-sub">{isQuick ? 'QUICK STASH' : leftInventory.label || 'FULL STASH'}</span>
      </div>
      {!isQuick && (
        <>
          <div className="inventory-filters">
            <img src={qIcon} alt="Q" className="inventory-filter-key" onClick={() => cycleFilter(-1)} />
            {FILTERS.map((filter) => (
              <div
                key={filter.id}
                className={`inventory-filter${activeFilter === filter.id ? ' is-active' : ''}`}
                onClick={() => setActiveFilter(filter.id)}
              >
                {filter.icon}
              </div>
            ))}
            <img src={eIcon} alt="E" className="inventory-filter-key" onClick={() => cycleFilter(1)} />
          </div>
          <div className="inventory-equip subgrid-stack">
            <SubGrid search={search} activeFilter={activeFilter} items={body} title="BODY" maxWeight={100000} cols={2} inventory={leftInventory} />
            <SubGrid search={search} activeFilter={activeFilter} items={accessories} title="ACCESSORIES" cols={2} inventory={leftInventory} />
          </div>
        </>
      )}
      <div className="inventory-carry subgrid-stack">
        <SubGrid search={search} activeFilter={activeFilter} items={pockets} title="POCKETS" maxWeight={150000} cols={5} inventory={leftInventory} />
        <SubGrid search={search} activeFilter={activeFilter} items={backpack} title="BACKPACK" maxWeight={300000} cols={5} inventory={leftInventory} />
      </div>
    </>
  );
};

export default LeftInventory;
