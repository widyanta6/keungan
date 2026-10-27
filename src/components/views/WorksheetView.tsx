import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Worksheet, WorksheetColumn, WorksheetColumnType } from '../../types';
import {
  TableProperties,
  Plus,
  Send,
  Info,
  CheckSquare,
  Square,
  X,
  FileSpreadsheet,
  Copy,
  Archive,
  Trash2,
  Download,
  Settings2,
  Search,
  ExternalLink,
  Tag,
  Calendar,
  Layers,
} from 'lucide-react';
import * as XLSX from 'xlsx';

export const WorksheetView: React.FC = () => {
  const {
    currentUser,
    brands,
    assets,
    worksheets,
    teamMembers,
    products,
    kols,
    orders,
    tasks,
    transactions,
    marketing,
    addWorksheetRow,
    updateWorksheetRow,
    deleteWorksheetRow,
    convertWorksheetRowToTransaction,
    createWorksheet,
    duplicateWorksheet,
    archiveWorksheet,
    deleteWorksheet,
    addColumnToWorksheet,
    deleteWorksheetColumn,
    selectedBrandId,
  } = useApp();

  const [activeWorksheetId, setActiveWorksheetId] = useState<string>('');
  const [rowSearchQuery, setRowSearchQuery] = useState('');
  const [showArchived, setShowArchived] = useState(false);

  // Modals
  const [isCreateWsModalOpen, setIsCreateWsModalOpen] = useState(false);
  const [isAddColumnModalOpen, setIsAddColumnModalOpen] = useState(false);
  const [isManageColumnsModalOpen, setIsManageColumnsModalOpen] = useState(false);
  const [isAddRowModalOpen, setIsAddRowModalOpen] = useState(false);
  const [editingRow, setEditingRow] = useState<any | null>(null);
  const [newRowData, setNewRowData] = useState<Record<string, any>>({});

  // Create Worksheet Form
  const [newWsTitle, setNewWsTitle] = useState('');
  const [newWsDesc, setNewWsDesc] = useState('');
  const [newWsBrandId, setNewWsBrandId] = useState('');
  const [newWsTemplate, setNewWsTemplate] = useState<Worksheet['templateType']>('custom');

  // Add Column Form
  const [newColLabel, setNewColLabel] = useState('');
  const [newColType, setNewColType] = useState<WorksheetColumnType>('text');
  const [newColOptionsStr, setNewColOptionsStr] = useState('');
  const [colError, setColError] = useState('');

  // Conversion Modal states
  const [convertingRow, setConvertingRow] = useState<any | null>(null);
  const [convAmountStr, setConvAmountStr] = useState('');
  const [convType, setConvType] = useState<'income' | 'expense'>('income');
  const [convCategory, setConvCategory] = useState('Penjualan Produk');
  const [convDesc, setConvDesc] = useState('');
  const [convAssetId, setConvAssetId] = useState('');
  const [convPaymentMethod, setConvPaymentMethod] = useState('Transfer Bank');
  const [convError, setConvError] = useState('');

  if (!currentUser) return null;

  const isAdmin = currentUser.role === 'admin';
  const userBrands = brands;
  const userAssets = assets;
  const userWorksheets = worksheets;

  // Filter worksheets by permitted brand & archive toggle
  const availableWorksheets = userWorksheets.filter((w) => {
    if (w.brandId && !brands.some((b) => b.id === w.brandId)) return false;
    if (selectedBrandId !== 'all' && w.brandId !== selectedBrandId) return false;
    if (!showArchived && w.isArchived) return false;
    return true;
  });

  const currentWorksheet =
    availableWorksheets.find((w) => w.id === activeWorksheetId) ||
    availableWorksheets[0] ||
    null;

  // Filter rows of current worksheet
  const filteredRows = currentWorksheet
    ? currentWorksheet.rows.filter((row) => {
        if (!rowSearchQuery.trim()) return true;
        const q = rowSearchQuery.toLowerCase();
        return Object.values(row).some((val) =>
          val !== null && val !== undefined && String(val).toLowerCase().includes(q)
        );
      })
    : [];

  // Create Worksheet submit
  const handleCreateWorksheetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWsTitle.trim() || !newWsBrandId) return;

    let initialCols: WorksheetColumn[] = [];
    if (newWsTemplate === 'production') {
      initialCols = [
        { id: 'batchCode', label: 'Kode Batch', type: 'text' },
        { id: 'product', label: 'Produk Terkait', type: 'product' },
        { id: 'targetQty', label: 'Target Jumlah', type: 'number' },
        { id: 'estCost', label: 'Estimasi Biaya', type: 'currency' },
        { id: 'pic', label: 'Penanggung Jawab', type: 'team_member' },
        {
          id: 'status',
          label: 'Status Produksi',
          type: 'status',
          options: ['Perencanaan', 'Proses', 'QC', 'Selesai'],
        },
      ];
    } else if (newWsTemplate === 'event' || newWsTemplate === 'task_tracker') {
      initialCols = [
        { id: 'activityName', label: 'Nama Kegiatan / Proyek', type: 'text' },
        { id: 'pic', label: 'PIC Anggota Tim', type: 'team_member' },
        { id: 'targetDate', label: 'Tenggat Waktu', type: 'date' },
        { id: 'budget', label: 'Anggaran Rencana', type: 'currency' },
        {
          id: 'status',
          label: 'Status',
          type: 'status',
          options: ['Belum Mulai', 'Sedang Dikerjakan', 'Review', 'Selesai'],
        },
      ];
    } else if (newWsTemplate === 'client_pipeline') {
      initialCols = [
        { id: 'clientName', label: 'Nama Klien / Partner', type: 'text' },
        { id: 'dealValue', label: 'Estimasi Nilai Deal', type: 'currency' },
        { id: 'contact', label: 'Kontak', type: 'text' },
        {
          id: 'stage',
          label: 'Tahap Pipeline',
          type: 'status',
          options: ['Lead Masuk', 'Pitching / Proposal', 'Negosiasi', 'Deal Menang', 'Batal'],
        },
      ];
    } else {
      // blank / custom
      initialCols = [
        { id: 'item_name', label: 'Nama Item / Catatan', type: 'text' },
        { id: 'amount', label: 'Estimasi Nominal', type: 'currency' },
        {
          id: 'status',
          label: 'Status',
          type: 'status',
          options: ['Aktif', 'Review', 'Selesai'],
        },
      ];
    }

    createWorksheet(newWsTitle.trim(), newWsDesc.trim(), newWsBrandId, newWsTemplate, initialCols);
    setIsCreateWsModalOpen(false);
    setNewWsTitle('');
    setNewWsDesc('');
  };

  // Add Column Submit
  const handleAddColumnSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentWorksheet) return;
    setColError('');

    if (!newColLabel.trim()) {
      setColError('Nama kolom wajib diisi.');
      return;
    }

    const colId = `col_${Date.now()}`;
    const options =
      newColType === 'select' || newColType === 'status'
        ? newColOptionsStr
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
        : undefined;

    addColumnToWorksheet(currentWorksheet.id, {
      id: colId,
      label: newColLabel.trim(),
      type: newColType,
      options: options && options.length > 0 ? options : ['Opsi 1', 'Opsi 2'],
    });

    setIsAddColumnModalOpen(false);
    setNewColLabel('');
    setNewColOptionsStr('');
  };

  // Open Add Row Modal
  const handleOpenAddRow = () => {
    if (!currentWorksheet) return;
    const initial: Record<string, any> = {};
    currentWorksheet.columns.forEach((col) => {
      if (col.type === 'checkbox') initial[col.id] = false;
      else if (col.type === 'status' && col.options) initial[col.id] = col.options[0];
      else if (col.type === 'currency' || col.type === 'number') initial[col.id] = 0;
      else initial[col.id] = '';
    });
    setNewRowData(initial);
    setEditingRow(null);
    setIsAddRowModalOpen(true);
  };

  // Open Edit Row Modal
  const handleOpenEditRow = (row: any) => {
    setNewRowData({ ...row });
    setEditingRow(row);
    setIsAddRowModalOpen(true);
  };

  // Save Row
  const handleSaveRow = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentWorksheet) return;
    if (editingRow) {
      updateWorksheetRow(currentWorksheet.id, editingRow.id, newRowData);
    } else {
      addWorksheetRow(currentWorksheet.id, newRowData);
    }
    setIsAddRowModalOpen(false);
  };

  // Export Current Worksheet to Excel
  const handleExportWorksheet = () => {
    if (!currentWorksheet) return;
    const exportData = currentWorksheet.rows.map((row) => {
      const rowObj: Record<string, any> = {};
      currentWorksheet.columns.forEach((col) => {
        rowObj[col.label] = row[col.id] !== undefined ? row[col.id] : '';
      });
      return rowObj;
    });

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, currentWorksheet.title.substring(0, 30));
    XLSX.writeFile(
      wb,
      `Worksheet_${currentWorksheet.title.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.xlsx`
    );
  };

  // Conversion Modal handlers
  const handleOpenConvert = (row: any) => {
    setConvertingRow(row);
    let nominal = 0;
    // Find first currency or number column
    for (const col of currentWorksheet?.columns || []) {
      if ((col.type === 'currency' || col.type === 'number') && row[col.id]) {
        nominal = Number(row[col.id]) || 0;
        break;
      }
    }
    if (!nominal) nominal = 500000;

    const desc = row.clientName
      ? `Pesanan Lembar Kerja - ${row.clientName}`
      : row.activityName
      ? `Pengeluaran Kegiatan: ${row.activityName}`
      : row.item_name || 'Transaksi dari Lembar Kerja';

    const defaultType = row.dealValue || row.clientName ? 'income' : 'expense';

    setConvAmountStr(nominal.toString());
    setConvType(defaultType);
    setConvCategory(defaultType === 'income' ? 'Penjualan Produk' : 'Operasional');
    setConvDesc(desc);
    setConvAssetId(userAssets[0]?.id || '');
    setConvPaymentMethod('Transfer Bank');
    setConvError('');
  };

  const handleExecuteConvert = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentWorksheet || !convertingRow) return;
    setConvError('');

    const amt = parseFloat(convAmountStr) || 0;
    if (amt <= 0) {
      setConvError('Nominal transaksi harus lebih besar dari Rp 0.');
      return;
    }

    const res = convertWorksheetRowToTransaction(currentWorksheet.id, convertingRow.id, {
      brandId: currentWorksheet.brandId,
      type: convType,
      category: convCategory,
      description: convDesc,
      amount: amt,
      assetId: convAssetId,
      paymentMethod: convPaymentMethod,
    });

    if (!res.success) {
      setConvError(res.error || 'Gagal mengubah baris menjadi transaksi.');
      return;
    }

    setConvertingRow(null);
  };

  // Helper to render relational column cell text
  const renderCellContent = (col: WorksheetColumn, val: any) => {
    if (val === undefined || val === null || val === '') return <span className="text-slate-300">-</span>;

    if (col.type === 'currency') {
      return (
        <span className="font-mono font-bold text-slate-900 tabular-nums">
          Rp {Number(val).toLocaleString('id-ID')}
        </span>
      );
    }

    if (col.type === 'number') {
      return <span className="font-mono tabular-nums">{Number(val).toLocaleString('id-ID')}</span>;
    }

    if (col.type === 'status') {
      return (
        <span className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold bg-violet-50 text-violet-800 border border-violet-200">
          {String(val)}
        </span>
      );
    }

    if (col.type === 'team_member') {
      const tm = teamMembers.find((m) => m.id === val);
      return (
        <span className="font-medium text-slate-800 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-violet-500" />
          {tm ? tm.name : String(val)}
        </span>
      );
    }

    if (col.type === 'product') {
      const prod = products.find((p) => p.id === val);
      return (
        <span className="font-medium text-slate-800">
          {prod ? prod.name : String(val)}
        </span>
      );
    }

    if (col.type === 'kol') {
      const kol = kols.find((k) => k.id === val);
      return (
        <span className="font-medium text-indigo-700">
          {kol ? `${kol.name} (${kol.platform})` : String(val)}
        </span>
      );
    }

    if (col.type === 'order') {
      const ord = orders.find((o) => o.id === val);
      return (
        <span className="font-mono text-slate-700">
          {ord ? `#${ord.id} (Rp ${ord.netSales.toLocaleString('id-ID')})` : String(val)}
        </span>
      );
    }

    if (col.type === 'task') {
      const tsk = tasks.find((t) => t.id === val);
      return (
        <span className="text-slate-800 font-medium">
          {tsk ? tsk.title : String(val)}
        </span>
      );
    }

    return <span>{String(val)}</span>;
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-2xl p-6 border border-purple-100 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-violet-700 uppercase tracking-wider mb-1">
            <TableProperties className="w-4 h-4" />
            <span>Dynamic Worksheet Engine (Seksi 3 PRD)</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900">
            Lembar Kerja Mandiri Tanpa Koding
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Buat tabel khusus untuk tracking produksi, sponsorship event, pipeline klien, atau tugas.
            Dapat dihubungkan ke modul lain tanpa merusak saldo kas sebelum dikonfirmasi.
          </p>
        </div>

        {!isAdmin && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setNewWsBrandId(userBrands[0]?.id || '');
                setIsCreateWsModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-violet-600 hover:bg-violet-700 rounded-xl transition-all shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Buat Worksheet Baru</span>
            </button>
          </div>
        )}
      </div>

      {/* Financial Isolation Principle Note */}
      <div className="p-3.5 bg-violet-50/70 border border-violet-100 rounded-xl text-xs text-slate-600 flex items-start gap-2.5">
        <Info className="w-4 h-4 text-violet-700 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong className="text-violet-900">Aturan Wajib Keuangan Worksheet:</strong> Angka pada
          lembar kerja bersifat monitoring / estimasi dan <strong>tidak otomatis memutasi kas</strong>.
          Gunakan tombol <strong className="text-violet-700">"Kirim ke Keuangan"</strong> untuk
          membukukannya menjadi transaksi resmi yang teraudit.
        </p>
      </div>

      {/* Worksheet Tabs & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full">
          {availableWorksheets.map((ws) => (
            <button
              key={ws.id}
              onClick={() => setActiveWorksheetId(ws.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-2 ${
                currentWorksheet?.id === ws.id
                  ? 'bg-violet-900 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-violet-50 border border-purple-100'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>{ws.title}</span>
              {ws.isArchived && (
                <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1 rounded">Arsip</span>
              )}
            </button>
          ))}

          {availableWorksheets.length === 0 && (
            <span className="text-xs text-slate-400 italic">Belum ada worksheet aktif.</span>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <label className="flex items-center gap-1.5 text-xs text-slate-500 cursor-pointer">
            <input
              type="checkbox"
              checked={showArchived}
              onChange={(e) => setShowArchived(e.target.checked)}
              className="w-3.5 h-3.5 text-violet-600 rounded"
            />
            <span>Tampilkan Arsip</span>
          </label>
        </div>
      </div>

      {/* Active Worksheet Panel */}
      {currentWorksheet ? (
        <div className="bg-white rounded-2xl border border-purple-100 shadow-xs overflow-hidden">
          {/* Worksheet Action Header */}
          <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">{currentWorksheet.title}</h2>
                <span className="text-[11px] font-semibold text-violet-700 bg-violet-50 px-2 py-0.5 rounded-full border border-violet-100">
                  {userBrands.find((b) => b.id === currentWorksheet.brandId)?.name || 'Multi-Brand'}
                </span>
                {currentWorksheet.isArchived && (
                  <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                    Diarsipkan
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">{currentWorksheet.description}</p>
            </div>

            {/* Actions for current worksheet */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari dalam baris..."
                  value={rowSearchQuery}
                  onChange={(e) => setRowSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                />
              </div>

              {!isAdmin && (
                <>
                  <button
                    onClick={handleOpenAddRow}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-violet-600 hover:bg-violet-700 rounded-lg transition-colors shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tambah Baris</span>
                  </button>

                  <button
                    onClick={() => setIsAddColumnModalOpen(true)}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tambah Kolom</span>
                  </button>

                  <button
                    onClick={() => setIsManageColumnsModalOpen(true)}
                    title="Atur & Hapus Kolom"
                    className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors"
                  >
                    <Settings2 className="w-4 h-4" />
                  </button>
                </>
              )}

              <button
                onClick={handleExportWorksheet}
                title="Ekspor ke Excel (.xlsx)"
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Ekspor Excel</span>
              </button>

              {!isAdmin && (
                <>
                  <button
                    onClick={() => duplicateWorksheet(currentWorksheet.id)}
                    title="Gandakan Worksheet"
                    className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors"
                  >
                    <Copy className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => archiveWorksheet(currentWorksheet.id)}
                    title={currentWorksheet.isArchived ? 'Buka Arsip' : 'Arsipkan Worksheet'}
                    className={`p-1.5 border border-slate-200 rounded-lg transition-colors ${
                      currentWorksheet.isArchived
                        ? 'text-amber-600 bg-amber-50 hover:bg-amber-100'
                        : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                    }`}
                  >
                    <Archive className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => {
                      if (confirm(`Yakin ingin menghapus worksheet "${currentWorksheet.title}"?`)) {
                        deleteWorksheet(currentWorksheet.id);
                      }
                    }}
                    title="Hapus Worksheet"
                    className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 border border-slate-200 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                  {currentWorksheet.columns.map((col) => (
                    <th
                      key={col.id}
                      className={`py-3 px-4 ${
                        col.type === 'currency'
                          ? 'text-right'
                          : col.type === 'checkbox'
                          ? 'text-center'
                          : ''
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <span>{col.label}</span>
                        <span className="text-[10px] text-slate-400 font-normal lowercase">
                          ({col.type})
                        </span>
                      </div>
                    </th>
                  ))}
                  {!isAdmin && <th className="py-3 px-4 text-center">Buku Kas</th>}
                  {!isAdmin && <th className="py-3 px-4 text-center">Aksi</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={currentWorksheet.columns.length + (isAdmin ? 0 : 2)}
                      className="py-10 text-center text-slate-400"
                    >
                      {rowSearchQuery
                        ? 'Tidak ada baris yang cocok dengan pencarian.'
                        : 'Belum ada baris dalam lembar kerja ini.'}
                    </td>
                  </tr>
                ) : (
                  filteredRows.map((row) => (
                    <tr key={row.id} className="hover:bg-violet-50/30 transition-colors">
                      {currentWorksheet.columns.map((col) => {
                        const val = row[col.id];

                        if (col.type === 'checkbox') {
                          return (
                            <td key={col.id} className="py-3 px-4 text-center">
                              <button
                                disabled={isAdmin}
                                onClick={() =>
                                  updateWorksheetRow(currentWorksheet.id, row.id, {
                                    [col.id]: !val,
                                  })
                                }
                                className="text-violet-700 hover:text-violet-900"
                              >
                                {val ? (
                                  <CheckSquare className="w-4 h-4 text-emerald-600" />
                                ) : (
                                  <Square className="w-4 h-4 text-slate-300" />
                                )}
                              </button>
                            </td>
                          );
                        }

                        return (
                          <td
                            key={col.id}
                            className={`py-3 px-4 ${
                              col.type === 'currency' ? 'text-right' : ''
                            }`}
                          >
                            {renderCellContent(col, val)}
                          </td>
                        );
                      })}

                      {/* Bridge to Finance Column */}
                      {!isAdmin && (
                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          {row.convertedTx ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                              Terbukukan
                            </span>
                          ) : (
                            <button
                              onClick={() => handleOpenConvert(row)}
                              title="Kirim nilai baris ini ke Transaksi Keuangan resmi"
                              className="flex items-center gap-1 mx-auto px-2 py-1 text-[11px] font-semibold text-violet-700 bg-violet-50 hover:bg-violet-100 rounded-lg transition-colors border border-violet-200"
                            >
                              <Send className="w-3 h-3" />
                              <span>Ke Keuangan</span>
                            </button>
                          )}
                        </td>
                      )}

                      {/* Row Actions */}
                      {!isAdmin && (
                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => handleOpenEditRow(row)}
                              className="p-1 text-slate-400 hover:text-slate-700 rounded"
                              title="Edit Baris"
                            >
                              <Settings2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => deleteWorksheetRow(currentWorksheet.id, row.id)}
                              className="p-1 text-slate-400 hover:text-rose-600 rounded"
                              title="Hapus Baris"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl p-10 text-center text-slate-400 border border-purple-100">
          Tidak ada worksheet yang tersedia. Klik tombol <strong>"Buat Worksheet Baru"</strong> untuk
          membuat lembar kerja pertama Anda.
        </div>
      )}

      {/* Modal: Buat Worksheet Baru */}
      {isCreateWsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <TableProperties className="w-4 h-4 text-violet-600" />
                Buat Lembar Kerja Baru
              </h2>
              <button
                onClick={() => setIsCreateWsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateWorksheetSubmit} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nama Lembar Kerja <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Jadwal Produksi Batch 5 / Monitoring Event"
                  value={newWsTitle}
                  onChange={(e) => setNewWsTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Deskripsi Singkat</label>
                <input
                  type="text"
                  placeholder="Tujuan atau cakupan data lembar kerja ini..."
                  value={newWsDesc}
                  onChange={(e) => setNewWsDesc(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Brand</label>
                <select
                  value={newWsBrandId}
                  onChange={(e) => setNewWsBrandId(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                  required
                >
                  {userBrands.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.category})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Pilih Template Awal</label>
                <select
                  value={newWsTemplate}
                  onChange={(e) => setNewWsTemplate(e.target.value as Worksheet['templateType'])}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/20 font-medium"
                >
                  <option value="custom">Kosong (Custom Kolom Sendiri)</option>
                  <option value="production">Pelacakan Produksi & Batch (Bahan/Produk)</option>
                  <option value="event">Pelacakan Kegiatan Event / Proyek</option>
                  <option value="client_pipeline">Pipeline Penjualan & Sponsorship</option>
                  <option value="task_tracker">Monitoring Tugas & Pembayaran</option>
                </select>
                <p className="text-[11px] text-slate-400 mt-1">
                  Template akan menyusun kolom standar awal, Anda tetap bebas menambah atau menghapus kolom kapan saja.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateWsModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold bg-violet-600 hover:bg-violet-700 text-white rounded-lg transition-colors shadow-xs"
                >
                  Buat Worksheet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Tambah Kolom Baru */}
      {isAddColumnModalOpen && currentWorksheet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Plus className="w-4 h-4 text-violet-600" />
                Tambah Kolom ke: {currentWorksheet.title}
              </h2>
              <button
                onClick={() => setIsAddColumnModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {colError && (
              <div className="mt-3 p-2 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">
                {colError}
              </div>
            )}

            <form onSubmit={handleAddColumnSubmit} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Label / Judul Kolom <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Estimasi Fee, PIC Tim, Tanggal Selesai..."
                  value={newColLabel}
                  onChange={(e) => setNewColLabel(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tipe Data Kolom</label>
                <select
                  value={newColType}
                  onChange={(e) => setNewColType(e.target.value as WorksheetColumnType)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                >
                  <optgroup label="Tipe Standar">
                    <option value="text">Teks Bebas</option>
                    <option value="number">Angka (Number)</option>
                    <option value="currency">Mata Uang (Rupiah)</option>
                    <option value="date">Tanggal (Date Picker)</option>
                    <option value="checkbox">Checkbox (Ya / Tidak)</option>
                    <option value="status">Status Badge</option>
                    <option value="select">Pilihan Tunggal (Dropdown)</option>
                  </optgroup>
                  <optgroup label="Relasi Antar Modul (Seksi 3.3 PRD)">
                    <option value="team_member">Anggota Tim (Relasi Tim)</option>
                    <option value="product">Produk (Relasi Katalog)</option>
                    <option value="kol">KOL / Influencer (Relasi KOL)</option>
                    <option value="campaign">Kampanye Marketing</option>
                    <option value="order">Pesanan Penjualan</option>
                    <option value="task">Tugas Kerja</option>
                  </optgroup>
                </select>
              </div>

              {(newColType === 'select' || newColType === 'status') && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Pilihan Nilai (Pisahkan dengan Koma)
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Belum Mulai, Proses, Selesai"
                    value={newColOptionsStr}
                    onChange={(e) => setNewColOptionsStr(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                  />
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddColumnModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold bg-violet-600 hover:bg-violet-700 text-white rounded-lg transition-colors shadow-xs"
                >
                  Simpan Kolom
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Kelola / Hapus Kolom */}
      {isManageColumnsModalOpen && currentWorksheet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Settings2 className="w-4 h-4 text-violet-600" />
                Kelola Kolom Worksheet
              </h2>
              <button
                onClick={() => setIsManageColumnsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-2 max-h-72 overflow-y-auto">
              {currentWorksheet.columns.map((col) => (
                <div
                  key={col.id}
                  className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                >
                  <div>
                    <span className="font-semibold text-slate-800">{col.label}</span>
                    <span className="ml-1.5 text-[10px] text-slate-400">({col.type})</span>
                  </div>

                  {currentWorksheet.columns.length > 1 && (
                    <button
                      onClick={() => {
                        if (confirm(`Hapus kolom "${col.label}"?`)) {
                          deleteWorksheetColumn(currentWorksheet.id, col.id);
                        }
                      }}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded"
                      title="Hapus Kolom"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setIsManageColumnsModalOpen(false)}
                className="px-4 py-2 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg"
              >
                Selesai
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Tambah / Edit Baris */}
      {isAddRowModalOpen && currentWorksheet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base text-slate-900">
                {editingRow ? 'Edit Baris Data' : `Tambah Baris: ${currentWorksheet.title}`}
              </h3>
              <button
                onClick={() => setIsAddRowModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveRow} className="space-y-3.5 text-xs max-h-96 overflow-y-auto">
              {currentWorksheet.columns.map((col) => (
                <div key={col.id}>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {col.label} <span className="text-[10px] text-slate-400">({col.type})</span>
                  </label>

                  {/* Relational selectors */}
                  {col.type === 'team_member' ? (
                    <select
                      value={newRowData[col.id] || ''}
                      onChange={(e) =>
                        setNewRowData({ ...newRowData, [col.id]: e.target.value })
                      }
                      className="w-full bg-white border border-slate-200 rounded-lg p-2 text-slate-800 font-medium"
                    >
                      <option value="">-- Pilih Anggota Tim --</option>
                      {teamMembers.map((tm) => (
                        <option key={tm.id} value={tm.id}>
                          {tm.name} ({tm.roleOrPosition})
                        </option>
                      ))}
                    </select>
                  ) : col.type === 'product' ? (
                    <select
                      value={newRowData[col.id] || ''}
                      onChange={(e) =>
                        setNewRowData({ ...newRowData, [col.id]: e.target.value })
                      }
                      className="w-full bg-white border border-slate-200 rounded-lg p-2 text-slate-800 font-medium"
                    >
                      <option value="">-- Pilih Produk --</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  ) : col.type === 'kol' ? (
                    <select
                      value={newRowData[col.id] || ''}
                      onChange={(e) =>
                        setNewRowData({ ...newRowData, [col.id]: e.target.value })
                      }
                      className="w-full bg-white border border-slate-200 rounded-lg p-2 text-slate-800 font-medium"
                    >
                      <option value="">-- Pilih KOL --</option>
                      {kols.map((k) => (
                        <option key={k.id} value={k.id}>
                          {k.name} ({k.platform})
                        </option>
                      ))}
                    </select>
                  ) : col.type === 'order' ? (
                    <select
                      value={newRowData[col.id] || ''}
                      onChange={(e) =>
                        setNewRowData({ ...newRowData, [col.id]: e.target.value })
                      }
                      className="w-full bg-white border border-slate-200 rounded-lg p-2 text-slate-800 font-medium"
                    >
                      <option value="">-- Pilih Pesanan --</option>
                      {orders.map((o) => (
                        <option key={o.id} value={o.id}>
                          #{o.id} - Rp {o.netSales.toLocaleString('id-ID')} ({o.status})
                        </option>
                      ))}
                    </select>
                  ) : col.type === 'task' ? (
                    <select
                      value={newRowData[col.id] || ''}
                      onChange={(e) =>
                        setNewRowData({ ...newRowData, [col.id]: e.target.value })
                      }
                      className="w-full bg-white border border-slate-200 rounded-lg p-2 text-slate-800 font-medium"
                    >
                      <option value="">-- Pilih Tugas --</option>
                      {tasks.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.title} ({t.status})
                        </option>
                      ))}
                    </select>
                  ) : col.type === 'select' || col.type === 'status' ? (
                    <select
                      value={newRowData[col.id] || ''}
                      onChange={(e) =>
                        setNewRowData({ ...newRowData, [col.id]: e.target.value })
                      }
                      className="w-full bg-white border border-slate-200 rounded-lg p-2 text-slate-800 font-medium"
                    >
                      <option value="">-- Pilih Opsi --</option>
                      {(col.options || []).map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  ) : col.type === 'checkbox' ? (
                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="checkbox"
                        checked={!!newRowData[col.id]}
                        onChange={(e) =>
                          setNewRowData({ ...newRowData, [col.id]: e.target.checked })
                        }
                        className="w-4 h-4 text-violet-600 rounded"
                      />
                      <span className="text-slate-600">Centang jika aktif / selesai</span>
                    </div>
                  ) : col.type === 'date' ? (
                    <input
                      type="date"
                      value={newRowData[col.id] || ''}
                      onChange={(e) =>
                        setNewRowData({ ...newRowData, [col.id]: e.target.value })
                      }
                      className="w-full font-mono bg-white border border-slate-200 rounded-lg p-2 text-slate-800 font-medium"
                    />
                  ) : col.type === 'currency' || col.type === 'number' ? (
                    <input
                      type="number"
                      value={newRowData[col.id] !== undefined ? newRowData[col.id] : 0}
                      onChange={(e) =>
                        setNewRowData({
                          ...newRowData,
                          [col.id]: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="w-full font-mono tabular-nums bg-white border border-slate-200 rounded-lg p-2 text-slate-800 font-medium"
                    />
                  ) : (
                    <input
                      type="text"
                      value={newRowData[col.id] || ''}
                      onChange={(e) =>
                        setNewRowData({ ...newRowData, [col.id]: e.target.value })
                      }
                      className="w-full bg-white border border-slate-200 rounded-lg p-2 text-slate-800 font-medium"
                    />
                  )}
                </div>
              ))}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddRowModalOpen(false)}
                  className="px-4 py-2 font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 font-semibold text-white bg-violet-600 hover:bg-violet-700 rounded-lg transition-colors shadow-xs"
                >
                  Simpan Baris
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Kirim Nilai Baris ke Keuangan Resmi */}
      {convertingRow && currentWorksheet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-purple-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Send className="w-5 h-5 text-violet-700" />
                <h3 className="font-bold text-base text-slate-900">
                  Kirim Data Lembar Kerja ke Keuangan
                </h3>
              </div>
              <button
                onClick={() => setConvertingRow(null)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-violet-50 rounded-xl text-xs space-y-1">
              <p className="text-slate-600">
                Data akan dibukukan menjadi transaksi keuangan resmi dan memutasi saldo akun aset terkait.
              </p>
            </div>

            {convError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
                {convError}
              </div>
            )}

            <form onSubmit={handleExecuteConvert} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Jenis Transaksi
                  </label>
                  <select
                    value={convType}
                    onChange={(e) => setConvType(e.target.value as 'income' | 'expense')}
                    className="w-full bg-white border border-slate-200 rounded-lg p-2 text-slate-800 font-medium"
                  >
                    <option value="income">Pemasukan (+)</option>
                    <option value="expense">Pengeluaran (-)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Nominal (IDR) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={convAmountStr}
                    onChange={(e) => setConvAmountStr(e.target.value)}
                    className="w-full font-mono tabular-nums bg-white border border-slate-200 rounded-lg p-2 text-slate-800 font-bold"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Deskripsi Transaksi <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={convDesc}
                  onChange={(e) => setConvDesc(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg p-2 text-slate-800 font-medium"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Kategori</label>
                  <input
                    type="text"
                    value={convCategory}
                    onChange={(e) => setConvCategory(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg p-2 text-slate-800 font-medium"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Akun Kas / Aset <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={convAssetId}
                    onChange={(e) => setConvAssetId(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg p-2 text-slate-800 font-medium"
                    required
                  >
                    {userAssets.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name} (Saldo: Rp {a.currentBalance.toLocaleString('id-ID')})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setConvertingRow(null)}
                  className="px-4 py-2 font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 font-semibold text-white bg-violet-600 hover:bg-violet-700 rounded-lg transition-colors shadow-xs"
                >
                  Konfirmasi Pembukuan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
