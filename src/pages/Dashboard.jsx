import { useEffect, useMemo, useState } from 'react';
import {
  BarChart,
  Bar,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { getMenus, getSales, todayStr } from '../lib/storage';
import { filterSales, summarize, dailySeries, topBottom } from '../lib/calc';

const RANGES = {
  today: 'วันนี้',
  week: '7 วันล่าสุด',
  month: '30 วันล่าสุด',
  all: 'ทั้งหมด',
};

function rangeToDates(range) {
  const to = todayStr();
  if (range === 'all') return { from: null, to: null };
  const days = range === 'today' ? 0 : range === 'week' ? 6 : 29;
  const from = new Date();
  from.setDate(from.getDate() - days);
  return { from: from.toISOString().slice(0, 10), to };
}

function StatCard({ label, value, tone }) {
  const color =
    tone === 'good' ? 'text-emerald-600' : tone === 'bad' ? 'text-red-600' : 'text-stone-800';
  return (
    <div className="bg-white rounded-xl border border-stone-200 p-4">
      <div className="text-xs text-stone-500 mb-1">{label}</div>
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
    </div>
  );
}

export default function Dashboard() {
  const [menus, setMenus] = useState([]);
  const [sales, setSales] = useState([]);
  const [range, setRange] = useState('week');

  useEffect(() => {
    getMenus().then(setMenus);
    getSales().then(setSales);
  }, []);

  const { from, to } = rangeToDates(range);
  const filtered = useMemo(() => filterSales(sales, { from, to }), [sales, from, to]);
  const summary = useMemo(() => summarize(filtered, menus), [filtered, menus]);
  const series = useMemo(() => dailySeries(filtered, menus), [filtered, menus]);
  const byProfit = useMemo(() => topBottom(summary.perMenu, 'profit'), [summary]);
  const byQty = useMemo(() => topBottom(summary.perMenu, 'quantity'), [summary]);

  const profitChartData = summary.perMenu
    .map((p) => ({ name: p.menu.name, กำไร: Number(p.profit.toFixed(2)) }))
    .sort((a, b) => b.กำไร - a.กำไร);

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        {Object.entries(RANGES).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setRange(key)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
              range === key
                ? 'bg-emerald-600 text-white'
                : 'bg-white text-stone-600 border border-stone-200'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-3">
        <StatCard label="ยอดขายรวม" value={`฿${summary.revenue.toFixed(0)}`} />
        <StatCard label="ต้นทุนรวม" value={`฿${summary.cost.toFixed(0)}`} />
        <StatCard
          label="กำไรรวม"
          value={`฿${summary.profit.toFixed(0)}`}
          tone={summary.profit >= 0 ? 'good' : 'bad'}
        />
      </div>

      <div className="bg-white rounded-xl border border-stone-200 p-4">
        <h3 className="font-semibold text-stone-700 mb-3">กำไรแยกตามชนิดน้ำ</h3>
        {profitChartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={profitChartData} margin={{ left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="กำไร" radius={[4, 4, 0, 0]}>
                {profitChartData.map((entry, i) => (
                  <Cell key={i} fill={entry.กำไร >= 0 ? '#059669' : '#dc2626'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="text-center text-stone-400 py-10">ยังไม่มีข้อมูลในช่วงนี้</div>
        )}
      </div>

      <div className="bg-white rounded-xl border border-stone-200 p-4">
        <h3 className="font-semibold text-stone-700 mb-3">ยอดขายตามช่วงเวลา</h3>
        {series.length > 0 ? (
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={series} margin={{ left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Line type="monotone" dataKey="revenue" name="ยอดขาย" stroke="#059669" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="profit" name="กำไร" stroke="#f59e0b" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="text-center text-stone-400 py-10">ยังไม่มีข้อมูลในช่วงนี้</div>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <RankCard title="🏆 Top 5 ขายดี" rows={byQty.top} valueKey="quantity" unit=" แก้ว" />
        <RankCard title="💰 Top 5 กำไรสูงสุด" rows={byProfit.top} valueKey="profit" unit=" บาท" />
        <RankCard title="📉 Bottom 5 ขายน้อย" rows={byQty.bottom} valueKey="quantity" unit=" แก้ว" tone="bad" />
        <RankCard title="⚠️ Bottom 5 กำไรต่ำ" rows={byProfit.bottom} valueKey="profit" unit=" บาท" tone="bad" />
      </div>
    </div>
  );
}

function RankCard({ title, rows, valueKey, unit, tone }) {
  return (
    <div className="bg-white rounded-xl border border-stone-200 p-4">
      <h3 className="font-semibold text-stone-700 mb-2">{title}</h3>
      {rows.length === 0 ? (
        <div className="text-stone-400 text-sm py-2">ไม่มีข้อมูล</div>
      ) : (
        <ul className="space-y-1.5">
          {rows.map((r, i) => (
            <li key={r.menu.id} className="flex items-center justify-between text-sm">
              <span className="text-stone-700">
                {i + 1}. {r.menu.name}
              </span>
              <span
                className={`font-semibold ${
                  tone === 'bad' ? 'text-red-500' : 'text-emerald-600'
                }`}
              >
                {r[valueKey].toFixed(valueKey === 'quantity' ? 0 : 2)}
                {unit}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
