import React, { useState } from 'react';
import { db } from './firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { X, Save } from 'lucide-react';

export default function EditProfileModal({ user, profile, onClose, onSaved }) {
  const [fullName, setFullName] = useState(profile.fullName || '');
  const [course, setCourse] = useState(profile.course || '');
  const [college, setCollege] = useState(profile.college || '');
  const [university, setUniversity] = useState(profile.university || '');
  const [collegeIdNumber, setCollegeIdNumber] = useState(profile.collegeIdNumber || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    const updates = { fullName, course, college, university, collegeIdNumber };
    await updateDoc(doc(db, 'profiles', user.uid), updates);
    onSaved({ ...profile, ...updates });
    setSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <h3 className="font-bold text-sm text-blue-700">Edit Your Campus Profile</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSave} className="space-y-3 text-xs">
          <div>
            <label className="font-semibold text-slate-600 block mb-1">Full Name</label>
            <input type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full border border-slate-300 rounded-xl px-3 py-2" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="font-semibold text-slate-600 block mb-1">Course / Role</label>
              <input type="text" required value={course} onChange={(e) => setCourse(e.target.value)} className="w-full border border-slate-300 rounded-xl px-3 py-2" />
            </div>
            <div>
              <label className="font-semibold text-slate-600 block mb-1">ID / Roll Number</label>
              <input type="text" required value={collegeIdNumber} onChange={(e) => setCollegeIdNumber(e.target.value)} className="w-full border border-slate-300 rounded-xl px-3 py-2" />
            </div>
          </div>
          <div>
            <label className="font-semibold text-slate-600 block mb-1">College / Institution</label>
            <input type="text" required value={college} onChange={(e) => setCollege(e.target.value)} className="w-full border border-slate-300 rounded-xl px-3 py-2" />
          </div>
          <div>
            <label className="font-semibold text-slate-600 block mb-1">University</label>
            <input type="text" required value={university} onChange={(e) => setUniversity(e.target.value)} className="w-full border border-slate-300 rounded-xl px-3 py-2" />
          </div>
          <button type="submit" disabled={saving} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl flex items-center justify-center gap-1.5">
            <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  );
}
