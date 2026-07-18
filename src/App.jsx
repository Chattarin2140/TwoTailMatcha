import { useState } from 'react';
import Dashboard from './pages/Dashboard';
import MenuManagement from './pages/MenuManagement';
import SalesEntry from './pages/SalesEntry';
import SalesHistory from './pages/SalesHistory';
import Insights from './pages/Insights';

const TABS = [
  { id: 'dashboard', label: 'แดชบอร์ด', icon: '📊' },
  { id: 'entry', label: 'บันทึกขาย', icon: '➕' },
  { id: 'history', label: 'ประวัติ', icon: '📜' },
  { id: 'insights', label: 'วิเคราะห์', icon: '💡' },
  { id: 'menu', label: 'จัดการเมนู', icon: '🍹' },
];

export default function App() {
  const [tab, setTab] = useState('dashboard');
  const [refreshKey, setRefreshKey] = useState(0);
  const bump = () => setRefreshKey((k) => k + 1);

  return (
    <div className="min-h-screen bg-stone-100 pb-20 md:pb-0">
      <header className="bg-white border-b border-stone-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-lg font-bold text-stone-800">🥤 บันทึกการขายน้ำ</h1>
          <nav className="hidden md:flex gap-1">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                  tab === t.id
                    ? 'bg-emerald-600 text-white'
                    : 'text-stone-600 hover:bg-stone-100'
                }`}
              >
                {t.icon} {t.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-4">
        {tab === 'dashboard' && <Dashboard key={refreshKey} />}
        {tab === 'entry' && <SalesEntry key={refreshKey} onChange={bump} />}
        {tab === 'history' && <SalesHistory key={refreshKey} onChange={bump} />}
        {tab === 'insights' && <Insights key={refreshKey} />}
        {tab === 'menu' && <MenuManagement key={refreshKey} onChange={bump} />}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-stone-200 flex md:hidden z-10">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 py-2 flex flex-col items-center text-xs font-medium ${
              tab === t.id ? 'text-emerald-600' : 'text-stone-500'
            }`}
          >
            <span className="text-lg leading-none">{t.icon}</span>
            {t.label}
          </button>
        ))}
      </nav>
    </div>
  );
}
