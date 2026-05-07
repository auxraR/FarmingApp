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
      // Reemplaza estas rutas con las tuyas si son diferentes
      const [clientsRes, productsRes, livestockRes] = await Promise.all([
        apiClient.get('/clients/'), // Endpoint de clientes
        apiClient.get('/products/'), // Endpoint de leche/insumos
        apiClient.get('/livestock/?status=Activo') // Solo ganado vivo y en finca
      ]);
      setClients(clientsRes.data);
      setProducts(productsRes.data);
      setLivestock(livestockRes.data);
    } catch (err) {
      console.error("Error cargando datos para ventas", err);
    }
  };

  // --- LÓGICA DEL CARRITO ---
  const handleAddToCart = () => {
    if (!selectedItem || !quantity || quantity <= 0) {
      Swal.fire({ icon: 'warning', title: 'Oops...', text: 'Please select an item and a valid quantity.' });
      return;
    }

    let itemDetails = {};
    let finalPrice = parseFloat(priceOverride);

    if (itemType === 'Producto') {
      const prod = products.find(p => p.id.toString() === selectedItem);
      if (!finalPrice) finalPrice = parseFloat(prod.precio_actual);
      itemDetails = {
        id: prod.id,
        name: prod.nombre,
        unit: prod.unidad_medida
      };
    } else {
      const animal = livestock.find(a => a.id.toString() === selectedItem);
      if (!finalPrice) {
        Swal.fire({ icon: 'warning', title: 'Missing Price', text: 'Please enter the agreed sale price for this animal.' });
        return;
      }
      itemDetails = {
        id: animal.id,
        name: animal.nombre || `Animal #${animal.id} (${animal.raza})`,
        unit: 'Head/Kg'
      };
    }

    const subtotal = finalPrice * parseFloat(quantity);

    const newItem = {
      cartId: Date.now(), 
      type: itemType,
      itemId: itemDetails.id,
      name: itemDetails.name,
      unit: itemDetails.unit,
      price: finalPrice,
      quantity: parseFloat(quantity),
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

  // --- PROCESAR LA VENTA ---
  const handleCheckout = async () => {
    if (!selectedClient) {
      Swal.fire({ icon: 'error', title: 'Missing Client', text: 'Please select a client for this sale.' });
      return;
    }
    if (cart.length === 0) {
      Swal.fire({ icon: 'error', title: 'Empty Cart', text: 'Add at least one item to the sale.' });
      return;
    }

    const salePayload = {
      cliente: selectedClient,
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
      await apiClient.post('/ventas/', salePayload);
      Swal.fire({ title: 'Sale Completed!', text: 'The transaction has been recorded.', icon: 'success', timer: 2000, showConfirmButton: false });
      setCart([]);
      setSelectedClient('');
    } catch (err) {
      console.error(err);
      Swal.fire({ icon: 'error', title: 'Error', text: 'Could not complete the sale.' });
    }
  };

  return (
    <div className="flex-1 bg-[#F4F6F8] min-h-screen p-8 mt-[70px]">
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-[#E0E0E0]">
        <h1 className="text-3xl font-bold text-[#11131F] flex items-center gap-3">
          <ShoppingCart className="text-[#11131F]" size={28} />
          Point of Sale
        </h1>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* LADO IZQUIERDO: FORMULARIO DE INGRESO (Panel de Control) */}
        <div className="lg:w-2/3 space-y-6">
          
          {/* Tarjeta: Seleccionar Cliente */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-[#EBEBEB]">
            <h2 className="text-lg font-bold text-black flex items-center gap-2 mb-4">
              <User size={20} className="text-[#8C92AC]" /> 1. Select Client
            </h2>
            <select 
              value={selectedClient} 
              onChange={(e) => setSelectedClient(e.target.value)}
              className="w-full p-3 bg-[#F4F6F8] rounded-xl text-black border border-[#E0E0E0] focus:ring-1 focus:ring-[#11131F]"
            >
              <option value="">-- Choose a Client --</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>{c.nombre} {c.apellido}</option>
              ))}
            </select>
          </div>

          {/* Tarjeta: Agregar Item */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-[#EBEBEB]">
            <h2 className="text-lg font-bold text-black flex items-center gap-2 mb-4">
              <Package size={20} className="text-[#8C92AC]" /> 2. Add Item to Cart
            </h2>
            
            {/* Toggle Tipo de Item */}
            <div className="flex gap-4 mb-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="itemType" checked={itemType === 'Producto'} onChange={() => {setItemType('Producto'); setSelectedItem('');}} className="accent-black w-4 h-4" />
                <span className="text-sm font-semibold text-black">Product (Milk, Cheese)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="itemType" checked={itemType === 'Ganado'} onChange={() => {setItemType('Ganado'); setSelectedItem('');}} className="accent-black w-4 h-4" />
                <span className="text-sm font-semibold text-black">Livestock (Animal)</span>
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-[#8C92AC] mb-1 uppercase tracking-wider">Select Item</label>
                <select value={selectedItem} onChange={(e) => setSelectedItem(e.target.value)} className="w-full p-3 bg-[#F4F6F8] rounded-xl text-black border border-[#E0E0E0]">
                  <option value="">-- Select --</option>
                  {itemType === 'Producto' 
                    ? products.map(p => <option key={p.id} value={p.id}>{p.nombre} (Stock: {p.stock} {p.unidad_medida})</option>)
                    : livestock.map(l => <option key={l.id} value={l.id}>{l.nombre || `ID #${l.id}`} - {l.raza}</option>)
                  }
                </select>
              </div>
              
              <div>
                <label className="block text-xs font-semibold text-[#8C92AC] mb-1 uppercase tracking-wider">Quantity</label>
                <input type="number" step="0.01" value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder={itemType === 'Producto' ? "Liters/Kg" : "1"} className="w-full p-3 bg-[#F4F6F8] rounded-xl text-black border border-[#E0E0E0]" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#8C92AC] mb-1 uppercase tracking-wider">Unit Price (C$)</label>
                <input type="number" step="0.01" value={priceOverride} onChange={(e) => setPriceOverride(e.target.value)} placeholder="Leave blank for default" className="w-full p-3 bg-[#F4F6F8] rounded-xl text-black border border-[#E0E0E0]" />
              </div>
            </div>

            <button onClick={handleAddToCart} className="w-full mt-2 py-3 bg-[#F4F6F8] text-black font-bold rounded-xl border border-[#E0E0E0] hover:bg-[#EBEBEB] transition flex items-center justify-center gap-2">
              <Plus size={18} /> Add to Order
            </button>
          </div>
        </div>

        {/* LADO DERECHO: EL RECIBO / FACTURA */}
        <div className="lg:w-1/3">
          <div className="bg-white p-6 rounded-3xl shadow-lg border-2 border-black flex flex-col h-full sticky top-24">
            <h2 className="text-2xl font-extrabold text-black flex items-center gap-2 mb-6 pb-4 border-b-2 border-dashed border-[#E0E0E0]">
              <Receipt size={24} /> Current Order
            </h2>

            {/* Lista de Items */}
            <div className="flex-1 overflow-y-auto mb-6 space-y-4">
              {cart.length === 0 ? (
                <p className="text-center text-[#8C92AC] mt-10 italic">The cart is empty.</p>
              ) : (
                cart.map((item) => (
                  <div key={item.cartId} className="flex justify-between items-start p-3 bg-[#F9FAFB] rounded-xl border border-[#EBEBEB]">
                    <div>
                      <p className="font-bold text-black text-sm">{item.name}</p>
                      <p className="text-xs text-[#8C92AC] mt-0.5">{item.quantity} {item.unit} x C$ {item.price.toFixed(2)}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-black text-sm">C$ {item.subtotal.toFixed(2)}</span>
                      <button onClick={() => removeFromCart(item.cartId)} className="text-[#EF4444] hover:text-black transition">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Totales y Botón de Pago */}
            <div className="mt-auto pt-4 border-t-2 border-dashed border-[#E0E0E0]">
              <div className="flex justify-between items-center mb-6">
                <span className="text-lg font-bold text-[#8C92AC]">TOTAL</span>
                <span className="text-4xl font-black text-black tracking-tight">C$ {cartTotal.toFixed(2)}</span>
              </div>
              <button 
                onClick={handleCheckout}
                className="w-full py-4 bg-black text-white text-lg font-bold rounded-2xl hover:bg-[#222222] transition shadow-md"
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