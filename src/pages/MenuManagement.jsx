import { useEffect, useState } from 'react';
import { getMenus, addMenu, updateMenu, deleteMenu, resetMenusToSeed } from '../lib/storage';
import { profitPerCup, profitPct } from '../lib/calc';

const CATEGORIES = ['Matcha', 'ชา', 'กาแฟ', 'น้ำผลไม้', 'โซดา', 'อื่นๆ'];
const emptyForm = { name: '', category: CATEGORIES[0], cost_price: '', sell_price: '' };
const emptyAddon = { name: '', price: '' };
const emptyIngredient = { name: '', cost: '' };

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export default function MenuManagement({ onChange }) {
  const [menus, setMenus] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [addons, setAddons] = useState([]);
  const [addonDraft, setAddonDraft] = useState(emptyAddon);
  const [ingredients, setIngredients] = useState([]);
  const [ingredientDraft, setIngredientDraft] = useState(emptyIngredient);
  const [editingId, setEditingId] = useState(null);

  const ingredientsTotal = ingredients.reduce((sum, i) => sum + i.cost, 0);

  useEffect(() => {
    getMenus().then(setMenus);
  }, []);

  const refresh = (list) => {
    setMenus(list);
    onChange?.();
  };

  const addAddonDraft = () => {
    const name = addonDraft.name.trim();
    const price = Number(addonDraft.price);
    if (!name || price < 0 || Number.isNaN(price)) return;
    setAddons((prev) => [...prev, { id: uid(), name, price }]);
    setAddonDraft(emptyAddon);
  };

  const removeAddon = (id) => {
    setAddons((prev) => prev.filter((a) => a.id !== id));
  };

  const addIngredientDraft = () => {
    const name = ingredientDraft.name.trim();
    const cost = Number(ingredientDraft.cost);
    if (!name || cost < 0 || Number.isNaN(cost)) return;
    setIngredients((prev) => [...prev, { id: uid(), name, cost }]);
    setIngredientDraft(emptyIngredient);
  };

  const removeIngredient = (id) => {
    setIngredients((prev) => prev.filter((i) => i.id !== id));
  };

  const submit = async (e) => {
    e.preventDefault();
    const payload = {
      name: form.name.trim(),
      category: form.category,
      cost_price: ingredients.length > 0 ? ingredientsTotal : Number(form.cost_price),
      sell_price: Number(form.sell_price),
      addons,
      ingredients,
    };
    if (!payload.name || payload.cost_price < 0 || payload.sell_price < 0) return;

    if (editingId) {
      refresh(await updateMenu(editingId, payload));
      setEditingId(null);
    } else {
      refresh(await addMenu(payload));
    }
    setForm(emptyForm);
    setAddons([]);
    setAddonDraft(emptyAddon);
    setIngredients([]);
    setIngredientDraft(emptyIngredient);
  };

  const startEdit = (m) => {
    setEditingId(m.id);
    setForm({
      name: m.name,
      category: m.category,
      cost_price: String(m.cost_price),
      sell_price: String(m.sell_price),
    });
    setAddons(m.addons || []);
    setAddonDraft(emptyAddon);
    setIngredients(m.ingredients || []);
    setIngredientDraft(emptyIngredient);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm(emptyForm);
    setAddons([]);
    setAddonDraft(emptyAddon);
    setIngredients([]);
    setIngredientDraft(emptyIngredient);
  };

  const remove = async (id) => {
    if (!confirm('ลบเมนูนี้? รายการขายที่บันทึกไว้จะยังอยู่แต่จะไม่ผูกกับเมนูนี้แล้ว')) return;
    refresh(await deleteMenu(id));
  };

  const resetToSeed = async () => {
    if (
      !confirm(
        'รีเซ็ตเมนูทั้งหมดกลับเป็นเมนู Two Tails Matcha เริ่มต้น? เมนูที่แก้ไข/เพิ่มเองไว้จะหายหมด (รายการขายที่บันทึกไว้แล้วไม่หาย)'
      )
    )
      return;
    refresh(await resetMenusToSeed());
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-stone-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-stone-800">
            {editingId ? 'แก้ไขเมนู' : 'เพิ่มเมนูใหม่'}
          </h2>
          <button
            type="button"
            onClick={resetToSeed}
            className="text-xs text-stone-400 hover:text-red-500"
          >
            รีเซ็ตเป็นเมนูเริ่มต้น
          </button>
        </div>
        <form onSubmit={submit} className="space-y-3">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <input
              className="col-span-2 md:col-span-1 border border-stone-300 rounded-lg px-3 py-2"
              placeholder="ชื่อเมนู"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
            <select
              className="border border-stone-300 rounded-lg px-3 py-2"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <input
              type="number"
              min="0"
              step="0.01"
              className={`border border-stone-300 rounded-lg px-3 py-2 ${
                ingredients.length > 0 ? 'bg-stone-100 text-stone-500' : ''
              }`}
              placeholder="ต้นทุน (บาท)"
              value={ingredients.length > 0 ? ingredientsTotal.toFixed(2) : form.cost_price}
              onChange={(e) => setForm({ ...form, cost_price: e.target.value })}
              readOnly={ingredients.length > 0}
              required
            />
            <input
              type="number"
              min="0"
              step="0.01"
              className="border border-stone-300 rounded-lg px-3 py-2"
              placeholder="ราคาขาย (บาท)"
              value={form.sell_price}
              onChange={(e) => setForm({ ...form, sell_price: e.target.value })}
              required
            />
            <div className="flex gap-2">
              <button
                type="submit"
                className="flex-1 bg-emerald-600 text-white rounded-lg px-3 py-2 font-medium hover:bg-emerald-700"
              >
                {editingId ? 'บันทึก' : 'เพิ่ม'}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="bg-stone-200 text-stone-700 rounded-lg px-3 py-2"
                >
                  ยกเลิก
                </button>
              )}
            </div>
          </div>

          <div className="border-t border-stone-100 pt-3">
            <div className="text-xs text-stone-500 mb-2">
              ตัวเลือกเสริม (เช่น Cold foam, แยกน้ำ) — ราคาส่วนต่างต่อแก้ว
            </div>
            {addons.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {addons.map((a) => (
                  <span
                    key={a.id}
                    className="flex items-center gap-1 text-xs bg-stone-100 text-stone-600 rounded-full px-2.5 py-1"
                  >
                    {a.name} +{a.price}
                    <button
                      type="button"
                      onClick={() => removeAddon(a.id)}
                      className="text-stone-400 hover:text-red-500 ml-1"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                className="flex-1 border border-stone-300 rounded-lg px-3 py-1.5 text-sm"
                placeholder="ชื่อตัวเลือก เช่น Cold foam"
                value={addonDraft.name}
                onChange={(e) => setAddonDraft({ ...addonDraft, name: e.target.value })}
              />
              <input
                type="number"
                min="0"
                step="0.01"
                className="sm:w-28 border border-stone-300 rounded-lg px-3 py-1.5 text-sm"
                placeholder="ราคา +บาท"
                value={addonDraft.price}
                onChange={(e) => setAddonDraft({ ...addonDraft, price: e.target.value })}
              />
              <button
                type="button"
                onClick={addAddonDraft}
                className="shrink-0 whitespace-nowrap bg-stone-800 text-white rounded-lg px-3 py-1.5 text-sm"
              >
                เพิ่มตัวเลือก
              </button>
            </div>
          </div>

          <div className="border-t border-stone-100 pt-3">
            <div className="text-xs text-stone-500 mb-2">
              ต้นทุนแยกส่วนต่อแก้ว (เช่น นม 8, มัทฉะ 12, น้ำแข็ง 3) — ถ้ากรอกตรงนี้ ต้นทุนรวมด้านบนจะคำนวณให้อัตโนมัติ
            </div>
            {ingredients.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {ingredients.map((i) => (
                  <span
                    key={i.id}
                    className="flex items-center gap-1 text-xs bg-amber-50 text-amber-700 rounded-full px-2.5 py-1"
                  >
                    {i.name} {i.cost}
                    <button
                      type="button"
                      onClick={() => removeIngredient(i.id)}
                      className="text-amber-400 hover:text-red-500 ml-1"
                    >
                      ×
                    </button>
                  </span>
                ))}
                <span className="text-xs font-semibold text-stone-500 px-1 py-1">
                  รวม {ingredientsTotal.toFixed(2)} บาท
                </span>
              </div>
            )}
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                className="flex-1 border border-stone-300 rounded-lg px-3 py-1.5 text-sm"
                placeholder="ส่วนประกอบ เช่น นม"
                value={ingredientDraft.name}
                onChange={(e) => setIngredientDraft({ ...ingredientDraft, name: e.target.value })}
              />
              <input
                type="number"
                min="0"
                step="0.01"
                className="sm:w-28 border border-stone-300 rounded-lg px-3 py-1.5 text-sm"
                placeholder="ต้นทุน บาท"
                value={ingredientDraft.cost}
                onChange={(e) => setIngredientDraft({ ...ingredientDraft, cost: e.target.value })}
              />
              <button
                type="button"
                onClick={addIngredientDraft}
                className="shrink-0 whitespace-nowrap bg-stone-800 text-white rounded-lg px-3 py-1.5 text-sm"
              >
                เพิ่มส่วนประกอบ
              </button>
            </div>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-xl border border-stone-200 overflow-x-auto">
        <table className="w-full text-sm min-w-[720px]">
          <thead className="bg-stone-50 text-stone-500 text-left">
            <tr>
              <th className="px-4 py-2 whitespace-nowrap">ชื่อเมนู</th>
              <th className="px-4 py-2 whitespace-nowrap">หมวดหมู่</th>
              <th className="px-4 py-2 text-right whitespace-nowrap">ต้นทุน</th>
              <th className="px-4 py-2 text-right whitespace-nowrap">ราคาขาย</th>
              <th className="px-4 py-2 text-right whitespace-nowrap">กำไร/แก้ว</th>
              <th className="px-4 py-2 text-right whitespace-nowrap">% กำไร</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {menus.map((m) => {
              const profit = profitPerCup(m);
              const pct = profitPct(m);
              return (
                <tr key={m.id} className="border-t border-stone-100 align-top">
                  <td className="px-4 py-2 font-medium text-stone-800">
                    {m.name}
                    {m.addons?.length > 0 && (
                      <div className="text-xs text-stone-400 font-normal mt-0.5">
                        {m.addons.map((a) => a.name).join(', ')}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-2 text-stone-500">{m.category}</td>
                  <td className="px-4 py-2 text-right">
                    {(Number(m.cost_price) || 0).toFixed(2)}
                    {m.ingredients?.length > 0 && (
                      <div className="text-xs text-stone-400 font-normal mt-0.5">
                        {m.ingredients.map((i) => `${i.name} ${i.cost}`).join(', ')}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-2 text-right">{(Number(m.sell_price) || 0).toFixed(2)}</td>
                  <td
                    className={`px-4 py-2 text-right font-semibold ${
                      profit >= 0 ? 'text-emerald-600' : 'text-red-600'
                    }`}
                  >
                    {profit.toFixed(2)}
                  </td>
                  <td
                    className={`px-4 py-2 text-right font-semibold ${
                      pct >= 0 ? 'text-emerald-600' : 'text-red-600'
                    }`}
                  >
                    {pct.toFixed(1)}%
                  </td>
                  <td className="px-4 py-2 text-right whitespace-nowrap">
                    <button
                      onClick={() => startEdit(m)}
                      className="text-stone-500 hover:text-emerald-600 px-2"
                    >
                      แก้ไข
                    </button>
                    <button
                      onClick={() => remove(m.id)}
                      className="text-stone-500 hover:text-red-600 px-2"
                    >
                      ลบ
                    </button>
                  </td>
                </tr>
              );
            })}
            {menus.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-stone-400">
                  ยังไม่มีเมนู เพิ่มเมนูแรกด้านบนได้เลย
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
