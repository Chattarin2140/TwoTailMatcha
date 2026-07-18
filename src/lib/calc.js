export function profitPerCup(menu) {
  return menu.sell_price - menu.cost_price;
}

export function addonsTotal(sale) {
  return (sale.addons || []).reduce((sum, a) => sum + a.price, 0);
}

export function saleUnitPrice(sale, menu) {
  return menu.sell_price + addonsTotal(sale);
}

export function profitPct(menu) {
  if (menu.sell_price === 0) return 0;
  return (profitPerCup(menu) / menu.sell_price) * 100;
}

function inRange(dateStr, from, to) {
  if (from && dateStr < from) return false;
  if (to && dateStr > to) return false;
  return true;
}

export function filterSales(sales, { from, to, menuId } = {}) {
  return sales.filter((s) => {
    if (menuId && s.menu_id !== menuId) return false;
    return inRange(s.date, from, to);
  });
}

export function summarize(sales, menus) {
  const menuById = Object.fromEntries(menus.map((m) => [m.id, m]));
  let revenue = 0;
  let cost = 0;
  const perMenu = {};

  for (const s of sales) {
    const menu = menuById[s.menu_id];
    if (!menu) continue;
    const rev = saleUnitPrice(s, menu) * s.quantity;
    const cst = menu.cost_price * s.quantity;
    revenue += rev;
    cost += cst;
    if (!perMenu[menu.id]) {
      perMenu[menu.id] = { menu, quantity: 0, revenue: 0, cost: 0, profit: 0 };
    }
    perMenu[menu.id].quantity += s.quantity;
    perMenu[menu.id].revenue += rev;
    perMenu[menu.id].cost += cst;
    perMenu[menu.id].profit += rev - cst;
  }

  return {
    revenue,
    cost,
    profit: revenue - cost,
    perMenu: Object.values(perMenu),
  };
}

export function dailySeries(sales, menus) {
  const menuById = Object.fromEntries(menus.map((m) => [m.id, m]));
  const byDate = {};
  for (const s of sales) {
    const menu = menuById[s.menu_id];
    if (!menu) continue;
    if (!byDate[s.date]) byDate[s.date] = { date: s.date, revenue: 0, cost: 0, profit: 0 };
    const rev = saleUnitPrice(s, menu) * s.quantity;
    const cst = menu.cost_price * s.quantity;
    byDate[s.date].revenue += rev;
    byDate[s.date].cost += cst;
    byDate[s.date].profit += rev - cst;
  }
  return Object.values(byDate).sort((a, b) => a.date.localeCompare(b.date));
}

export function topBottom(perMenu, key, n = 5) {
  const sorted = [...perMenu].sort((a, b) => b[key] - a[key]);
  return {
    top: sorted.slice(0, n),
    bottom: sorted.slice(-n).reverse(),
  };
}

export function generateInsights(perMenu) {
  if (perMenu.length === 0) return [];

  const avgProfitPct =
    perMenu.reduce((sum, p) => sum + profitPct(p.menu), 0) / perMenu.length;
  const avgQty = perMenu.reduce((sum, p) => sum + p.quantity, 0) / perMenu.length;

  const insights = [];

  for (const p of perMenu) {
    const pct = profitPct(p.menu);
    const highQty = p.quantity >= avgQty;
    const highPct = pct >= avgProfitPct;

    if (highQty && !highPct) {
      insights.push({
        type: 'warning',
        menu: p.menu,
        title: `${p.menu.name}: ขายดีแต่กำไรต่ำ`,
        detail: `ขาย ${p.quantity} แก้ว (สูงกว่าเฉลี่ย) แต่กำไร ${pct.toFixed(1)}% ต่ำกว่าเฉลี่ยร้าน ${avgProfitPct.toFixed(1)}% เสี่ยงเหนื่อยฟรี ลองพิจารณาปรับราคาหรือลดต้นทุน`,
      });
    } else if (!highQty && highPct) {
      insights.push({
        type: 'opportunity',
        menu: p.menu,
        title: `${p.menu.name}: กำไรสูงแต่ขายน้อย`,
        detail: `กำไร ${pct.toFixed(1)}% สูงกว่าเฉลี่ย แต่ขายแค่ ${p.quantity} แก้ว โอกาสโปรโมทเพิ่มยอดขาย`,
      });
    } else if (!highQty && !highPct) {
      insights.push({
        type: 'danger',
        menu: p.menu,
        title: `${p.menu.name}: ขายน้อยและกำไรต่ำ`,
        detail: `ขาย ${p.quantity} แก้ว กำไร ${pct.toFixed(1)}% ทั้งสองอย่างต่ำกว่าเฉลี่ย ควรพิจารณาตัดออกจากเมนู`,
      });
    } else {
      insights.push({
        type: 'good',
        menu: p.menu,
        title: `${p.menu.name}: ดาวเด่นของร้าน`,
        detail: `ขาย ${p.quantity} แก้ว กำไร ${pct.toFixed(1)}% สูงกว่าเฉลี่ยทั้งคู่ รักษาระดับนี้ไว้`,
      });
    }
  }

  const order = { danger: 0, warning: 1, opportunity: 2, good: 3 };
  return insights.sort((a, b) => order[a.type] - order[b.type]);
}
