import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { collection, addDoc, query, orderBy, onSnapshot, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { ShoppingBag, Lock, Unlock, PlusCircle, IndianRupee, CheckCircle, ExternalLink, Copy } from 'lucide-react';

const UPI_ID = '9963088662-3@axl';

export default function ProjectStore({ user, profile }) {
  const [items, setItems] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [title, setTitle] = useState('');
  const [courseTag, setCourseTag] = useState('MBA / B.Tech');
  const [price, setPrice] = useState('99');
  const [driveLink, setDriveLink] = useState('');
  const [utrMap, setUtrMap] = useState({});
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const unsubItems = onSnapshot(query(collection(db, 'store_items'), orderBy('createdAt', 'desc')), (snap) => {
      setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    const unsubPurchases = onSnapshot(collection(db, 'purchases'), (snap) => {
      setPurchases(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => { unsubItems(); unsubPurchases(); };
  }, []);

  const copyUpi = () => {
    navigator.clipboard.writeText(UPI_ID);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAddItem = async (e) => {
    e.preventDefault();
    if (!title.trim() || !driveLink.trim()) return;
    await addDoc(collection(db, 'store_items'), {
      title, courseTag, price: Number(price), driveLink, createdAt: serverTimestamp()
    });
    setTitle(''); setDriveLink('');
  };

  const handleBuyRequest = async (item) => {
    const utr = utrMap[item.id];
    if (!utr || utr.trim().length < 6) {
      alert('Please enter your 12-digit UPI Transaction / UTR ID after paying.');
      return;
    }
    await addDoc(collection(db, 'purchases'), {
      itemId: item.id,
      itemTitle: item.title,
      buyerId: user.uid,
      buyerName: profile.fullName,
      buyerMobile: profile.mobile,
      utr: utr.trim(),
      status: 'pending',
      createdAt: serverTimestamp()
    });
    setUtrMap({ ...utrMap, [item.id]: '' });
    alert('Payment UTR submitted! Super Admin will unlock your download shortly.');
  };

  const handleApprovePurchase = async (purchaseId) => {
    await updateDoc(doc(db, 'purchases', purchaseId), { status: 'approved' });
  };

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white rounded-2xl p-4 shadow-md space-y-2">
        <div className="flex items-center gap-2 font-bold text-base">
          <ShoppingBag className="w-5 h-5" /> Premium Project Reports & Exam Kits
        </div>
        <p className="text-xs text-blue-100">
          Pay via PhonePe / GPay / Paytm to the UPI ID below and enter your 12-digit UTR ID to unlock instant download:
        </p>
        <div className="flex items-center justify-between bg-white/15 px-3 py-2 rounded-xl text-xs">
          <span className="font-mono font-bold">{UPI_ID}</span>
          <button onClick={copyUpi} className="bg-white text-indigo-700 font-bold px-2.5 py-1 rounded-lg flex items-center gap-1">
            <Copy className="w-3 h-3" /> {copied ? 'Copied!' : 'Copy UPI'}
          </button>
        </div>
      </div>

      {profile.role === 'admin' && (
        <form onSubmit={handleAddItem} className="bg-white border border-indigo-200 rounded-2xl p-4 shadow-sm space-y-3">
          <div className="text-xs font-bold text-indigo-700 uppercase">Super Admin: Add Paid Project / Solved Guide</div>
          <div className="grid sm:grid-cols-3 gap-2">
            <input type="text" placeholder="Project / Guide Title" required value={title} onChange={(e) => setTitle(e.target.value)} className="border border-slate-300 rounded-xl px-3 py-2 text-xs" />
            <input type="text" placeholder="Course (e.g., MBA HR / B.Tech)" value={courseTag} onChange={(e) => setCourseTag(e.target.value)} className="border border-slate-300 rounded-xl px-3 py-2 text-xs" />
            <input type="number" placeholder="Price (₹)" required value={price} onChange={(e) => setPrice(e.target.value)} className="border border-slate-300 rounded-xl px-3 py-2 text-xs" />
          </div>
          <div className="flex gap-2">
            <input type="url" placeholder="Google Drive / PDF Download Link" required value={driveLink} onChange={(e) => setDriveLink(e.target.value)} className="flex-1 border border-slate-300 rounded-xl px-3 py-2 text-xs" />
            <button type="submit" className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1">
              <PlusCircle className="w-4 h-4" /> Publish
            </button>
          </div>
        </form>
      )}

      <div className="grid sm:grid-cols-2 gap-3">
        {items.map((item) => {
          const userPurchase = purchases.find((p) => p.itemId === item.id && p.buyerId === user.uid);
          const isUnlocked = profile.role === 'admin' || userPurchase?.status === 'approved';

          return (
            <div key={item.id} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col justify-between space-y-3">
              <div>
                <div className="flex justify-between items-start gap-2">
                  <span className="bg-indigo-50 text-indigo-700 text-[10px] font-bold px-2.5 py-0.5 rounded-full">{item.courseTag}</span>
                  <span className="bg-emerald-50 text-emerald-700 font-extrabold text-xs px-2.5 py-0.5 rounded-full flex items-center">
                    <IndianRupee className="w-3 h-3" />{item.price}
                  </span>
                </div>
                <h3 className="font-bold text-slate-900 text-sm mt-2">{item.title}</h3>
              </div>

              {isUnlocked ? (
                <a href={item.driveLink} target="_blank" rel="noreferrer" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2.5 rounded-xl flex items-center justify-center gap-1.5">
                  <Unlock className="w-4 h-4" /> Download Full File <ExternalLink className="w-3.5 h-3.5" />
                </a>
              ) : userPurchase?.status === 'pending' ? (
                <div className="bg-amber-50 border border-amber-200 text-amber-800 text-xs p-2.5 rounded-xl text-center font-medium">
                  ⏳ Payment Verifying (UTR: {userPurchase.utr})
                </div>
              ) : (
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <div className="text-[11px] text-slate-500">Pay ₹{item.price} to <strong>{UPI_ID}</strong> & paste UTR:</div>
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      placeholder="12-digit UPI UTR ID"
                      value={utrMap[item.id] || ''}
                      onChange={(e) => setUtrMap({ ...utrMap, [item.id]: e.target.value })}
                      className="flex-1 border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs"
                    />
                    <button onClick={() => handleBuyRequest(item)} className="bg-blue-600 text-white text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1">
                      <Lock className="w-3 h-3" /> Unlock
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {profile.role === 'admin' && purchases.filter((p) => p.status === 'pending').length > 0 && (
        <div className="bg-white border border-emerald-300 rounded-2xl p-4 space-y-2">
          <h4 className="font-bold text-xs text-emerald-800 uppercase">Pending UPI Payments to Approve</h4>
          {purchases.filter((p) => p.status === 'pending').map((p) => (
            <div key={p.id} className="flex items-center justify-between bg-emerald-50 p-2.5 rounded-xl text-xs">
              <div>
                <strong>{p.buyerName}</strong> ({p.buyerMobile}) • {p.itemTitle} • UTR: <strong>{p.utr}</strong>
              </div>
              <button onClick={() => handleApprovePurchase(p.id)} className="bg-emerald-600 text-white px-3 py-1.5 rounded-lg font-bold flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5" /> Unlock
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
