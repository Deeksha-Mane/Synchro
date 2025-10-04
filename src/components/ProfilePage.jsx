import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
import { db } from '../firebase';
import ImagePreview from './ImagePreview';

export default function ProfilePage() {
  const { currentUser } = useAuth();
  const [userData, setUserData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    fullName: '',
    rollNumber: '',
    branch: '',
    year: '',
    phone: '',
    skills: '',
    profileImage: '',
    bio: '',
    github: '',
    linkedin: '',
    portfolio: ''
  });

  useEffect(() => {
    fetchUserData();
  }, [currentUser]);

  const fetchUserData = async () => {
    if (!currentUser) return;
    
    try {
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        setUserData(data);
        setEditForm({
          fullName: data.fullName || '',
          rollNumber: data.rollNumber || '',
          branch: data.branch || '',
          year: data.year || '',
          phone: data.phone || '',
          skills: Array.isArray(data.skills) ? data.skills.join(', ') : '',
          profileImage: data.profileImage || '',
          bio: data.bio || '',
          github: data.github || '',
          linkedin: data.linkedin || '',
          portfolio: data.portfolio || ''
        });
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setEditForm({
      ...editForm,
      [e.target.name]: e.target.value
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updatedData = {
        ...editForm,
        skills: editForm.skills.split(',').map(skill => skill.trim()).filter(skill => skill),
        updatedAt: new Date().toISOString()
      };

      // Update Firestore (create if doesn't exist)
      await setDoc(doc(db, 'users', currentUser.uid), updatedData, { merge: true });

      // Update Firebase Auth profile
      await updateProfile(currentUser, {
        displayName: editForm.fullName,
        photoURL: editForm.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(editForm.fullName)}&background=3b82f6&color=fff&size=200`
      });

      setUserData({ ...userData, ...updatedData });
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-12 text-white relative">
          <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-8">
            {/* Profile Image */}
            <div className="relative">
              <ImagePreview 
                imageUrl={isEditing ? editForm.profileImage : (userData?.profileImage || currentUser?.photoURL)}
                fallbackName={userData?.fullName || currentUser?.displayName || 'User'}
                className="w-32 h-32"
              />
              {isEditing && (
                <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm">Edit</span>
                </div>
              )}
            </div>

            {/* Basic Info */}
            <div className="text-center md:text-left flex-1">
              <h1 className="text-3xl font-bold mb-2">
                {userData?.fullName || currentUser?.displayName || 'User'}
              </h1>
              <p className="text-blue-100 text-lg mb-2">
                {userData?.branch} • {userData?.year}
              </p>
              <p className="text-blue-200">
                Roll No: {userData?.rollNumber}
              </p>
              <p className="text-blue-200">
                {currentUser?.email}
              </p>
            </div>

            {/* Edit Button */}
            <div>
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="bg-white text-blue-600 px-6 py-2 rounded-lg font-semibold hover:bg-gray-100 transition duration-300"
                >
                  Edit Profile
                </button>
              ) : (
                <div className="space-x-3">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-green-500 text-white px-6 py-2 rounded-lg font-semibold hover:bg-green-600 transition duration-300 disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="bg-gray-500 text-white px-6 py-2 rounded-lg font-semibold hover:bg-gray-600 transition duration-300"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="p-8">
          {isEditing ? (
            /* Edit Form */
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">Personal Information</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                  <input
                    type="text"
                    name="fullName"
                    value={editForm.fullName}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Roll Number</label>
                    <input
                      type="text"
                      name="rollNumber"
                      value={editForm.rollNumber}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Year</label>
                    <select
                      name="year"
                      value={editForm.year}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select Year</option>
                      <option value="FE">First Year</option>
                      <option value="SE">Second Year</option>
                      <option value="TE">Third Year</option>
                      <option value="BE">Final Year</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Branch</label>
                  <select
                    name="branch"
                    value={editForm.branch}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select Branch</option>
                    <option value="Computer Engineering">Computer Engineering</option>
                    <option value="Information Technology">Information Technology</option>
                    <option value="Electronics & Telecommunication">Electronics & Telecommunication</option>
                    <option value="Mechanical Engineering">Mechanical Engineering</option>
                    <option value="Civil Engineering">Civil Engineering</option>
                    <option value="Electrical Engineering">Electrical Engineering</option>
                    <option value="Production Engineering">Production Engineering</option>
                    <option value="Metallurgy Engineering">Metallurgy Engineering</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                  <input
                    type="tel"
                    name="phone"
                    value={editForm.phone}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Profile Image URL</label>
                  <input
                    type="url"
                    name="profileImage"
                    value={editForm.profileImage}
                    onChange={handleInputChange}
                    placeholder="https://example.com/your-image.jpg"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {editForm.profileImage && (
                    <div className="mt-3">
                      <p className="text-sm text-gray-600 mb-2">Preview:</p>
                      <ImagePreview 
                        imageUrl={editForm.profileImage}
                        fallbackName={editForm.fullName || 'User'}
                        className="w-16 h-16"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">Additional Information</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
                  <textarea
                    name="bio"
                    value={editForm.bio}
                    onChange={handleInputChange}
                    rows={4}
                    placeholder="Tell us about yourself..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Skills (comma separated)</label>
                  <input
                    type="text"
                    name="skills"
                    value={editForm.skills}
                    onChange={handleInputChange}
                    placeholder="React, Node.js, Python, etc."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">GitHub Profile</label>
                  <input
                    type="url"
                    name="github"
                    value={editForm.github}
                    onChange={handleInputChange}
                    placeholder="https://github.com/username"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">LinkedIn Profile</label>
                  <input
                    type="url"
                    name="linkedin"
                    value={editForm.linkedin}
                    onChange={handleInputChange}
                    placeholder="https://linkedin.com/in/username"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Portfolio Website</label>
                  <input
                    type="url"
                    name="portfolio"
                    value={editForm.portfolio}
                    onChange={handleInputChange}
                    placeholder="https://yourportfolio.com"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          ) : (
            /* Display Mode */
            <div className="grid md:grid-cols-3 gap-8">
              {/* Left Column - Personal Info */}
              <div className="md:col-span-2 space-y-8">
                {/* Bio Section */}
                {userData?.bio && (
                  <div>
                    <h3 className="text-xl font-semibold text-gray-800 mb-4">About</h3>
                    <p className="text-gray-600 leading-relaxed">{userData.bio}</p>
                  </div>
                )}

                {/* Skills Section */}
                {userData?.skills && userData.skills.length > 0 && (
                  <div>
                    <h3 className="text-xl font-semibold text-gray-800 mb-4">Skills</h3>
                    <div className="flex flex-wrap gap-2">
                      {userData.skills.map((skill, index) => (
                        <span
                          key={index}
                          className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Contact & Links */}
                <div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-4">Contact & Links</h3>
                  <div className="space-y-3">
                    {userData?.phone && (
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">📱</span>
                        <span className="text-gray-600">{userData.phone}</span>
                      </div>
                    )}
                    {userData?.github && (
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">🐙</span>
                        <a href={userData.github} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                          GitHub Profile
                        </a>
                      </div>
                    )}
                    {userData?.linkedin && (
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">💼</span>
                        <a href={userData.linkedin} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                          LinkedIn Profile
                        </a>
                      </div>
                    )}
                    {userData?.portfolio && (
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">🌐</span>
                        <a href={userData.portfolio} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                          Portfolio Website
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column - Stats & Achievements */}
              <div className="space-y-6">
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Hackathon Stats</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Projects</span>
                      <span className="font-semibold">3</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Rank</span>
                      <span className="font-semibold">#12</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Team</span>
                      <span className="font-semibold">Code Warriors</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Achievements</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center space-x-2">
                      <span>🏆</span>
                      <span>Winner - COEP TechFest 2023</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span>🥈</span>
                      <span>Runner-up - Smart India Hackathon</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span>🎯</span>
                      <span>Best Innovation Award</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}