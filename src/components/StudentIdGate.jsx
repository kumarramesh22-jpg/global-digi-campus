import React, { useState } from "react";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase"; // Adjust path if your firebase config is elsewhere

export default function StudentIdGate({ user, userProfile, onSubmitted }) {
  const [studentType, setStudentType] = useState("college"); // "school" or "college"
  const [fullName, setFullName] = useState(userProfile?.name || "");
  const [institution, setInstitution] = useState("");
  const [gradeOrCourse, setGradeOrCourse] = useState("");
  const [previewImage, setPreviewImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Compress ID photo in browser so it fits free Firestore limits (< 150 KB)
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 600;
        const scale = MAX_WIDTH / img.width;
        canvas.width = MAX_WIDTH;
        canvas.height = img.height * scale;

        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        const compressedBase64 = canvas.toDataURL("image/jpeg", 0.7);
        setPreviewImage(compressedBase64);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!fullName || !institution || !gradeOrCourse || !previewImage) {
      setError("Please fill all details and upload a clear photo of your ID card.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await setDoc(
        doc(db, "users", user.uid),
        {
          name: fullName,
          studentType,
          institutionName: institution,
          gradeOrCourse,
          idCardImage: previewImage,
          verificationStatus: "pending",
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
      if (onSubmitted) onSubmitted();
    } catch (err) {
      setError("Upload failed: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Screen 1: Waiting for Admin Approval
  if (userProfile?.verificationStatus === "pending") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-6 text-center border border-indigo-100">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center text-2xl font-bold">
            ⏳
          </div>
          <h2 className="text-xl font-bold text-slate-800">ID Verification Pending</h2>
          <p className="text-sm text-slate-600 mt-2">
            Thanks, <span className="font-semibold">{userProfile.name}</span>! Your{" "}
            <span className="capitalize font-semibold">{userProfile.studentType}</span> ID for{" "}
            <span className="font-semibold">{userProfile.institutionName}</span> is under review.
          </p>
          <p className="text-xs text-slate-400 mt-4">
            You will unlock Global Digi Campus automatically once approved.
          </p>
        </div>
      </div>
    );
  }

  // Screen 2: ID Upload Onboarding Form
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-blue-50 p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-6 border border-slate-100">
        <div className="text-center mb-6">
          <span className="px-3 py-1 text-xs font-semibold bg-indigo-100 text-indigo-700 rounded-full">
            Student Verification Gate
          </span>
          <h1 className="text-2xl font-bold text-slate-900 mt-2">Welcome to Global Digi Campus</h1>
          <p className="text-sm text-slate-500 mt-1">
            Verify your School or College ID to connect with verified students.
          </p>
        </div>

        {/* Age-Group Selector */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <button
            type="button"
            onClick={() => setStudentType("school")}
            className={`p-3 rounded-xl border-2 text-left transition ${
              studentType === "school"
                ? "border-emerald-500 bg-emerald-50 text-emerald-900"
                : "border-slate-200 text-slate-600"
            }`}
          >
            <div className="text-lg">🎒</div>
            <div className="font-bold text-sm">School Student</div>
            <div className="text-xs opacity-75">Classes 1 – 12</div>
          </button>

          <button
            type="button"
            onClick={() => setStudentType("college")}
            className={`p-3 rounded-xl border-2 text-left transition ${
              studentType === "college"
                ? "border-indigo-600 bg-indigo-50 text-indigo-900"
                : "border-slate-200 text-slate-600"
            }`}
          >
            <div className="text-lg">🎓</div>
            <div className="font-bold text-sm">College / Univ</div>
            <div className="text-xs opacity-75">UG, PG, MBA, PhD</div>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Enter your name as on ID card"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {studentType === "school" ? "School Name" : "College / University Name"}
            </label>
            <input
              type="text"
              value={institution}
              onChange={(e) => setInstitution(e.target.value)}
              placeholder={
                studentType === "school"
                  ? "e.g., St. Gabriel's High School"
                  : "e.g., University Arts & Science College"
              }
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {studentType === "school" ? "Class / Standard" : "Course & Year"}
            </label>
            <input
              type="text"
              value={gradeOrCourse}
              onChange={(e) => setGradeOrCourse(e.target.value)}
              placeholder={studentType === "school" ? "e.g., Class 9" : "e.g., MBA 1st Year"}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* ID Card Upload Box */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Upload School / College ID Photo
            </label>
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-indigo-300 rounded-xl cursor-pointer bg-indigo-50/40 hover:bg-indigo-50 transition overflow-hidden">
              {previewImage ? (
                <img src={previewImage} alt="ID Preview" className="h-full object-contain" />
              ) : (
                <div className="text-center p-3">
                  <p className="text-sm font-medium text-indigo-700">📷 Tap to Snap or Upload ID</p>
                  <p className="text-xs text-slate-500 mt-1">JPG or PNG (Auto-compressed)</p>
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleImageUpload}
                className="hidden"
              />
            </label>
          </div>

          {error && <p className="text-xs text-red-600 font-medium">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-sm shadow transition"
          >
            {loading ? "Uploading ID..." : "Submit ID for Verification"}
          </button>
        </form>
      </div>
    </div>
  );
}
