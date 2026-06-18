import React, { useState, useEffect } from 'react';
import apiClient from '../api/client';
import { Boxes, TrendingUp, TrendingDown, Package, Plus, Trash2, Edit2, Search } from 'lucide-react';
import Swal from 'sweetalert2';

const InventoryPage = () => {
  const [products, setProducts] = useState([]);
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showProductModal, setShowProductModal] = useState(false);
  const [showMovementModal, setShowMovementModal] = useState(false);
  const [isEditingProduct, setIsEditingProduct] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState(null);
  
  // 🔥 SOLUCIÓN AL BUG DE ZONA HORARIA
  const getLocalDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [productForm, setProductForm] = useState({ 
    nombre: '', categoria: 'Alimento', unidad_medida: 'Kg', precio_actual: 0 
  });
  
  const [movementForm, setMovementForm] = useState({ 
    producto: '', tipo_movimiento: 'Entrada', cantidad: '', 
    motivo: 'Compra', costo_unitario: '', observaciones: '', 
    fecha_movimiento: getLocalDate() // 🔥 Fecha local por defecto
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Asumiendo que tu backend ya filtra los estado=1
      const [prodRes, movRes] = await Promise.all([
        apiClient.get('/products/'),
        apiClient.get('/inventory-movements/')
      ]);
      setProducts(prodRes.data);
      setMovements(movRes.data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const handleOpenNewProduct = () => {
    setIsEditingProduct(false);
    setSelectedProductId(null);
    setProductForm({ nombre: '', categoria: 'Alimento', unidad_medida: 'Kg', precio_actual: 0 });
    setShowProductModal(true);
  };

  const handleEditProductClick = (product) => {
    setIsEditingProduct(true);
    setSelectedProductId(product.id);
    setProductForm({ 
      nombre: product.nombre, 
      categoria: product.categoria, 
      unidad_medida: product.unidad_medida, 
      precio_actual: product.precio_actual 
    });
    setShowProductModal(true);
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    try {
      if (isEditingProduct) {
        await apiClient.patch(`/products/${selectedProductId}/`, productForm);
        Swal.fire({ title: 'Success', text: 'Product updated successfully', icon: 'success', timer: 1500, showConfirmButton: false });
      } else {
        await apiClient.post('/products/', { ...productForm, stock: 0 }); 
        Swal.fire({ title: 'Success', text: 'Product created successfully', icon: 'success', timer: 1500, showConfirmButton: false });
      }
      setShowProductModal(false);
      setProductForm({ nombre: '', categoria: 'Alimento', unidad_medida: 'Kg', precio_actual: 0 });
      setIsEditingProduct(false);
      setSelectedProductId(null);
      fetchData();
    } catch (err) {
      Swal.fire({ title: 'Error', text: 'Could not save product', icon: 'error', confirmButtonColor: '#2563EB' });
    }
  };

  const handleDeleteProduct = async (id) => {
    const result = await Swal.fire({
      title: 'Archive Product?',
      text: "This will hide the product from the catalog, but keep its history in the ledger.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#DC2626', 
      cancelButtonColor: '#6B7280',  
      confirmButtonText: 'Yes, archive it'
    });

    if (result.isConfirmed) {
      try {
      
        await apiClient.patch(`/products/${id}/`, { estado: 0 });
        Swal.fire('Archived!', 'Product has been removed from view.', 'success');
        fetchData();
      } catch (err) {
        Swal.fire({ title: 'Error', text: 'Cannot archive this product.', icon: 'error', confirmButtonColor: '#2563EB' });
      }
    }
  };

  const handleCreateMovement = async (e) => {
    e.preventDefault();
    try {
      await apiClient.post('/inventory-movements/', movementForm);
      Swal.fire({ title: 'Success', text: 'Movement recorded successfully', icon: 'success', timer: 1500, showConfirmButton: false });
      setShowMovementModal(false);
      setMovementForm({ producto: '', tipo_movimiento: 'Entrada', cantidad: '', motivo: 'Compra', costo_unitario: '', observaciones: '', fecha_movimiento: getLocalDate() });
      fetchData();
    } catch (err) {
      Swal.fire({ title: 'Error', text: 'Could not record movement', icon: 'error', confirmButtonColor: '#2563EB' });
    }
  };

  const handleDeleteMovement = async (id) => {
    const result = await Swal.fire({
      title: 'Archive record?',
      text: "You are about to hide this movement from the ledger.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#DC2626', 
      cancelButtonColor: '#6B7280',
      confirmButtonText: 'Yes, archive it'
    });

    if (result.isConfirmed) {
      try {
      
        await apiClient.patch(`/inventory-movements/${id}/`, { estado: 0 });
        Swal.fire('Archived!', 'Record hidden.', 'success');
        fetchData();
      } catch (err) {
        Swal.fire({ title: 'Error', text: 'Could not archive record.', icon: 'error', confirmButtonColor: '#2563EB' });
      }
    }
  };

  const filteredMovements = movements
    .filter((mov) => {
      const q = searchTerm.trim().toLowerCase();
      if (!q) return true;
      
      const prodName = (mov.producto_nombre || '').toLowerCase();
      const type = (mov.tipo_movimiento || '').toLowerCase();
      const dateStr = new Date(mov.fecha_movimiento).toLocaleDateString().toLowerCase(); 
      
      return prodName.includes(q) || type.includes(q) || dateStr.includes(q);
    })
    .sort((a, b) => new Date(b.fecha_movimiento) - new Date(a.fecha_movimiento))
    .slice(0, 7); 

  const translateCategory = (cat) => {
    if (cat === 'Alimento') return 'Feed / Food';
    if (cat === 'Salud') return 'Health / Vaccine';
    if (cat === 'Venta') return 'Sale / Product';
    return cat;
  };

  if (loading) return <div className="flex-1 p-8 bg-[#F5F4F0] text-green-900 font-bold animate-pulse mt-20 text-center">Loading Inventory...</div>;

  return (
    <div className="flex-1 bg-[#F5F4F0] min-h-screen p-4 text-stone-800">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4 border-b border-stone-200 pb-4">
        <div>
          <h1 className="text-3xl font-black text-green-900 flex items-center gap-3">
          Warehouse & Inventory
          </h1>
          <p className="text-sm text-amber-900 font-semibold mt-1"></p>
        </div>
        
        <button 
          onClick={handleOpenNewProduct}
          className="bg-blue-600 text-white px-6 py-3 rounded-xl text-sm font-black flex items-center justify-center gap-2 hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/30"
        >
          <Plus size={18} strokeWidth={2.5} /> Add New Product
        </button>
      </div>

      {/* Cards de Stock Actual */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {products.map(product => (
          <div key={product.id} className="bg-white p-6 rounded-3xl shadow-lg shadow-stone-500/5 border border-stone-200 flex flex-col justify-between group relative overflow-hidden">
            <div>
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-black text-green-900 uppercase tracking-widest">{product.nombre}</p>
                  <span className="text-[10px] font-bold bg-stone-100 text-stone-600 px-2.5 py-0.5 rounded-full mt-1.5 inline-block uppercase tracking-wider">
                    {translateCategory(product.categoria)}
                  </span>
                </div>
                {/* Botones de acción ocultos que aparecen al hacer hover */}
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => handleEditProductClick(product)} className="text-blue-600 hover:text-white transition bg-blue-50 hover:bg-blue-600 p-2 rounded-xl shadow-sm">
                    <Edit2 size={14} strokeWidth={2.5} />
                  </button>
                  <button onClick={() => handleDeleteProduct(product.id)} className="text-red-600 hover:text-white transition bg-red-50 hover:bg-red-600 p-2 rounded-xl shadow-sm">
                    <Trash2 size={14} strokeWidth={2.5} />
                  </button>
                </div>
              </div>
              <h3 className="text-3xl font-black text-stone-800 mt-3">{product.stock} <span className="text-sm font-bold text-stone-400">{product.unidad_medida}</span></h3>
            </div>
            <div className="mt-5 pt-4 border-t border-stone-100 flex justify-between items-center text-[10px] font-black text-amber-900 uppercase tracking-widest">
              <span>Current Value:</span>
              <span className="text-green-800 text-sm">C$ {product.precio_actual}</span>
            </div>
          </div>
        ))}
        {products.length === 0 && (
          <div className="col-span-full p-8 text-center text-stone-500 font-semibold bg-white rounded-3xl border border-stone-200 shadow-sm">
            No products in the catalog yet. Click "Add New Product" to start.
          </div>
        )}
      </div>

      {/* Tabla de Movimientos (Kardex) */}
      <div className="bg-white rounded-3xl shadow-lg shadow-stone-500/5 border border-stone-200 overflow-hidden">
        <div className="p-6 border-b border-stone-100 bg-[#FAF8F5] flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h2 className="text-xl font-black flex items-center gap-2 text-green-900">
            <Package size={22} className="text-amber-800" /> Movement History 
          </h2>
          
          <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
            {/* BUSCADOR DE KARDEX */}
            <div className="relative w-full md:w-72">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-stone-400" size={16} />
              <input
                type="text"
                placeholder="Search by product, type..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-white rounded-xl text-sm font-semibold text-stone-800 border border-stone-200 focus:border-green-800 focus:ring-4 focus:ring-green-800/10 outline-none transition-all"
              />
            </div>

            <button 
              onClick={() => setShowMovementModal(true)}
              className="flex justify-center items-center gap-2 bg-stone-100 text-stone-700 border border-stone-200 px-5 py-2.5 rounded-xl text-sm font-black hover:bg-stone-200 transition whitespace-nowrap w-full md:w-auto"
            >
              <Plus size={16} strokeWidth={2.5} /> Manual Adjustment
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-[#FAF8F5] text-amber-900 text-[10px] uppercase font-black tracking-widest border-b border-stone-200">
              <tr>
                <th className="p-5 pl-6">Date</th>
                <th className="p-5">Product</th>
                <th className="p-5">Type</th>
                <th className="p-5">Quantity</th>
                <th className="p-5">Reason</th>
                <th className="p-5 text-right">Unit Cost</th>
                <th className="p-5 pr-6 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredMovements.length > 0 ? (
                filteredMovements.map((mov) => (
                  <tr key={mov.id} className="hover:bg-stone-50 transition-colors">
                    <td className="p-5 pl-6 text-xs font-bold text-stone-500">
                      {new Date(mov.fecha_movimiento).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="p-5">
                      <p className="text-sm font-black text-green-900">{mov.producto_nombre}</p>
                    </td>
                    <td className="p-5">
                      <div className={`flex items-center gap-1.5 font-black text-[9px] uppercase tracking-widest px-2.5 py-1 rounded-lg w-fit border ${
                        mov.tipo_movimiento === 'Entrada' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-600 border-red-200'
                      }`}>
                        {mov.tipo_movimiento === 'Entrada' ? <TrendingUp size={12} strokeWidth={3} /> : <TrendingDown size={12} strokeWidth={3} />}
                        {mov.tipo_movimiento === 'Entrada' ? 'Inbound' : 'Outbound'}
                      </div>
                    </td>
                    <td className={`p-5 font-black text-sm ${mov.tipo_movimiento === 'Entrada' ? 'text-green-700' : 'text-red-600'}`}>
                      {mov.tipo_movimiento === 'Entrada' ? '+' : '-'}{mov.cantidad}
                    </td>
                    <td className="p-5">
                      <span className="text-[10px] font-bold text-stone-600 bg-stone-100 px-2.5 py-1 rounded-md uppercase tracking-wider">{mov.motivo}</span>
                    </td>
                    <td className="p-5 text-right font-bold text-sm text-stone-800">
                      {mov.costo_unitario ? `C$ ${mov.costo_unitario}` : '--'}
                    </td>
                    <td className="p-5 pr-6 text-center">
                      <button onClick={() => handleDeleteMovement(mov.id)} className="text-red-500 hover:text-white bg-red-50 hover:bg-red-600 transition p-2 rounded-xl shadow-sm flex items-center justify-center mx-auto">
                        <Trash2 size={14} strokeWidth={2.5} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="p-12 text-center">
                     <span className="text-4xl mb-4 block">📦</span>
                     <h3 className="text-lg font-black text-green-900">No movements found</h3>
                     <p className="text-sm font-semibold text-stone-500 mt-1">There are no inventory records matching your search.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- MODAL 1: PRODUCTO (CREAR / EDITAR) --- */}
      {showProductModal && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-opacity">
          <div className="bg-white w-full max-w-md rounded-3xl p-8 shadow-2xl border border-stone-200">
            <h2 className="text-2xl font-black text-green-900 mb-6 border-b border-stone-100 pb-4">
              {isEditingProduct ? 'Edit Product' : 'Add to Catalog'}
            </h2>
            <form onSubmit={handleSaveProduct} className="space-y-5">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-amber-900 mb-1.5 ml-1">Product Name</label>
                <input required className="w-full p-3.5 bg-stone-50 rounded-xl font-bold text-stone-800 border border-stone-200 focus:border-green-800 focus:ring-4 focus:ring-green-800/10 outline-none transition-all" 
                  value={productForm.nombre}
                  placeholder="e.g. Concentrado Premium"
                  onChange={e => setProductForm({...productForm, nombre: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-amber-900 mb-1.5 ml-1">Category</label>
                  <select className="w-full p-3.5 bg-stone-50 rounded-xl font-bold text-stone-800 border border-stone-200 focus:border-green-800 focus:ring-4 focus:ring-green-800/10 outline-none transition-all"
                    value={productForm.categoria}
                    onChange={e => setProductForm({...productForm, categoria: e.target.value})}>
                    <option value="Alimento">Feed / Food</option>
                    <option value="Salud">Health / Vaccine</option>
                    <option value="Venta">Sale / Product</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-amber-900 mb-1.5 ml-1">Unit</label>
                  <input required className="w-full p-3.5 bg-stone-50 rounded-xl font-bold text-stone-800 border border-stone-200 focus:border-green-800 focus:ring-4 focus:ring-green-800/10 outline-none transition-all"
                    value={productForm.unidad_medida}
                    placeholder="Kg, L, Dose"
                    onChange={e => setProductForm({...productForm, unidad_medida: e.target.value})} />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-amber-900 mb-1.5 ml-1">Current Value / Price (C$)</label>
                <input type="number" step="0.01" className="w-full p-3.5 bg-stone-50 rounded-xl font-black text-green-900 text-lg border border-stone-200 focus:border-green-800 focus:ring-4 focus:ring-green-800/10 outline-none transition-all"
                  value={productForm.precio_actual}
                  onChange={e => setProductForm({...productForm, precio_actual: e.target.value})} />
              </div>
              <div className="flex gap-4 mt-8 border-t border-stone-100 pt-6">
                <button type="button" onClick={() => setShowProductModal(false)} className="flex-1 py-3.5 bg-stone-100 font-black text-stone-600 rounded-xl hover:bg-stone-200 transition-colors">
                  Cancel
                </button>
                <button type="submit" className="flex-1 py-3.5 bg-blue-600 text-white rounded-xl font-black shadow-lg shadow-blue-600/30 hover:bg-blue-700 transition-all">
                  {isEditingProduct ? 'Update Product' : 'Save Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL 2: NUEVO MOVIMIENTO (RESTOCK / AJUSTE) --- */}
      {showMovementModal && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-opacity">
          <div className="bg-white w-full max-w-md rounded-3xl p-8 shadow-2xl border border-stone-200">
            <h2 className="text-2xl font-black text-green-900 mb-6 border-b border-stone-100 pb-4">Record Movement</h2>
            <form onSubmit={handleCreateMovement} className="space-y-5">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-amber-900 mb-1.5 ml-1">Select Product</label>
                <select required className="w-full p-3.5 bg-stone-50 rounded-xl font-bold text-stone-800 border border-stone-200 focus:border-green-800 focus:ring-4 focus:ring-green-800/10 outline-none transition-all"
                  value={movementForm.producto}
                  onChange={e => setMovementForm({...movementForm, producto: e.target.value})}>
                  <option value="">-- Choose Product --</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.nombre} ({p.stock} {p.unidad_medida} available)</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-amber-900 mb-1.5 ml-1">Type</label>
                  <select className="w-full p-3.5 bg-stone-50 rounded-xl font-bold text-stone-800 border border-stone-200 focus:border-green-800 focus:ring-4 focus:ring-green-800/10 outline-none transition-all"
                    value={movementForm.tipo_movimiento}
                    onChange={e => setMovementForm({...movementForm, tipo_movimiento: e.target.value})}>
                    <option value="Entrada">Inbound (+)</option>
                    <option value="Salida">Outbound (-)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-amber-900 mb-1.5 ml-1">Quantity</label>
                  <input type="number" step="0.01" required className="w-full p-3.5 bg-stone-50 rounded-xl font-bold text-stone-800 border border-stone-200 focus:border-green-800 focus:ring-4 focus:ring-green-800/10 outline-none transition-all"
                    value={movementForm.cantidad}
                    placeholder="0.00"
                    onChange={e => setMovementForm({...movementForm, cantidad: e.target.value})} />
                </div>
              </div>

              {/* 🔥 NUEVO: Renglón para Motivo y Fecha */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-amber-900 mb-1.5 ml-1">Reason</label>
                  <input placeholder="e.g. Restock" required className="w-full p-3.5 bg-stone-50 rounded-xl font-bold text-stone-800 border border-stone-200 focus:border-green-800 focus:ring-4 focus:ring-green-800/10 outline-none transition-all"
                    value={movementForm.motivo}
                    onChange={e => setMovementForm({...movementForm, motivo: e.target.value})} />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-amber-900 mb-1.5 ml-1">Date</label>
                  <input type="date" required className="w-full p-3.5 bg-stone-50 rounded-xl font-bold text-stone-800 border border-stone-200 focus:border-green-800 focus:ring-4 focus:ring-green-800/10 outline-none transition-all"
                    value={movementForm.fecha_movimiento}
                    onChange={e => setMovementForm({...movementForm, fecha_movimiento: e.target.value})} />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-amber-900 mb-1.5 ml-1">Total Cost (Opt)</label>
                <input type="number" step="0.01" placeholder="C$" className="w-full p-3.5 bg-stone-50 rounded-xl font-bold text-stone-800 border border-stone-200 focus:border-green-800 focus:ring-4 focus:ring-green-800/10 outline-none transition-all"
                  value={movementForm.costo_unitario}
                  onChange={e => setMovementForm({...movementForm, costo_unitario: e.target.value})} />
              </div>

              <div className="flex gap-4 mt-8 border-t border-stone-100 pt-6">
                <button type="button" onClick={() => setShowMovementModal(false)} className="flex-1 py-3.5 bg-stone-100 font-black text-stone-600 rounded-xl hover:bg-stone-200 transition-colors">
                  Cancel
                </button>
                <button type="submit" className="flex-1 py-3.5 bg-blue-600 text-white rounded-xl font-black shadow-lg shadow-blue-600/30 hover:bg-blue-700 transition-all">
                  Save Movement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryPage;