import { useMemo, useState } from 'react';
import { getMenus, getSales } from '../lib/storage';
import { summarize, generateInsights, profitPct } from '../lib/calc';

const STYLE = {
  danger: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', badge: '✂️' },
  warning: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', badge: '⚠️' },
  opportunity: { bg: 'bg-sky-50', border: 'border-sky-200', text: 'text-sky-700', badge: '📣' },
  good: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', badge: '⭐' },
};

export default function Insights() {
  const [menus] = useState(getMenus());
  const [sales] = useState(getSales());

  const summary = useMemo(() => summarize(sales, menus), [sales, menus]);
  const insights = useMemo(() => generateInsights(summary.perMenu), [summary]);

  const avgProfitPct =
    menus.length > 0
      ? menus.reduce((sum, m) => sum + profitPct(m), 0) / menus.length
      : 0;

  if (summary.perMenu.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-stone-200 p-8 text-center text-stone-400">
        ยังไม่มีข้อมูลการขายพอให้วิเคราะห์ ไปบันทึกยอดขายก่อนนะ
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-stone-200 p-4">
        <div className="text-xs text-stone-500">% กำไรเฉลี่ยของร้าน (ทุกเมนู)</div>
        <div className="text-2xl font-bold text-stone-800">{avgProfitPct.toFixed(1)}%</div>
      </div>

      <div className="grid md:grid-cols-2 gap-3">
        {insights.map((ins) => {
          const s = STYLE[ins.type];
          return (
            <div
              key={ins.menu.id}
              className={`rounded-xl border p-4 ${s.bg} ${s.border}`}
            >
              <div className={`font-semibold ${s.text} mb-1`}>
                {s.badge} {ins.title}
              </div>
              <div className="text-sm text-stone-600">{ins.detail}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
