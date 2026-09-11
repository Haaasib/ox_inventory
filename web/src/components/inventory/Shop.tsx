import React, { useEffect, useMemo, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../store';
import { selectIsBusy, selectRightInventory } from '../../store/inventory';
import { Items } from '../../store/items';
import { SlotWithItem } from '../../typings';
import { canPurchaseItem, getItemUrl, isSlotWithItem } from '../../helpers';
import { categoryLabel, collectShopCategories, resolveItemCategory } from '../../helpers/shopCategories';
import { checkoutShop } from '../../thunks/checkoutShop';
import arrowsIcon from '../../../public/kenney_icons/keyboard_arrows.png';
import mouseLeftIcon from '../../../public/kenney_icons/mouse_left_outline.png';
import shiftIcon from '../../../public/kenney_icons/keyboard_shift.png';
import escIcon from '../../../public/kenney_icons/keyboard_escape.png';

type CartLine = {
  slot: number;
  name: string;
  count: number;
  price: number;
  currency?: string;
};

const IconArmor = () => (
  <svg viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2.2 3.6 5.8v6.4c0 5.6 3.6 10 8.4 11.6 4.8-1.6 8.4-6 8.4-11.6V5.8L12 2.2zm0 4.2 1.15 2.7h2.85l-2.3 1.7.88 2.7L12 12.3l-2.58 1.2.88-2.7-2.3-1.7h2.85L12 6.4z" />
  </svg>
);

const IconGun = () => (
  <svg viewBox="0 0 24 24" fill="currentColor">
    <path d="M2.4 9.4h9.2l.55 1.55h7.2v2.05h-2.05l-.85 6.55H8.05L7.1 13H4.7v-1.7H2.4V9.4zm12.7 1.55h3.55v1.05h-4.05l.5-1.05z" />
  </svg>
);

const IconFist = () => (
  <svg viewBox="0 0 24 24" fill="currentColor">
    <path d="M9.2 5.4c.9 0 1.65.7 1.75 1.58.18-.06.38-.1.58-.1.92 0 1.68.7 1.78 1.6.2-.08.42-.12.65-.12.95 0 1.72.74 1.78 1.68V13c0 3.05-2.2 5.55-5.55 5.55H9.1C6.35 18.55 4.4 16.5 4.4 14.05V11.7c0-.95.78-1.72 1.75-1.72.22 0 .43.04.62.12V9.2c0-.95.78-1.72 1.75-1.72.24 0 .46.05.68.14V7.1c0-.95.77-1.7 1.7-1.7z" />
  </svg>
);

const IconAmmo = () => (
  <svg viewBox="0 0 24 24" fill="currentColor">
    <path fillRule="evenodd" d="M12 2.2A9.8 9.8 0 1 0 21.8 12 9.8 9.8 0 0 0 12 2.2zm0 2.7a7.1 7.1 0 1 1 0 14.2 7.1 7.1 0 0 1 0-14.2zm0 3.4a3.7 3.7 0 1 0 0 7.4 3.7 3.7 0 0 0 0-7.4z" />
  </svg>
);

const IconMags = () => (
  <svg viewBox="0 0 24 24" fill="currentColor">
    <path d="M5.2 4.2h13.6l-1.6 4.2H6.8L5.2 4.2zM5.8 9.4h12.4l-1.6 4.2H7.4L5.8 9.4zM6.4 14.6h11.2L16 18.8H8L6.4 14.6z" />
  </svg>
);

const IconFood = () => (
  <svg viewBox="0 0 24 24" fill="currentColor">
    <path d="M5.2 2.8h1.8v8.2H5.2zm3.4 0h1.8v8.2H8.6zM6.1 11.6h2.6V21H6.1zM15.4 2.8c2.6 0 4.4 2.1 4.4 5.6 0 3.4-1.7 5.5-4.4 5.5V2.8zm0 11.1H17.2V21h-1.8z" />
  </svg>
);

const IconDrinks = () => (
  <svg viewBox="0 0 24 24" fill="currentColor">
    <path d="M7.4 2.8h9.2l-1.15 15.4A2.3 2.3 0 0 1 13.18 20.4h-2.36a2.3 2.3 0 0 1-2.27-2.2L7.4 2.8z" />
  </svg>
);

const IconMedical = () => (
  <svg viewBox="0 0 24 24" fill="currentColor">
    <path d="M8.4 3.2h7.2v5.2H21v7.2h-5.4v5.2H8.4v-5.2H3V8.4h5.4z" />
  </svg>
);

const IconTools = () => (
  <svg viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.4 7.2a4.7 4.7 0 0 1-6.4 4.4L8.6 17l-1.8-1.8 5.4-5.4A4.7 4.7 0 0 1 16.8 3.4L14 6.2 17.8 10l2.6-2.8zM6.2 18.2 5 21.2 8 20z" />
  </svg>
);

const IconGeneral = () => (
  <svg viewBox="0 0 24 24" fill="currentColor">
    <path d="M8.2 7.2V5.4A3.8 3.8 0 0 1 12 1.6a3.8 3.8 0 0 1 3.8 3.8v1.8h3.4l-1.2 15.2H6L4.8 7.2h3.4z" />
  </svg>
);

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  armor: <IconArmor />,
  weapons: <IconGun />,
  melee: <IconFist />,
  ammo: <IconAmmo />,
  magazines: <IconMags />,
  food: <IconFood />,
  drinks: <IconDrinks />,
  medical: <IconMedical />,
  tools: <IconTools />,
  attachments: <IconTools />,
  general: <IconGeneral />,
};

const money = (value: number) => `$${value.toLocaleString('en-US')}`;

const itemLabel = (item: { name: string; metadata?: Record<string, any> }) => {
  const data = Items[item.name];
  const raw = item.metadata?.label || data?.label || item.name.replace(/^WEAPON_/i, '').replace(/_/g, ' ');
  return String(raw).toUpperCase();
};

const Shop: React.FC = () => {
  const shop = useAppSelector(selectRightInventory);
  const isBusy = useAppSelector(selectIsBusy);
  const shiftPressed = useAppSelector((state) => state.inventory.shiftPressed);
  const dispatch = useAppDispatch();
  const [categoryId, setCategoryId] = useState('');
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [cart, setCart] = useState<CartLine[]>([]);
  const items = useMemo(() => shop.items.filter((item): item is SlotWithItem => isSlotWithItem(item)), [shop.items]);
  const categories = useMemo(() => collectShopCategories(shop.items, shop.categories), [shop.items, shop.categories]);
  const activeCategory = categoryId || categories[0]?.id || 'general';
  const visibleItems = useMemo(
    () => items.filter((item) => resolveItemCategory(item.name, item.category) === activeCategory),
    [items, activeCategory]
  );
  const selected = visibleItems.find((item) => item.slot === selectedSlot) || visibleItems[0];
  const taxPct = shop.tax ?? 0;
  const subtotal = cart.reduce((sum, line) => sum + line.price * line.count, 0);
  const tax = Math.ceil(subtotal * (taxPct / 100));
  const total = subtotal + tax;

  useEffect(() => {
    setCart([]);
    setCategoryId(categories[0]?.id || '');
    setSelectedSlot(null);
  }, [shop.id]);

  useEffect(() => {
    if (!visibleItems.some((item) => item.slot === selectedSlot)) {
      setSelectedSlot(visibleItems[0]?.slot ?? null);
    }
  }, [activeCategory, visibleItems, selectedSlot]);

  const addToCart = (item: SlotWithItem, amount = 1) => {
    if (!canPurchaseItem(item, { type: shop.type, groups: shop.groups }) || item.count === 0) return;
    const qty = Math.max(1, amount);
    setCart((prev) => {
      const existing = prev.find((line) => line.slot === item.slot);
      const stock = item.count ?? 9999;
      if (existing) {
        const next = Math.min(existing.count + qty, stock);
        return prev.map((line) => (line.slot === item.slot ? { ...line, count: next } : line));
      }
      return [...prev, { slot: item.slot, name: item.name, count: Math.min(qty, stock), price: item.price || 0, currency: item.currency }];
    });
  };

  const changeQty = (slot: number, delta: number) => {
    setCart((prev) =>
      prev
        .map((line) => {
          if (line.slot !== slot) return line;
          const stock = items.find((item) => item.slot === slot)?.count ?? 9999;
          return { ...line, count: Math.min(Math.max(line.count + delta, 0), stock) };
        })
        .filter((line) => line.count > 0)
    );
  };

  const pay = async (method: 'cash' | 'card' | 'giftcard') => {
    if (cart.length === 0 || isBusy) return;
    try {
      await dispatch(checkoutShop({ items: cart.map((line) => ({ fromSlot: line.slot, count: line.count })), payment: method })).unwrap();
      setCart([]);
    } catch {
      return;
    }
  };

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const tag = (event.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      const catIndex = Math.max(0, categories.findIndex((entry) => entry.id === activeCategory));
      const itemIndex = Math.max(0, visibleItems.findIndex((item) => item.slot === selected?.slot));
      if (event.code === 'ArrowUp' || event.code === 'KeyW') {
        event.preventDefault();
        const next = categories[Math.max(0, catIndex - 1)];
        if (next) setCategoryId(next.id);
        return;
      }
      if (event.code === 'ArrowDown' || event.code === 'KeyS') {
        event.preventDefault();
        const next = categories[Math.min(categories.length - 1, catIndex + 1)];
        if (next) setCategoryId(next.id);
        return;
      }
      if (event.code === 'ArrowLeft' || event.code === 'KeyA') {
        event.preventDefault();
        const next = visibleItems[Math.max(0, itemIndex - 1)];
        if (next) setSelectedSlot(next.slot);
        return;
      }
      if (event.code === 'ArrowRight' || event.code === 'KeyD') {
        event.preventDefault();
        const next = visibleItems[Math.min(visibleItems.length - 1, itemIndex + 1)];
        if (next) setSelectedSlot(next.slot);
        return;
      }
      if (event.code === 'Enter' || event.code === 'NumpadEnter') {
        event.preventDefault();
        if (selected) addToCart(selected, event.shiftKey ? 10 : 1);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [categories, activeCategory, visibleItems, selected]);

  return (
    <div className="shop-root" style={{ pointerEvents: isBusy ? 'none' : 'auto' }}>
      <nav className="shop-nav">
        <div className="shop-brand">
          <span className="shop-brand-title">{(shop.label || 'SHOP').toUpperCase()}</span>
          <span className="shop-brand-sub">{(shop.address?.[0] || 'UNKNOWN STREET').toUpperCase()}</span>
          <span className="shop-brand-sub">{(shop.address?.[1] || 'SAN ANDREAS').toUpperCase()}</span>
        </div>
        <div className="shop-cats">
          {categories.map((entry) => (
            <button
              key={entry.id}
              type="button"
              className={`shop-cat${entry.id === activeCategory ? ' is-active' : ''}`}
              onClick={() => setCategoryId(entry.id)}
            >
              <span className="shop-cat-icon">{CATEGORY_ICONS[entry.id] || <IconGeneral />}</span>
              <span className="shop-cat-label">{categoryLabel(entry.id, entry.label)}</span>
            </button>
          ))}
        </div>
      </nav>
      <div className="shop-header">
        <span className="shop-header-title">SHOP</span>
        <div className="shop-header-accent">
          <span />
          <span />
          <span />
        </div>
      </div>
      <div className="shop-body">
        <section className="shop-catalog">
          <div className="shop-catalog-head">
            <span>{categoryLabel(activeCategory, categories.find((entry) => entry.id === activeCategory)?.label)}</span>
          </div>
          <div className="shop-grid">
            {visibleItems.map((item) => {
              const locked = !canPurchaseItem(item, { type: shop.type, groups: shop.groups }) || item.count === 0;
              return (
                <article
                  key={item.slot}
                  className={`shop-card${selected?.slot === item.slot ? ' is-selected' : ''}${locked ? ' is-locked' : ''}`}
                  onClick={() => {
                    setSelectedSlot(item.slot);
                    if (!locked) addToCart(item, shiftPressed ? 10 : 1);
                  }}
                >
                  <div className="shop-card-body">
                    <h3>{itemLabel(item)}</h3>
                    <p>{money(item.price || 0)}</p>
                    <div className="shop-card-art" style={{ backgroundImage: `url(${getItemUrl(item)})` }} />
                  </div>
                  <button
                    type="button"
                    className="shop-card-add"
                    disabled={locked}
                    onClick={(event) => {
                      event.stopPropagation();
                      addToCart(item, shiftPressed ? 10 : 1);
                    }}
                  >
                    ADD TO CART
                  </button>
                </article>
              );
            })}
          </div>
        </section>
        <aside className="shop-cart">
          <div className="shop-cart-head">
            <div>
              <h2>SHOPPING CART</h2>
              <p>FINALIZE THE PURCHASE OF YOUR ITEMS</p>
            </div>
            <span className="shop-cart-geo" />
          </div>
          <div className="shop-cart-body">
            {cart.length === 0 ? (
              <span className="shop-cart-empty">YOUR CART IS EMPTY</span>
            ) : (
              cart.map((line) => (
                <div key={line.slot} className="shop-cart-line">
                  <div className="shop-cart-thumb" style={{ backgroundImage: `url(${getItemUrl(line.name)})` }} />
                  <div className="shop-cart-info">
                    <strong>{itemLabel(line)}</strong>
                    <span>{money(line.price * line.count)}</span>
                  </div>
                  <div className="shop-cart-qty">
                    <button type="button" onClick={() => changeQty(line.slot, -1)}>
                      -
                    </button>
                    <span>{line.count}</span>
                    <button type="button" onClick={() => changeQty(line.slot, 1)}>
                      +
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="shop-cart-fees">
            <div>
              <span>Subtotal</span>
              <span>{money(subtotal)}</span>
            </div>
            <div>
              <span>Tax ({taxPct}%)</span>
              <span>{money(tax)}</span>
            </div>
          </div>
          <div className="shop-cart-totalbar">
            <span>TOTAL COST</span>
            <span>{money(total)}</span>
          </div>
          <div className="shop-cart-pay">
            <button type="button" disabled={cart.length === 0} onClick={() => pay('giftcard')}>
              GIFT CARD
            </button>
            <button type="button" disabled={cart.length === 0} onClick={() => pay('card')}>
              CARD PAY
            </button>
            <button type="button" disabled={cart.length === 0} onClick={() => pay('cash')}>
              CASH PAY
            </button>
          </div>
        </aside>
      </div>
      <div className="shop-footer">
        <div className="shop-footer-bar">
          <div className="shop-footer-item">
            <img src={arrowsIcon} alt="" />
            NAVIGATE
          </div>
          <span className="shop-footer-divider">/</span>
          <div className="shop-footer-item">
            <img src={mouseLeftIcon} alt="" />
            ADD TO CART
          </div>
          <span className="shop-footer-divider">/</span>
          <div className="shop-footer-item">
            <img src={shiftIcon} alt="" />
            +10
          </div>
          <span className="shop-footer-divider">/</span>
          <div className="shop-footer-item">
            <img src={escIcon} alt="" />
            CLOSE
          </div>
        </div>
        <span className="shop-footer-version">1.0.9-5.0.0</span>
      </div>
    </div>
  );
};

export default Shop;
