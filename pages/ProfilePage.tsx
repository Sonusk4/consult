
import React from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../App';
import { Camera, Mail, Phone, Globe, Lock, Bell, User as UserIcon } from 'lucide-react';

const ProfilePage: React.FC = () => {
  const { user } = useAuth();

  return (
    <Layout title="My Profile">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Header/Cover */}
          <div className="h-32 bg-gradient-to-r from-blue-500 to-indigo-600"></div>
          
          <div className="px-8 pb-8">
            <div className="relative -mt-16 mb-8 flex items-end justify-between">
              <div className="relative group">
                <img src={user?.avatar} className="w-32 h-32 rounded-3xl border-8 border-white object-cover shadow-lg" alt="Avatar" />
                <button className="absolute bottom-2 right-2 bg-blue-600 text-white p-2 rounded-xl shadow-lg hover:scale-110 transition-transform">
                  <Camera size={18} />
                </button>
              </div>
              <div className="flex space-x-3 mb-2">
                <button className="bg-white border-2 border-gray-100 text-gray-700 px-6 py-2.5 rounded-xl font-bold hover:bg-gray-50 transition-all">Cancel</button>
                <button className="bg-blue-600 text-white px-8 py-2.5 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100">Save Changes</button>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="md:col-span-1 space-y-2">
                <h3 className="font-bold text-gray-900 text-lg">Profile Information</h3>
                <p className="text-sm text-gray-500">Update your account photo and personal details here.</p>
                <div className="pt-6 space-y-1">
                  <button className="w-full text-left px-4 py-2.5 rounded-xl bg-blue-50 text-blue-600 font-bold flex items-center"><UserIcon size={18} className="mr-3" /> Account</button>
                  <button className="w-full text-left px-4 py-2.5 rounded-xl text-gray-500 hover:bg-gray-50 font-bold flex items-center"><Lock size={18} className="mr-3" /> Password</button>
                  <button className="w-full text-left px-4 py-2.5 rounded-xl text-gray-500 hover:bg-gray-50 font-bold flex items-center"><Bell size={18} className="mr-3" /> Notifications</button>
                </div>
              </div>

              <div className="md:col-span-2 space-y-6">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Full Name</label>
                    <input type="text" defaultValue={user?.name} className="w-full bg-gray-50 border-none rounded-2xl px-5 py-3.5 text-gray-900 font-medium focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input type="email" defaultValue={user?.email} className="w-full bg-gray-50 border-none rounded-2xl pl-12 pr-5 py-3.5 text-gray-900 font-medium focus:ring-2 focus:ring-blue-500 outline-none" />
                    </div>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Phone Number</label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input type="text" defaultValue="+1 (555) 000-0000" className="w-full bg-gray-50 border-none rounded-2xl pl-12 pr-5 py-3.5 text-gray-900 font-medium focus:ring-2 focus:ring-blue-500 outline-none" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Location</label>
                    <div className="relative">
                      <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input type="text" defaultValue="San Francisco, CA" className="w-full bg-gray-50 border-none rounded-2xl pl-12 pr-5 py-3.5 text-gray-900 font-medium focus:ring-2 focus:ring-blue-500 outline-none" />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Bio / Summary</label>
                  <textarea 
                    rows={4} 
                    className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 text-gray-900 font-medium focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                    placeholder="Tell us a bit about yourself..."
                  ></textarea>
                </div>

                <div className="pt-6 border-t border-gray-50">
                   <h4 className="font-bold text-gray-900 mb-4">Linked Accounts</h4>
                   <div className="space-y-3">
                     {[
                       { name: 'Google', icon: 'G', color: 'bg-red-50 text-red-600', status: 'Connected' },
                       { name: 'LinkedIn', icon: 'L', color: 'bg-blue-50 text-blue-600', status: 'Connected' }
                     ].map((acc, i) => (
                       <div key={i} className="flex items-center justify-between p-4 rounded-2xl border border-gray-100">
                         <div className="flex items-center space-x-3">
                           <div className={`w-10 h-10 rounded-xl ${acc.color} flex items-center justify-center font-black text-lg`}>{acc.icon}</div>
                           <span className="font-bold text-gray-900">{acc.name}</span>
                         </div>
                         <button className="text-sm font-bold text-gray-400 hover:text-red-500">Disconnect</button>
                       </div>
                     ))}
                   </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ProfilePage;
