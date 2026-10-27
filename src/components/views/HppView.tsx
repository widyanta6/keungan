import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { HPPRecipe, HPPMaterialItem } from '../../types';
import {
  Calculator,
  Plus,
  Trash2,
  Info,
  DollarSign,
  PieChart,
  X,
  Layers,
} from 'lucide-react';

export const HppView: React.FC = () => {
  const {
    currentUser,
    brands,
    products,
    hppRecipes,
    addHPPRecipe,
    updateHPPRecipe,
  } = useApp();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<HPPRecipe | null>(null);

  // Form states
  const [brandId, setBrandId] = useState('');
  const [productId, setProductId] = useState('');
  const [batchQty, setBatchQty] = useState(1);
  const [materials, setMaterials] = useState<HPPMaterialItem[]>([
    { id: '1', name: '', quantity: 1, unit: 'pcs', unitCost: 0, totalCost: 0 },
  ]);
  const [directLaborCost, setDirectLaborCost] = useState(0);
  const [packagingCost, setPackagingCost] = useState(0);
  const [overheadCost, setOverheadCost] = useState(0);
  const [sellingPrice, setSellingPrice] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');

  if (!currentUser) return null;

  const isAdmin = currentUser.role === 'admin';
  const userBrands = isAdmin
    ? brands
    : brands.filter((b) => b.workspaceId === currentUser.workspaceId);
  const userProducts = isAdmin
    ? products
    : products.filter((p) => p.workspaceId === currentUser.workspaceId);
  const userRecipes = isAdmin
    ? hppRecipes
    : hppRecipes.filter((h) => h.workspaceId === currentUser.workspaceId);

  const brandMap = new Map<string, string>();
  brands.forEach((b) => brandMap.set(b.id, b.name));

  // Dynamic calculations inside modal
  const totalMaterialsCost = materials.reduce((sum, m) => sum + m.totalCost, 0);
  const totalBatchCost = totalMaterialsCost + directLaborCost + packagingCost + overheadCost;
  const hppPerUnit = batchQty > 0 ? Math.round(totalBatchCost / batchQty) : 0;
  const grossProfitPerUnit = sellingPrice - hppPerUnit;
  const grossMarginPercent =
    sellingPrice > 0 ? parseFloat(((grossProfitPerUnit / sellingPrice) * 100).toFixed(1)) : 0;

  const handleOpenAdd = () => {
    setEditingRecipe(null);
    setBrandId(userBrands[0]?.id || '');
    setProductId(userProducts[0]?.id || '');
    setBatchQty(1);
    setMaterials([
      { id: '1', name: 'Material Utama', quantity: 1, unit: 'pcs', unitCost: 50000, totalCost: 50000 },
    ]);
    setDirectLaborCost(30000);
    setPackagingCost(15000);
    setOverheadCost(10000);
    setSellingPrice(userProducts[0]?.price || 150000);
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (r: HPPRecipe) => {
    setEditingRecipe(r);
    setBrandId(r.brandId);
    setProductId(r.productId);
    setBatchQty(r.batchQuantity);
    setMaterials([...r.materials]);
    setDirectLaborCost(r.directLaborCost);
    setPackagingCost(r.packagingCost);
    setOverheadCost(r.overheadCost);
    setSellingPrice(r.sellingPrice);
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const handleMaterialChange = (
    index: number,
    field: keyof HPPMaterialItem,
    value: string | number
  ) => {
    setMaterials((prev) => {
      const updated = [...prev];
      const item = { ...updated[index], [field]: value };
      if (field === 'quantity' || field === 'unitCost') {
        item.totalCost = (item.quantity || 0) * (item.unitCost || 0);
      }
      updated[index] = item;
      return updated;
    });
  };

  const handleAddMaterialRow = () => {
    setMaterials((prev) => [
      ...prev,
      { id: `mat_${Date.now()}`, name: '', quantity: 1, unit: 'pcs', unitCost: 0, totalCost: 0 },
    ]);
  };

  const handleRemoveMaterialRow = (index: number) => {
    setMaterials((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const targetProduct = userProducts.find((p) => p.id === productId);
    const prodName = targetProduct ? targetProduct.name : 'Produk Kustom';

    if (materials.length === 0) {
      setErrorMsg('Minimal satu komponen bahan baku harus dimasukkan.');
      return;
    }

    if (editingRecipe) {
      const res = updateHPPRecipe(editingRecipe.id, {
        brandId,
        productId,
        productName: prodName,
        batchQuantity: batchQty,
        materials,
        directLaborCost,
        packagingCost,
        overheadCost,
        totalHppPerUnit: hppPerUnit,
        sellingPrice,
        grossProfitPerUnit,
        grossMarginPercent,
      });
      if (!res.success) {
        setErrorMsg(res.error || 'Gagal mengubah perhitungan HPP.');
        return;
      }
    } else {
      const res = addHPPRecipe({
        workspaceId: currentUser.workspaceId,
        brandId,
        productId,
        productName: prodName,
        batchQuantity: batchQty,
        materials,
        directLaborCost,
        packagingCost,
        overheadCost,
        totalHppPerUnit: hppPerUnit,
        sellingPrice,
        grossProfitPerUnit,
        grossMarginPercent,
      });
      if (!res.success) {
        setErrorMsg(res.error || 'Gagal menyimpan HPP.');
        return;
      }
    }

    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header and Add Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-2xl p-6 border border-purple-100 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-violet-700 uppercase tracking-wider mb-1">
            <Calculator className="w-4 h-4" />
            <span>Kalkulasi HPP & Struktur Biaya Produk</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900">
            Harga Pokok Produksi (HPP) & Margin Keuntungan
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Hitung biaya bahan baku riil, ongkos pengrajin, kemasan, dan margin kotor produk secara transparan.
          </p>
        </div>

        {!isAdmin && (
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-violet-600 hover:bg-violet-700 rounded-xl transition-all shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Kalkulasi Produk Baru</span>
          </button>
        )}
      </div>

      {/* Financial integrity card */}
      <div className="p-3.5 bg-violet-50/70 border border-violet-100 rounded-xl text-xs text-slate-600 flex items-start gap-2.5">
        <Info className="w-4 h-4 text-violet-700 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong className="text-violet-900">Ketentuan Akuntansi BizFlow:</strong> Biaya operasional umum
          (seperti sewa gedung atau iklan marketing) tidak digabung ke dalam HPP langsung per unit. HPP murni
          mencakup bahan baku, upah pengerjaan langsung, kemasan produk jadi, dan overhead produksi unit.
        </p>
      </div>

      {/* Recipe Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {userRecipes.map((recipe) => {
          const brandName = brandMap.get(recipe.brandId) || recipe.brandId;
          const matSum = recipe.materials.reduce((s, m) => s + m.totalCost, 0);

          return (
            <div
              key={recipe.id}
              className="bg-white rounded-2xl p-5 border border-purple-100 shadow-xs flex flex-col justify-between hover:border-violet-300 transition-all"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <span className="text-[11px] font-semibold text-violet-700 uppercase tracking-wider">
                      {brandName}
                    </span>
                    <h3 className="font-bold text-base text-slate-900">{recipe.productName}</h3>
                    <p className="text-xs text-slate-400 font-mono">
                      Batch Produksi: {recipe.batchQuantity} unit
                    </p>
                  </div>

                  {!isAdmin && (
                    <button
                      onClick={() => handleOpenEdit(recipe)}
                      className="text-xs font-semibold text-violet-700 hover:text-violet-900 px-2.5 py-1 bg-violet-50 rounded-lg transition-colors"
                    >
                      Ubah Formula
                    </button>
                  )}
                </div>

                {/* Visual Cost Structure Progress */}
                <div className="my-4 p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-3">
                  <div className="flex justify-between items-baseline font-mono tabular-nums">
                    <div>
                      <span className="text-xs text-slate-500">Total HPP per Unit</span>
                      <div className="text-xl font-bold text-slate-900">
                        Rp {recipe.totalHppPerUnit.toLocaleString('id-ID')}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-slate-500">Harga Jual</span>
                      <div className="text-base font-bold text-emerald-600">
                        Rp {recipe.sellingPrice.toLocaleString('id-ID')}
                      </div>
                    </div>
                  </div>

                  {/* Profit summary */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200 text-xs font-mono tabular-nums">
                    <div>
                      <span className="text-[11px] text-slate-400">Laba Kotor / Unit:</span>
                      <div className="font-bold text-violet-900">
                        +Rp {recipe.grossProfitPerUnit.toLocaleString('id-ID')}
                      </div>
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-400">Gross Margin:</span>
                      <div className="font-bold text-emerald-600">
                        {recipe.grossMarginPercent}%
                      </div>
                    </div>
                  </div>
                </div>

                {/* Materials Breakdown Table */}
                <div className="space-y-1.5 text-xs">
                  <div className="font-semibold text-slate-700 flex justify-between py-1">
                    <span>Komponen Biaya Langsung</span>
                    <span>Subtotal</span>
                  </div>
                  <div className="divide-y divide-slate-100 font-mono tabular-nums text-slate-600">
                    <div className="py-1 flex justify-between">
                      <span className="font-sans">Bahan Baku ({recipe.materials.length} item):</span>
                      <span>Rp {matSum.toLocaleString('id-ID')}</span>
                    </div>
                    <div className="py-1 flex justify-between">
                      <span className="font-sans">Tenaga Kerja Langsung:</span>
                      <span>Rp {recipe.directLaborCost.toLocaleString('id-ID')}</span>
                    </div>
                    <div className="py-1 flex justify-between">
                      <span className="font-sans">Kemasan & Packaging:</span>
                      <span>Rp {recipe.packagingCost.toLocaleString('id-ID')}</span>
                    </div>
                    <div className="py-1 flex justify-between">
                      <span className="font-sans">Alokasi Overhead:</span>
                      <span>Rp {recipe.overheadCost.toLocaleString('id-ID')}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-3 mt-4 border-t border-slate-100 text-[11px] text-slate-400 flex items-center justify-between">
                <span>Formula Terakhir: {recipe.updatedAt}</span>
                <span className="font-mono text-emerald-600 font-semibold">
                  Status Margin: Sehat & Profitabel
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* HPP Formula Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-xl border border-purple-100 space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Calculator className="w-5 h-5 text-violet-700" />
                <h3 className="font-bold text-base text-slate-900">
                  {editingRecipe ? 'Ubah Formula HPP' : 'Kalkulator Formula HPP Produk'}
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

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div className="grid grid-cols-3 gap-3">
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
                  <label className="block font-semibold text-slate-700 mb-1">Produk Target</label>
                  <select
                    value={productId}
                    onChange={(e) => {
                      setProductId(e.target.value);
                      const p = userProducts.find((x) => x.id === e.target.value);
                      if (p) setSellingPrice(p.price);
                    }}
                    className="w-full bg-white border border-slate-200 rounded-lg p-2 text-slate-800 font-medium"
                    required
                  >
                    {userProducts.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Batch Qty</label>
                  <input
                    type="number"
                    min="1"
                    value={batchQty}
                    onChange={(e) => setBatchQty(parseInt(e.target.value, 10) || 1)}
                    className="w-full font-mono tabular-nums bg-white border border-slate-200 rounded-lg p-2 text-slate-800 font-medium"
                    required
                  />
                </div>
              </div>

              {/* Dynamic Materials Rows */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-800">
                    Bahan Baku & Material (Batch Total)
                  </label>
                  <button
                    type="button"
                    onClick={handleAddMaterialRow}
                    className="text-xs text-violet-700 hover:text-violet-900 font-semibold flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Tambah Bahan
                  </button>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {materials.map((m, idx) => (
                    <div
                      key={m.id || idx}
                      className="grid grid-cols-12 gap-2 items-center bg-slate-50 p-2 rounded-xl border border-slate-200"
                    >
                      <input
                        type="text"
                        placeholder="Nama bahan / part"
                        value={m.name}
                        onChange={(e) => handleMaterialChange(idx, 'name', e.target.value)}
                        className="col-span-5 bg-white border border-slate-200 rounded-lg p-1.5 text-xs text-slate-800"
                        required
                      />
                      <input
                        type="number"
                        placeholder="Qty"
                        min="0.1"
                        step="any"
                        value={m.quantity}
                        onChange={(e) =>
                          handleMaterialChange(idx, 'quantity', parseFloat(e.target.value) || 0)
                        }
                        className="col-span-2 font-mono bg-white border border-slate-200 rounded-lg p-1.5 text-xs text-slate-800"
                        required
                      />
                      <input
                        type="text"
                        placeholder="Satuan"
                        value={m.unit}
                        onChange={(e) => handleMaterialChange(idx, 'unit', e.target.value)}
                        className="col-span-2 bg-white border border-slate-200 rounded-lg p-1.5 text-xs text-slate-800"
                        required
                      />
                      <input
                        type="number"
                        placeholder="Harga/Unit"
                        min="0"
                        value={m.unitCost}
                        onChange={(e) =>
                          handleMaterialChange(idx, 'unitCost', parseFloat(e.target.value) || 0)
                        }
                        className="col-span-2 font-mono tabular-nums bg-white border border-slate-200 rounded-lg p-1.5 text-xs text-slate-800"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveMaterialRow(idx)}
                        className="col-span-1 text-slate-400 hover:text-red-500 flex justify-center"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Labor, Packaging, Overhead */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Upah Tenaga Kerja
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={directLaborCost}
                    onChange={(e) => setDirectLaborCost(parseFloat(e.target.value) || 0)}
                    className="w-full font-mono tabular-nums bg-white border border-slate-200 rounded-lg p-2 text-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Biaya Kemasan</label>
                  <input
                    type="number"
                    min="0"
                    value={packagingCost}
                    onChange={(e) => setPackagingCost(parseFloat(e.target.value) || 0)}
                    className="w-full font-mono tabular-nums bg-white border border-slate-200 rounded-lg p-2 text-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Overhead Produksi
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={overheadCost}
                    onChange={(e) => setOverheadCost(parseFloat(e.target.value) || 0)}
                    className="w-full font-mono tabular-nums bg-white border border-slate-200 rounded-lg p-2 text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Harga Jual Produk (IDR) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  value={sellingPrice}
                  onChange={(e) => setSellingPrice(parseFloat(e.target.value) || 0)}
                  className="w-full font-mono tabular-nums bg-white border border-slate-200 rounded-lg p-2 text-slate-800 font-bold"
                  required
                />
              </div>

              {/* Realtime Result Summary Banner */}
              <div className="p-3 bg-violet-50 rounded-xl border border-violet-100 flex items-center justify-between font-mono tabular-nums">
                <div>
                  <span className="text-slate-500 text-[11px]">HPP per Unit:</span>
                  <div className="font-bold text-slate-900 text-sm">
                    Rp {hppPerUnit.toLocaleString('id-ID')}
                  </div>
                </div>
                <div>
                  <span className="text-slate-500 text-[11px]">Laba Kotor:</span>
                  <div className="font-bold text-violet-900 text-sm">
                    Rp {grossProfitPerUnit.toLocaleString('id-ID')}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-slate-500 text-[11px]">Gross Margin:</span>
                  <div className="font-bold text-emerald-600 text-sm">
                    {grossMarginPercent}%
                  </div>
                </div>
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
                  Simpan Formula HPP
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
