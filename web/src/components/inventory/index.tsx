import React, { useState } from 'react';
import useNuiEvent from '../../hooks/useNuiEvent';
import InventoryControl from './InventoryControl';
import InventoryHotbar from './InventoryHotbar';
import { useAppDispatch, useAppSelector } from '../../store';
import { refreshSlots, selectInventoryMode, setAdditionalMetadata, setupInventory } from '../../store/inventory';
import { useExitListener } from '../../hooks/useExitListener';
import type { Inventory as InventoryProps, InventoryMode } from '../../typings';
import RightInventory from './RightInventory';
import LeftInventory from './LeftInventory';
import Tooltip from '../utils/Tooltip';
import { closeTooltip } from '../../store/tooltip';
import InventoryContext from './InventoryContext';
import { closeContextMenu } from '../../store/contextMenu';
import Fade from '../utils/transitions/Fade';
import { Search } from 'lucide-react';
import mouseLeftIcon from '../../../public/kenney_icons/mouse_left_outline.png';
import mouseRightIcon from '../../../public/kenney_icons/mouse_right_outline.png';
import mouseScrollIcon from '../../../public/kenney_icons/mouse_scroll_outline.png';
import shiftIcon from '../../../public/kenney_icons/keyboard_shift.png';
import escIcon from '../../../public/kenney_icons/keyboard_escape.png';

const Footer: React.FC<{ isQuick: boolean }> = ({ isQuick }) => {
  return (
    <div className={`inventory-footer${isQuick ? ' is-quick' : ''}`}>
      <div className="inventory-footer-item">
        <img src={mouseLeftIcon} alt="mouse left" />
        PICK UP
      </div>
      <span className="inventory-footer-divider">/</span>
      <div className="inventory-footer-item">
        <img src={mouseRightIcon} alt="mouse right" />
        CONTEXT MENU
      </div>
      <span className="inventory-footer-divider">/</span>
      <div className="inventory-footer-item">
        <img src={mouseScrollIcon} alt="mouse scroll" />
        USE ITEM
      </div>
      {!isQuick && (
        <>
          <span className="inventory-footer-divider">/</span>
          <div className="inventory-footer-item">
            <img src={shiftIcon} alt="shift" />
            +
            <img src={mouseLeftIcon} alt="mouse left" />
            QUICK MOVE
          </div>
        </>
      )}
      <span className="inventory-footer-divider">/</span>
      <div className="inventory-footer-item">
        <img src={escIcon} alt="esc" />
        CLOSE
      </div>
    </div>
  );
};

const Inventory: React.FC = () => {
  const [inventoryVisible, setInventoryVisible] = useState(false);
  const [search, setSearch] = useState('');
  const dispatch = useAppDispatch();
  const mode = useAppSelector(selectInventoryMode);
  const isQuick = mode === 'quick';
  useNuiEvent<boolean>('setInventoryVisible', setInventoryVisible);
  useNuiEvent<false>('closeInventory', () => {
    setInventoryVisible(false);
    setSearch('');
    dispatch(closeContextMenu());
    dispatch(closeTooltip());
  });
  useExitListener(setInventoryVisible);

  useNuiEvent<{
    leftInventory?: InventoryProps;
    rightInventory?: InventoryProps;
    mode?: InventoryMode;
  }>('setupInventory', (data) => {
    dispatch(setupInventory(data));
    !inventoryVisible && setInventoryVisible(true);
  });

  useNuiEvent('refreshSlots', (data) => dispatch(refreshSlots(data)));

  useNuiEvent('displayMetadata', (data: Array<{ metadata: string; value: string }>) => {
    dispatch(setAdditionalMetadata(data));
  });

  return (
    <>
      <Fade in={inventoryVisible}>
        <div className={`inventory-wrapper${isQuick ? ' is-quick' : ''}`}>
          <div className={`inventory-shell${isQuick ? ' is-quick' : ''}`}>
            <LeftInventory search={search} />
            {!isQuick && (
              <div className="inventory-other">
                <div className="inventory-search">
                  <Search size={16} className="inventory-search-icon" />
                  <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="SEARCH..." maxLength={100} />
                  <span className="inventory-search-count">{search.length}/100</span>
                </div>
                <RightInventory search={search} />
              </div>
            )}
          </div>
          <Footer isQuick={isQuick} />
          <Tooltip />
          <InventoryContext />
        </div>
      </Fade>
      <InventoryHotbar />
    </>
  );
};

export default Inventory;
