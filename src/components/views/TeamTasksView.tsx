import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { TeamMember, Task, TaskStatus, TaskPriority, CompensationType } from '../../types';
import {
  Users,
  CheckSquare,
  Plus,
  Search,
  Kanban,
  List,
  Clock,
  Calendar,
  AlertCircle,
  X,
  Edit2,
  Trash2,
  CheckCircle2,
  ArrowRight,
  Info,
} from 'lucide-react';

export const TeamTasksView: React.FC = () => {
  const {
    currentUser,
    brands,
    teamMembers,
    tasks,
    addTeamMember,
    updateTeamMember,
    addTask,
    updateTask,
    deleteTask,
    selectedBrandId,
    setSelectedBrandId,
  } = useApp();

  const [activeSubTab, setActiveSubTab] = useState<'tasks' | 'team'>('tasks');
  const [viewMode, setViewMode] = useState<'board' | 'list'>('board');
  const [searchQuery, setSearchQuery] = useState('');
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Form states Task
  const [taskBrandId, setTaskBrandId] = useState('');
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskAssigneeId, setTaskAssigneeId] = useState('');
  const [taskProject, setTaskProject] = useState('');
  const [taskPriority, setTaskPriority] = useState<TaskPriority>('medium');
  const [taskStartDate, setTaskStartDate] = useState('');
  const [taskDeadline, setTaskDeadline] = useState('');
  const [taskStatus, setTaskStatus] = useState<TaskStatus>('todo');
  const [taskEstFeeStr, setTaskEstFeeStr] = useState('0');
  const [taskError, setTaskError] = useState('');

  // Form states Member
  const [memberName, setMemberName] = useState('');
  const [memberContact, setMemberContact] = useState('');
  const [memberRole, setMemberRole] = useState('');
  const [memberBrandId, setMemberBrandId] = useState('');
  const [compType, setCompType] = useState<CompensationType>('monthly_salary');
  const [baseRateStr, setBaseRateStr] = useState('3500000');
  const [memberNotes, setMemberNotes] = useState('');
  const [memberError, setMemberError] = useState('');

  if (!currentUser) return null;

  const isAdmin = currentUser.role === 'admin';
  const userBrands = brands;
  const userMembers = teamMembers;
  const userTasks = tasks;

  const brandMap = new Map<string, string>();
  brands.forEach((b) => brandMap.set(b.id, b.name));

  const filteredTasks = userTasks.filter((t) => {
    if (t.brandId && !brands.some((b) => b.id === t.brandId)) return false;
    if (selectedBrandId !== 'all' && t.brandId !== selectedBrandId) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = t.title.toLowerCase().includes(q);
      const matchAssignee = (t.assigneeName || '').toLowerCase().includes(q);
      const matchProject = (t.relatedProjectOrEvent || '').toLowerCase().includes(q);
      if (!matchTitle && !matchAssignee && !matchProject) return false;
    }
    return true;
  });

  const filteredMembers = userMembers.filter((m) => {
    if (selectedBrandId !== 'all' && m.brandId !== selectedBrandId) return false;
    return true;
  });

  const handleOpenAddTask = () => {
    const now = new Date();
    setEditingTask(null);
    setTaskBrandId(userBrands[0]?.id || '');
    setTaskTitle('');
    setTaskDesc('');
    setTaskAssigneeId(userMembers[0]?.id || '');
    setTaskProject('');
    setTaskPriority('medium');
    setTaskStartDate(now.toISOString().slice(0, 10));
    setTaskDeadline(new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10));
    setTaskStatus('todo');
    setTaskEstFeeStr('0');
    setTaskError('');
    setIsTaskModalOpen(true);
  };

  const handleSaveTask = (e: React.FormEvent) => {
    e.preventDefault();
    setTaskError('');

    if (!taskTitle.trim()) {
      setTaskError('Judul tugas wajib diisi.');
      return;
    }

    const assignee = userMembers.find((m) => m.id === taskAssigneeId);
    const estFee = parseFloat(taskEstFeeStr) || 0;

    if (editingTask) {
      const res = updateTask(editingTask.id, {
        brandId: taskBrandId,
        title: taskTitle,
        description: taskDesc,
        assigneeId: taskAssigneeId,
        assigneeName: assignee ? assignee.name : undefined,
        relatedProjectOrEvent: taskProject,
        priority: taskPriority,
        startDate: taskStartDate,
        deadline: taskDeadline,
        status: taskStatus,
        estimatedFee: estFee,
        approvedFee: taskStatus === 'done' ? estFee : editingTask.approvedFee,
        feeApproved: taskStatus === 'done' ? true : editingTask.feeApproved,
      });
      if (!res.success) {
        setTaskError(res.error || 'Gagal mengubah tugas.');
        return;
      }
    } else {
      const res = addTask({
        brandId: taskBrandId,
        title: taskTitle,
        description: taskDesc,
        assigneeId: taskAssigneeId,
        assigneeName: assignee ? assignee.name : undefined,
        relatedProjectOrEvent: taskProject,
        priority: taskPriority,
        startDate: taskStartDate,
        deadline: taskDeadline,
        status: taskStatus,
        estimatedFee: estFee,
      });
      if (!res.success) {
        setTaskError(res.error || 'Gagal menambah tugas.');
        return;
      }
    }

    setIsTaskModalOpen(false);
  };

  const handleSaveMember = (e: React.FormEvent) => {
    e.preventDefault();
    setMemberError('');

    if (!memberName.trim() || !memberRole.trim()) {
      setMemberError('Nama dan jabatan anggota tim wajib diisi.');
      return;
    }

    const rate = parseFloat(baseRateStr) || 0;
    const res = addTeamMember({
      brandId: memberBrandId || userBrands[0]?.id || '',
      name: memberName,
      contactInfo: memberContact,
      roleOrPosition: memberRole,
      compensationType: compType,
      baseRate: rate,
      isActive: true,
      notes: memberNotes,
    });

    if (!res.success) {
      setMemberError(res.error || 'Gagal menambah anggota tim.');
      return;
    }

    setIsMemberModalOpen(false);
  };

  // Kanban Columns
  const kanbanColumns: { status: TaskStatus; label: string; bg: string }[] = [
    { status: 'todo', label: 'Belum Mulai', bg: 'bg-slate-100' },
    { status: 'in_progress', label: 'Sedang Dikerjakan', bg: 'bg-blue-50' },
    { status: 'review', label: 'Menunggu Review', bg: 'bg-amber-50' },
    { status: 'done', label: 'Selesai', bg: 'bg-emerald-50' },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-2xl p-6 border border-purple-100 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-violet-700 uppercase tracking-wider mb-1">
            <Users className="w-4 h-4" />
            <span>Manajemen Tim & Pembagian Tugas (Kanban / List)</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900">Alokasi Tim & Distribusi Pekerjaan</h1>
          <p className="text-xs text-slate-500 mt-1">
            Koordinasi anggota tim, tenggat waktu proyek, serta pengelolaan honor tugas terhubung ke payroll.
          </p>
        </div>

        {!isAdmin && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setMemberBrandId(userBrands[0]?.id || '');
                setMemberName('');
                setMemberContact('');
                setMemberRole('');
                setCompType('monthly_salary');
                setBaseRateStr('3500000');
                setMemberNotes('');
                setMemberError('');
                setIsMemberModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-colors"
            >
              <Users className="w-3.5 h-3.5 text-slate-500" />
              <span>+ Anggota Tim</span>
            </button>
            <button
              onClick={handleOpenAddTask}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-violet-600 hover:bg-violet-700 rounded-xl transition-all shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>+ Buat Tugas</span>
            </button>
          </div>
        )}
      </div>

      {/* Financial Rule Notice */}
      <div className="p-3.5 bg-violet-50/70 border border-violet-100 rounded-xl text-xs text-slate-600 flex items-start gap-2.5">
        <Info className="w-4 h-4 text-violet-700 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong className="text-violet-900">Aturan Tugas & Biaya (Seksi 7.4):</strong> Estimasi biaya tugas tidak
          otomatis menjadi pengeluaran kas. Jika tugas memiliki honorarium, nominal disetujui dimasukkan ke rekap
          payroll bulanan, dan kas baru berkurang saat pembayaran payroll resmi dieksekusi.
        </p>
      </div>

      {/* Sub tabs & Filter Toolbar */}
      <div className="bg-white rounded-2xl p-4 border border-purple-100 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setActiveSubTab('tasks')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                activeSubTab === 'tasks' ? 'bg-white text-violet-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              Tugas & Proyek ({filteredTasks.length})
            </button>
            <button
              onClick={() => setActiveSubTab('team')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                activeSubTab === 'team' ? 'bg-white text-violet-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              Direktori Anggota Tim ({filteredMembers.length})
            </button>
          </div>

          {activeSubTab === 'tasks' && (
            <div className="flex items-center bg-slate-100 p-1 rounded-xl">
              <button
                onClick={() => setViewMode('board')}
                className={`p-1.5 rounded-lg ${
                  viewMode === 'board' ? 'bg-white text-violet-900 shadow-xs' : 'text-slate-500'
                }`}
                title="Tampilan Papan Kanban"
              >
                <Kanban className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg ${
                  viewMode === 'list' ? 'bg-white text-violet-900 shadow-xs' : 'text-slate-500'
                }`}
                title="Tampilan Daftar Tabel"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari tugas / PIC..."
              className="bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-2.5 py-1 text-slate-800 placeholder:text-slate-400 focus:outline-none"
            />
          </div>

          <select
            value={selectedBrandId}
            onChange={(e) => setSelectedBrandId(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-slate-700 font-semibold"
          >
            <option value="all">Semua Brand</option>
            {userBrands.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tab: Tasks */}
      {activeSubTab === 'tasks' && (
        <>
          {viewMode === 'board' ? (
            /* Kanban Board */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {kanbanColumns.map((col) => {
                const columnTasks = filteredTasks.filter((t) => t.status === col.status);

                return (
                  <div key={col.status} className="bg-slate-50/70 rounded-2xl p-4 border border-slate-200/80 flex flex-col">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-3">
                      <span className="font-bold text-xs text-slate-800 uppercase tracking-wider">
                        {col.label}
                      </span>
                      <span className="text-[11px] font-mono font-bold bg-white px-2 py-0.5 rounded-full text-slate-600 border border-slate-200">
                        {columnTasks.length}
                      </span>
                    </div>

                    <div className="space-y-3 flex-1 overflow-y-auto">
                      {columnTasks.map((task) => (
                        <div
                          key={task.id}
                          className="bg-white rounded-xl p-3.5 border border-purple-100 shadow-xs hover:border-violet-300 transition-all space-y-2 text-xs"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-semibold text-violet-700 bg-violet-50 px-2 py-0.5 rounded">
                              {brandMap.get(task.brandId)}
                            </span>
                            <span
                              className={`text-[9px] font-bold uppercase px-1.5 py-0.2 rounded ${
                                task.priority === 'urgent'
                                  ? 'bg-red-100 text-red-700'
                                  : task.priority === 'high'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {task.priority}
                            </span>
                          </div>

                          <h4 className="font-bold text-slate-900 leading-snug">{task.title}</h4>
                          <p className="text-[11px] text-slate-500 line-clamp-2">{task.description}</p>

                          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                            <span className="font-semibold text-slate-700">{task.assigneeName || 'Unassigned'}</span>
                            <span className="font-mono flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-slate-400" />
                              {task.deadline}
                            </span>
                          </div>

                          {!isAdmin && (
                            <div className="pt-2 flex items-center justify-between border-t border-dashed border-slate-100">
                              <select
                                value={task.status}
                                onChange={(e) => {
                                  const newStat = e.target.value as TaskStatus;
                                  updateTask(task.id, {
                                    status: newStat,
                                    feeApproved: newStat === 'done' ? true : task.feeApproved,
                                    approvedFee: newStat === 'done' ? task.estimatedFee : task.approvedFee,
                                  });
                                }}
                                className="text-[10px] bg-slate-50 border border-slate-200 rounded p-1 text-slate-700"
                              >
                                <option value="todo">Pindah: Belum Mulai</option>
                                <option value="in_progress">Pindah: Dikerjakan</option>
                                <option value="review">Pindah: Review</option>
                                <option value="done">Pindah: Selesai</option>
                              </select>

                              <button
                                onClick={() => deleteTask(task.id)}
                                className="text-slate-400 hover:text-red-500 p-1"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Table View */
            <div className="bg-white rounded-2xl border border-purple-100 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[11px]">
                      <th className="py-3 px-4">Judul Tugas</th>
                      <th className="py-3 px-4">Brand & Proyek</th>
                      <th className="py-3 px-4">Penanggung Jawab</th>
                      <th className="py-3 px-4">Deadline</th>
                      <th className="py-3 px-4 text-center">Prioritas</th>
                      <th className="py-3 px-4 text-center">Status</th>
                      {!isAdmin && <th className="py-3 px-4 text-center">Aksi</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredTasks.map((t) => (
                      <tr key={t.id} className="hover:bg-violet-50/40">
                        <td className="py-3 px-4 font-semibold text-slate-900">{t.title}</td>
                        <td className="py-3 px-4 text-slate-600">
                          <span className="font-semibold text-violet-900">{brandMap.get(t.brandId)}</span>
                          {t.relatedProjectOrEvent && (
                            <div className="text-[11px] text-slate-400">{t.relatedProjectOrEvent}</div>
                          )}
                        </td>
                        <td className="py-3 px-4 font-medium text-slate-800">{t.assigneeName || '-'}</td>
                        <td className="py-3 px-4 font-mono text-slate-500">{t.deadline}</td>
                        <td className="py-3 px-4 text-center">
                          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                            {t.priority}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="text-[11px] font-semibold text-violet-800 bg-violet-50 px-2 py-0.5 rounded">
                            {t.status.replace('_', ' ')}
                          </span>
                        </td>
                        {!isAdmin && (
                          <td className="py-3 px-4 text-center">
                            <button onClick={() => deleteTask(t.id)} className="p-1 text-slate-400 hover:text-red-500">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* Tab: Team Directory */}
      {activeSubTab === 'team' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredMembers.map((m) => (
            <div key={m.id} className="bg-white rounded-2xl p-5 border border-purple-100 shadow-xs space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-semibold text-violet-700 uppercase tracking-wider">
                    {brandMap.get(m.brandId)}
                  </span>
                  <h3 className="font-bold text-base text-slate-900">{m.name}</h3>
                  <p className="text-xs text-slate-500">{m.roleOrPosition}</p>
                </div>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0 mt-1" />
              </div>

              <div className="space-y-1.5 p-3 rounded-xl bg-slate-50 text-xs font-mono tabular-nums">
                <div className="flex justify-between text-slate-500">
                  <span className="font-sans">Skema Kompensasi:</span>
                  <span className="font-semibold text-slate-800 uppercase text-[10px]">
                    {m.compensationType.replace('_', ' ')}
                  </span>
                </div>
                <div className="flex justify-between text-slate-700 font-bold">
                  <span className="font-sans">Tarif / Gaji Dasar:</span>
                  <span className="text-violet-900">Rp {m.baseRate.toLocaleString('id-ID')}</span>
                </div>
              </div>

              <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-100">
                Kontak: {m.contactInfo || '-'}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Task Modal */}
      {isTaskModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-purple-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-violet-700" />
                <h3 className="font-bold text-base text-slate-900">Buat Tugas Baru</h3>
              </div>
              <button onClick={() => setIsTaskModalOpen(false)} className="text-slate-400 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            {taskError && <div className="p-2.5 bg-red-50 text-red-700 text-xs rounded-lg">{taskError}</div>}

            <form onSubmit={handleSaveTask} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Brand</label>
                  <select
                    value={taskBrandId}
                    onChange={(e) => setTaskBrandId(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg p-2 text-slate-800 font-medium"
                    required
                  >
                    {userBrands.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Penanggung Jawab (PIC)</label>
                  <select
                    value={taskAssigneeId}
                    onChange={(e) => setTaskAssigneeId(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg p-2 text-slate-800 font-medium"
                  >
                    <option value="">Pilih Anggota Tim...</option>
                    {userMembers
                      .filter((m) => m.brandId === taskBrandId)
                      .map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name} ({m.roleOrPosition})
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Judul Tugas <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  placeholder="Contoh: Finalisasi Desain Denah Booth Sponsor"
                  className="w-full bg-white border border-slate-200 rounded-lg p-2 text-slate-800 font-medium"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Deskripsi Tugas</label>
                <textarea
                  rows={2}
                  value={taskDesc}
                  onChange={(e) => setTaskDesc(e.target.value)}
                  placeholder="Deliverables dan rincian pekerjaan..."
                  className="w-full bg-white border border-slate-200 rounded-lg p-2 text-slate-800"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Prioritas</label>
                  <select
                    value={taskPriority}
                    onChange={(e) => setTaskPriority(e.target.value as TaskPriority)}
                    className="w-full bg-white border border-slate-200 rounded-lg p-2 text-slate-800"
                  >
                    <option value="low">Rendah</option>
                    <option value="medium">Sedang</option>
                    <option value="high">Tinggi</option>
                    <option value="urgent">Mendesak</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tenggat (Deadline)</label>
                  <input
                    type="date"
                    value={taskDeadline}
                    onChange={(e) => setTaskDeadline(e.target.value)}
                    className="w-full font-mono bg-white border border-slate-200 rounded-lg p-2 text-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Estimasi Honor (IDR)</label>
                  <input
                    type="number"
                    min="0"
                    value={taskEstFeeStr}
                    onChange={(e) => setTaskEstFeeStr(e.target.value)}
                    className="w-full font-mono tabular-nums bg-white border border-slate-200 rounded-lg p-2 text-slate-800 font-semibold"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsTaskModalOpen(false)}
                  className="px-4 py-2 font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 font-semibold text-white bg-violet-600 hover:bg-violet-700 rounded-lg shadow-xs"
                >
                  Simpan Tugas
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Team Member Modal */}
      {isMemberModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-purple-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-violet-700" />
                <h3 className="font-bold text-base text-slate-900">Tambah Anggota Tim Baru</h3>
              </div>
              <button onClick={() => setIsMemberModalOpen(false)} className="text-slate-400 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            {memberError && <div className="p-2.5 bg-red-50 text-red-700 text-xs rounded-lg">{memberError}</div>}

            <form onSubmit={handleSaveMember} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Brand Terkait</label>
                <select
                  value={memberBrandId}
                  onChange={(e) => setMemberBrandId(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg p-2 text-slate-800 font-medium"
                >
                  {userBrands.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nama Lengkap</label>
                <input
                  type="text"
                  value={memberName}
                  onChange={(e) => setMemberName(e.target.value)}
                  placeholder="Contoh: Kadek Wisnu"
                  className="w-full bg-white border border-slate-200 rounded-lg p-2 text-slate-800 font-medium"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Posisi / Peran</label>
                <input
                  type="text"
                  value={memberRole}
                  onChange={(e) => setMemberRole(e.target.value)}
                  placeholder="Contoh: Jewelry Craftsman / Event Coordinator"
                  className="w-full bg-white border border-slate-200 rounded-lg p-2 text-slate-800 font-medium"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Skema Kompensasi</label>
                  <select
                    value={compType}
                    onChange={(e) => setCompType(e.target.value as CompensationType)}
                    className="w-full bg-white border border-slate-200 rounded-lg p-2 text-slate-800 font-medium"
                  >
                    <option value="monthly_salary">Gaji Bulanan</option>
                    <option value="project_fee">Honorarium Proyek</option>
                    <option value="event_fee">Honorarium Event</option>
                    <option value="task_based">Bayaran per Tugas</option>
                    <option value="target_incentive">Insentif Target</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tarif Dasar (IDR)</label>
                  <input
                    type="number"
                    min="0"
                    value={baseRateStr}
                    onChange={(e) => setBaseRateStr(e.target.value)}
                    className="w-full font-mono tabular-nums bg-white border border-slate-200 rounded-lg p-2 text-slate-800 font-bold"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Kontak (WhatsApp / Email)</label>
                <input
                  type="text"
                  value={memberContact}
                  onChange={(e) => setMemberContact(e.target.value)}
                  placeholder="0812-xxxx-xxxx"
                  className="w-full bg-white border border-slate-200 rounded-lg p-2 text-slate-800"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsMemberModalOpen(false)}
                  className="px-4 py-2 font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 font-semibold text-white bg-violet-600 hover:bg-violet-700 rounded-lg shadow-xs"
                >
                  Simpan Anggota Tim
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
