import { useState, useEffect } from 'react';
import { api } from '@/lib/api/client';
import { Search, Clock, Activity, Loader2 } from 'lucide-react';

interface AuditLog {
  id: string;
  tenantId: string;
  userId: string;
  action: string;
  entity: string;
  entityId: string;
  oldValue: string;
  newValue: string;
  ip: string;
  createdAt: string;
}

export function AuditLogPage() {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('');
  const [entityFilter, setEntityFilter] = useState('');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (actionFilter) params.append('action', actionFilter);
      if (entityFilter) params.append('entity', entityFilter);
      
      const response = await api.get(`/audit-log?${params.toString()}`);
      
      // Mengasumsikan response.data.data berisi array jika dari standard response
      // Jika Backend return langsung array di response.data, maka sesuaikan:
      setLogs(response.data.data || response.data || []);
    } catch (error) {
      console.error('Failed to fetch audit logs', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actionFilter, entityFilter]);

  const getActionColor = (action: string) => {
    switch(action?.toUpperCase()) {
      case 'CREATE': return 'bg-success/20 text-success';
      case 'UPDATE': return 'bg-primary/20 text-primary';
      case 'DELETE': return 'bg-danger/20 text-danger';
      default: return 'bg-surface text-muted';
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
        <div>
          <h1 className="text-2xl font-bold text-main">Riwayat Aktivitas (Audit Log)</h1>
          <p className="text-muted text-sm mt-1">Pemantauan rekam jejak sistem & tindakan pengguna (Security Logging).</p>
        </div>
      </div>

      <div className="glass-panel p-4 flex flex-wrap gap-4 items-center justify-between">
         <div className="flex items-center gap-4 flex-wrap flex-1">
           <div className="relative max-w-xs w-full">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input 
                type="text" 
                placeholder="Cari entitas..."
                className="input-base pl-9 w-full" 
                value={entityFilter}
                onChange={(e) => setEntityFilter(e.target.value)}
              />
           </div>
           
           <select 
              className="input-base py-2 w-auto min-w-[150px]"
              title="Filter Berdasarkan Aksi"
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
            >
             <option value="">Semua Aksi</option>
             <option value="CREATE">CREATE</option>
             <option value="UPDATE">UPDATE</option>
             <option value="DELETE">DELETE</option>
             <option value="GET">GET</option>
           </select>
         </div>
      </div>

      <div className="glass-panel overflow-hidden">
        {loading ? (
           <div className="p-12 flex justify-center items-center flex-col text-muted">
              <Loader2 className="w-8 h-8 animate-spin mb-4 text-primary" />
              <p>Memuat rekam jejak sistem...</p>
           </div>
        ) : logs.length === 0 ? (
           <div className="p-12 flex justify-center items-center flex-col text-muted">
              <Activity className="w-12 h-12 mb-4 opacity-50" />
              <p>Belum ada rekaman log audit yang cocok.</p>
           </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-surface/50 text-xs uppercase text-muted font-bold tracking-wider border-b border-[var(--border-light)]">
                <tr>
                  <th className="px-6 py-4">Waktu</th>
                  <th className="px-6 py-4">Aksi</th>
                  <th className="px-6 py-4">Entitas</th>
                  <th className="px-6 py-4">User ID / IP</th>
                  <th className="px-6 py-4">Data Perubahan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-light)]">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-surface-glass transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-muted" />
                        <span>{new Date(log.createdAt).toLocaleString('id-ID')}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                       <span className={`px-2 py-1 rounded text-xs font-bold ${getActionColor(log.action)}`}>
                         {log.action}
                       </span>
                    </td>
                    <td className="px-6 py-4 font-medium">
                      {log.entity} <br/>
                      <span className="text-[10px] bg-surface px-1 py-0.5 rounded text-muted font-mono">{log.entityId}</span>
                    </td>
                    <td className="px-6 py-4 text-xs font-mono">
                      User: {log.userId?.slice(0, 8) || 'System'}<br/>
                      IP: {log.ip}
                    </td>
                    <td className="px-6 py-4">
                      {log.newValue ? (
                        <div className="max-w-xs overflow-hidden text-ellipsis whitespace-nowrap text-xs text-muted" title={log.newValue}>
                           {log.newValue}
                        </div>
                      ) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
