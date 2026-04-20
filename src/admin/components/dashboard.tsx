import React, { useState, useEffect, useCallback } from 'react';

// ─── Design tokens ────────────────────────────────────────────────────────────
const BLUE     = '#3b82f6';
const GREEN    = '#22c55e';
const AMBER    = '#f59e0b';
const BG       = '#f1f5f9';
const CARD     = '#ffffff';
const TEXT     = '#0f172a';
const MUTED    = '#64748b';
const BORDER   = '#e2e8f0';
const DARK     = '#1e293b';

const PERIODS = [
  { key: 'weekly',  label: 'Weekly'   },
  { key: 'monthly', label: 'Monthly'  },
  { key: 'yearly',  label: 'Yearly'   },
  { key: 'all',     label: 'All Time' },
  { key: 'custom',  label: '📅 Custom' },
];

type Bucket = { label: string; users: number; partners: number };

// ─── SVG Bar Chart ────────────────────────────────────────────────────────────
const BarChart = ({ data, color, title }: { data: { label: string; value: number }[]; color: string; title: string }) => {
  const [tip, setTip] = useState<{ i: number; x: number; y: number } | null>(null);
  const H = 160, PAD = 32, W = 600;

  if (!data || data.length === 0) {
    return (
      <div style={{ height: H + PAD, display: 'flex', alignItems: 'center', justifyContent: 'center', color: MUTED, fontSize: 13 }}>
        No registrations in this period
      </div>
    );
  }

  const max = Math.max(...data.map(d => d.value), 1);
  const n = data.length;
  const slotW = W / n;
  const barW = Math.max(6, Math.min(36, slotW * 0.6));

  return (
    <div style={{ position: 'relative', width: '100%', overflowX: 'auto', overflowY: 'visible' }}>
      <svg
        viewBox={`0 0 ${W} ${H + PAD}`}
        width="100%"
        style={{ display: 'block', overflow: 'visible' }}
      >
        {/* Horizontal grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map(t => {
          const y = H - Math.round(t * H);
          return (
            <g key={t}>
              <line x1={0} y1={y} x2={W} y2={y} stroke={BORDER} strokeWidth={1} strokeDasharray={t === 0 ? '' : '4 4'} />
              <text x={0} y={y - 3} fontSize={9} fill={MUTED}>{Math.round(t * max)}</text>
            </g>
          );
        })}

        {/* Bars */}
        {data.map((d, i) => {
          const cx = slotW * i + slotW / 2;
          const barH = Math.max(2, Math.round((d.value / max) * H));
          const barY = H - barH;
          const isHov = tip?.i === i;
          return (
            <g
              key={i}
              onMouseEnter={e => setTip({ i, x: cx, y: barY - 8 })}
              onMouseLeave={() => setTip(null)}
              style={{ cursor: 'pointer' }}
            >
              {/* hover glow */}
              {isHov && <rect x={cx - barW / 2 - 4} y={0} width={barW + 8} height={H} fill={color} opacity={0.07} rx={4} />}
              {/* bar */}
              <rect
                x={cx - barW / 2} y={barY} width={barW} height={barH}
                fill={color} opacity={isHov ? 1 : 0.78} rx={4}
                style={{ transition: 'opacity 0.15s' }}
              />
              {/* x-label */}
              {(n <= 15 || i % Math.ceil(n / 10) === 0) && (
                <text
                  x={cx} y={H + 16} textAnchor="middle" fontSize={9} fill={MUTED}
                  transform={n > 20 ? `rotate(-40,${cx},${H + 16})` : ''}
                >
                  {d.label.length > 7 ? d.label.slice(5) : d.label}
                </text>
              )}
            </g>
          );
        })}

        {/* Tooltip */}
        {tip && (
          <g>
            <rect
              x={Math.min(tip.x - 28, W - 60)} y={tip.y - 26}
              width={56} height={22} rx={6} fill={DARK}
            />
            <text
              x={Math.min(tip.x - 28, W - 60) + 28} y={tip.y - 11}
              textAnchor="middle" fontSize={12} fontWeight={700} fill="#fff"
            >
              {data[tip.i].value}
            </text>
          </g>
        )}
      </svg>
    </div>
  );
};

// ─── Stat card ────────────────────────────────────────────────────────────────
const Card = ({ label, value, color, emoji }: { label: string; value: number; color: string; emoji: string }) => (
  <div style={{
    flex: '1 1 140px', background: CARD, borderRadius: 16,
    boxShadow: '0 2px 12px rgba(0,0,0,0.07)', borderTop: `4px solid ${color}`,
    padding: '22px 20px', textAlign: 'center',
  }}>
    <div style={{ fontSize: 30, marginBottom: 6 }}>{emoji}</div>
    <div style={{ fontSize: 40, fontWeight: 900, color: TEXT, lineHeight: 1 }}>{value.toLocaleString()}</div>
    <div style={{ marginTop: 8, fontSize: 11, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</div>
  </div>
);

// ─── Chart panel card ─────────────────────────────────────────────────────────
const ChartCard = ({
  title, emoji, color, data, total,
}: {
  title: string; emoji: string; color: string;
  data: { label: string; value: number }[]; total: number;
}) => (
  <div style={{
    background: CARD, borderRadius: 18,
    boxShadow: '0 2px 16px rgba(0,0,0,0.07)',
    borderLeft: `6px solid ${color}`,
    padding: '28px 32px',
  }}>
    {/* Header */}
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
      <div>
        <div style={{ fontSize: 18, fontWeight: 800, color: TEXT }}>{emoji} {title}</div>
        <div style={{ fontSize: 12, color: MUTED, marginTop: 2 }}>Registrations over time</div>
      </div>
      <div style={{
        background: color, color: '#fff', borderRadius: 12,
        padding: '6px 18px', fontSize: 24, fontWeight: 900,
      }}>
        {total}
      </div>
    </div>
    {/* Chart */}
    <BarChart data={data} color={color} title={title} />
  </div>
);

// ─── Main Dashboard ───────────────────────────────────────────────────────────
const Dashboard = (props: any) => {
  const [period, setPeriod]       = useState('weekly');
  const [from, setFrom]           = useState('');
  const [to, setTo]               = useState('');
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [data, setData]           = useState<{
    users: number; partners: number; payments: number;
    chartData: Bucket[];
  }>({ users: 0, partners: 0, payments: 1450, chartData: [] });

  const fetchStats = useCallback(async (p: string, f?: string, t?: string) => {
    setLoading(true);
    setError('');
    try {
      let url = `/api/admin/stats?period=${p}`;
      if (p === 'custom' && f && t) url += `&from=${f}&to=${t}`;
      const res = await fetch(url, { credentials: 'include' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setData(json);
    } catch (e: any) {
      setError(e.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchStats('weekly'); }, []);

  const handlePeriod = (p: string) => {
    setPeriod(p);
    if (p !== 'custom') fetchStats(p);
  };

  const usersData    = (data.chartData || []).map(b => ({ label: b.label, value: b.users }));
  const partnersData = (data.chartData || []).map(b => ({ label: b.label, value: b.partners }));

  return (
    <div style={{ padding: '36px 44px', background: BG, minHeight: '100vh', fontFamily: '"Inter", system-ui, sans-serif', boxSizing: 'border-box' }}>

      {/* Title */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ margin: 0, fontSize: 28, fontWeight: 900, color: TEXT }}>📊 EasyWay Dashboard</h1>
        <p style={{ margin: '4px 0 0', color: MUTED, fontSize: 14 }}>Platform analytics & growth overview</p>
      </div>

      {/* Period Selector */}
      <div style={{ background: CARD, borderRadius: 14, padding: '16px 22px', marginBottom: 28, boxShadow: '0 1px 6px rgba(0,0,0,0.05)', display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
        {PERIODS.map(p => (
          <button
            key={p.key}
            onClick={() => handlePeriod(p.key)}
            style={{
              padding: '7px 18px', borderRadius: 22, border: 'none', cursor: 'pointer',
              fontSize: 13, fontWeight: 700,
              background: period === p.key ? DARK : BORDER,
              color: period === p.key ? '#fff' : MUTED,
              transition: 'all 0.15s',
              boxShadow: period === p.key ? '0 2px 8px rgba(0,0,0,0.18)' : 'none',
            }}
          >
            {p.label}
          </button>
        ))}

        {period === 'custom' && (
          <>
            <input type="date" value={from} onChange={e => setFrom(e.target.value)}
              style={{ padding: '6px 12px', borderRadius: 8, border: `1px solid ${BORDER}`, fontSize: 13, outline: 'none' }} />
            <span style={{ color: MUTED }}>→</span>
            <input type="date" value={to} onChange={e => setTo(e.target.value)}
              style={{ padding: '6px 12px', borderRadius: 8, border: `1px solid ${BORDER}`, fontSize: 13, outline: 'none' }} />
            <button
              onClick={() => { if (from && to) fetchStats('custom', from, to); }}
              style={{
                padding: '7px 18px', borderRadius: 22, border: 'none', cursor: 'pointer',
                fontSize: 13, fontWeight: 700, background: BLUE, color: '#fff',
                boxShadow: '0 2px 8px rgba(59,130,246,0.3)',
              }}
            >
              Apply
            </button>
          </>
        )}
      </div>

      {/* Summary stat cards */}
      <div style={{ display: 'flex', gap: 18, marginBottom: 32, flexWrap: 'wrap' }}>
        <Card label="Registered Users"  value={data.users}    color={BLUE}  emoji="👤" />
        <Card label="Active Partners"   value={data.partners} color={GREEN} emoji="🤝" />
        <Card label="Platform Payments" value={data.payments} color={AMBER} emoji="💳" />
      </div>

      {/* Charts section */}
      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 12, padding: '16px 20px', color: '#dc2626', marginBottom: 24, fontSize: 14 }}>
          ⚠️ Error loading stats: {error}
        </div>
      )}

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {[BLUE, GREEN].map(c => (
            <div key={c} style={{ background: CARD, borderRadius: 18, borderLeft: `6px solid ${c}`, padding: '28px 32px', minHeight: 240, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ color: MUTED, fontSize: 14 }}>Loading chart…</div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <ChartCard title="Users Growth"    emoji="👤" color={BLUE}  data={usersData}    total={data.users}    />
          <ChartCard title="Partners Growth" emoji="🤝" color={GREEN} data={partnersData} total={data.partners} />
        </div>
      )}
    </div>
  );
};

export default Dashboard;
