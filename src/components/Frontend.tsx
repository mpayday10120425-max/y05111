import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, MenuItem, OrderStatus } from '../firebase';
import { motion, AnimatePresence } from 'motion/react';

export default function Frontend() {
  const [products, setProducts] = useState<MenuItem[]>([]);
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  
  const [selectedProduct, setSelectedProduct] = useState<MenuItem | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [selectedSweetness, setSelectedSweetness] = useState('正常糖');
  const [selectedIce, setSelectedIce] = useState('正常冰');

  useEffect(() => {
    const q = query(collection(db, 'products'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items: MenuItem[] = [];
      snapshot.forEach((doc) => items.push({ id: doc.id, ...doc.data() } as MenuItem));
      setProducts(items);
    });
    return () => unsubscribe();
  }, []);

  const handleOpenProductSelection = (product: MenuItem) => {
    setSelectedProduct(product);
    setEditingIndex(null);
    setSelectedSweetness('正常糖');
    setSelectedIce('正常冰');
  };

  const handleOpenEditSelection = (index: number) => {
    const item = cart[index];
    setSelectedProduct({ id: item.id, name: item.name, price: item.price, description: item.description });
    setSelectedSweetness(item.sweetness);
    setSelectedIce(item.iceLevel);
    setEditingIndex(index);
  };

  const saveToCart = () => {
    if (!selectedProduct) return;

    if (editingIndex !== null) {
      // Update existing item
      const newCart = [...cart];
      newCart[editingIndex] = {
        ...selectedProduct,
        quantity: newCart[editingIndex].quantity,
        sweetness: selectedSweetness,
        iceLevel: selectedIce,
      };
      setCart(newCart);
    } else {
      // Add new item logic (merge if same options)
      const existingIndex = cart.findIndex(
        (item) => item.id === selectedProduct.id && item.sweetness === selectedSweetness && item.iceLevel === selectedIce
      );

      if (existingIndex > -1) {
        const newCart = [...cart];
        newCart[existingIndex].quantity += 1;
        setCart(newCart);
      } else {
        setCart([...cart, { ...selectedProduct, quantity: 1, sweetness: selectedSweetness, iceLevel: selectedIce }]);
      }
    }
    setSelectedProduct(null);
    setEditingIndex(null);
  };

  const updateQuantity = (index: number, delta: number) => {
    setCart((prev) => {
      const newCart = [...prev];
      newCart[index].quantity += delta;
      if (newCart[index].quantity <= 0) {
        newCart.splice(index, 1);
      }
      return newCart;
    });
  };

  const totalPrice = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleSubmitOrder = async () => {
    if (!customerName.trim() || cart.length === 0) return;
    
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'orders'), {
        customerName,
        items: cart,
        totalPrice,
        status: OrderStatus.PENDING,
        createdAt: serverTimestamp(),
      });

      setCart([]);
      setCustomerName('');
      setOrderSuccess(true);
      setTimeout(() => setOrderSuccess(false), 3000);
    } catch (error) {
      console.error('Order failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const sweetnessOptions = ['無糖', '微糖', '半糖', '少糖', '正常糖'];
  const iceOptions = ['去冰', '微冰', '少冰', '正常冰', '熱'];

  return (
    <div className="grid grid-cols-1 md:grid-cols-7 h-full relative">
      {/* Menu Main Section */}
      <div className="md:col-span-4 p-8 md:p-12 lg:p-16 flex flex-col border-r border-editorial-ink/10 h-full overflow-y-auto">
        <div className="text-[11px] uppercase tracking-[0.2em] opacity-50 mb-6 font-bold">Curated Selection</div>
        <h1 className="serif text-5xl md:text-7xl lg:text-8xl leading-[0.9] mb-12 tracking-tight">
          The Art of<br />Pure Infusion
        </h1>
        
        <div className="space-y-0 mt-8">
          {products.map((product, idx) => (
            <motion.div
              layout
              key={product.id}
              className="flex justify-between items-end border-b border-editorial-ink/20 py-5 hover:opacity-60 transition-opacity cursor-pointer group"
              onClick={() => product.id && handleOpenProductSelection(product)}
            >
              <div className="flex flex-col">
                <span className="text-[10px] font-bold opacity-30 mb-1">0{idx + 1}</span>
                <h3 className="serif text-2xl italic group-hover:translate-x-2 transition-transform duration-300">
                  {product.name}
                </h3>
                <p className="text-xs opacity-50 font-light mt-1 max-w-xs">{product.description}</p>
              </div>
              <div className="text-right">
                <span className="text-sm font-light tracking-wider">${product.price} / Cup</span>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="mt-auto pt-16 flex justify-between items-end">
          <p className="text-[10px] leading-relaxed opacity-40 max-w-[240px] uppercase tracking-widest font-bold">
            Every leaf is hand-picked at peak elevation to ensure the integrity of the flavor profile. Direct from source.
          </p>
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-bold uppercase tracking-wider opacity-60">Status</span>
            <div className="w-2 h-2 bg-green-500 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.5)]"></div>
          </div>
        </div>
      </div>

      {/* Cart / Order Section */}
      <div className="md:col-span-3 bg-editorial-ink text-editorial-bg p-8 md:p-12 lg:p-16 flex flex-col min-h-[500px] md:min-h-screen overflow-y-auto">
        <div className="mb-12">
          <h2 className="serif text-4xl mb-4 italic">Selection Basket</h2>
          <p className="text-sm opacity-60 leading-relaxed font-light">
            Review your collection. All infusions are prepared fresh upon order confirmation.
          </p>
        </div>

        <div className="flex-1 space-y-6">
          {cart.length === 0 ? (
            <div className="py-20 text-center opacity-30 italic text-sm">No items selected yet</div>
          ) : (
            cart.map((item, index) => (
              <div key={`${item.id}-${index}`} className="flex justify-between items-start border-b border-editorial-bg/10 pb-4 cursor-pointer group hover:bg-editorial-bg/5 transition-colors" onClick={() => handleOpenEditSelection(index)}>
                <div>
                  <h4 className="serif text-lg font-medium group-hover:italic transition-all">{item.name}</h4>
                  <p className="text-[10px] opacity-40 uppercase tracking-widest mt-1">
                    {item.sweetness} / {item.iceLevel}
                  </p>
                  <p className="text-xs opacity-50 mt-1 uppercase tracking-tighter">Qty: {item.quantity} × ${item.price}</p>
                </div>
                <div className="flex items-center gap-4">
                  <button onClick={(e) => { e.stopPropagation(); updateQuantity(index, -1); }} className="opacity-40 hover:opacity-100 text-lg">－</button>
                  <span className="text-sm font-bold min-w-[20px] text-center">{item.quantity}</span>
                  <button onClick={(e) => { e.stopPropagation(); updateQuantity(index, 1); }} className="opacity-40 hover:opacity-100 text-lg">＋</button>
                </div>
              </div>
            ))
          )}
        </div>

        {cart.length > 0 && (
          <div className="mt-12 pt-8 border-t border-editorial-bg/20">
            <div className="flex justify-between items-baseline mb-8">
              <span className="text-[10px] uppercase tracking-widest font-bold opacity-50">Total Investment</span>
              <span className="serif text-4xl">${totalPrice}</span>
            </div>

            <div className="space-y-6">
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-widest opacity-40 font-bold">Collector Name</label>
                <input
                  type="text"
                  placeholder="Identification"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full bg-transparent border-b border-editorial-bg/30 py-3 text-lg focus:outline-none focus:border-editorial-bg transition-colors placeholder:opacity-20"
                />
              </div>
              
              <button
                onClick={handleSubmitOrder}
                disabled={isSubmitting || !customerName.trim()}
                className="w-full bg-editorial-bg text-editorial-ink py-5 text-xs font-bold uppercase tracking-[0.2em] transition-all hover:tracking-[0.3em] disabled:opacity-30 disabled:pointer-events-none mt-4"
              >
                {isSubmitting ? 'Transmitting...' : 'Confirm Infusion'}
              </button>
            </div>
          </div>
        )}

        {/* Modal for product options */}
        <AnimatePresence>
          {selectedProduct && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-editorial-ink/90 backdrop-blur-sm"
              onClick={() => setSelectedProduct(null)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-editorial-bg text-editorial-ink p-10 max-w-lg w-full flex flex-col gap-8"
                onClick={(e) => e.stopPropagation()}
              >
                <div>
                  <h3 className="serif text-4xl italic mb-2">{selectedProduct.name}</h3>
                  <p className="text-sm opacity-50">{selectedProduct.description}</p>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="text-[10px] uppercase tracking-[0.2em] font-bold opacity-40 block mb-4">Sweetness Level</label>
                    <div className="flex flex-wrap gap-2">
                      {sweetnessOptions.map(opt => (
                        <button
                          key={opt}
                          onClick={() => setSelectedSweetness(opt)}
                          className={`px-4 py-2 text-[10px] uppercase font-bold tracking-widest border transition-all ${
                            selectedSweetness === opt ? 'bg-editorial-ink text-editorial-bg border-editorial-ink' : 'border-editorial-ink/20 opacity-50 hover:opacity-100 hover:border-editorial-ink'
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] uppercase tracking-[0.2em] font-bold opacity-40 block mb-4">Temperature / Ice</label>
                    <div className="flex flex-wrap gap-2">
                      {iceOptions.map(opt => (
                        <button
                          key={opt}
                          onClick={() => setSelectedIce(opt)}
                          className={`px-4 py-2 text-[10px] uppercase font-bold tracking-widest border transition-all ${
                            selectedIce === opt ? 'bg-editorial-ink text-editorial-bg border-editorial-ink' : 'border-editorial-ink/20 opacity-50 hover:opacity-100 hover:border-editorial-ink'
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-6 border-t border-editorial-ink/10">
                  <span className="serif text-2xl">${selectedProduct.price}</span>
                  <button
                    onClick={saveToCart}
                    className="bg-editorial-ink text-editorial-bg px-8 py-4 text-xs font-bold uppercase tracking-widest hover:opacity-80 transition-opacity"
                  >
                    {editingIndex !== null ? 'Update Selection' : 'Confirm Addition'}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-12 pt-12 border-t border-editorial-bg/10 text-[9px] uppercase tracking-widest opacity-30 flex justify-between">
          <span>Secure Transaction</span>
          <span>AISINFUSION — {new Date().getFullYear()}</span>
        </div>
      </div>

      <AnimatePresence>
        {orderSuccess && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="fixed top-12 right-12 bg-white text-editorial-ink px-10 py-6 shadow-2xl z-50 border-l-4 border-editorial-ink"
          >
            <p className="serif text-xl italic mb-1 text-editorial-ink">Order Transmitted.</p>
            <p className="text-[10px] uppercase font-bold opacity-50">Your infusion is being prepared.</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
