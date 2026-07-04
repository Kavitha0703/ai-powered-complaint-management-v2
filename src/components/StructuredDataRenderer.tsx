import React, { useState, useMemo } from 'react';
import { 
  Search, ChevronUp, ChevronDown, DownloadCloud, FileText, FileSpreadsheet, 
  Copy, BarChart, PieChart, Activity, Check, Download
} from 'lucide-react';
import { 
  BarChart as RechartsBarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, 
  Legend, ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell, LineChart, Line, CartesianGrid
} from 'recharts';

export interface StructuredData {
  type?: string;
  kpis?: { label: string; value: string; trend?: string }[];
  table?: {
    columns: string[];
    rows: Record<string, string | number>[];
  };
  chart?: {
    type: string;
    title: string;
    labels: string[];
    datasets: { label: string; data: number[] }[];
  };
  actions?: string[];
}

interface Props {
  data: StructuredData;
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4'];

export default function StructuredDataRenderer({ data }: Props) {
    
  return (
    <div className="w-full space-y-4 my-4 font-sans text-slate-800 dark:text-slate-200">
      {/* KPI Cards */}
      {data.kpis && data.kpis.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {data.kpis.map((kpi, idx) => (
            <div key={idx} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 shadow-sm flex flex-col items-center text-center">
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-1">{kpi.label}</span>
              <span className="text-xl font-black text-slate-800 dark:text-white">{kpi.value}</span>
            </div>
          ))}
        </div>
      )}

      {/* Chart */}
      {data.chart && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm w-full h-[300px]">
          <h4 className="text-sm font-bold mb-4 text-center">{data.chart.title}</h4>
          <ResponsiveContainer width="100%" height="100%">
            {data.chart.type === 'bar' ? (
              <RechartsBarChart data={data.chart.labels.map((lbl, i) => {
                const item: any = { name: lbl };
                data.chart!.datasets.forEach((ds, dIdx) => {
                  item[ds.label] = ds.data[i] || 0;
                });
                return item;
              })}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="name" fontSize={10} tick={{fill: '#888'}} />
                <YAxis fontSize={10} tick={{fill: '#888'}} />
                <RechartsTooltip contentStyle={{ backgroundColor: '#1E293B', color: '#fff', fontSize: '12px', border: 'none', borderRadius: '8px' }} />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                {data.chart.datasets.map((ds, idx) => (
                  <Bar key={ds.label} dataKey={ds.label} fill={COLORS[idx % COLORS.length]} radius={[4, 4, 0, 0]} />
                ))}
              </RechartsBarChart>
            ) : data.chart.type === 'pie' ? (
              <RechartsPieChart>
                <Pie 
                  data={data.chart.labels.map((lbl, i) => ({ name: lbl, value: data.chart!.datasets[0].data[i] || 0 }))}
                  cx="50%" cy="50%" outerRadius={80} fill="#8884d8"
                  dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {data.chart.labels.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip contentStyle={{ backgroundColor: '#1E293B', color: '#fff', fontSize: '12px', border: 'none', borderRadius: '8px' }} />
              </RechartsPieChart>
            ) : (
              <LineChart data={data.chart.labels.map((lbl, i) => {
                const item: any = { name: lbl };
                data.chart!.datasets.forEach((ds, dIdx) => {
                  item[ds.label] = ds.data[i] || 0;
                });
                return item;
              })}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="name" fontSize={10} tick={{fill: '#888'}} />
                <YAxis fontSize={10} tick={{fill: '#888'}} />
                <RechartsTooltip contentStyle={{ backgroundColor: '#1E293B', color: '#fff', fontSize: '12px', border: 'none', borderRadius: '8px' }} />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                {data.chart.datasets.map((ds, idx) => (
                  <Line key={ds.label} type="monotone" dataKey={ds.label} stroke={COLORS[idx % COLORS.length]} strokeWidth={2} />
                ))}
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>
      )}

      {/* DataTable */}
      {data.table && data.table.columns && (
        <DataTable columns={data.table.columns} rows={data.table.rows} />
      )}

      {/* Action Buttons */}
      {data.actions && data.actions.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-4">
          {data.actions.map((act, idx) => (
            <button key={idx} className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer text-slate-700 dark:text-slate-300">
              <Activity className="w-3.5 h-3.5" />
              {act}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function DataTable({ columns, rows }: { columns: string[], rows: Record<string, string | number>[] }) {
    
  const [searchTerm, setSearchTerm] = useState('');
  const [sortCol, setSortCol] = useState<string | null>(null);
  const [sortAsc, setSortAsc] = useState(true);
  const [page, setPage] = useState(1);
  const rowsPerPage = 5;

  const filteredRows = useMemo(() => {
    let res = [...rows];
    if (searchTerm) {
      res = res.filter(r => 
        Object.values(r).some(v => String(v).toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    if (sortCol) {
      res.sort((a, b) => {
        const valA = a[sortCol];
        const valB = b[sortCol];
        if (typeof valA === 'number' && typeof valB === 'number') {
          return sortAsc ? valA - valB : valB - valA;
        }
        return sortAsc ? String(valA).localeCompare(String(valB)) : String(valB).localeCompare(String(valA));
      });
    }
    return res;
  }, [rows, searchTerm, sortCol, sortAsc]);

  const paginatedRows = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    return filteredRows.slice(start, start + rowsPerPage);
  }, [filteredRows, page]);

  const totalPages = Math.ceil(filteredRows.length / rowsPerPage);

  const handleSort = (col: string) => {
    if (sortCol === col) {
      setSortAsc(!sortAsc);
    } else {
      setSortCol(col);
      setSortAsc(true);
    }
  };

  const handleCopy = () => {
    const text = [
      columns.join('\t'),
      ...rows.map(r => columns.map(c => r[c] || '').join('\t'))
    ].join('\n');
    navigator.clipboard.writeText(text);
  };

  const handleExportCSV = () => {
    const csv = [
      columns.join(','),
      ...rows.map(r => columns.map(c => `"${String(r[c] || '').replace(/"/g, '""')}"`).join(','))
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'export.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden flex flex-col">
      {/* Toolbar */}
      <div className="p-3 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row gap-3 justify-between items-center bg-slate-50 dark:bg-slate-850">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input 
            type="text" 
            placeholder={"Search table..."} 
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
            className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs rounded-lg pl-8 pr-3 py-1.5 focus:outline-none focus:border-blue-500"
          />
        </div>
        <div className="flex gap-2 shrink-0">
          <button onClick={handleCopy} className="p-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors" title={"Copy to clipboard"}>
            <Copy className="w-3.5 h-3.5" />
          </button>
          <button onClick={handleExportCSV} className="p-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors" title={"Export CSV"}>
            <Download className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      
      {/* Table Wrapper (Responsive) */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs whitespace-nowrap">
          <thead className="bg-slate-100 dark:bg-slate-800/80 sticky top-0">
            <tr>
              {columns.map(col => (
                <th 
                  key={col} 
                  onClick={() => handleSort(col)}
                  className="px-4 py-2.5 font-bold text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700/80 select-none transition-colors"
                >
                  <div className="flex items-center gap-1">
                    {col}
                    <div className="flex flex-col">
                      <ChevronUp className={`w-2.5 h-2.5 ${sortCol === col && sortAsc ? 'text-blue-500' : 'text-slate-400 dark:text-slate-500'}`} />
                      <ChevronDown className={`w-2.5 h-2.5 -mt-1 ${sortCol === col && !sortAsc ? 'text-blue-500' : 'text-slate-400 dark:text-slate-500'}`} />
                    </div>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedRows.length > 0 ? paginatedRows.map((row, i) => (
              <tr key={i} className="border-b border-slate-100 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                {columns.map(col => (
                  <td key={col} className="px-4 py-2.5 text-slate-700 dark:text-slate-300 font-medium">
                    {row[col]}
                  </td>
                ))}
              </tr>
            )) : (
              <tr>
                <td colSpan={columns.length} className="px-4 py-6 text-center text-slate-500 italic">
                  {"No records found matching your search."}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="p-2 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-850">
          <span className="text-[10px] font-bold text-slate-500 px-2">
            {"Showing"}{(page - 1) * rowsPerPage + 1} {"to"}{Math.min(page * rowsPerPage, filteredRows.length)} {"of"}{filteredRows.length}
          </span>
          <div className="flex gap-1">
            <button 
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-2 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-[10px] font-bold disabled:opacity-50 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              {"Prev"}</button>
            <button 
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-2 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-[10px] font-bold disabled:opacity-50 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              {"Next"}</button>
          </div>
        </div>
      )}
    </div>
  );
}
