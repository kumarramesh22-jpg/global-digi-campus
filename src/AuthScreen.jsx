import React, { useState } from 'react';
import { auth, db } from './firebase';
import { EDUCATION_DATA, ADMIN_MOBILE } from './data';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { GraduationCap } from 'lucide-react';

export default function AuthScreen({ onSuccess }) {
  const [isRegister, setIsRegister] = useState(false);
  const [roleType, setRoleType] = useState('student');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [mobile, setMobile] = useState('');
  const [course, setCourse] = useState('MBA');
  const [collegeIdNumber, setCollegeIdNumber] = useState('');
  const [idPhotoBase64, setIdPhotoBase64] = useState('');

  const [country, setCountry] = useState('India');
  const [stateName, setStateName] = useState('Telangana');
  const [district, setDistrict] = useState('Hanamkonda');
  const [university, setUniversity] = useState('Kakatiya University');
  const [college, setCollege] = useState('University Arts & Science College');
  const [customCollege, setCustomCollege] = useState('');
  const [authError, setAuthError] = useState('');

  const handleIdUpload = (e) => {
  const file = e.target.files?.[0];

    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const scale = Math.min(400 / img.width, 1);
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        setIdPhotoBase64(canvas.toDataURL('image/jpeg', 0.6));
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setAuthError('');
    try {
      if (isRegister) {
        if (!collegeIdNumber.trim()) {
          setAuthError('Institutional ID Card Number is mandatory.');
          return;
        }
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        const isAcademicEmail = /\.(edu|ac\.in|edu\.in|ac\.uk|edu\.au)$/i.test(email);
        const isSuperAdmin = mobile.trim() === ADMIN_MOBILE;
        const isCollegeAdmin = roleType === 'college_admin';
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
          role: isSuperAdmin ? 'admin' : roleType,
          isVerified: isSuperAdmin || (!isCollegeAdmin && isAcademicEmail),
          karmaPoints: 10,
          createdAt: serverTimestamp()
        };

        await setDoc(doc(db, 'profiles', cred.user.uid), newProfile);
        onSuccess(newProfile);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err) {
      setAuthError(err.message);
    }
  };

  const statesList = Object.keys(EDUCATION_DATA[country] || { Other: {} });
  const districtsList = Object.keys((EDUCATION_DATA[country] || {})[stateName] || { Other: {} });
  const universitiesList = Object.keys(((EDUCATION_DATA[country] || {})[stateName] || {})[district] || { Other: ['Other'] });
  const collegesList = (((EDUCATION_DATA[country] || {})[stateName] || {})[district] || {})[university] || ['Other'];

  return (
    <div className="min-h-screen bg-[#f0f2f5] flex flex-col justify-center py-8 px-4">
      <div className="max-w-md w-full mx-auto bg-white border border-slate-200 rounded-2xl shadow-md p-6">
        <div className="flex items-center gap-2 justify-center mb-1">
          <GraduationCap className="w-8 h-8 text-blue-600" />
          <h1 className="text-2xl font-extrabold text-slate-900">Global Digi Campus</h1>
        </div>
        <p className="text-center text-xs text-slate-500 mb-5">Verified Students & College Administration Only</p>

        {authError && <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-3 rounded-xl mb-4">{authError}</div>}

        <form onSubmit={handleAuth} className="space-y-3 text-sm">
          {isRegister && (
            <>
              <div className="grid grid-cols-2 gap-2 bg-blue-50 p-1.5 rounded-xl border border-blue-200">
                <button type="button" onClick={() => { setRoleType('student'); setCourse('MBA'); }} className={`py-1.5 rounded-lg text-xs font-bold ${roleType === 'student' ? 'bg-blue-600 text-white' : 'text-blue-700'}`}>
                  🎓 Student Login
                </button>
                <button type="button" onClick={() => { setRoleType('college_admin'); setCourse('Professor / Dean'); }} className={`py-1.5 rounded-lg text-xs font-bold ${roleType === 'college_admin' ? 'bg-indigo-700 text-white' : 'text-indigo-800'}`}>
                  🏛️ College Admin (Prof/Dean)
                </button>
              </div>

              <input type="text" placeholder="Full Name (as on Institutional ID)" required value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full border border-slate-300 rounded-xl px-3 py-2" />
              <div className="grid grid-cols-2 gap-2">
                <input type="tel" placeholder="Mobile Number" required value={mobile} onChange={(e) => setMobile(e.target.value)} className="w-full border border-slate-300 rounded-xl px-3 py-2" />
                <input type="text" placeholder={roleType === 'college_admin' ? 'Designation (e.g. Dean, HOD)' : 'Course (e.g. MBA, B.Tech)'} required value={course} onChange={(e) => setCourse(e.target.value)} className="w-full border border-slate-300 rounded-xl px-3 py-2" />
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
                <label className="block text-xs font-semibold text-slate-700">Campus Location</label>
                <select value={country} onChange={(e) => { setCountry(e.target.value); setStateName('Other'); setDistrict('Other'); setUniversity('Other'); setCollege('Other'); }} className="w-full border border-slate-300 rounded-lg px-2 py-1.5 bg-white text-xs">
                  {Object.keys(EDUCATION_DATA).map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                {country === 'India' && (
                  <>
                    <div className="grid grid-cols-2 gap-2">
                      <select value={stateName} onChange={(e) => { setStateName(e.target.value); setDistrict('Other'); setUniversity('Other'); setCollege('Other'); }} className="w-full border border-slate-300 rounded-lg px-2 py-1.5 bg-white text-xs">
                        {statesList.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                      <select value={district} onChange={(e) => { setDistrict(e.target.value); setUniversity('Other'); setCollege('Other'); }} className="w-full border border-slate-300 rounded-lg px-2 py-1.5 bg-white text-xs">
                        {districtsList.map((d) => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </div>
                    <select value={university} onChange={(e) => { setUniversity(e.target.value); setCollege('Other'); }} className="w-full border border-slate-300 rounded-lg px-2 py-1.5 bg-white text-xs">
                      {universitiesList.map((u) => <option key={u} value={u}>{u}</option>)}
                    </select>
                    <select value={college} onChange={(e) => setCollege(e.target.value)} className="w-full border border-slate-300 rounded-lg px-2 py-1.5 bg-white text-xs">
                      {collegesList.map((col) => <option key={col} value={col}>{col}</option>)}
                    </select>
                  </>
                )}
                {(country !== 'India' || college === 'Other') && (
                  <input type="text" placeholder="Type University / College Name" required value={customCollege} onChange={(e) => setCustomCollege(e.target.value)} className="w-full border border-slate-300 rounded-lg px-2 py-1.5 bg-white text-xs" />
                )}
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
                <label className="block text-xs font-semibold text-slate-700">{roleType === 'college_admin' ? 'Faculty / Dean ID Verification' : 'Student ID Verification'}</label>
                <input type="text" placeholder={roleType === 'college_admin' ? 'Faculty / Employee ID Number' : 'College Roll No / ID Number'} required value={collegeIdNumber} onChange={(e) => setCollegeIdNumber(e.target.value)} className="w-full border border-slate-300 rounded-lg px-2 py-1.5 bg-white text-xs" />
                <input type="file" accept="image/*" onChange={handleIdUpload} className="text-xs w-full" />
              </div>
            </>
          )}

          <input type="email" placeholder="Institutional or Personal Email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full border border-slate-300 rounded-xl px-3 py-2" />
          <input type="password" placeholder="Password (min 6 chars)" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full border border-slate-300 rounded-xl px-3 py-2" />

          <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl">
            {isRegister ? 'Submit ID & Register' : 'Login to Campus'}
          </button>
        </form>

        <button onClick={() => setIsRegister(!isRegister)} className="w-full text-center text-xs text-blue-600 font-semibold mt-4">
          {isRegister ? 'Already registered? Login here' : 'New Student / Professor / Dean? Verify ID'}
        </button>
      </div>
    </div>
  );
}
