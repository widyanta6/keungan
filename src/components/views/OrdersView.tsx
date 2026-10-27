import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Order, OrderItem, OrderStatus } from '../../types';
import {
  ShoppingBag,
  Plus,
  Search,
  RotateCcw,
  CheckCircle2,
  Clock,
  XCircle,
  X,
  AlertCircle,
  Info,
  DollarSign,
  UserCheck,
} from 'lucide-react';

export const OrdersView: React.FC = () => {
  const {
    currentUser,
    brands,
    products,
    orders,
    kols,
    addOrder,
    processOrderRefund,
    selectedBrandId,
    setSelectedBrandId,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isRefundModalOpen, setIsRefundModalOpen] = useState(false);
  const [targetOrderForRefund, setTargetOrderForRefund] = useState<Order | null>(null);

  // Form states for adding order
  const [brandId, setBrandId] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerContact, setCustomerContact] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [quantityStr, setQuantityStr] = useState('1');
  const [discountStr, setDiscountStr] = useState('0');
  const [kolId, setKolId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Transfer Bank BCA');
  const [notes, setNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Refund states
  const [refundAmountStr, setRefundAmountStr] = useState('');
  const [refundReason, setRefundReason] = useState('');
  const [refundError, setRefundError] = useState('');

  if (!currentUser) return null;

  const isAdmin = currentUser.role === 'admin';
  const userBrands = brands;
  const userOrders = orders;
  const userProducts = products;
  const userKols = kols;

  const brandMap = new Map<string, string>();
  brands.forEach((b) => brandMap.set(b.id, b.name));

  const kolMap = new Map<string, string>();
  kols.forEach((k) => kolMap.set(k.id, `${k.name} (${k.handleOrAccount})`));

  // Filter orders
  const filteredOrders = userOrders.filter((o) => {
    if (selectedBrandId !== 'all' && o.brandId !== selectedBrandId) return false;
    if (statusFilter !== 'all' && o.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchNum = o.orderNumber.toLowerCase().includes(q);
      const matchCust = o.customerName.toLowerCase().includes(q);
      const matchKol = (kolMap.get(o.kolId || '') || '').toLowerCase().includes(q);
      if (!matchNum && !matchCust && !matchKol) return false;
    }
    return true;
  });

  // Calculate totals
  const totalGross = filteredOrders.reduce((sum, o) => sum + o.grossSales, 0);
  const totalDiscount = filteredOrders.reduce((sum, o) => sum + o.discount, 0);
  const totalRefund = filteredOrders.reduce((sum, o) => sum + o.refundAmount, 0);
  const totalNetSales = filteredOrders.reduce((sum, o) => sum + o.netSales, 0);

  // Atribusi Penjualan KOL (bagian dari total, bukan terpisah!)
  const kolAttributedOrders = filteredOrders.filter((o) => !!o.kolId && o.status === 'completed');
  const kolAttributedSales = kolAttributedOrders.reduce((sum, o) => sum + o.netSales, 0);

  const handleOpenAdd = () => {
    setBrandId(userBrands[0]?.id || '');
    setCustomerName('');
    setCustomerContact('');
    setSelectedProductId(userProducts[0]?.id || '');
    setQuantityStr('1');
    setDiscountStr('0');
    setKolId('');
    setPaymentMethod('Transfer Bank BCA');
    setNotes('');
    setErrorMsg('');
    setIsAddModalOpen(true);
  };

  const handleSaveOrder = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!customerName.trim()) {
      setErrorMsg('Nama pelanggan wajib diisi.');
      return;
    }

    const prod = userProducts.find((p) => p.id === selectedProductId);
    if (!prod) {
      setErrorMsg('Pilih produk yang dipesan.');
      return;
    }

    const qty = parseInt(quantityStr, 10) || 1;
    const discount = parseFloat(discountStr) || 0;
    const grossSales = prod.price * qty;

    const items: OrderItem[] = [
      {
        productId: prod.id,
        productName: prod.name,
        quantity: qty,
        unitPrice: prod.price,
        subtotal: grossSales,
      },
    ];

    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10);
    const orderNumber = `ORD-${Date.now().toString().slice(-6)}`;

    const res = addOrder({
      brandId,
      orderNumber,
      orderDate: dateStr,
      customerName,
      customerContact,
      items,
      grossSales,
      discount,
      refundAmount: 0,
      status: 'completed',
      kolId: kolId || undefined,
      commissionEligible: !!kolId,
      paymentMethod,
      notes,
    });

    if (!res.success) {
      setErrorMsg(res.error || 'Gagal menyimpan pesanan.');
      return;
    }

    setIsAddModalOpen(false);
  };

  const handleOpenRefund = (order: Order) => {
    setTargetOrderForRefund(order);
    setRefundAmountStr(order.netSales.toString());
    setRefundReason('');
    setRefundError('');
    setIsRefundModalOpen(true);
  };

  const handleExecuteRefund = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetOrderForRefund) return;
    setRefundError('');

    const amt = parseFloat(refundAmountStr) || 0;
    if (amt <= 0) {
      setRefundError('Nominal refund harus lebih besar dari Rp 0.');
      return;
    }
    if (amt > targetOrderForRefund.netSales) {
      setRefundError(`Nominal refund melebihi penjualan bersih (Rp ${targetOrderForRefund.netSales.toLocaleString('id-ID')}).`);
      return;
    }
    if (!refundReason.trim()) {
      setRefundError('Wajib mengisi alasan pengembalian dana.');
      return;
    }

    const res = processOrderRefund(targetOrderForRefund.id, amt, refundReason);
    if (!res.success) {
      setRefundError(res.error || 'Gagal memproses refund.');
      return;
    }

    setIsRefundModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-2xl p-6 border border-purple-100 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-violet-700 uppercase tracking-wider mb-1">
            <ShoppingBag className="w-4 h-4" />
            <span>Manajemen Pesanan & Penjualan</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900">Pesanan Penjualan & Atribusi KOL</h1>
          <p className="text-xs text-slate-500 mt-1">
            Setiap pesanan dihitung sekali sebagai penjualan bisnis. Atribusi KOL digunakan untuk mengukur efektivitas dan hak komisi.
          </p>
        </div>

        {!isAdmin && (
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-violet-600 hover:bg-violet-700 rounded-xl transition-all shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Catat Pesanan Baru</span>
          </button>
        )}
      </div>

      {/* Strict Financial Attribution Notice (PRD Section 5.3) */}
      <div className="p-3.5 bg-violet-50/70 border border-violet-100 rounded-xl text-xs text-slate-600 flex items-start gap-2.5">
        <Info className="w-4 h-4 text-violet-700 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong className="text-violet-900">Aturan Integritas Penjualan (Seksi 5.3):</strong> Penjualan
          dari KOL merupakan bagian dari total penjualan brand, <em>bukan pendapatan tambahan di luar penjualan tersebut</em>.
          Pesanan yang dibatalkan atau direfund otomatis mengurangi penjualan bersih dan membatalkan kelayakan komisi.
        </p>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-purple-100 shadow-xs">
          <span className="text-xs font-semibold text-slate-500">Penjualan Bersih (Net Sales)</span>
          <div className="text-xl font-bold font-mono tabular-nums text-emerald-600 mt-1">
            Rp {totalNetSales.toLocaleString('id-ID')}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Kotor: Rp {totalGross.toLocaleString('id-ID')} · Diskon: Rp {totalDiscount.toLocaleString('id-ID')}
          </p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-purple-100 shadow-xs">
          <span className="text-xs font-semibold text-slate-500">Total Pengembalian (Refund)</span>
          <div className="text-xl font-bold font-mono tabular-nums text-red-600 mt-1">
            Rp {totalRefund.toLocaleString('id-ID')}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Mengurangi omzet bersih & komisi</p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-purple-100 shadow-xs">
          <span className="text-xs font-semibold text-slate-500">Teratribusi ke KOL</span>
          <div className="text-xl font-bold font-mono tabular-nums text-violet-900 mt-1">
            Rp {kolAttributedSales.toLocaleString('id-ID')}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {kolAttributedOrders.length} pesanan via referral influencer
          </p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-purple-100 shadow-xs">
          <span className="text-xs font-semibold text-slate-500">Rasio Penjualan KOL</span>
          <div className="text-xl font-bold font-mono tabular-nums text-slate-900 mt-1">
            {totalNetSales > 0 ? ((kolAttributedSales / totalNetSales) * 100).toFixed(1) : 0}%
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Dari total penjualan bersih brand</p>
        </div>
      </div>

      {/* Filter and Table */}
      <div className="bg-white rounded-2xl border border-purple-100 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari no. order, pelanggan, atau nama KOL..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-violet-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-slate-700 font-medium"
            >
              <option value="all">Semua Status</option>
              <option value="completed">Selesai / Lunas</option>
              <option value="refunded">Direfund</option>
              <option value="cancelled">Dibatalkan</option>
            </select>

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

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">No. Order & Tanggal</th>
                <th className="py-3 px-4">Brand</th>
                <th className="py-3 px-4">Pelanggan & Item</th>
                <th className="py-3 px-4">Atribusi KOL</th>
                <th className="py-3 px-4 text-right">Penjualan Bersih (IDR)</th>
                <th className="py-3 px-4 text-center">Status</th>
                {!isAdmin && <th className="py-3 px-4 text-center">Aksi</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-400">
                    Belum ada pesanan terdaftar.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((o) => {
                  const kol = kols.find((k) => k.id === o.kolId);
                  const isRefunded = o.status === 'refunded';
                  const isCancelled = o.status === 'cancelled';

                  return (
                    <tr key={o.id} className="hover:bg-violet-50/40 transition-colors">
                      <td className="py-3 px-4 font-mono text-[11px]">
                        <div className="font-bold text-slate-900">{o.orderNumber}</div>
                        <div className="text-slate-400">{o.orderDate}</div>
                      </td>

                      <td className="py-3 px-4 font-semibold text-violet-900">
                        {brandMap.get(o.brandId)}
                      </td>

                      <td className="py-3 px-4 max-w-xs">
                        <div className="font-semibold text-slate-900">{o.customerName}</div>
                        <div className="text-[11px] text-slate-500 truncate">
                          {o.items.map((it) => `${it.productName} (${it.quantity}x)`).join(', ')}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        {kol ? (
                          <div className="flex items-center gap-1.5">
                            <UserCheck className="w-3.5 h-3.5 text-violet-600 shrink-0" />
                            <div>
                              <span className="font-semibold text-slate-900">{kol.name}</span>
                              <span className="text-[10px] text-violet-700 block font-mono">
                                {o.affiliateCode || kol.handleOrAccount}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px]">Penjualan Langsung</span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right font-mono tabular-nums">
                        <div className="font-bold text-sm text-slate-900">
                          Rp {o.netSales.toLocaleString('id-ID')}
                        </div>
                        {o.refundAmount > 0 && (
                          <div className="text-[10px] text-red-600">
                            Refund: -Rp {o.refundAmount.toLocaleString('id-ID')}
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                            isRefunded
                              ? 'bg-amber-50 text-amber-800'
                              : isCancelled
                              ? 'bg-red-50 text-red-700'
                              : 'bg-emerald-50 text-emerald-700'
                          }`}
                        >
                          {isRefunded ? 'Direfund' : isCancelled ? 'Batal' : 'Selesai'}
                        </span>
                      </td>

                      {!isAdmin && (
                        <td className="py-3 px-4 text-center">
                          {o.status === 'completed' && o.netSales > 0 && (
                            <button
                              onClick={() => handleOpenRefund(o)}
                              title="Proses Refund Pengembalian Dana"
                              className="px-2.5 py-1 text-[11px] font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors flex items-center gap-1 mx-auto"
                            >
                              <RotateCcw className="w-3 h-3" />
                              <span>Refund</span>
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Order Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-purple-100 space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-violet-700" />
                <h3 className="font-bold text-base text-slate-900">Catat Pesanan Penjualan Baru</h3>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-700 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSaveOrder} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Brand</label>
                  <select
                    value={brandId}
                    onChange={(e) => setBrandId(e.target.value)}
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
                  <label className="block font-semibold text-slate-700 mb-1">Atribusi Sumber KOL (Opsional)</label>
                  <select
                    value={kolId}
                    onChange={(e) => setKolId(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg p-2 text-slate-800 font-medium"
                  >
                    <option value="">Penjualan Langsung (Tanpa KOL)</option>
                    {userKols
                      .filter((k) => k.brandId === brandId)
                      .map((k) => (
                        <option key={k.id} value={k.id}>
                          {k.name} ({k.handleOrAccount})
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nama Pelanggan <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Contoh: Nadia Pratama"
                    className="w-full bg-white border border-slate-200 rounded-lg p-2 text-slate-800 font-medium"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Kontak / Telepon</label>
                  <input
                    type="text"
                    value={customerContact}
                    onChange={(e) => setCustomerContact(e.target.value)}
                    placeholder="0812-xxxx-xxxx"
                    className="w-full bg-white border border-slate-200 rounded-lg p-2 text-slate-800 font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">Pilih Produk</label>
                  <select
                    value={selectedProductId}
                    onChange={(e) => setSelectedProductId(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg p-2 text-slate-800 font-medium"
                    required
                  >
                    {userProducts
                      .filter((p) => p.brandId === brandId)
                      .map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} (Rp {p.price.toLocaleString('id-ID')})
                        </option>
                      ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Jumlah (Qty)</label>
                  <input
                    type="number"
                    min="1"
                    value={quantityStr}
                    onChange={(e) => setQuantityStr(e.target.value)}
                    className="w-full font-mono tabular-nums bg-white border border-slate-200 rounded-lg p-2 text-slate-800 font-bold"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Diskon Potongan (IDR)</label>
                  <input
                    type="number"
                    min="0"
                    value={discountStr}
                    onChange={(e) => setDiscountStr(e.target.value)}
                    className="w-full font-mono tabular-nums bg-white border border-slate-200 rounded-lg p-2 text-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Metode Pembayaran</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg p-2 text-slate-800 font-medium"
                  >
                    <option value="Transfer Bank BCA">Transfer Bank BCA</option>
                    <option value="Transfer Bank Mandiri">Transfer Bank Mandiri</option>
                    <option value="Transfer Bank BNI">Transfer Bank BNI</option>
                    <option value="QRIS">QRIS</option>
                    <option value="ShopeePay">ShopeePay</option>
                    <option value="Tunai / Kas">Tunai / Kas</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Catatan Pesanan</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Spesifikasi ukiran, request khusus, dsb."
                  className="w-full bg-white border border-slate-200 rounded-lg p-2 text-slate-800"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 font-semibold text-white bg-violet-600 hover:bg-violet-700 rounded-lg shadow-xs"
                >
                  Simpan Pesanan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Refund Modal */}
      {isRefundModalOpen && targetOrderForRefund && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-red-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-red-600">
                <RotateCcw className="w-5 h-5" />
                <h3 className="font-bold text-base text-slate-900">Proses Refund Pesanan</h3>
              </div>
              <button onClick={() => setIsRefundModalOpen(false)} className="text-slate-400 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-red-50 rounded-xl text-xs space-y-1 text-slate-700">
              <p>
                <strong>No. Order:</strong> {targetOrderForRefund.orderNumber} ({targetOrderForRefund.customerName})
              </p>
              <p className="font-mono tabular-nums">
                <strong>Penjualan Bersih Saat Ini:</strong> Rp {targetOrderForRefund.netSales.toLocaleString('id-ID')}
              </p>
              <p className="text-[11px] text-red-700">
                Refund akan mengurangi penjualan bersih dan mencatat transaksi pengembalian dana kas resmi.
              </p>
            </div>

            {refundError && (
              <div className="p-2.5 bg-red-100 text-red-800 text-xs rounded-lg">{refundError}</div>
            )}

            <form onSubmit={handleExecuteRefund} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nominal Refund (IDR) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  max={targetOrderForRefund.netSales}
                  value={refundAmountStr}
                  onChange={(e) => setRefundAmountStr(e.target.value)}
                  className="w-full font-mono tabular-nums bg-white border border-slate-200 rounded-lg p-2 text-slate-800 font-bold"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Alasan Refund <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={2}
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  placeholder="Contoh: Barang retur ukuran tidak sesuai atau pembatalan acara..."
                  className="w-full bg-white border border-slate-200 rounded-lg p-2 text-slate-800 font-medium"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsRefundModalOpen(false)}
                  className="px-4 py-2 font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-xs"
                >
                  Konfirmasi Refund
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
