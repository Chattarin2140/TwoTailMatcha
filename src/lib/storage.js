import { supabase } from './supabaseClient';

function uid() {
  return crypto.randomUUID();
}

function buildSeedMenus() {
  return [
    {
      id: uid(),
      name: 'เพียวมัทฉะ',
      category: 'Matcha',
      cost_price: 0,
      sell_price: 130,
      addons: [
        { id: uid(), name: 'แยกน้ำ', price: 5 },
        { id: uid(), name: 'เอิร์ลเกรย์ไซรัป (ที่ร้านทำเอง)', price: 15 },
        { id: uid(), name: 'Cold foam', price: 15 },
        { id: uid(), name: 'Strawberry cold foam', price: 25 },
      ],
      ingredients: [],
    },
    {
      id: uid(),
      name: 'Matcha latte (โทนถั่วคั่วปลาย)',
      category: 'Matcha',
      cost_price: 0,
      sell_price: 150,
      addons: [
        { id: uid(), name: 'Cold foam', price: 15 },
        { id: uid(), name: 'Strawberry cold foam', price: 25 },
        { id: uid(), name: 'นมโอ๊ต (good mate barista)', price: 20 },
        { id: uid(), name: 'แยกน้ำ', price: 5 },
      ],
      ingredients: [],
    },
    {
      id: uid(),
      name: 'Matcha cold foam',
      category: 'Matcha',
      cost_price: 0,
      sell_price: 150,
      addons: [],
      ingredients: [],
    },
    {
      id: uid(),
      name: 'Aroarashi uji matcha',
      category: 'Matcha',
      cost_price: 0,
      sell_price: 170,
      addons: [],
      ingredients: [],
    },
    {
      id: uid(),
      name: 'Peace Naturalist (แนะนำลาเต้)',
      category: 'Matcha',
      cost_price: 0,
      sell_price: 140,
      addons: [],
      ingredients: [],
    },
    {
      id: uid(),
      name: 'Peace essentialist',
      category: 'Matcha',
      cost_price: 0,
      sell_price: 145,
      addons: [],
      ingredients: [],
    },
    {
      id: uid(),
      name: 'Yame Gyokuro Latte (โทนถั่ว)',
      category: 'Matcha',
      cost_price: 0,
      sell_price: 140,
      addons: [],
      ingredients: [],
    },
  ];
}

async function fetchMenus() {
  const { data, error } = await supabase
    .from('menus')
    .select('*')
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data.map((m) => ({ addons: [], ingredients: [], ...m }));
}

export async function getMenus() {
  const existing = await fetchMenus();
  if (existing.length === 0) {
    const { error } = await supabase.from('menus').insert(buildSeedMenus());
    if (error) throw error;
    return fetchMenus();
  }
  return existing;
}

export async function addMenu(menu) {
  const row = { id: uid(), addons: [], ingredients: [], ...menu };
  const { error } = await supabase.from('menus').insert(row);
  if (error) throw error;
  return fetchMenus();
}

export async function updateMenu(id, patch) {
  const { error } = await supabase.from('menus').update(patch).eq('id', id);
  if (error) throw error;
  return fetchMenus();
}

export async function deleteMenu(id) {
  const { error } = await supabase.from('menus').delete().eq('id', id);
  if (error) throw error;
  return fetchMenus();
}

export async function resetMenusToSeed() {
  const { error: delError } = await supabase.from('menus').delete().not('id', 'is', null);
  if (delError) throw delError;
  const { error } = await supabase.from('menus').insert(buildSeedMenus());
  if (error) throw error;
  return fetchMenus();
}

async function fetchSales() {
  const { data, error } = await supabase
    .from('sales')
    .select('*')
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data.map((s) => ({ addons: [], ...s }));
}

export async function getSales() {
  return fetchSales();
}

export async function addSale(sale) {
  const row = { id: uid(), addons: [], ...sale };
  const { error } = await supabase.from('sales').insert(row);
  if (error) throw error;
  return fetchSales();
}

export async function updateSale(id, patch) {
  const { error } = await supabase.from('sales').update(patch).eq('id', id);
  if (error) throw error;
  return fetchSales();
}

export async function deleteSale(id) {
  const { error } = await supabase.from('sales').delete().eq('id', id);
  if (error) throw error;
  return fetchSales();
}

export function todayStr() {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}
