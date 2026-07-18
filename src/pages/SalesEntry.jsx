import { useState } from 'react';
import { getMenus, addSale, todayStr } from '../lib/storage';

export default function SalesEntry({ onChange }) {
  const [menus] = useState(getMenus());
  const [date, setDate] = useState(todayStr());
  const [cart, setCart] = useState({});
  const [selectedAddons, setSelectedAddons] = useState({});
  const [savedFlash, setSavedFlash] = useState(false);

  const bump = (menuId, delta) => {
    setCart((prev) => {
      const next = { ...prev };
      const cur = next[menuId] || 0;
      const val = Math.max(0, cur + delta);
      if (val === 0) delete next[menuId];
      else next[menuId] = val;
      return next;
    });
  };

  const toggleAddon = (menuId, addonId) => {
    setSelectedAddons((prev) => {
      const cur = new Set(prev[menuId] || []);
      if (cur.has(addonId)) cur.delete(addonId);
      else cur.add(addonId);
      return { ...prev, [menuId]: cur };
    });
  };

  const cartCount = Object.values(cart).reduce((a, b) => a + b, 0);

  const commit = () => {
    if (cartCount === 0) return;
    const now = new Date().toISOString();
    for (const [menuId, qty] of Object.entries(cart)) {
      const menu = menus.find((m) => m.id === menuId);
      const chosenIds = selectedAddons[menuId] || new Set();
      const addons = (menu?.addons || [])
        .filter((a) => chosenIds.has(a.id))
        .map((a) => ({ name: a.name, price: a.price }));
      addSale({ menu_id: menuId, quantity: qty, date, timestamp: now, addons });
    }
    setCart({});
    setSelectedAddons({});
    setSavedFlash(true);
    onChange?.();
    setTimeout(() => setSavedFlash(false), 1500);
  };

  const byCategory = menus.reduce((acc, m) => {
    (acc[m.category] ||= []).push(m);
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-stone-200 p-4 flex items-center gap-3">
        <label className="text-sm text-stone-500">วันที่บันทึก</label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="border border-stone-300 rounded-lg px-3 py-1.5"
        />
      </div>

      {menus.length === 0 && (
        <div className="bg-white rounded-xl border border-stone-200 p-6 text-center text-stone-400">
          ยังไม่มีเมนู ไปเพิ่มเมนูที่หน้า "จัดการเมนู" ก่อนนะ
        </div>
      )}

      {Object.entries(byCategory).map(([cat, items]) => (
        <div key={cat}>
          <h3 className="text-sm font-semibold text-stone-500 mb-2 px-1">{cat}</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {items.map((m) => {
              const chosenIds = selectedAddons[m.id] || new Set();
              const addonsPrice = (m.addons || [])
                .filter((a) => chosenIds.has(a.id))
                .reduce((sum, a) => sum + a.price, 0);
              const unitPrice = m.sell_price + addonsPrice;

              return (
                <div
                  key={m.id}
                  className="bg-white rounded-xl border border-stone-200 p-3 flex flex-col gap-2"
                >
                  <div>
                    <div className="font-semibold text-stone-800">{m.name}</div>
                    <div className="text-xs text-stone-400">
                      {unitPrice.toFixed(0)} บาท
                      {addonsPrice > 0 && (
                        <span className="text-emerald-600"> (+{addonsPrice})</span>
                      )}
                    </div>
                  </div>

                  {m.addons?.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {m.addons.map((a) => (
                        <button
                          key={a.id}
                          type="button"
                          onClick={() => toggleAddon(m.id, a.id)}
                          className={`text-[11px] px-2 py-1 rounded-full border ${
                            chosenIds.has(a.id)
                              ? 'bg-emerald-600 text-white border-emerald-600'
                              : 'bg-stone-50 text-stone-500 border-stone-200'
                          }`}
                        >
                          {a.name} +{a.price}
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between mt-auto">
                    <button
                      onClick={() => bump(m.id, -1)}
                      className="w-10 h-10 rounded-lg bg-stone-100 text-stone-600 text-xl font-bold active:bg-stone-200"
                    >
                      -
                    </button>
                    <span className="text-xl font-bold text-stone-800 tabular-nums">
                      {cart[m.id] || 0}
                    </span>
                    <button
                      onClick={() => bump(m.id, 1)}
                      className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-700 text-xl font-bold active:bg-emerald-200"
                    >
                      +
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {cartCount > 0 && (
        <div className="sticky bottom-16 md:bottom-4 z-10">
          <button
            onClick={commit}
            className="w-full bg-emerald-600 text-white rounded-xl py-4 font-bold text-lg shadow-lg hover:bg-emerald-700"
          >
            บันทึกยอดขาย ({cartCount} แก้ว)
          </button>
        </div>
      )}

      {savedFlash && (
        <div className="text-center text-emerald-600 font-medium">บันทึกแล้ว</div>
      )}
    </div>
  );
}
