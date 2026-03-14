import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { BarChart3, Calendar, Users, CheckCircle, XCircle, Clock, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

interface RekapEntry {
  santriId: string;
  santriName?: string;
  santri?: { name: string; kelas?: string };
  name?: string;
  kelas?: string;
  hadir?: number;
  sakit?: number;
  izin?: number;
  alpha?: number;
  status?: string;
  type?: string;
}

export function RekapPage() {
  const [data, setData] = useState<RekapEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('today');

  const fetchRekap = async () => {
    setLoading(true);
    try {
      // Try the rekap endpoint first, fallback to today's log
      let entries: RekapEntry[] = [];
      if (period === 'today') {
        const res = await api.get('/attendance/today');
        const raw = Array.isArray(res.data) ? res.data : (res.data?.data || []);
        // Group by santri
        const grouped = new Map<string, RekapEntry>();
        for (const row of raw) {
          const name = row.santriName || row.santri?.name || 'Santri';
          const key = row.santriId || name;
          if (!grouped.has(key)) {
            grouped.set(key, {
              santriId: key,
              santriName: name,
              kelas: row.santri?.kelas || '-',
              hadir: 0, sakit: 0, izin: 0, alpha: 0,
            });
          }
          const entry = grouped.get(key)!;
          if (row.type === 'MASUK' || row.status === 'HADIR') entry.hadir = (entry.hadir || 0) + 1;
          else if (row.status === 'SAKIT') entry.sakit = (entry.sakit || 0) + 1;
          else if (row.status === 'IZIN') entry.izin = (entry.izin || 0) + 1;
          else if (row.status === 'ALPHA') entry.alpha = (entry.alpha || 0) + 1;
        }
        entries = Array.from(grouped.values());
      } else {
        // Try weekly/monthly recap endpoint
        try {
          const res = await api.get(`/attendance/recap?period=${period}`);
          entries = Array.isArray(res.data) ? res.data : (res.data?.data || []);
        } catch {
          // Fallback — just use today's data
          const res = await api.get('/attendance/today');
          const raw = Array.isArray(res.data) ? res.data : (res.data?.data || []);
          const grouped = new Map<string, RekapEntry>();
          for (const row of raw) {
            const name = row.santriName || row.santri?.name || 'Santri';
            const key = row.santriId || name;
            if (!grouped.has(key)) {
              grouped.set(key, { santriId: key, santriName: name, kelas: row.santri?.kelas || '-', hadir: 0, sakit: 0, izin: 0, alpha: 0 });
            }
            const entry = grouped.get(key)!;
            entry.hadir = (entry.hadir || 0) + 1;
          }
          entries = Array.from(grouped.values());
        }
      }
      setData(entries);
    } catch {
      toast.error('Gagal memuat rekap absensi');
      setData([]);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchRekap(); }, [period]);

  const totalHadir = data.reduce((s, d) => s + (d.hadir || 0), 0);
  const totalSakit = data.reduce((s, d) => s + (d.sakit || 0), 0);
  const totalIzin = data.reduce((s, d) => s + (d.izin || 0), 0);
  const totalAlpha = data.reduce((s, d) => s + (d.alpha || 0), 0);

  return (
    <div className="animate-in" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: '1.125rem', fontWeight: 700 }}>📊 Rekap Absensi</h2>
        <button onClick={fetchRekap} className="btn btn-outline" style={{ padding: '0.375rem 0.75rem' }} title="Refresh">
          <RefreshCw size={16} />
        </button>
      </div>

      {/* Period Selector */}
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        {[
          { key: 'today', label: 'Hari Ini', icon: <Clock size={14} /> },
          { key: 'week', label: 'Minggu Ini', icon: <Calendar size={14} /> },
          { key: 'month', label: 'Bulan Ini', icon: <BarChart3 size={14} /> },
        ].map(p => (
          <button
            key={p.key}
            onClick={() => setPeriod(p.key)}
            className={`btn ${period === p.key ? 'btn-primary' : 'btn-outline'}`}
            style={{ flex: 1, justifyContent: 'center', fontSize: '0.75rem', padding: '0.5rem 0.375rem' }}
          >
            {p.icon} {p.label}
          </button>
        ))}
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '0.5rem' }}>
        <div className="card" style={{ padding: '0.75rem', textAlign: 'center' }}>
          <CheckCircle size={16} style={{ margin: '0 auto 0.25rem', color: 'var(--success)' }} />
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--success)' }}>{totalHadir}</div>
          <div className="text-muted" style={{ fontSize: '0.5625rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Hadir</div>
        </div>
        <div className="card" style={{ padding: '0.75rem', textAlign: 'center' }}>
          <XCircle size={16} style={{ margin: '0 auto 0.25rem', color: 'var(--warning)' }} />
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--warning)' }}>{totalSakit}</div>
          <div className="text-muted" style={{ fontSize: '0.5625rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Sakit</div>
        </div>
        <div className="card" style={{ padding: '0.75rem', textAlign: 'center' }}>
          <Calendar size={16} style={{ margin: '0 auto 0.25rem', color: 'var(--accent)' }} />
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--accent)' }}>{totalIzin}</div>
          <div className="text-muted" style={{ fontSize: '0.5625rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Izin</div>
        </div>
        <div className="card" style={{ padding: '0.75rem', textAlign: 'center' }}>
          <Users size={16} style={{ margin: '0 auto 0.25rem', color: 'var(--danger)' }} />
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--danger)' }}>{totalAlpha}</div>
          <div className="text-muted" style={{ fontSize: '0.5625rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Alpha</div>
        </div>
      </div>

      {/* Table */}
      <div className="card" style={{ overflow: 'hidden' }}>
        {loading ? (
          <div className="text-center text-muted" style={{ padding: '3rem' }}>
            <BarChart3 size={32} style={{ opacity: 0.3, margin: '0 auto 0.5rem' }} />
            <p>Memuat rekap...</p>
          </div>
        ) : data.length === 0 ? (
          <div className="text-center text-muted" style={{ padding: '3rem' }}>
            <BarChart3 size={32} style={{ opacity: 0.3, margin: '0 auto 0.5rem' }} />
            <p>Belum ada data absensi</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.6875rem', textTransform: 'uppercase' }}>Nama</th>
                  <th style={{ padding: '0.75rem', textAlign: 'center', color: 'var(--success)', fontWeight: 600, fontSize: '0.6875rem' }}>H</th>
                  <th style={{ padding: '0.75rem', textAlign: 'center', color: 'var(--warning)', fontWeight: 600, fontSize: '0.6875rem' }}>S</th>
                  <th style={{ padding: '0.75rem', textAlign: 'center', color: 'var(--accent)', fontWeight: 600, fontSize: '0.6875rem' }}>I</th>
                  <th style={{ padding: '0.75rem', textAlign: 'center', color: 'var(--danger)', fontWeight: 600, fontSize: '0.6875rem' }}>A</th>
                </tr>
              </thead>
              <tbody>
                {data.map((row, i) => {
                  const name = row.santriName || row.santri?.name || row.name || '-';
                  return (
                    <tr key={row.santriId || i} style={{ borderBottom: i < data.length - 1 ? '1px solid var(--border)' : 'none' }}>
                      <td style={{ padding: '0.75rem' }}>
                        <div style={{ fontWeight: 600 }}>{name}</div>
                        <div className="text-muted" style={{ fontSize: '0.6875rem' }}>{row.kelas || row.santri?.kelas || ''}</div>
                      </td>
                      <td style={{ padding: '0.75rem', textAlign: 'center', fontWeight: 700, color: 'var(--success)' }}>{row.hadir || 0}</td>
                      <td style={{ padding: '0.75rem', textAlign: 'center', fontWeight: 700, color: 'var(--warning)' }}>{row.sakit || 0}</td>
                      <td style={{ padding: '0.75rem', textAlign: 'center', fontWeight: 700, color: 'var(--accent)' }}>{row.izin || 0}</td>
                      <td style={{ padding: '0.75rem', textAlign: 'center', fontWeight: 700, color: row.alpha ? 'var(--danger)' : 'var(--text-muted)' }}>{row.alpha || 0}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
