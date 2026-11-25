import React, { useState, useEffect } from 'react';
import { auth, db } from './firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import {
  doc,
  setDoc,
  getDoc,
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  updateDoc,
  where,
  serverTimestamp
} from 'firebase/firestore';
import {
  GraduationCap,
  Users,
  BookOpen,
  HeartHandshake,
  ShieldCheck,
  MessageSquare,
  LogOut,
  PlusCircle,
  CheckCircle,
  Globe,
  Search,
  AlertTriangle
} from 'lucide-react';

// Hierarchical Location & University Data (Expandable + "Other" Manual Entry)
const EDUCATION_DATA = {
  India: {
    Telangana: {
      Hanamkonda: {
        'Kakatiya University': ['University Arts & Science College', 'Chaitanya Deemed to be University', 'Vaagdevi Degree & PG College', 'Other'],
        'JNTUH Affiliated': ['KITSW (Kakatiya Institute of Technology & Science)', 'SR University', 'Other'],
        Other: ['Other']
      },
      Warangal: {
        'Kakatiya University': ['KU Campus Colleges', 'Lal Bahadur College', 'Other'],
        'NIT Warangal': ['National Institute of Technology Warangal', 'Other'],
        Other: ['Other']
      },
      Hyderabad: {
        'Osmania University': ['University College of Commerce & Business Management', 'Nizam College', 'Other'],
        'JNTUH': ['JNTUH College of Engineering', 'CBIT', 'VNR VJIET', 'Other'],
        'Guru Nanak University': ['Guru Nanak Institutions', 'Other'],
        Other: ['Other']
      },
      Other: { Other: ['Other'] }
    },
    'Andhra Pradesh': {
      Visakhapatnam: { 'Andhra University': ['AU College of Engineering', 'Other'], Other: ['Other'] },
      Vijayawada: { 'Acharya Nagarjuna University': ['KL University', 'VR Siddhartha', 'Other'], Other: ['Other'] },
      Other: { Other: ['Other'] }
    },
    Maharashtra: {
      Mumbai: { 'University of Mumbai': ['St. Xavier’s College', 'NMIMS', 'IIT Bombay', 'Other'], Other: ['Other'] },
      Pune: { 'Savitribai Phule Pune University': ['Fergusson College', 'COEP', 'Symbiosis', 'Other'], Other: ['Other'] },
      Other: { Other: ['Other'] }
    },
    Karnataka: {
      Bengaluru: { 'Bangalore University': ['Christ University', 'RV College of Engineering', 'IISc', 'Other'], Other: ['Other'] },
      Other: { Other: ['Other'] }
    },
    Other: { Other: { Other: ['Other'] } }
  },
  'United States': { Other: { Other: { Other: ['Other'] } } },
  'United Kingdom': { Other: { Other: { Other: ['Other'] } } },
  Canada: { Other: { Other: { Other: ['Other'] } } },
  Other: { Other: { Other: { Other: ['Other'] } } }
};

const ADMIN_MOBILE = '9963088662'; // Auto-grants Super Admin privileges

export default function App() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Auth & Registration State
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [mobile, setMobile] = useState('');
  const [course, setCourse] = useState('MBA');
  const [collegeIdNumber, setCollegeIdNumber] = useState('');
  const [idPhotoBase64, setIdPhotoBase64] = useState('');

  // Cascading Location Dropdowns
  const [country, setCountry] = useState('India');
  const [stateName, setStateName] = useState('Telangana');
  const [district, setDistrict] = useState('Hanamkonda');
  const [university, setUniversity] = useState('Kakatiya University');
  const [college, setCollege] = useState('University Arts & Science College');
  const [customCollege, setCustomCollege] = useState('');
  const [authError, setAuthError] = useState('');

  // Main App Navigation & Data
  const [activeTab, setActiveTab] = useState('feed'); // 'feed', 'peers', 'support', 'chat', 'admin'
  const [posts, setPosts] = useState([]);
  const [peers, setPeers] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // New Post Form
  const [postCategory, setPostCategory] = useState('notes');
  const [postTitle, setPostTitle] = useState('');
  const [postContent, setPostContent] = useState('');
  const [needsFaculty, setNeedsFaculty] = useState(false);

  // 1-on-1 Peer Chat
  const [chatTarget, setChatTarget] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');

  // Listen to Auth State
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const snap = await getDoc(doc(db, 'profiles', currentUser.uid));
        if (snap.exists()) setProfile(snap.data());
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // Listen to Posts & Verified Peers
  useEffect(() => {
    if (!profile?.isVerified) return;

    const qPosts = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
    const unsubPosts = onSnapshot(qPosts, (snap) => {
      setPosts(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    const unsubPeers = onSnapshot(collection(db, 'profiles'), (snap) => {
      setPeers(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    return () => {
      unsubPosts();
      unsubPeers();
    };
  }, [profile]);

  // Listen to Admin Pending List if Admin
  useEffect(() => {
    if (profile?.role !== 'admin') return;
    const unsubPeers = onSnapshot(collection(db, 'profiles'), (snap) => {
      setPeers(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsubPeers();
  }, [profile]);

  // Listen to 1-on-1 Chat Messages
  useEffect(() => {
    if (!user || !chatTarget) return;
    const chatId = [user.uid, chatTarget.id].sort().join('_');
    const qChat = query(collection(db, 'chats', chatId, 'messages'), orderBy('createdAt', 'asc'));
    const unsub = onSnapshot(qChat, (snap) => {
      setMessages(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, [user, chatTarget]);

  // Compress ID Card Image to Base64 (Zero Storage Cost)
  const handleIdUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const scale = Math.min(400 / img.width, 1);
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        setIdPhotoBase64(canvas.toDataURL('image/jpeg', 0.6));
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  // Register or Login
  const handleAuth = async (e) => {
    e.preventDefault();
    setAuthError('');
    try {
      if (isRegister) {
        if (!collegeIdNumber.trim()) {
          setAuthError('College ID Card Number is mandatory.');
          return;
        }
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        const isAcademicEmail = /\.(edu|ac\.in|edu\.in|ac\.uk|edu\.au)$/i.test(email);
        const isSuperAdmin = mobile.trim() === ADMIN_MOBILE;
        const finalCollege = college === 'Other' || customCollege ? customCollege || 'Other College' : college;

        const newProfile = {
          uid: cred.user.uid,
          fullName,
          email,
          mobile,
          course,
          collegeIdNumber,
          idPhotoBase64,
          country,
          state: stateName,
          district,
          university,
          college: finalCollege,
          role: isSuperAdmin ? 'admin' : 'student',
          isVerified: isAcademicEmail || isSuperAdmin,
          karmaPoints: 10,
          createdAt: serverTimestamp()
        };

        await setDoc(doc(db, 'profiles', cred.user.uid), newProfile);
        setProfile(newProfile);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err) {
      setAuthError(err.message);
    }
  };

  // Create Post
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

  // Send 1-on-1 Peer Message
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

  // Admin Verify Student
  const handleVerifyStudent = async (studentId, status) => {
    await updateDoc(doc(db, 'profiles', studentId), { isVerified: status });
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-slate-600 font-medium">Loading Global Digi Campus...</div>;
  }

  // 1. LOGIN / VERIFIED STUDENT REGISTRATION SCREEN
