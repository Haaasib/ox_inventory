import { onUse } from '../../dnd/onUse';
import { onGive } from '../../dnd/onGive';
import { onDrop } from '../../dnd/onDrop';
import { Items } from '../../store/items';
import { fetchNui } from '../../utils/fetchNui';
import { Locale } from '../../store/locale';
import { isSlotWithItem } from '../../helpers';
import { setClipboard } from '../../utils/setClipboard';
import { store, useAppSelector } from '../../store';
import { selectLeftInventory, setShiftPressed } from '../../store/inventory';
import React from 'react';
import { Menu, MenuItem } from '../utils/menu/Menu';
import { Lock } from 'lucide-react';
import mouseIcon from '../../../public/kenney_icons/mouse_left_outline.png';
import escIcon from '../../../public/kenney_icons/keyboard_escape.png';

interface DataProps {
  action: string;
  component?: string;
  slot?: number;
  serial?: string;
  id?: number;
}

interface Button {
  label: string;
  index: number;
  group?: string;
}

interface Group {
  groupName: string | null;
  buttons: ButtonWithIndex[];
}

interface ButtonWithIndex extends Button {
  index: number;
}

interface GroupedButtons extends Array<Group> {}

const InventoryContext: React.FC = () => {
  const contextMenu = useAppSelector((state) => state.contextMenu);
  const leftInventory = useAppSelector(selectLeftInventory);
  const item = contextMenu.item;
  const itemData = item ? Items[item.name] : undefined;
  const itemLabel = item?.metadata?.label || itemData?.label || item?.name || '';
  const itemType = item?.metadata?.type || 'ITEM TYPE';
  const itemWeight = item ? (item.weight / 1000).toFixed(1) : '0.0';

  const handleClick = (data: DataProps) => {
    if (!item) return;
    switch (data && data.action) {
      case 'use':
        onUse({ name: item.name, slot: item.slot });
        break;
      case 'give':
        onGive({ name: item.name, slot: item.slot });
        break;
      case 'drop':
        isSlotWithItem(item) && onDrop({ item: item, inventory: 'player' });
        break;
      case 'split': {
        if (!isSlotWithItem(item) || item.count < 2) return;
        const empty = leftInventory.items.find((slot) => !slot.name);
        if (!empty) return;
        store.dispatch(setShiftPressed(true));
        onDrop({ item, inventory: 'player' }, { item: { slot: empty.slot }, inventory: 'player' });
        store.dispatch(setShiftPressed(false));
        break;
      }
      case 'remove':
        fetchNui('removeComponent', { component: data?.component, slot: data?.slot });
        break;
      case 'removeAmmo':
        fetchNui('removeAmmo', item.slot);
        break;
      case 'copy':
        setClipboard(data.serial || '');
        break;
      case 'custom':
        fetchNui('useButton', { id: (data?.id || 0) + 1, slot: item.slot });
        break;
    }
  };

  const groupButtons = (buttons: any): GroupedButtons => {
    return buttons.reduce((groups: Group[], button: Button, index: number) => {
      if (button.group) {
        const groupIndex = groups.findIndex((group) => group.groupName === button.group);
        if (groupIndex !== -1) {
          groups[groupIndex].buttons.push({ ...button, index });
        } else {
          groups.push({
            groupName: button.group,
            buttons: [{ ...button, index }],
          });
        }
      } else {
        groups.push({
          groupName: null,
          buttons: [{ ...button, index }],
        });
      }
      return groups;
    }, []);
  };

  return (
    <Menu>
      {item && (
        <div className="context-menu-header">
          <span className="context-menu-type">{itemType}</span>
          <span className="context-menu-name">{itemLabel}</span>
          <span className="context-menu-weight">
            <Lock size={11} strokeWidth={2.4} />
            {itemWeight}KG
          </span>
        </div>
      )}
      <MenuItem onClick={() => handleClick({ action: 'use' })} label={Locale.ui_use || 'Use'} />
      {item && item.count > 1 && (
        <MenuItem onClick={() => handleClick({ action: 'split' })} label={Locale.ui_split || 'Split'} />
      )}
      <MenuItem onClick={() => handleClick({ action: 'give' })} label={Locale.ui_give || 'Give'} />
      <MenuItem onClick={() => handleClick({ action: 'drop' })} label={Locale.ui_drop || 'Drop'} />
      {item && item.metadata?.ammo > 0 && (
        <MenuItem onClick={() => handleClick({ action: 'removeAmmo' })} label={Locale.ui_remove_ammo || 'Remove ammo'} />
      )}
      {item && item.metadata?.serial && (
        <MenuItem
          onClick={() => handleClick({ action: 'copy', serial: item.metadata?.serial })}
          label={Locale.ui_copy || 'Copy serial'}
        />
      )}
      {item && item.metadata?.components && item.metadata?.components.length > 0 && (
        <Menu label={Locale.ui_removeattachments || 'Remove attachments'}>
          {item &&
            item.metadata?.components.map((component: string, index: number) => (
              <MenuItem
                key={index}
                onClick={() => handleClick({ action: 'remove', component, slot: item.slot })}
                label={Items[component]?.label || ''}
              />
            ))}
        </Menu>
      )}
      {((item && item.name && Items[item.name]?.buttons?.length) || 0) > 0 && (
        <>
          {item &&
            item.name &&
            groupButtons(Items[item.name]?.buttons).map((group: Group, index: number) => (
              <React.Fragment key={index}>
                {group.groupName ? (
                  <Menu label={group.groupName}>
                    {group.buttons.map((button: Button) => (
                      <MenuItem
                        key={button.index}
                        onClick={() => handleClick({ action: 'custom', id: button.index })}
                        label={button.label}
                      />
                    ))}
                  </Menu>
                ) : (
                  group.buttons.map((button: Button) => (
                    <MenuItem
                      key={button.index}
                      onClick={() => handleClick({ action: 'custom', id: button.index })}
                      label={button.label}
                    />
                  ))
                )}
              </React.Fragment>
            ))}
        </>
      )}
      {item && (
        <div className="context-menu-footer">
          <div className="context-menu-hints">
            <span className="context-menu-hint">
              <img src={mouseIcon} alt="" />
              {Locale.ui_confirm || 'Confirm'}
            </span>
            <span className="context-menu-hint">
              <img src={escIcon} alt="" />
              {Locale.ui_close || 'Close'}
            </span>
          </div>
          <span className="context-menu-count">x{item.count}</span>
        </div>
      )}
    </Menu>
  );
};

export default InventoryContext;
