import moneyIcon from '../assets/game_icons/money-stack.svg';
import idIcon from '../assets/game_icons/id-card.svg';
import phoneIcon from '../assets/game_icons/smartphone.svg';
import glassesIcon from '../assets/game_icons/spectacles.svg';
import watchIcon from '../assets/game_icons/watch.svg';
import maskIcon from '../assets/game_icons/carnival-mask.svg';
import shirtIcon from '../assets/game_icons/t-shirt.svg';
import vestIcon from '../assets/game_icons/kevlar-vest.svg';
import packIcon from '../assets/game_icons/backpack.svg';
import keyIcon from '../assets/game_icons/key.svg';
import walletIcon from '../assets/game_icons/wallet.svg';
import radioIcon from '../assets/game_icons/walkie-talkie.svg';

const TYPE_ICONS: Record<string, string> = {
  cash: moneyIcon,
  idcard: idIcon,
  phone: phoneIcon,
};

export const SLOT_ICONS: Record<number, string> = {
  41: moneyIcon,
  42: idIcon,
  43: phoneIcon,
  44: watchIcon,
  45: maskIcon,
  46: shirtIcon,
  47: vestIcon,
  48: packIcon,
  49: glassesIcon,
  50: keyIcon,
  51: walletIcon,
  52: radioIcon,
};

export const setBodySlots = (slots?: Record<string, number>) => {
  if (!slots) return;
  if (slots.cash) SLOT_ICONS[slots.cash] = TYPE_ICONS.cash;
  if (slots.idcard) SLOT_ICONS[slots.idcard] = TYPE_ICONS.idcard;
  if (slots.phone) SLOT_ICONS[slots.phone] = TYPE_ICONS.phone;
};
