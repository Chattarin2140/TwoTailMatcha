import { useState } from 'react';
import { getMenus, getSales, updateSale, deleteSale } from '../lib/storage';
import { downloadCsv } from '../lib/csv';
import { saleUnitPrice, addonsTotal } from '../lib/calc';

export default function SalesHistory({ onChange }) {
  const [menus] = useState(getMenus());
  const [sales, setSales] = useState(getSales());
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [menuFilter, setMenuFilter] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editQty, setEditQty] = useState('');

  const menuById = Object.fromEntries(menus.map((m) => [m.id, m]));

  const filtered = sales
    .filter((s) => (fromDate ? s.date >= fromDate : true))
    .filter((s) => (toDate ? s.date <= toDate : true))
    .filter((s) => (menuFilter ? s.menu_id === menuFilter : true))
    .sort((a, b) => b.date.localeCompare(a.date) || b.timestamp?.localeCompare(a.timestamp || ''));

  const refresh = (list) => {
    setSales(list);
    onChange?.();
  };

  const remove = (id) => {
    if (!confirm('ลบรายการนี้?')) return;
    refresh(deleteSale(id));
  };

  const startEdit = (s) => {
    setEditingId(s.id);
    setEditQty(String(s.quantity));
  };

  const saveEdit = (id) => {
    const qty = Number(editQty);
    if (qty <= 0) return;
    refresh(updateSale(id, { quantity: qty }));
    setEditingId(null);
  };

  const exportCsv = () => {
    const rows = filtered.map((s) => {
      const m = menuById[s.menu_id];
      return {
        date: s.date,
        menu: m?.name || '(ลบแล้ว)',
        category: m?.category || '',
        addons: (s.addons || []).map((a) => `${a.name}(+${a.price})`).join('; '),
        quantity: s.quantity,
        unit_price: m ? saleUnitPrice(s, m) : '',
        cost_price: m?.cost_price ?? '',
        revenue: m ? saleUnitPrice(s, m) * s.quantity : '',
        profit: m ? (saleUnitPrice(s, m) - m.cost_price) * s.quantity : '',
      };
    });
    downloadCsv(`sales-history-${Date.now()}.csv`, rows);
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-stone-200 p-4 flex flex-wrap items-end gap-3">
        <div>
          <label className="block text-xs text-stone-500 mb-1">จากวันที่</label>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="border border-stone-300 rounded-lg px-3 py-1.5"
          />
        </div>
        <div>
          <label className="block text-xs text-stone-500 mb-1">ถึงวันที่</label>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="border border-stone-300 rounded-lg px-3 py-1.5"
          />
        </div>
        <div>
          <label className="block text-xs text-stone-500 mb-1">เมนู</label>
          <select
            value={menuFilter}
            onChange={(e) => setMenuFilter(e.target.value)}
            className="border border-stone-300 rounded-lg px-3 py-1.5"
          >
            <option value="">ทั้งหมด</option>
            {menus.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>
        <button
          onClick={exportCsv}
          className="ml-auto bg-stone-800 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-stone-700"
        >
          Export CSV
        </button>
      </div>

      <div className="bg-white rounded-xl border border-stone-200 overflow-x-auto">
        <table className="w-full text-sm min-w-[640px]">
          <thead className="bg-stone-50 text-stone-500 text-left">
            <tr>
              <th className="px-4 py-2 whitespace-nowrap">วันที่</th>
              <th className="px-4 py-2 whitespace-nowrap">เมนู</th>
              <th className="px-4 py-2 text-right whitespace-nowrap">จำนวน</th>
              <th className="px-4 py-2 text-right whitespace-nowrap">ยอดขาย</th>
              <th className="px-4 py-2 text-right">กำไร</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((s) => {
              const m = menuById[s.menu_id];
              const revenue = m ? saleUnitPrice(s, m) * s.quantity : 0;
              const profit = m ? (saleUnitPrice(s, m) - m.cost_price) * s.quantity : 0;
              return (
                <tr key={s.id} className="border-t border-stone-100">
                  <td className="px-4 py-2 text-stone-500">{s.date}</td>
                  <td className="px-4 py-2 font-medium text-stone-800">
                    {m?.name || '(เมนูถูกลบแล้ว)'}
                    {s.addons?.length > 0 && (
                      <div className="text-xs text-stone-400 font-normal">
                        {s.addons.map((a) => a.name).join(', ')} (+{addonsTotal(s)})
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-2 text-right">
                    {editingId === s.id ? (
                      <input
                        type="number"
                        min="1"
                        value={editQty}
                        onChange={(e) => setEditQty(e.target.value)}
                        className="w-16 border border-stone-300 rounded px-2 py-1 text-right"
                      />
                    ) : (
                      s.quantity
                    )}
                  </td>
                  <td className="px-4 py-2 text-right">{revenue.toFixed(2)}</td>
                  <td
                    className={`px-4 py-2 text-right font-semibold ${
                      profit >= 0 ? 'text-emerald-600' : 'text-red-600'
                    }`}
                  >
                    {profit.toFixed(2)}
                  </td>
                  <td className="px-4 py-2 text-right whitespace-nowrap">
                    {editingId === s.id ? (
                      <button
                        onClick={() => saveEdit(s.id)}
                        className="text-emerald-600 px-2"
                      >
                        บันทึก
                      </button>
                    ) : (
                      <button
                        onClick={() => startEdit(s)}
                        className="text-stone-500 hover:text-emerald-600 px-2"
                      >
                        แก้ไข
                      </button>
                    )}
                    <button
                      onClick={() => remove(s.id)}
                      className="text-stone-500 hover:text-red-600 px-2"
                    >
                      ลบ
                    </button>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-stone-400">
                  ไม่พบรายการขาย
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
