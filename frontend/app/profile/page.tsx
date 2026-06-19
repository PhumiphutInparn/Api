"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { getUserByIdAPI, updateUserAPI, uploadProfileAPI } from "../../services/api";

export default function ProfilePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    role: "",
    profile_picture: "",
  });

  useEffect(() => {
    const fetchUserData = async () => {
      const storedUserId = localStorage.getItem("user_id");
      if (!storedUserId) {
        router.push("/login");
        return;
      }
      setUserId(storedUserId);

      try {
        const data = await getUserByIdAPI(storedUserId);
        const user = data?.data || data;

        const fallbackImage = "https://cdn-icons-png.flaticon.com/512/149/149071.png";
        const currentImage = user.profile_picture ? user.profile_picture : fallbackImage;

        setFormData({
          first_name: user.first_name || "",
          last_name: user.last_name || "",
          email: user.email || "",
          role: user.role || "member",
          profile_picture: currentImage,
        });
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    if (!userId) return;
    try {
      setLoading(true);
      await updateUserAPI(userId, {
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        role: formData.role,
      });
      alert("อัปเดตข้อมูลสำเร็จ!");
      setIsEditing(false);
    } catch (error) {
      alert("เกิดข้อผิดพลาดในการอัปเดต หรืออีเมลซ้ำในระบบ");
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setLoading(true);
      const res = await uploadProfileAPI(file);

      if (res.imageUrl) {
        setFormData((prev) => ({ ...prev, profile_picture: res.imageUrl }));
        alert("เปลี่ยนรูปโปรไฟล์สำเร็จ!");
      }
    } catch (error) {
      alert("เกิดข้อผิดพลาดในการอัปโหลด");
    } finally {
      setLoading(false);
    }
  };

  if (loading && !formData.first_name) {
    return <div className="min-h-screen flex items-center justify-center">กำลังโหลดข้อมูล...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Welcome, {formData.first_name || "User"}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <button
            onClick={() => router.push("/books")}
            className="bg-white text-gray-700 border border-gray-300 hover:border-black px-5 py-2.5 rounded-xl text-sm font-medium transition-all shadow-sm"
          >
            กลับหน้าหลัก
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="h-32 bg-gradient-to-r from-gray-100 via-gray-50 to-gray-200"></div>

          <div className="px-8 pb-8">
            <div className="flex justify-between items-end -mt-12 mb-8">
              <div className="flex items-end space-x-6">
                <div className="relative group">
                  <div className="w-28 h-28 rounded-full border-4 border-white overflow-hidden bg-gray-200 shadow-md">
                    <img
                      src={formData.profile_picture}
                      alt="Profile"
                      className="w-full h-full object-cover"
                      onError={(e) => { e.currentTarget.src = "https://cdn-icons-png.flaticon.com/512/149/149071.png" }}
                    />
                  </div>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-0 right-0 bg-black text-white p-2 rounded-full shadow-lg hover:bg-gray-800 transition-transform hover:scale-105"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageChange}
                    className="hidden"
                    accept="image/*"
                  />
                </div>

                <div className="pb-2">
                  <h2 className="text-xl font-bold text-gray-900">
                    {formData.first_name} {formData.last_name}
                  </h2>
                  <p className="text-sm text-gray-500">{formData.email}</p>
                </div>
              </div>

              <div className="pb-2">
                {isEditing ? (
                  <div className="space-x-3">
                    <button
                      onClick={() => setIsEditing(false)}
                      className="px-6 py-2 rounded-xl text-sm font-medium text-gray-600 border border-gray-300 hover:bg-gray-50 transition-colors"
                    >
                      ยกเลิก
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={loading}
                      className="px-6 py-2 rounded-xl text-sm font-medium text-white bg-black hover:bg-gray-800 transition-colors"
                    >
                      {loading ? "กำลังบันทึก..." : "บันทึกข้อมูล"}
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-6 py-2 rounded-xl text-sm font-medium text-black border border-gray-300 hover:border-black transition-colors"
                  >
                    Edit Profile
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 mt-8">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-900">First Name</label>
                <input
                  type="text"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                  readOnly={!isEditing}
                  className={`w-full rounded-xl px-4 py-3 text-sm transition-all outline-none ${
                    isEditing
                      ? "bg-white border-2 border-blue-500 text-gray-900 shadow-sm"
                      : "bg-gray-50 border-2 border-transparent text-gray-500"
                  }`}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-900">Last Name</label>
                <input
                  type="text"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  readOnly={!isEditing}
                  className={`w-full rounded-xl px-4 py-3 text-sm transition-all outline-none ${
                    isEditing
                      ? "bg-white border-2 border-blue-500 text-gray-900 shadow-sm"
                      : "bg-gray-50 border-2 border-transparent text-gray-500"
                  }`}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-900">Email Address</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  readOnly={!isEditing}
                  className={`w-full rounded-xl px-4 py-3 text-sm transition-all outline-none ${
                    isEditing
                      ? "bg-white border-2 border-blue-500 text-gray-900 shadow-sm"
                      : "bg-gray-50 border-2 border-transparent text-gray-500"
                  }`}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-900">Role</label>
                {isEditing ? (
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    className="w-full bg-white border-2 border-blue-500 text-gray-900 rounded-xl px-4 py-3 text-sm shadow-sm outline-none"
                  >
                    <option value="member">Member</option>
                    <option value="admin">Admin</option>
                  </select>
                ) : (
                  <input
                    type="text"
                    value={formData.role === 'admin' ? 'Administrator' : 'Member'}
                    readOnly
                    className="w-full bg-gray-100 border-2 border-transparent text-gray-400 cursor-not-allowed rounded-xl px-4 py-3 text-sm"
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}