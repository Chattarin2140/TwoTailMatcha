const MENU_KEY = 'dst_menus';
const SALE_KEY = 'dst_sales';

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function read(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function write(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
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
    },
    {
      id: uid(),
      name: 'Matcha cold foam',
      category: 'Matcha',
      cost_price: 0,
      sell_price: 150,
      addons: [],
    },
    {
      id: uid(),
      name: 'Aroarashi uji matcha',
      category: 'Matcha',
      cost_price: 0,
      sell_price: 170,
      addons: [],
    },
    {
      id: uid(),
      name: 'Peace Naturalist (แนะนำลาเต้)',
      category: 'Matcha',
      cost_price: 0,
      sell_price: 140,
      addons: [],
    },
    {
      id: uid(),
      name: 'Peace essentialist',
      category: 'Matcha',
      cost_price: 0,
      sell_price: 145,
      addons: [],
    },
    {
      id: uid(),
      name: 'Yame Gyokuro Latte (โทนถั่ว)',
      category: 'Matcha',
      cost_price: 0,
      sell_price: 140,
      addons: [],
    },
  ];
}

export function getMenus() {
  const existing = read(MENU_KEY);
  if (existing.length === 0) {
    const seed = buildSeedMenus();
    write(MENU_KEY, seed);
    return seed;
  }
  return existing.map((m) => ({ addons: [], ingredients: [], ...m }));
}

export function saveMenus(menus) {
  write(MENU_KEY, menus);
}

export function resetMenusToSeed() {
  const seed = buildSeedMenus();
  write(MENU_KEY, seed);
  return seed;
}

export function addMenu(menu) {
  const menus = getMenus();
  const next = [...menus, { id: uid(), addons: [], ingredients: [], ...menu }];
  saveMenus(next);
  return next;
}

export function updateMenu(id, patch) {
  const menus = getMenus().map((m) => (m.id === id ? { ...m, ...patch } : m));
  saveMenus(menus);
  return menus;
}

export function deleteMenu(id) {
  const menus = getMenus().filter((m) => m.id !== id);
  saveMenus(menus);
  return menus;
}

export function getSales() {
  return read(SALE_KEY);
}

export function saveSales(sales) {
  write(SALE_KEY, sales);
}

export function addSale(sale) {
  const sales = getSales();
  const next = [...sales, { id: uid(), addons: [], ...sale }];
  saveSales(next);
  return next;
}

export function updateSale(id, patch) {
  const sales = getSales().map((s) => (s.id === id ? { ...s, ...patch } : s));
  saveSales(sales);
  return sales;
}

export function deleteSale(id) {
  const sales = getSales().filter((s) => s.id !== id);
  saveSales(sales);
  return sales;
}

export function todayStr() {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}
