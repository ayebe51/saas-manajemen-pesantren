import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { Clock, RefreshCw, Users, LogIn, LogOut } from 'lucide-react';
import toast from 'react-hot-toast';

interface AttendanceLog {
  id: string;
  santriName?: string;
  santri?: { name: string };
  type: string;
  timestamp?: string;
  createdAt?: string;
}

export function LogPage() {
  const [logs, setLogs] = useState<AttendanceLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await api.get('/attendance/today');
      const data = Array.isArray(res.data) ? res.data : (res.data?.data || []);
      setLogs(data);
    } catch {
      toast.error('Gagal memuat log presensi');
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchLogs(); }, []);

  const masukCount = logs.filter(l => l.type === 'MASUK').length;
  const keluarCount = logs.filter(l => l.type === 'KELUAR').length;

  return (
    <div className="animate-in" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: '1.125rem', fontWeight: 700 }}>📋 Log Hari Ini</h2>
        <button onClick={fetchLogs} className="btn btn-outline" style={{ padding: '0.375rem 0.75rem' }} title="Refresh">
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '0.75rem' }}>
        <div className="card" style={{ padding: '1rem', textAlign: 'center' }}>
          <Users size={20} style={{ margin: '0 auto 0.375rem', color: 'var(--primary)' }} />
          <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{logs.length}</div>
          <div className="text-muted" style={{ fontSize: '0.6875rem' }}>Total</div>
        </div>
        <div className="card" style={{ padding: '1rem', textAlign: 'center' }}>
          <LogIn size={20} style={{ margin: '0 auto 0.375rem', color: 'var(--success)' }} />
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--success)' }}>{masukCount}</div>
          <div className="text-muted" style={{ fontSize: '0.6875rem' }}>Masuk</div>
        </div>
        <div className="card" style={{ padding: '1rem', textAlign: 'center' }}>
          <LogOut size={20} style={{ margin: '0 auto 0.375rem', color: 'var(--danger)' }} />
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--danger)' }}>{keluarCount}</div>
          <div className="text-muted" style={{ fontSize: '0.6875rem' }}>Keluar</div>
        </div>
      </div>

      {/* Log List */}
      <div className="card">
        {loading ? (
          <div className="text-center text-muted" style={{ padding: '3rem' }}>
            <Clock size={32} style={{ opacity: 0.3, margin: '0 auto 0.5rem' }} />
            <p>Memuat log...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center text-muted" style={{ padding: '3rem' }}>
            <Clock size={32} style={{ opacity: 0.3, margin: '0 auto 0.5rem' }} />
            <p>Belum ada presensi hari ini</p>
          </div>
        ) : (
          <div>
            {logs.map((log, i) => {
              const name = log.santriName || log.santri?.name || '-';
              const time = log.timestamp || log.createdAt;
              return (
                <div key={log.id || i} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '0.875rem 1rem',
                  borderBottom: i < logs.length - 1 ? '1px solid var(--border)' : 'none',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{
                      width: '2rem', height: '2rem', borderRadius: '0.5rem',
                      background: log.type === 'MASUK' ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {log.type === 'MASUK' ? <LogIn size={14} color="var(--success)" /> : <LogOut size={14} color="var(--danger)" />}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{name}</div>
                      <span className={`badge ${log.type === 'MASUK' ? 'badge-success' : 'badge-danger'}`}>{log.type}</span>
                    </div>
                  </div>
                  <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                    {time ? new Date(time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-'}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
