import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import api from '../../lib/api';

interface Report {
  period: string;
  purchasesCount: number;
  purchasesTotal: string;
  rechargesCount: number;
  rechargesTotal: string;
  activeUsers: number;
  topUsers: Array<{ userId: string; name: string; amount: string }>;
  dailyBreakdown: Record<string, { purchases: string; recharges: string; neto: string }>;
}

export const AdminReports: React.FC = () => {
  const [report, setReport] = useState<Report | null>(null);
  const [period, setPeriod] = useState('today');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReport = async () => {
      setLoading(true);
      try {
        const { data } = await api.get(`/admin/reports?period=${period}`);
        setReport(data);
      } catch (err) {
        console.error('Error fetching report:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [period]);

  if (!report || loading) {
    return (
      <div className="min-h-screen bg-slate-50 md:ml-64 pt-20 md:pt-0 pb-24 md:pb-0 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600 mx-auto mb-4"></div>
          <p>Cargando reportes...</p>
        </div>
      </div>
    );
  }

  const periodLabels = {
    today: 'Hoy',
    week: 'Esta Semana',
    month: 'Este Mes',
    all: 'Todo el Tiempo'
  };

  const maxAmount = Math.max(...report.topUsers.map(u => parseFloat(u.amount)), 1);

  return (
    <div className="min-h-screen bg-slate-50 md:ml-64 pt-20 md:pt-0 pb-24 md:pb-0">
      <div className="p-4 md:p-8">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Reportes</h1>
            <p className="text-slate-600">Análisis y estadísticas del sistema</p>
          </div>

          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-violet-500 bg-white"
          >
            <option value="today">Hoy</option>
            <option value="week">Esta Semana</option>
            <option value="month">Este Mes</option>
            <option value="all">Todo el Tiempo</option>
          </select>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-red-50 border-red-200">
            <CardContent className="pt-6">
              <p className="text-sm text-red-600">Compras</p>
              <p className="text-2xl font-bold text-red-900 mt-1">
                {report.purchasesCount}
              </p>
              <p className="text-xs text-red-700 mt-2">
                ${parseFloat(report.purchasesTotal).toFixed(2)}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-emerald-50 border-emerald-200">
            <CardContent className="pt-6">
              <p className="text-sm text-emerald-600">Recargas</p>
              <p className="text-2xl font-bold text-emerald-900 mt-1">
                {report.rechargesCount}
              </p>
              <p className="text-xs text-emerald-700 mt-2">
                ${parseFloat(report.rechargesTotal).toFixed(2)}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-slate-50 border-blue-200">
            <CardContent className="pt-6">
              <p className="text-sm text-slate-700">Neto</p>
              <p className="text-2xl font-bold text-blue-900 mt-1">
                ${(parseFloat(report.rechargesTotal) - parseFloat(report.purchasesTotal)).toFixed(2)}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-slate-50 border-purple-200">
            <CardContent className="pt-6">
              <p className="text-sm text-slate-700">Usuarios Activos</p>
              <p className="text-2xl font-bold text-purple-900 mt-1">
                {report.activeUsers}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Top Usuarios */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Top 5 Usuarios por Gasto</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {report.topUsers.map((user, idx) => (
                <div key={idx}>
                  <div className="flex justify-between items-center mb-1">
                    <p className="font-medium text-slate-900">
                      {idx + 1}. {user.name}
                    </p>
                    <p className="font-semibold text-red-600">
                      ${parseFloat(user.amount).toFixed(2)}
                    </p>
                  </div>
                  <div className="h-6 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full  rounded-full"
                      style={{
                        width: `${(parseFloat(user.amount) / maxAmount) * 100}%`
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Desglose Diario */}
        {Object.keys(report.dailyBreakdown).length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Desglose Diario</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left py-3 px-4 font-semibold">Fecha</th>
                      <th className="text-right py-3 px-4 font-semibold">Compras</th>
                      <th className="text-right py-3 px-4 font-semibold">Recargas</th>
                      <th className="text-right py-3 px-4 font-semibold">Neto</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(report.dailyBreakdown)
                      .sort(([dateA], [dateB]) => dateB.localeCompare(dateA))
                      .map(([date, data], idx) => (
                        <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50">
                          <td className="py-3 px-4">
                            {new Date(date).toLocaleDateString('es-MX')}
                          </td>
                          <td className="py-3 px-4 text-right text-red-600 font-medium">
                            -${parseFloat(data.purchases).toFixed(2)}
                          </td>
                          <td className="py-3 px-4 text-right text-emerald-600 font-medium">
                            +${parseFloat(data.recharges).toFixed(2)}
                          </td>
                          <td className={`py-3 px-4 text-right font-semibold ${
                            parseFloat(data.neto) >= 0 ? 'text-emerald-600' : 'text-red-600'
                          }`}>
                            ${parseFloat(data.neto).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
