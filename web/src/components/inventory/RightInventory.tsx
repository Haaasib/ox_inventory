import InventoryGrid from './InventoryGrid';
import { useAppSelector } from '../../store';
import { selectDropInventory, selectRightInventory } from '../../store/inventory';
import { hasInventoryItems, isDropInventory, shouldShowRightInventory } from '../../helpers';

const RightInventory: React.FC<{ search: string }> = ({ search }) => {
  const dropInventory = useAppSelector(selectDropInventory);
  const rightInventory = useAppSelector(selectRightInventory);
  const showDrop = isDropInventory(rightInventory.type) && hasInventoryItems(rightInventory);
  const showStorage = shouldShowRightInventory(rightInventory);
  return (
    <>
      <InventoryGrid inventory={{ ...dropInventory, label: 'GROUP INVENTORY' }} compact search={search} />
      {showDrop && <InventoryGrid inventory={{ ...rightInventory, label: 'DROP' }} compact search={search} />}
      {showStorage && <InventoryGrid inventory={rightInventory} search={search} />}
    </>
  );
};

export default RightInventory;
