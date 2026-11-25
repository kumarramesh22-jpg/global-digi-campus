import React, { useState, useEffect } from 'react';
import { auth, db } from './firebase';
import AuthScreen from './AuthScreen';
import { signOut, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, collection, addDoc, query, orderBy, onSnapshot, updateDoc, serverTimestamp } from 'firebase/firestore';
import { GraduationCap, Users, BookOpen, HeartHandshake, ShieldCheck, MessageSquare, LogOut, PlusCircle, CheckCircle, Globe, Search, AlertTriangle } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState('feed');
  const [posts, setPosts] = useState([]);
  const [peers, setPeers] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [postCategory, setPostCategory] = useState('notes');
  const [postTitle, setPostTitle] = useState('');
  const [postContent, setPostContent] = useState('');
  const [needsFaculty, setNeedsFaculty] = useState(false);

  const [chatTarget, setChatTarget] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');

  useEffect(() => {
    return onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const snap = await getDoc(doc(db, 'profiles', currentUser.uid));
        if (snap.exists()) setProfile(snap.data());
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!profile?.isVerified && profile?.role !== 'admin') return;
    const unsubPosts = onSnapshot(query(collection(db, 'posts'), orderBy('createdAt', 'desc')), (snap) => {
      setPosts(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    const unsubPeers = onSnapshot(collection(db, 'profiles'), (snap) => {
      setPeers(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => { unsubPosts(); unsubPeers(); };
  }, [profile]);

  useEffect(() => {
    if (!user || !chatTarget) return;
    const chatId = [user.uid, chatTarget.id].sort().join('_');
    return onSnapshot(query(collection(db, 'chats', chatId, 'messages'), orderBy('createdAt', 'asc')), (snap) => {
      setMessages(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
  }, [user, chatTarget]);

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!postTitle.trim() || !postContent.trim()) return;
    await addDoc(collection(db, 'posts'), {
      authorId: user.uid,
      authorName: profile.fullName,
      authorCollege: profile.college,
      authorCourse: profile.course,
      authorCountry: profile.country,
      category: activeTab === 'support' ? 'moral_support' : postCategory,
      title: postTitle,
      content: postContent,
      needsFaculty,
      createdAt: serverTimestamp()
    });
    setPostTitle('');
    setPostContent('');
    setNeedsFaculty(false);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !chatTarget) return;
    const chatId = [user.uid, chatTarget.id].sort().join('_');
    await addDoc(collection(db, 'chats', chatId, 'messages'), {
      senderId: user.uid,
      senderName: profile.fullName,
      text: newMessage,
      createdAt: serverTimestamp()
    });
    setNewMessage('');
  };

  const handleVerifyStudent = async (studentId, status) => {
    await updateDoc(doc(db, 'profiles', studentId), { isVerified: status });
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-slate-600 font-medium">Loading Global Digi Campus...</div>;
  if (!user || !profile) return <AuthScreen onSuccess={setProfile} />;

  if (!profile.isVerified) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white border border-slate-200 rounded-xl p-6 text-center space-y-4">
          <ShieldCheck className="w-12 h-12 text-slate-700 mx-auto" />
          <h2 className="text-xl font-bold text-slate-900">College ID Verification Pending</h2>
          <p className="text-sm text-slate-600">
            Hello <strong>{profile.fullName}</strong> ({profile.college}). Our admin team is reviewing your ID (<strong>{profile.collegeIdNumber}</strong>).
          </p>
          <button onClick={() => signOut(auth)} className="inline-flex items-center gap-2 text-xs text-slate-700 border border-slate-300 px-4 py-2 rounded-lg">
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </div>
    );
  }

  const filteredPosts = posts.filter((p) => {
    if (activeTab === 'support') return p.category === 'moral_support';
    if (selectedCategory !== 'all' && p.category !== selectedCategory) return false;
    if (searchQuery && !`${p.title} ${p.content} ${p.authorCourse} ${p.authorCollege}`.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return p.category !== 'moral_support';
  });

  const verifiedPeers = peers.filter(
    (p) => p.isVerified && p.id !== user.uid && (!searchQuery || `${p.fullName} ${p.course} ${p.college} ${p.country}`.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-6 h-6 text-slate-900" />
            <div>
              <h1 className="font-bold text-base text-slate-900 leading-tight">Global Digi Campus</h1>
              <p className="text-[11px] text-slate-500">{profile.college} • {profile.course}</p>
            </div>
          </div>
          <button onClick={() => signOut(auth)} className="text-xs text-slate-600 flex items-center gap-1 border border-slate-200 px-2.5 py-1.5 rounded-lg">
            <LogOut className="w-3.5 h-3.5" /> Logout
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 space-y-4">
        {(activeTab === 'feed' || activeTab === 'peers') && (
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input type="text" placeholder="Search any course, college, country, notes, or project..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-white border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-sm" />
          </div>
        )}

        {activeTab === 'feed' && (
          <>
            <form onSubmit={handleCreatePost} className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">Share With Global Students</span>
                <select value={postCategory} onChange={(e) => setPostCategory(e.target.value)} className="border border-slate-300 rounded-md px-2 py-1 text-xs bg-slate-50">
                  <option value="notes">Notes & Study Material</option>
                  <option value="project">Project Idea / Help</option>
                  <option value="career">Career & Competitive Exams</option>
                  <option value="games">Brain Games & Quiz</option>
                </select>
              </div>
              <input type="text" placeholder="Topic Title (e.g., MBA Operations Research Notes)" value={postTitle} onChange={(e) => setPostTitle(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" />
              <textarea rows="2" placeholder="Write your notes, Google Drive link, question, or idea..." value={postContent} onChange={(e) => setPostContent(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" />
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-1.5 text-xs text-slate-600">
                  <input type="checkbox" checked={needsFaculty} onChange={(e) => setNeedsFaculty(e.target.checked)} /> Request Faculty/Mentor Input Later
                </label>
                <button type="submit" className="bg-slate-900 text-white text-xs font-semibold px-4 py-2 rounded-lg flex items-center gap-1">
                  <PlusCircle className="w-3.5 h-3.5" /> Post Globally
                </button>
              </div>
            </form>

            <div className="flex gap-2 overflow-x-auto pb-1 text-xs">
              {['all', 'notes', 'project', 'career', 'games'].map((cat) => (
                <button key={cat} onClick={() => setSelectedCategory(cat)} className={`px-3 py-1.5 rounded-full border capitalize ${selectedCategory === cat ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200'}`}>{cat}</button>
              ))}
            </div>

            <div className="space-y-3">
              {filteredPosts.map((post) => (
                <div key={post.id} className="bg-white border border-slate-200 rounded-xl p-4 space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span><strong>{post.authorName}</strong> • {post.authorCourse} ({post.authorCollege}, {post.authorCountry})</span>
                    <span className="uppercase bg-slate-100 px-2 py-0.5 rounded text-[10px] font-semibold text-slate-700">{post.category}</span>
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm">{post.title}</h3>
                  <p className="text-sm text-slate-700 whitespace-pre-line">{post.content}</p>
