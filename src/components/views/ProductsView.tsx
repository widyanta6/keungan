import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Product } from '../../types';
import {
  Package,
  Plus,
  Search,
  AlertTriangle,
  Edit2,
  Trash2,
  X,
  Boxes,
  Tag,
} from 'lucide-react';

export const ProductsView: React.FC = () => {
  const {
    currentUser,
    brands,
    products,
    addProduct,
    updateProduct,
    deleteProduct,
    selectedBrandId,
    setSelectedBrandId,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [brandId, setBrandId] = useState('');
  const [category, setCategory] = useState('');
  const [priceStr, setPriceStr] = useState('');
  const [hppStr, setHppStr] = useState('');
  const [stockStr, setStockStr] = useState('');
  const [minStockAlertStr, setMinStockAlertStr] = useState('5');
  const [unit, setUnit] = useState('pcs');
  const [notes, setNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!currentUser) return null;

  const isAdmin = currentUser.role === 'admin';
  const userBrands = brands;
  const userProducts = products;

  const brandMap = new Map<string, string>();
  brands.forEach((b) => brandMap.set(b.id, b.name));

  const filteredProducts = userProducts.filter((p) => {
    if (p.brandId && !brands.some((b) => b.id === p.brandId)) return false;
    if (selectedBrandId !== 'all' && p.brandId !== selectedBrandId) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = p.name.toLowerCase().includes(q);
      const matchSku = p.sku.toLowerCase().includes(q);
      const matchCat = p.category.toLowerCase().includes(q);
      if (!matchName && !matchSku && !matchCat) return false;
    }
    return true;
  });

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setName('');
    setSku(`SKU-${Date.now().toString().slice(-4)}`);
    setBrandId(userBrands[0]?.id || '');
    setCategory('Koleksi Utama');
    setPriceStr('');
    setHppStr('');
    setStockStr('10');
    setMinStockAlertStr('5');
    setUnit('pcs');
    setNotes('');
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (p: Product) => {
    setEditingProduct(p);
    setName(p.name);
    setSku(p.sku);
    setBrandId(p.brandId);
    setCategory(p.category);
    setPriceStr(p.price.toString());
    setHppStr(p.estimatedHpp?.toString() || '');
    setStockStr(p.stock.toString());
    setMinStockAlertStr(p.minStockAlert.toString());
    setUnit(p.unit);
    setNotes(p.notes || '');
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const price = parseFloat(priceStr) || 0;
    const hpp = parseFloat(hppStr) || 0;
    const stock = parseInt(stockStr, 10) || 0;
    const minAlert = parseInt(minStockAlertStr, 10) || 0;

    if (!name.trim()) {
      setErrorMsg('Nama produk/layanan wajib diisi.');
      return;
    }
    if (price <= 0) {
      setErrorMsg('Harga jual harus lebih besar dari Rp 0.');
      return;
    }

    if (editingProduct) {
      const res = updateProduct(editingProduct.id, {
        name,
        sku,
        brandId,
        category,
        price,
        estimatedHpp: hpp,
        stock,
        minStockAlert: minAlert,
        unit,
        notes,
      });
      if (!res.success) {
        setErrorMsg(res.error || 'Gagal mengubah produk.');
        return;
      }
    } else {
      const res = addProduct({
        workspaceId: currentUser.workspaceId,
        brandId,
        name,
        sku,
        category,
        price,
        estimatedHpp: hpp,
        stock,
        minStockAlert: minAlert,
        unit,
        notes,
      });
      if (!res.success) {
        setErrorMsg(res.error || 'Gagal menambah produk.');
        return;
      }
    }

    setIsModalOpen(false);
  };

  return (
    <div className="space-y-5">
      {/* Header and Filter */}
      <div className="bg-white rounded-2xl p-4 border border-purple-100 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama produk, SKU, atau kategori..."
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-violet-500 font-medium"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedBrandId}
              onChange={(e) => setSelectedBrandId(e.target.value)}
              className="text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 focus:outline-none"
            >
              <option value="all">Semua Brand</option>
              {userBrands.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>

            {!isAdmin && (
              <button
                onClick={handleOpenAdd}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-violet-600 hover:bg-violet-700 rounded-xl transition-all shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Produk</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Product Table */}
      <div className="bg-white rounded-2xl border border-purple-100 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Info Produk & SKU</th>
                <th className="py-3 px-4">Brand & Kategori</th>
                <th className="py-3 px-4 text-right">Harga Jual (IDR)</th>
                <th className="py-3 px-4 text-right">Estimasi HPP</th>
                <th className="py-3 px-4 text-center">Stok / Sisa</th>
                <th className="py-3 px-4 text-right">Estimasi Margin</th>
                {!isAdmin && <th className="py-3 px-4 text-center">Aksi</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-400">
                    Belum ada produk terdaftar.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const brandName = brandMap.get(p.brandId) || p.brandId;
                  const hpp = p.estimatedHpp || 0;
                  const grossProfit = p.price - hpp;
                  const marginPct = p.price > 0 ? ((grossProfit / p.price) * 100).toFixed(1) : '0';
                  const isLowStock = p.stock <= p.minStockAlert;

                  return (
                    <tr key={p.id} className="hover:bg-violet-50/40 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{p.name}</div>
                        <div className="font-mono text-[11px] text-slate-400">{p.sku}</div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-semibold text-violet-900">{brandName}</div>
                        <div className="text-[11px] text-slate-500">{p.category}</div>
                      </td>

                      <td className="py-3 px-4 text-right font-mono font-bold tabular-nums text-slate-900">
                        Rp {p.price.toLocaleString('id-ID')}
                      </td>

                      <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-600">
                        {hpp > 0 ? `Rp ${hpp.toLocaleString('id-ID')}` : '-'}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span
                          className={`font-mono font-bold tabular-nums px-2 py-0.5 rounded text-xs inline-flex items-center gap-1 ${
                            isLowStock
                              ? 'bg-amber-100 text-amber-900'
                              : 'bg-emerald-50 text-emerald-700'
                          }`}
                        >
                          {isLowStock && <AlertTriangle className="w-3 h-3 text-amber-600" />}
                          {p.stock} {p.unit}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right font-mono tabular-nums">
                        {hpp > 0 ? (
                          <div>
                            <span className="font-bold text-emerald-600">{marginPct}%</span>
                            <div className="text-[10px] text-slate-400">
                              +Rp {grossProfit.toLocaleString('id-ID')}
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px]">Belum dihitung</span>
                        )}
                      </td>

                      {!isAdmin && (
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => handleOpenEdit(p)}
                              className="p-1.5 text-slate-400 hover:text-violet-700 hover:bg-violet-50 rounded-lg transition-colors"
                              title="Ubah Produk"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => deleteProduct(p.id)}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Hapus Produk"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
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

      {/* Product Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-purple-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Boxes className="w-5 h-5 text-violet-700" />
                <h3 className="font-bold text-base text-slate-900">
                  {editingProduct ? 'Ubah Informasi Produk' : 'Tambah Produk / Layanan Baru'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Brand <span className="text-red-500">*</span>
                  </label>
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
                  <label className="block font-semibold text-slate-700 mb-1">
                    SKU / Kode <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    className="w-full font-mono bg-white border border-slate-200 rounded-lg p-2 text-slate-800 font-medium"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nama Produk / Layanan <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: Keepsake Resin Ring 925 Silver"
                  className="w-full bg-white border border-slate-200 rounded-lg p-2 text-slate-800 font-medium"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Kategori</label>
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="Contoh: Perhiasan Cincin"
                    className="w-full bg-white border border-slate-200 rounded-lg p-2 text-slate-800 font-medium"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Satuan</label>
                  <input
                    type="text"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    placeholder="pcs / tiket / proyek / slot"
                    className="w-full bg-white border border-slate-200 rounded-lg p-2 text-slate-800 font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Harga Jual (IDR) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={priceStr}
                    onChange={(e) => setPriceStr(e.target.value)}
                    placeholder="0"
                    className="w-full font-mono tabular-nums bg-white border border-slate-200 rounded-lg p-2 text-slate-800 font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Estimasi HPP (IDR)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={hppStr}
                    onChange={(e) => setHppStr(e.target.value)}
                    placeholder="0"
                    className="w-full font-mono tabular-nums bg-white border border-slate-200 rounded-lg p-2 text-slate-800 font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Stok Saat Ini</label>
                  <input
                    type="number"
                    min="0"
                    value={stockStr}
                    onChange={(e) => setStockStr(e.target.value)}
                    className="w-full font-mono tabular-nums bg-white border border-slate-200 rounded-lg p-2 text-slate-800 font-medium"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Batas Peringatan Minimum
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={minStockAlertStr}
                    onChange={(e) => setMinStockAlertStr(e.target.value)}
                    className="w-full font-mono tabular-nums bg-white border border-slate-200 rounded-lg p-2 text-slate-800 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Catatan Tambahan</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Spesifikasi material, supplier, atau detail lainnya..."
                  className="w-full bg-white border border-slate-200 rounded-lg p-2 text-slate-800 font-medium"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 font-semibold text-white bg-violet-600 hover:bg-violet-700 rounded-lg transition-colors shadow-xs"
                >
                  Simpan Produk
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
