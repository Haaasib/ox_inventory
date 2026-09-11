import { CaseReducer, PayloadAction } from '@reduxjs/toolkit';
import { createEmptyDrop, getItemData, isDropInventory, itemDurability } from '../helpers';
import { Items } from '../store/items';
import { Inventory, InventoryMode, State } from '../typings';

const hydrateInventory = (inventory: Inventory, curTime: number): Inventory => ({
  ...inventory,
  items: Array.from(Array(inventory.slots), (_, index) => {
    const item = Object.values(inventory.items).find((entry) => entry?.slot === index + 1) || {
      slot: index + 1,
    };
    if (!item.name) return item;
    if (typeof Items[item.name] === 'undefined') {
      getItemData(item.name);
    }
    item.durability = itemDurability(item.metadata, curTime);
    return item;
  }),
});

export const setupInventoryReducer: CaseReducer<
  State,
  PayloadAction<{
    leftInventory?: Inventory;
    rightInventory?: Inventory;
    mode?: InventoryMode;
  }>
> = (state, action) => {
  const { leftInventory, rightInventory, mode } = action.payload;
  const curTime = Math.floor(Date.now() / 1000);
  if (leftInventory) state.leftInventory = hydrateInventory(leftInventory, curTime);
  if (rightInventory) {
    state.rightInventory = hydrateInventory(rightInventory, curTime);
    if (isDropInventory(rightInventory.type) && rightInventory.type === 'newdrop') {
      state.dropInventory = createEmptyDrop();
    }
  }
  if (mode) state.mode = mode;
  state.shiftPressed = false;
  state.isBusy = false;
};
