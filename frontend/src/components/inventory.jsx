import React, { useState, useEffect } from 'react';
import apiClient from '../api/client';
import { Boxes, TrendingUp, TrendingDown, Package, Plus, Trash2, Edit2 } from 'lucide-react';
import Swal from 'sweetalert2';

const InventoryPage = () => {
  const [products, setProducts] = useState([]);
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);

  // Estados para modales
  const [showProductModal, setShowProductModal] = useState(false);
  const [showMovementModal, setShowMovementModal] = useState(false);

  // Estados para saber si estamos editando
  const [isEditingProduct, setIsEditingProduct] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState(null);

  // Estados de formularios
  const [productForm, setProductForm] = useState({ nombre: '', categoria: 'Alimento', unidad_medida: 'Kg', precio_actual: 0 });
  const [movementForm, setMovementForm] = useState({ producto: '', tipo_movimiento: 'Entrada', cantidad: '', motivo: 'Compra', costo_unitario: '', observaciones: '' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
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

  // --- LÓGICA DE PRODUCTOS (CREAR Y EDITAR) ---
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
        await apiClient.put(`/products/${selectedProductId}/`, productForm);
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
      Swal.fire('Error', 'Could not save product', 'error');
    }
  };

  const handleDeleteProduct = async (id) => {
    const result = await Swal.fire({
      title: 'Delete Product?',
      text: "This will remove the product from the catalog. You cannot undo this.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#000000',
      confirmButtonText: 'Yes, delete it'
    });

    if (result.isConfirmed) {
      try {
        await apiClient.delete(`/products/${id}/`);
        Swal.fire('Deleted!', 'Product has been removed.', 'success');
        fetchData();
      } catch (err) {
        Swal.fire('Error', 'Cannot delete this product because it has associated inventory movements.', 'error');
      }
    }
  };

  // --- LÓGICA DE MOVIMIENTOS ---
  const handleCreateMovement = async (e) => {
    e.preventDefault();
    try {
      await apiClient.post('/inventory-movements/', movementForm);
      Swal.fire({ title: 'Success', text: 'Movement recorded', icon: 'success', timer: 1500, showConfirmButton: false });
      setShowMovementModal(false);
      setMovementForm({ producto: '', tipo_movimiento: 'Entrada', cantidad: '', motivo: 'Compra', costo_unitario: '', observaciones: '' });
      fetchData();
    } catch (err) {
      Swal.fire('Error', 'Could not record movement', 'error');
    }
  };

  const handleDeleteMovement = async (id) => {
    const result = await Swal.fire({
      title: 'Delete record?',
      text: "You are about to delete this movement.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#000000',
      confirmButtonText: 'Yes, delete it'
    });

    if (result.isConfirmed) {
      try {
        await apiClient.delete(`/inventory-movements/${id}/`);
        Swal.fire('Deleted!', 'Record removed.', 'success');
        fetchData();
      } catch (err) {
        Swal.fire('Error', 'Could not delete record.', 'error');
      }
    }
  };

  return (
    <div className="flex-1 bg-[#F4F6F8] min-h-screen p-8 mt-[0px]">
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-[#E0E0E0]">
        <h1 className="text-3xl font-bold text-[#11131F] flex items-center gap-3">
          <Boxes size={32} /> Warehouse & Inventory
        </h1>
        {/* BOTÓN TOP RIGHT - Agregar Producto Nuevo */}
        <button 
          onClick={handleOpenNewProduct}
          className="bg-black text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-zinc-800 transition shadow-md"
        >
          <Plus size={18} /> Add New Product
        </button>
      </div>

      {/* Cards de Stock Actual con Opciones de Edición/Eliminación */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {products.map(product => (
          <div key={product.id} className="bg-white p-6 rounded-3xl shadow-sm border border-[#EBEBEB] flex flex-col justify-between group">
            <div>
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-bold text-[#8C92AC] uppercase tracking-wider">{product.nombre}</p>
                  <span className="text-[9px] bg-gray-100 text-gray-500 px-2 py-1 rounded-md mt-1 inline-block">{product.categoria}</span>
                </div>
                {/* Botones de acción ocultos que aparecen al hacer hover */}
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => handleEditProductClick(product)} className="text-blue-400 hover:text-blue-600 transition bg-blue-50 p-1.5 rounded-lg">
                    <Edit2 size={14} />
                  </button>
                  <button onClick={() => handleDeleteProduct(product.id)} className="text-red-400 hover:text-red-600 transition bg-red-50 p-1.5 rounded-lg">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              <h3 className="text-2xl font-black mt-1">{product.stock} <span className="text-sm font-medium text-gray-500">{product.unidad_medida}</span></h3>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-50 flex justify-between items-center text-[10px] font-bold text-[#8C92AC]">
              <span>VALOR ACTUAL:</span>
              <span className="text-black">C$ {product.precio_actual}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Tabla de Movimientos (Kardex) */}
      <div className="bg-white rounded-3xl shadow-sm border border-[#EBEBEB] overflow-hidden">
        <div className="p-6 border-b border-[#EBEBEB] flex justify-between items-center">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Package size={22} className="text-[#8C92AC]" /> Movement History (Kardex)
          </h2>
          <button 
            onClick={() => setShowMovementModal(true)}
            className="flex items-center gap-2 bg-[#F4F6F8] text-black border border-[#E0E0E0] px-4 py-2 rounded-xl text-sm font-bold hover:bg-[#EBEBEB] transition"
          >
            <Plus size={16} /> Manual Adjustment / Restock
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-[#F4F6F8] text-[#8C92AC] text-[10px] uppercase font-black tracking-widest">
              <tr>
                <th className="p-4">Date</th>
                <th className="p-4">Product</th>
                <th className="p-4">Type</th>
                <th className="p-4">Quantity</th>
                <th className="p-4">Reason</th>
                <th className="p-4 text-right">Unit Cost</th>
                <th className="p-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EBEBEB]">
              {movements.map((mov) => (
                <tr key={mov.id} className="hover:bg-[#F9FAFB] transition-colors">
                  <td className="p-4 text-xs font-medium text-[#8C92AC]">
                    {new Date(mov.fecha_movimiento).toLocaleDateString()}
                  </td>
                  <td className="p-4">
                    <p className="text-sm font-bold text-black">{mov.producto_nombre}</p>
                  </td>
                  <td className="p-4">
                    <div className={`flex items-center gap-1 font-bold text-[10px] uppercase px-2 py-1 rounded-lg w-fit border ${
                      mov.tipo_movimiento === 'Entrada' ? 'bg-green-50 text-green-600 border-green-200' : 'bg-red-50 text-red-600 border-red-200'
                    }`}>
                      {mov.tipo_movimiento === 'Entrada' ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                      {mov.tipo_movimiento}
                    </div>
                  </td>
                  <td className={`p-4 font-black text-sm ${mov.tipo_movimiento === 'Entrada' ? 'text-green-600' : 'text-red-600'}`}>
                    {mov.tipo_movimiento === 'Entrada' ? '+' : '-'}{mov.cantidad}
                  </td>
                  <td className="p-4">
                    <span className="text-xs font-semibold text-[#8C92AC] bg-gray-100 px-2 py-1 rounded-md">{mov.motivo}</span>
                  </td>
                  <td className="p-4 text-right font-bold text-sm">
                    {mov.costo_unitario ? `C$ ${mov.costo_unitario}` : '--'}
                  </td>
                  <td className="p-4 text-center">
                    <button onClick={() => handleDeleteMovement(mov.id)} className="text-red-400 hover:text-red-600 transition p-1">
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {movements.length === 0 && (
            <div className="p-10 text-center text-[#8C92AC] italic font-medium">No inventory movements recorded.</div>
          )}
        </div>
      </div>

      {/* --- MODAL 1: PRODUCTO (CREAR / EDITAR) --- */}
      {showProductModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-8 shadow-2xl">
            <h2 className="text-2xl font-black mb-6">{isEditingProduct ? 'Edit Product' : 'Create Product Catalog'}</h2>
            <form onSubmit={handleSaveProduct} className="space-y-4">
              <div>
                <label className="text-[10px] font-black text-[#8C92AC] uppercase">Product Name</label>
                <input required className="w-full p-3 bg-[#F4F6F8] rounded-xl border border-[#E0E0E0] focus:ring-1 focus:ring-black outline-none" 
                  value={productForm.nombre}
                  onChange={e => setProductForm({...productForm, nombre: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-[#8C92AC] uppercase">Category</label>
                  <select className="w-full p-3 bg-[#F4F6F8] rounded-xl border border-[#E0E0E0] outline-none"
                    value={productForm.categoria}
                    onChange={e => setProductForm({...productForm, categoria: e.target.value})}>
                    <option value="Alimento">Alimento / Pienso</option>
                    <option value="Salud">Salud / Vacuna</option>
                    <option value="Venta">Venta / Producto</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black text-[#8C92AC] uppercase">Unit (Kg, Dosis, L)</label>
                  <input required className="w-full p-3 bg-[#F4F6F8] rounded-xl border border-[#E0E0E0] outline-none"
                    value={productForm.unidad_medida}
                    onChange={e => setProductForm({...productForm, unidad_medida: e.target.value})} />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-black text-[#8C92AC] uppercase">Current Value / Price (C$)</label>
                <input type="number" step="0.01" className="w-full p-3 bg-[#F4F6F8] rounded-xl border border-[#E0E0E0] outline-none"
                  value={productForm.precio_actual}
                  onChange={e => setProductForm({...productForm, precio_actual: e.target.value})} />
              </div>
              <div className="flex gap-3 mt-6 pt-4">
                <button type="button" onClick={() => setShowProductModal(false)} className="flex-1 py-3 font-bold text-[#8C92AC] hover:text-black transition">Cancel</button>
                <button type="submit" className="flex-1 py-3 bg-black text-white rounded-xl font-bold shadow-md hover:bg-zinc-800 transition">
                  {isEditingProduct ? 'Update Product' : 'Save Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL 2: NUEVO MOVIMIENTO (RESTOCK / AJUSTE) --- */}
      {showMovementModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-8 shadow-2xl">
            <h2 className="text-2xl font-black mb-6">Record Movement</h2>
            <form onSubmit={handleCreateMovement} className="space-y-4">
              <div>
                <label className="text-[10px] font-black text-[#8C92AC] uppercase">Select Product</label>
                <select required className="w-full p-3 bg-[#F4F6F8] rounded-xl border border-[#E0E0E0] outline-none"
                  value={movementForm.producto}
                  onChange={e => setMovementForm({...movementForm, producto: e.target.value})}>
                  <option value="">-- Choose --</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.nombre} ({p.stock} {p.unidad_medida} available)</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-[#8C92AC] uppercase">Type</label>
                  <select className="w-full p-3 bg-[#F4F6F8] rounded-xl border border-[#E0E0E0] outline-none"
                    value={movementForm.tipo_movimiento}
                    onChange={e => setMovementForm({...movementForm, tipo_movimiento: e.target.value})}>
                    <option value="Entrada">Entrada (+)</option>
                    <option value="Salida">Salida (-)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black text-[#8C92AC] uppercase">Quantity</label>
                  <input type="number" step="0.01" required className="w-full p-3 bg-[#F4F6F8] rounded-xl border border-[#E0E0E0] outline-none"
                    value={movementForm.cantidad}
                    onChange={e => setMovementForm({...movementForm, cantidad: e.target.value})} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-[#8C92AC] uppercase">Reason</label>
                  <input placeholder="e.g. Compra Insumos" required className="w-full p-3 bg-[#F4F6F8] rounded-xl border border-[#E0E0E0] outline-none"
                    value={movementForm.motivo}
                    onChange={e => setMovementForm({...movementForm, motivo: e.target.value})} />
                </div>
                <div>
                  <label className="text-[10px] font-black text-[#8C92AC] uppercase">Total Cost (Optional)</label>
                  <input type="number" step="0.01" placeholder="C$" className="w-full p-3 bg-[#F4F6F8] rounded-xl border border-[#E0E0E0] outline-none"
                    value={movementForm.costo_unitario}
                    onChange={e => setMovementForm({...movementForm, costo_unitario: e.target.value})} />
                </div>
              </div>
              <div className="flex gap-3 mt-6 pt-4">
                <button type="button" onClick={() => setShowMovementModal(false)} className="flex-1 py-3 font-bold text-[#8C92AC] hover:text-black transition">Cancel</button>
                <button type="submit" className="flex-1 py-3 bg-black text-white rounded-xl font-bold shadow-md hover:bg-zinc-800 transition">Save Movement</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryPage;