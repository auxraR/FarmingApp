import React, { useState, useEffect } from 'react';
import apiClient from '../api/client';
import Swal from 'sweetalert2';
import { ShoppingCart, Plus, Trash2, User, Package, Receipt } from 'lucide-react';

const SalesPage = () => {
  const [clients, setClients] = useState([]);
  const [products, setProducts] = useState([]);
  const [livestock, setLivestock] = useState([]);
  
  const [selectedClient, setSelectedClient] = useState('');
  const [cart, setCart] = useState([]);
  
  const [itemType, setItemType] = useState('Producto'); 
  const [selectedItem, setSelectedItem] = useState('');
  const [quantity, setQuantity] = useState('');
  const [priceOverride, setPriceOverride] = useState(''); 

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const [clientsRes, productsRes, livestockRes] = await Promise.all([
        apiClient.get('/clients/'), 
        apiClient.get('/products/'), 
        apiClient.get('/livestock/?estado=1') 
      ]);
      setClients(clientsRes.data);
      const ProductsToSend = productsRes.data.filter(p => p.categoria === 'Venta');
      setProducts(ProductsToSend); 
      setLivestock(livestockRes.data);
    } catch (err) {
      console.error("Error loading sales data", err);
    }
  };

  const handleAddToCart = () => {
    const effectiveQuantity = itemType === 'Ganado' ? 1 : parseFloat(quantity);
    if (!selectedItem || !effectiveQuantity || effectiveQuantity <= 0) {
      Swal.fire({ icon: 'warning', title: 'Oops...', text: 'Please select an item and a valid quantity.', confirmButtonColor: '#2563EB' });
      return;
    }

    const overrideNum = priceOverride === '' ? null : Number(priceOverride);
    if (overrideNum !== null && (!Number.isFinite(overrideNum) || overrideNum < 0)) {
      Swal.fire({ icon: 'error', title: 'Invalid Price', text: 'Unit price cannot be negative.', confirmButtonColor: '#2563EB' });
      return;
    }

    let itemDetails = {};
    let finalPrice = parseFloat(priceOverride);

    if (itemType === 'Producto') {
      const prod = products.find(p => p.id.toString() === selectedItem);
      
      const cantidadEnCarrito = cart
        .filter(item => item.type === 'Producto' && item.itemId === prod.id)
        .reduce((sum, item) => sum + item.quantity, 0);

      const cantidadTotalA_Vender = effectiveQuantity + cantidadEnCarrito;
      
      if (prod && cantidadTotalA_Vender > prod.stock) {
        Swal.fire({
          title: 'Stock Exceeded!',
          text: cantidadEnCarrito > 0 
            ? `You already have ${cantidadEnCarrito} in the cart. Adding ${effectiveQuantity} more exceeds the ${prod.stock} ${prod.unidad_medida} available.`
            : `Cannot sell ${effectiveQuantity}. Only ${prod.stock} ${prod.unidad_medida} available.`,
          icon: 'error',
          confirmButtonColor: '#2563EB'
        });
        return; 
      }

      if (!finalPrice) finalPrice = parseFloat(prod.precio_actual);
      itemDetails = {
        id: prod.id,
        name: prod.nombre,
        unit: prod.unidad_medida
      };
    } else {
      const animal = livestock.find(a => a.id.toString() === selectedItem);
      if (!finalPrice) {
        Swal.fire({ icon: 'warning', title: 'Missing Price', text: 'Please enter the agreed sale price for this animal.', confirmButtonColor: '#2563EB' });
        return;
      }
      itemDetails = {
        id: animal.id,
        name: animal.nombre || `Animal #${animal.id} (${animal.raza})`,
        unit: 'Head'
      };
    }

    if (!Number.isFinite(finalPrice) || finalPrice < 0) {
      Swal.fire({ icon: 'error', title: 'Invalid Price', text: 'Unit price cannot be negative.', confirmButtonColor: '#2563EB' });
      return;
    }

    const subtotal = finalPrice * effectiveQuantity;

    const newItem = {
      cartId: Date.now(), 
      type: itemType,
      itemId: itemDetails.id,
      name: itemDetails.name,
      unit: itemDetails.unit,
      price: finalPrice,
      quantity: effectiveQuantity,
      subtotal: subtotal
    };

    setCart([...cart, newItem]);
    
    setSelectedItem('');
    setQuantity('');
    setPriceOverride('');
  };

  const removeFromCart = (cartId) => {
    setCart(cart.filter(item => item.cartId !== cartId));
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.subtotal, 0);

  const handleCheckout = async () => {
    if (!selectedClient) {
      Swal.fire({ icon: 'error', title: 'Missing Client', text: 'Please select a client for this sale.', confirmButtonColor: '#2563EB' });
      return;
    }
    if (cart.length === 0) {
      Swal.fire({ icon: 'error', title: 'Empty Cart', text: 'Add at least one item to the sale.', confirmButtonColor: '#2563EB' });
      return;
    }

    const salePayload = {
      client: selectedClient,
      total: cartTotal,
      detalles: cart.map(item => ({
        tipo_item: item.type,
        producto: item.type === 'Producto' ? item.itemId : null,
        ganado: item.type === 'Ganado' ? item.itemId : null,
        cantidad: item.quantity,
        subtotal: item.subtotal
      }))
    };

    try {
      await apiClient.post('/sales/', salePayload);
      Swal.fire({ title: 'Sale Completed!', text: 'The transaction has been recorded.', icon: 'success', timer: 2000, showConfirmButton: false });
      setCart([]);
      setSelectedClient('');
      fetchInitialData(); 
    } catch (err) {
      console.error(err);
      Swal.fire({ icon: 'error', title: 'Error', text: 'Could not complete the sale.', confirmButtonColor: '#2563EB' });
    }
  };

  return (
    <div className="flex-1 bg-[#F5F4F0] min-h-screen p-4 text-stone-800">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-black text-green-900 flex items-center gap-3">
            Point of Sale
          </h1>
          <p className="text-sm text-amber-900 font-semibold mt-1"></p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* LEFT COLUMN: FORM */}
        <div className="lg:w-2/3 space-y-6">
          
          {/* CLIENT SELECTOR */}
          <div className="bg-white p-6 rounded-3xl shadow-lg shadow-stone-500/5 border border-stone-200 relative">
            <h2 className="text-xl font-black text-green-900 flex items-center gap-2 mb-5">
              <User size={22} className="text-amber-800" /> 1. Select Client
            </h2>
            <select 
              value={selectedClient} 
              onChange={(e) => setSelectedClient(e.target.value)}
              className="w-full p-3.5 bg-stone-50 rounded-xl text-stone-800 font-semibold border border-stone-200 focus:ring-4 focus:ring-green-800/10 focus:border-green-800 outline-none transition-all"
            >
              <option value="">-- Choose a Client --</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>{c.nombre} {c.apellido}</option>
              ))}
            </select>
          </div>

          {/* ITEM SELECTOR */}
          <div className="bg-white p-6 rounded-3xl shadow-lg shadow-stone-500/5 border border-stone-200 relative">
            <h2 className="text-xl font-black text-green-900 flex items-center gap-2 mb-6">
              <Package size={22} className="text-amber-800" /> 2. Add Item to Cart
            </h2>
            
            <div className="flex gap-6 mb-6 bg-[#FAF8F5] p-4 rounded-2xl border border-stone-200">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input type="radio" name="itemType" checked={itemType === 'Producto'} onChange={() => {setItemType('Producto'); setSelectedItem('');}} className="accent-green-800 w-4 h-4" />
                <span className="text-sm font-black text-stone-800">Farm Product (Milk, Cheese)</span>
              </label>
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input type="radio" name="itemType" checked={itemType === 'Ganado'} onChange={() => {setItemType('Ganado'); setSelectedItem(''); setQuantity('1');}} className="accent-green-800 w-4 h-4" />
                <span className="text-sm font-black text-stone-800">Livestock (Animal)</span>
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
              <div className="md:col-span-2">
                <label className="block text-[10px] font-black uppercase tracking-widest text-amber-900 mb-1.5 ml-1">Select Item</label>
                <select value={selectedItem} onChange={(e) => setSelectedItem(e.target.value)} className="w-full p-3.5 bg-stone-50 rounded-xl text-stone-800 font-semibold border border-stone-200 focus:ring-4 focus:ring-green-800/10 focus:border-green-800 outline-none transition-all">
                  <option value="">-- Select from Inventory --</option>
                  {itemType === 'Producto' 
                    ? products.map(p => <option key={p.id} value={p.id}>{p.nombre} (Stock: {p.stock} {p.unidad_medida})</option>)
                    : livestock.map(l => <option key={l.id} value={l.id}>{l.nombre || `ID #${l.id}`} - {l.raza}</option>)
                  }
                </select>
              </div>
              
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-amber-900 mb-1.5 ml-1">Quantity</label>
                <input
                  type="number"
                  step={itemType === 'Producto' ? '0.01' : '1'}
                  min={itemType === 'Producto' ? undefined : 1}
                  value={itemType === 'Ganado' ? '1' : quantity}
                  disabled={itemType === 'Ganado'}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder={itemType === 'Producto' ? "Liters / Kg" : "1"}
                  className="w-full p-3.5 bg-stone-50 rounded-xl text-stone-800 font-bold border border-stone-200 focus:ring-4 focus:ring-green-800/10 focus:border-green-800 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-amber-900 mb-1.5 ml-1">Unit Price (C$)</label>
                <input type="number" step="0.01" min="0" value={priceOverride} onChange={(e) => setPriceOverride(e.target.value)} placeholder="Leave blank for default" className="w-full p-3.5 bg-stone-50 rounded-xl text-stone-800 font-bold border border-stone-200 focus:ring-4 focus:ring-green-800/10 focus:border-green-800 outline-none transition-all" />
              </div>
            </div>

            <button onClick={handleAddToCart} className="w-full mt-4 py-4 bg-blue-600 text-white font-black rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2">
              <Plus size={18} strokeWidth={2.5} /> Add to Order
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: CART & RECEIPT */}
        <div className="lg:w-1/3">
          <div className="bg-white p-6 rounded-3xl shadow-lg shadow-stone-500/5 border border-stone-200 flex flex-col h-full sticky top-24">
            <h2 className="text-2xl font-black text-green-900 flex items-center gap-2 mb-6 pb-4 border-b-2 border-dashed border-stone-200">
              <Receipt size={24} className="text-amber-800" /> Current Order
            </h2>

            <div className="flex-1 overflow-y-auto mb-6 space-y-3">
              {cart.length === 0 ? (
                <p className="text-center text-stone-400 mt-10 font-semibold">The cart is currently empty.</p>
              ) : (
                cart.map((item) => (
                  <div key={item.cartId} className="flex justify-between items-center p-4 bg-[#FAF8F5] rounded-2xl border border-stone-200">
                    <div>
                      <p className="font-black text-green-900 text-sm">{item.name}</p>
                      <p className="text-xs font-bold text-stone-500 mt-1">
                        {item.quantity} {item.unit} <span className="mx-1">x</span> C$ {item.price.toFixed(2)}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-black text-stone-800 text-sm">C$ {item.subtotal.toFixed(2)}</span>
                      <button onClick={() => removeFromCart(item.cartId)} className="p-2 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white rounded-lg transition-colors">
                        <Trash2 size={16} strokeWidth={2.5} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="mt-auto pt-5 border-t-2 border-dashed border-stone-200">
              <div className="flex justify-between items-end mb-6">
                <span className="text-sm font-black uppercase tracking-widest text-amber-900">Total</span>
                <span className="text-4xl font-black text-green-900 tracking-tight">C$ {cartTotal.toFixed(2)}</span>
              </div>
              <button 
                onClick={handleCheckout}
                className="w-full py-4 bg-blue-600 text-white text-lg font-black rounded-2xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/30 flex items-center justify-center"
              >
                Complete Sale
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default SalesPage;