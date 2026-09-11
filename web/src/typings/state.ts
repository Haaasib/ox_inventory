import { Inventory } from './inventory';
import { Slot } from './slot';

export type InventoryMode = 'full' | 'quick';

export type State = {
  leftInventory: Inventory;
  rightInventory: Inventory;
  dropInventory: Inventory;
  mode: InventoryMode;
  itemAmount: number;
  shiftPressed: boolean;
  isBusy: boolean;
  additionalMetadata: Array<{ metadata: string; value: string }>;
  history?: {
    leftInventory: Inventory;
    rightInventory: Inventory;
    dropInventory: Inventory;
  };
};
