import React, { useState, useEffect } from 'react';
import { collection, doc, query, onSnapshot, updateDoc, getDoc, setDoc, orderBy } from 'firebase/firestore';
import { db, Order, OrderStatus } from '../firebase';
import { motion } from 'motion/react';

export default function Backend() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [password, setPassword] = useState('');
  const [isFirstEntry, setIsFirstEntry] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const checkSettings = async () => {
      const settingsRef = doc(db, 'settings', 'admin');
      const settingsSnap = await getDoc(settingsRef);
      if (!settingsSnap.exists()) {
        setIsFirstEntry(true);
      }
    };
    checkSettings();
  }, []);

  useEffect(() => {
    if (isAdmin) {
      const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const orderList: Order[] = [];
        snapshot.forEach((doc) => orderList.push({ id: doc.id, ...doc.data() } as Order));
        setOrders(orderList);
      });
      return () => unsubscribe();
    }
  }, [isAdmin]);

  const handleSetPassword = async () => {
    if (!newPassword.trim()) return;
    const settingsRef = doc(db, 'settings', 'admin');
    await setDoc(settingsRef, {
      adminPassword: newPassword,
      adminPasswordSet: true,
    });
    setIsFirstEntry(false);
    setIsAdmin(true);
  };

  const handleLogin = async () => {
    const settingsRef = doc(db, 'settings', 'admin');
    const settingsSnap = await getDoc(settingsRef);
    if (settingsSnap.exists() && settingsSnap.data().adminPassword === password) {
      setIsAdmin(true);
      setError('');
    } else {
      setError('密碼錯誤');
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    const orderRef = doc(db, 'orders', orderId);
    await updateDoc(orderRef, { status: newStatus });
  };

  if (isFirstEntry) {
    return (
      <div className="min-h-screen bg-editorial-ink flex items-center justify-center p-6 text-editorial-bg">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full"
        >
          <div className="mb-12">
            <h2 className="serif text-4xl mb-4 italic">Vault Access</h2>
            <p className="text-sm opacity-60 leading-relaxed font-light">
              First-time system initialization detected. Please establish your administrative credential for the cluster.
            </p>
          </div>
          <div className="space-y-8">
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-widest opacity-50 block mb-2">Administrator Password</label>
              <input
                type="password"
                placeholder="••••••••"
                className="bg-transparent border-none border-b border-editorial-bg/30 text-editorial-bg p-4 w-full text-xl outline-none focus:border-editorial-bg transition-colors"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            <button
              onClick={handleSetPassword}
              className="w-full bg-editorial-bg text-editorial-ink p-5 text-xs font-bold uppercase tracking-[0.2em] transition-all hover:tracking-[0.3em]"
            >
              Initialize Backend
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-editorial-ink flex items-center justify-center p-6 text-editorial-bg">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full"
        >
          <div className="mb-12">
            <h2 className="serif text-4xl mb-4 italic">Credential Required</h2>
            <p className="text-sm opacity-60 leading-relaxed font-light">
              This terminal is restricted. Enter the administrative key to access the order stream.
            </p>
          </div>
          <div className="space-y-8">
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-widest opacity-50 block mb-2">Admin Key</label>
              <input
                type="password"
                placeholder="••••••••"
                className="bg-transparent border-none border-b border-editorial-bg/30 text-editorial-bg p-4 w-full text-xl outline-none focus:border-editorial-bg transition-colors"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              {error && <p className="text-red-400 text-[10px] uppercase mt-2">{error}</p>}
            </div>
            <button
              onClick={handleLogin}
              className="w-full bg-editorial-bg text-editorial-ink p-5 text-xs font-bold uppercase tracking-[0.2em] transition-all hover:tracking-[0.3em]"
            >
              Access Cluster
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-editorial-bg p-8 md:p-12 lg:p-16 flex flex-col">
      <header className="flex justify-between items-end mb-16 border-b border-editorial-ink/10 pb-8">
        <div>
          <div className="text-[11px] uppercase tracking-[0.2em] opacity-50 mb-2 font-bold font-sans">Administrative Unit</div>
          <h1 className="serif text-5xl tracking-tight italic">Order Stream</h1>
        </div>
        <button
          onClick={() => setIsAdmin(false)}
          className="text-[10px] uppercase tracking-widest font-bold opacity-40 hover:opacity-100 transition-opacity"
        >
          Terminate Session
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-1px bg-editorial-ink/10 border border-editorial-ink/10">
        {orders.length === 0 ? (
          <div className="bg-editorial-bg col-span-full py-32 text-center">
            <p className="serif italic text-xl opacity-30">Stream empty / Waiting for signal</p>
          </div>
        ) : (
          orders.map((order) => (
            <motion.div
              layout
              key={order.id}
              className="bg-editorial-bg p-8 flex flex-col group hover:bg-editorial-ink hover:text-editorial-bg transition-colors duration-500"
            >
              <div className="flex justify-between items-start mb-8">
                <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-1 border border-current ${
                  order.status === OrderStatus.PENDING ? 'opacity-100' : 'opacity-40'
                }`}>
                  {order.status}
                </span>
                <span className="text-[9px] font-bold opacity-30 uppercase tracking-tighter">
                  {order.createdAt?.toDate().toLocaleTimeString() || '00:00:00'}
                </span>
              </div>
              
              <h3 className="serif text-2xl mb-6 italic">{order.customerName}</h3>
              
                <div className="space-y-3 mb-8 flex-1">
                {order.items.map((item, idx) => (
                  <div key={idx} className="flex flex-col border-b border-current/5 pb-2">
                    <div className="flex justify-between text-[11px] uppercase tracking-wide">
                      <span className="opacity-80">{item.name} × {item.quantity}</span>
                      <span className="font-bold">${item.price * item.quantity}</span>
                    </div>
                    <div className="text-[9px] uppercase tracking-widest opacity-40 mt-1">
                      {item.sweetness} / {item.iceLevel}
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-6 border-t border-current/20 mb-8">
                <div className="flex justify-between items-baseline">
                  <span className="text-[9px] uppercase tracking-widest opacity-40">Valuation</span>
                  <span className="serif text-2xl">${order.totalPrice}</span>
                </div>
              </div>

              <div className="flex gap-4">
                {order.status === OrderStatus.PENDING && (
                  <button
                    onClick={() => order.id && updateOrderStatus(order.id, OrderStatus.PREPARING)}
                    className="flex-1 border border-current py-3 text-[10px] font-bold uppercase tracking-widest hover:bg-current hover:text-editorial-bg transition-all"
                  >
                    Process
                  </button>
                )}
                {order.status === OrderStatus.PREPARING && (
                  <button
                    onClick={() => order.id && updateOrderStatus(order.id, OrderStatus.COMPLETED)}
                    className="flex-1 border border-current py-3 text-[10px] font-bold uppercase tracking-widest hover:bg-current hover:text-editorial-bg transition-all font-sans"
                  >
                    Finalize
                  </button>
                )}
                <button
                  onClick={() => order.id && updateOrderStatus(order.id, OrderStatus.CANCELLED)}
                  className="px-2 opacity-30 hover:opacity-100 transition-opacity text-[10px] uppercase font-bold"
                >
                  Void
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>

      <footer className="mt-auto pt-24 flex justify-between items-center text-[9px] uppercase tracking-[0.3em] opacity-30">
          <span>Kernel ID: 0x48291</span>
          <span>AIS INFUSION OPERATING SYSTEM</span>
      </footer>
    </div>
  );
}
