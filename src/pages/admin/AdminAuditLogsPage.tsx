import React, { useState, useEffect } from 'react';
import { History, Search, UserCheck } from 'lucide-react';
import { AuditLog } from '../../types';
import { getAuditLogs } from '../../services/auditService';
import { formatDateTime } from '../../utils/formatters';

export const AdminAuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const data = await getAuditLogs(200);
      setLogs(data);
      setLoading(false);
    };
    load();
  }, []);

  const filteredLogs = logs.filter((log) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      log.action?.toLowerCase().includes(term) ||
      log.entityType?.toLowerCase().includes(term) ||
      log.userName?.toLowerCase().includes(term) ||
      JSON.stringify(log.details || {}).toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#DCDCD5]">
        <div>
          <h2 className="text-xl font-bold text-[#151515] tracking-tight">
            Audit Trail & Log Aktivitas
          </h2>
          <p className="text-xs text-[#6D6D68] mt-0.5">
            Catatan historis seluruh perubahan data, impor CSV, update stok, dan aksi administratif di Cloud Firestore.
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="bg-[#F8F8F4] border border-[#DCDCD5] rounded-2xl p-3.5 flex items-center gap-3">
        <Search className="w-4 h-4 text-[#6D6D68]" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Cari aktivitas, tipe entitas, atau admin..."
          className="w-full bg-transparent border-none text-xs text-[#151515] focus:outline-hidden"
        />
      </div>

      {/* Logs Table */}
      <div className="bg-[#F8F8F4] border border-[#DCDCD5] rounded-3xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#DCDCD5] bg-[#F3F3EE] text-[#6D6D68]">
                <th className="py-3 px-4 font-semibold uppercase tracking-wider">Waktu</th>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider">Aksi</th>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider">Entitas</th>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider">Pelaku (Admin)</th>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider">Rincian Data</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E7E7E0]">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-xs text-[#6D6D68]">
                    Memuat audit logs...
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-xs text-[#6D6D68]">
                    Belum ada riwayat aktivitas.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-[#F3F3EE]/80 transition-colors">
                    <td className="py-3.5 px-4 text-[#6D6D68] whitespace-nowrap">
                      {formatDateTime(log.createdAt)}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-[#151515]">
                      <span className="font-mono bg-[#E7E7E0] px-2 py-0.5 rounded-md text-[11px]">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 uppercase font-bold text-[#6D6D68] text-[11px]">
                      {log.entityType} ({log.entityId.slice(0, 8)})
                    </td>
                    <td className="py-3.5 px-4 font-medium text-[#151515]">
                      {log.userName || log.userEmail || 'Admin'}
                    </td>
                    <td className="py-3.5 px-4 text-[#6D6D68] font-mono text-[11px] max-w-md truncate">
                      {JSON.stringify(log.details)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
