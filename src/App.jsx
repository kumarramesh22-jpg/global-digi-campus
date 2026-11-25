import React, { useState, useEffect } from 'react';
import { auth, db } from './firebase';
import AuthScreen from './AuthScreen';
import ProjectStore from './ProjectStore';
import EditProfileModal from './EditProfileModal';

import { signOut, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, collection, addDoc, query, orderBy, onSnapshot, updateDoc, deleteDoc, arrayUnion, serverTimestamp } from 'firebase/firestore';
import { GraduationCap, Users, BookOpen, HeartHandshake, ShieldCheck, MessageSquare, LogOut, PlusCircle, CheckCircle, Globe, Search, AlertTriangle, Trash2, ThumbsUp, Megaphone, ShoppingBag,UserCog  } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
const [showEditProfile, setShowEditProfile] = useState(false);

  const [activeTab, setActiveTab] = useState('feed');
  const [posts, setPosts] = useState([]);
  const [peers, setPeers] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [postCategory, setPostCategory] = useState('notes');
  const [postTitle, setPostTitle] = useState('');
  const [postContent, setPostContent] = useState('');
  const [needsFaculty, setNeedsFaculty] = useState(false);
  const [newNotice, setNewNotice] = useState('');

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
    const unsubNotices = onSnapshot(query(collection(db, 'announcements'), orderBy('createdAt', 'desc')), (snap) => {
      setAnnouncements(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => { unsubPosts(); unsubPeers(); unsubNotices(); };
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
      authorId: user.uid, authorName: profile.fullName, authorCollege: profile.college,
      authorCourse: profile.course, authorCountry: profile.country,
      category: activeTab === 'support' ? 'moral_support' : postCategory,
      title: postTitle, content: postContent, needsFaculty, likes: [], createdAt: serverTimestamp()
    });
    setPostTitle(''); setPostContent(''); setNeedsFaculty(false);
  };

  const handleLikePost = async (postId) => {
    await updateDoc(doc(db, 'posts', postId), { likes: arrayUnion(user.uid) });
  };

  const handleDeletePost = async (postId) => {
    if (window.confirm('Delete this post permanently?')) await deleteDoc(doc(db, 'posts', postId));
  };

  const handlePostAnnouncement = async (e) => {
    e.preventDefault();
    if (!newNotice.trim()) return;
    await addDoc(collection(db, 'announcements'), { text: newNotice, createdAt: serverTimestamp() });
    setNewNotice('');
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !chatTarget) return;
    const chatId = [user.uid, chatTarget.id].sort().join('_');
    await addDoc(collection(db, 'chats', chatId, 'messages'), {
      senderId: user.uid, senderName: profile.fullName, text: newMessage, createdAt: serverTimestamp()
    });
    setNewMessage('');
  };

  const handleVerifyStudent = async (studentId, status) => {
    await updateDoc(doc(db, 'profiles', studentId), { isVerified: status });
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-blue-600 font-bold">Loading Global Digi Campus...</div>;
  if (!user || !profile) return <AuthScreen onSuccess={setProfile} />;

  if (!profile.isVerified) {
    return (
      <div className="min-h-screen bg-[#f0f2f5] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-md p-6 text-center space-y-4">
          <ShieldCheck className="w-12 h-12 text-blue-600 mx-auto" />
          <h2 className="text-xl font-bold">College ID Verification Pending</h2>
          <p className="text-sm text-slate-600">Hello <strong>{profile.fullName}</strong> ({profile.college}). Super Admin is verifying ID <strong>{profile.collegeIdNumber}</strong>.</p>
          <button onClick={() => signOut(auth)} className="text-xs text-blue-600 font-semibold border border-blue-200 px-4 py-2 rounded-xl">Sign Out</button>
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

  const verifiedPeers = peers.filter((p) => p.isVerified && p.id !== user.uid && (!searchQuery || `${p.fullName} ${p.course} ${p.college} ${p.country}`.toLowerCase().includes(searchQuery.toLowerCase())));

  const badgeColors = {
    notes: 'bg-blue-100 text-blue-700',
    project: 'bg-purple-100 text-purple-700',
    career: 'bg-emerald-100 text-emerald-700',
    games: 'bg-amber-100 text-amber-800',
    moral_support: 'bg-pink-100 text-pink-700'
  };

  return (
    <div className="min-h-screen bg-[#f0f2f5] pb-24">
      <header className="bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-500 text-white sticky top-0 z-20 px-4 py-3 shadow-md">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="bg-white/20 p-2 rounded-xl"><GraduationCap className="w-6 h-6 text-white" /></div>
            <div>
              <h1 className="font-extrabold text-base tracking-tight leading-tight">Global Digi Campus</h1>
              <p className="text-[11px] text-blue-100">{profile.college} • {profile.course}</p>
            </div>
          </div>
         <button onClick={() => setShowEditProfile(true)} className="text-xs bg-white/15 hover:bg-white/25 px-3 py-1.5 rounded-full font-semibold flex items-center gap-1">
  <UserCog className="w-3.5 h-3.5" /> Edit
</button>
 <button onClick={() => signOut(auth)} className="text-xs bg-white/15 hover:bg-white/25 px-3 py-1.5 rounded-full font-semibold flex items-center gap-1">
            <LogOut className="w-3.5 h-3.5" /> Logout
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 space-y-4">
        {announcements.length > 0 && (
          <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-2xl p-3.5 shadow-sm flex items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <Megaphone className="w-4 h-4 shrink-0" />
              <span><strong>Campus Notice:</strong> {announcements.text}</span>
            </div>
            {profile.role === 'admin' && (
              <button onClick={() => deleteDoc(doc(db, 'announcements', announcements.id))} className="text-white/80 hover:text-white"><Trash2 className="w-3.5 h-3.5" /></button>
            )}
          </div>
        )}

        {(activeTab === 'feed' || activeTab === 'peers') && (
          <div className="relative">
            <Search className="w-4 h-4 text-blue-500 absolute left-3.5 top-3" />
            <input type="text" placeholder="Search any course, college, country, notes, or project..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-white border border-slate-200 rounded-full pl-10 pr-4 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        )}

        {activeTab === 'feed' && (
          <>
            <form onSubmit={handleCreatePost} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-blue-600 uppercase">Create Global Student Post</span>
                <select value={postCategory} onChange={(e) => setPostCategory(e.target.value)} className="border border-blue-200 rounded-full px-3 py-1 text-xs font-semibold text-blue-700 bg-blue-50">
                  <option value="notes">📚 Notes & Study Material</option>
                  <option value="project">💡 Project Idea / Help</option>
                  <option value="career">🎯 Career & Competitive Exams</option>
                  <option value="games">🎮 Entertainment , Quiz & Fun</option>
                </select>
              </div>
              <input type="text" placeholder="What's your topic? (e.g., MBA Operations Research Notes)" value={postTitle} onChange={(e) => setPostTitle(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm" />
              <textarea rows="2" placeholder="Share notes, Google Drive link, question, or idea with students worldwide..." value={postContent} onChange={(e) => setPostContent(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm" />
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
                  <input type="checkbox" checked={needsFaculty} onChange={(e) => setNeedsFaculty(e.target.checked)} className="accent-blue-600" /> Request Faculty Help Later
                </label>
                <button type="submit" className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold px-5 py-2 rounded-full shadow-sm flex items-center gap-1">
                  <PlusCircle className="w-3.5 h-3.5" /> Post Globally
                </button>
              </div>
            </form>

            <div className="flex gap-2 overflow-x-auto pb-1 text-xs">
              {['all', 'notes', 'project', 'career', 'games'].map((cat) => (
                <button key={cat} onClick={() => setSelectedCategory(cat)} className={`px-4 py-1.5 rounded-full font-semibold capitalize shadow-sm transition ${selectedCategory === cat ? 'bg-blue-600 text-white' : 'bg-white text-slate-700 hover:bg-blue-50'}`}>{cat}</button>
              ))}
            </div>

            <div className="space-y-3">
              {filteredPosts.map((post) => (
                <div key={post.id} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/80 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 text-white font-bold text-xs flex items-center justify-center">
                        {post.authorName?.charAt(0)}
                      </div>
                      <div>
                        <div className="font-bold text-xs text-slate-900">{post.authorName}</div>
                        <div className="text-[11px] text-slate-500">{post.authorCourse} • {post.authorCollege} ({post.authorCountry})</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`uppercase px-2.5 py-0.5 rounded-full text-[10px] font-bold ${badgeColors[post.category] || 'bg-slate-100 text-slate-700'}`}>{post.category}</span>
                      {(profile.role === 'admin' || post.authorId === user.uid) && (
                        <button onClick={() => handleDeletePost(post.id)} className="text-red-500 hover:text-red-700 p-1"><Trash2 className="w-4 h-4" /></button>
                      )}
                    </div>
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm">{post.title}</h3>
                  <p className="text-sm text-slate-700 whitespace-pre-line">{post.content}</p>
                  {post.needsFaculty && <span className="inline-block text-[11px] bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-0.5 rounded-full font-medium">🎓 Faculty / Mentor Review Requested</span>}
                  <div className="pt-2 border-t border-slate-100 flex items-center gap-4">
                    <button onClick={() => handleLikePost(post.id)} className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1">
                      <ThumbsUp className="w-3.5 h-3.5" /> Helpful ({post.likes?.length || 0})
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {activeTab === 'store' && <ProjectStore user={user} profile={profile} />}

        {activeTab === 'peers' && (
          <div className="grid sm:grid-cols-2 gap-3">
            {verifiedPeers.map((peer) => (
              <div key={peer.id} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/80 flex flex-col justify-between space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-sky-500 to-indigo-600 text-white font-bold text-sm flex items-center justify-center shrink-0">
                    {peer.fullName?.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-slate-900 text-sm">{peer.fullName}</h3>
                      <span className="text-[11px] bg-sky-50 text-sky-700 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1"><Globe className="w-3 h-3" /> {peer.country}</span>
                    </div>
                    <p className="text-xs font-medium text-indigo-600 mt-0.5">{peer.course} • {peer.college}</p>
                    <p className="text-[11px] text-slate-400">{peer.university}</p>
                  </div>
                </div>
                <button onClick={() => { setChatTarget(peer); setActiveTab('chat'); }} className="w-full bg-gradient-to-r from-blue-600 to-sky-500 text-white text-xs font-bold py-2 rounded-xl flex items-center justify-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5" /> Message Peer 1-on-1
                </button>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'support' && (
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-pink-600 to-rose-500 text-white rounded-2xl p-4 shadow-sm text-xs flex items-start gap-2.5">
              <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
              <div><strong>Peer Moral Support Wall:</strong> Verified students encouraging each other through exam stress & career doubts. For urgent counseling in India, call <strong>Tele-MANAS 14416</strong> (24/7 free).</div>
            </div>
            <form onSubmit={handleCreatePost} className="bg-white rounded-2xl p-4 shadow-sm space-y-3">
              <input type="text" placeholder="Share what's on your mind..." value={postTitle} onChange={(e) => setPostTitle(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm" />
              <textarea rows="2" placeholder="Fellow students & mentors are here to support you..." value={postContent} onChange={(e) => setPostContent(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm" />
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
                  <input type="checkbox" checked={needsFaculty} onChange={(e) => setNeedsFaculty(e.target.checked)} className="accent-pink-600" /> Request Faculty / Parent Advisor Help
                </label>
                <button type="submit" className="bg-pink-600 text-white text-xs font-bold px-5 py-2 rounded-full">Post Support Request</button>
              </div>
            </form>
            <div className="space-y-3">
              {filteredPosts.map((post) => (
                <div key={post.id} className="bg-white rounded-2xl p-4 shadow-sm space-y-2">
                  <div className="flex justify-between text-xs text-slate-500">
                    <span><strong className="text-pink-600">{post.authorName}</strong> • {post.authorCourse} ({post.authorCountry})</span>
                    {(profile.role === 'admin' || post.authorId === user.uid) && <button onClick={() => handleDeletePost(post.id)} className="text-red-500"><Trash2 className="w-4 h-4" /></button>}
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm">{post.title}</h3>
                  <p className="text-sm text-slate-700">{post.content}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'chat' && (
          <div className="bg-white rounded-2xl p-4 shadow-sm space-y-3">
            {!chatTarget ? (
              <p className="text-sm text-slate-500 text-center py-8">Open <strong>Peers</strong> tab and tap "Message Peer 1-on-1" to start chatting.</p>
            ) : (
              <>
                <div className="border-b border-slate-200 pb-2 flex justify-between items-center">
                  <div>
                    <h3 className="font-bold text-sm text-blue-700">{chatTarget.fullName}</h3>
                    <p className="text-[11px] text-slate-500">{chatTarget.course} • {chatTarget.college}</p>
                  </div>
                  <button onClick={() => setActiveTab('peers')} className="text-xs text-blue-600 font-semibold">Switch Peer</button>
                </div>
                <div className="h-64 overflow-y-auto space-y-2 bg-[#f0f2f5] p-3 rounded-xl">
                  {messages.map((m) => (
                    <div key={m.id} className={`p-2.5 rounded-2xl text-xs max-w-[80%] shadow-sm ${m.senderId === user.uid ? 'bg-blue-600 text-white ml-auto' : 'bg-white text-slate-800'}`}>
                      <span className="block text-[10px] opacity-75 mb-0.5">{m.senderName}</span>
                      {m.text}
                    </div>
                  ))}
                </div>
                <form onSubmit={handleSendMessage} className="flex gap-2">
                  <input type="text" placeholder="Type message..." value={newMessage} onChange={(e) => setNewMessage(e.target.value)} className="flex-1 bg-slate-50 border border-slate-300 rounded-full px-4 py-2 text-sm" />
                  <button type="submit" className="bg-blue-600 text-white px-5 py-2 rounded-full text-xs font-bold">Send</button>
                </form>
              </>
            )}
          </div>
        )}

           {activeTab === 'faculty_desk' && (profile.role === 'college_admin' || profile.role === 'admin') && (
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-indigo-700 to-blue-700 text-white rounded-2xl p-4 shadow-sm">
              <h2 className="font-bold text-sm">🏛️ Faculty & Dean Academic Desk — {profile.college}</h2>
              <p className="text-xs text-indigo-100 mt-1">Verify students from your institution and review student posts requesting faculty guidance.</p>
            </div>

            <div className="bg-white rounded-2xl p-4 shadow-sm space-y-3">
              <h3 className="font-bold text-xs text-indigo-700 uppercase">Campus Student Verification ({profile.college})</h3>
              {peers.filter((s) => s.role === 'student' && (profile.role === 'admin' || s.college === profile.college)).map((student) => (
                <div key={student.id} className="border border-slate-200 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1 text-xs">
                    <div className="font-bold text-slate-900">{student.fullName} ({student.course}) — {student.isVerified ? '✅ Verified' : '⏳ Pending'}</div>
                    <div className="text-slate-500">Roll/ID: <strong>{student.collegeIdNumber}</strong> • Mobile: {student.mobile}</div>
                    {student.idPhotoBase64 && <img src={student.idPhotoBase64} alt="Student ID" className="w-36 rounded-lg border border-slate-300 mt-1" />}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleVerifyStudent(student.id, true)} className="bg-emerald-600 text-white text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5" /> Approve</button>
                    <button onClick={() => handleVerifyStudent(student.id, false)} className="bg-red-50 text-red-600 border border-red-200 text-xs font-bold px-3 py-1.5 rounded-xl">Block</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'admin' && profile.role === 'admin' && (
          <div className="space-y-4">
            <form onSubmit={handlePostAnnouncement} className="bg-white rounded-2xl p-4 shadow-sm border border-amber-200 space-y-2">
              <h2 className="font-bold text-xs text-amber-800 uppercase">👑 Super Admin: Pin Global Announcement Banner</h2>
              <div className="flex gap-2">
                <input type="text" placeholder="Write announcement for all students worldwide..." value={newNotice} onChange={(e) => setNewNotice(e.target.value)} className="flex-1 border border-slate-300 rounded-xl px-3 py-2 text-xs" />
                <button type="submit" className="bg-amber-500 text-white font-bold text-xs px-4 py-2 rounded-xl">Broadcast</button>
              </div>
            </form>

            <div className="bg-white rounded-2xl p-4 shadow-sm space-y-3">
              <h2 className="font-bold text-sm text-blue-700">👑 Super Admin: All Faculty, Deans & Students ({peers.length} Total)</h2>
              {peers.map((member) => (
                <div key={member.id} className="border border-slate-200 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1 text-xs">
                    <div className="font-bold text-slate-900 flex items-center gap-1.5">
                      {member.fullName} ({member.course})
                      {member.role === 'college_admin' && <span className="bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full text-[10px]">🏛️ PROF / DEAN</span>}
                      <span>— {member.isVerified ? '✅ Verified' : '⏳ Pending'}</span>
                    </div>
                    <div className="text-slate-600">{member.college} • {member.university} ({member.country})</div>
                    <div className="text-slate-500">ID No: <strong>{member.collegeIdNumber}</strong> • Mobile: {member.mobile}</div>
                    {member.idPhotoBase64 && <img src={member.idPhotoBase64} alt="ID Card" className="w-40 rounded-lg border border-slate-300 mt-1" />}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleVerifyStudent(member.id, true)} className="bg-emerald-600 text-white text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5" /> Approve</button>
                    <button onClick={() => handleVerifyStudent(member.id, false)} className="bg-red-50 text-red-600 border border-red-200 text-xs font-bold px-3 py-1.5 rounded-xl">Block</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      </main>

          <nav className="fixed bottom-0 inset-x-0 bg-white border-t border-slate-200 py-2 px-1 shadow-lg z-20">
        <div className="max-w-4xl mx-auto flex justify-around text-[10px] font-bold text-slate-500">
          <button onClick={() => setActiveTab('feed')} className={`flex flex-col items-center gap-0.5 ${activeTab === 'feed' ? 'text-blue-600' : ''}`}><BookOpen className="w-5 h-5" /> Feed</button>
          <button onClick={() => setActiveTab('peers')} className={`flex flex-col items-center gap-0.5 ${activeTab === 'peers' ? 'text-sky-600' : ''}`}><Users className="w-5 h-5" /> Peers</button>
          <button onClick={() => setActiveTab('store')} className={`flex flex-col items-center gap-0.5 ${activeTab === 'store' ? 'text-indigo-600' : ''}`}><ShoppingBag className="w-5 h-5" /> Projects ₹</button>
          <button onClick={() => setActiveTab('support')} className={`flex flex-col items-center gap-0.5 ${activeTab === 'support' ? 'text-pink-600' : ''}`}><HeartHandshake className="w-5 h-5" /> Support</button>
          <button onClick={() => setActiveTab('chat')} className={`flex flex-col items-center gap-0.5 ${activeTab === 'chat' ? 'text-blue-600' : ''}`}><MessageSquare className="w-5 h-5" /> Chat</button>
          {(profile.role === 'college_admin' || profile.role === 'admin') && (
            <button onClick={() => setActiveTab('faculty_desk')} className={`flex flex-col items-center gap-0.5 ${activeTab === 'faculty_desk' ? 'text-indigo-700' : ''}`}><GraduationCap className="w-5 h-5" /> Faculty</button>
          )}
          {profile.role === 'admin' && (
            <button onClick={() => setActiveTab('admin')} className={`flex flex-col items-center gap-0.5 ${activeTab === 'admin' ? 'text-amber-600' : ''}`}><ShieldCheck className="w-5 h-5" /> Super Admin</button>
          )}
        </div>
      </nav>

