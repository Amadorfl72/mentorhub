import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Button, Sidebar, Avatar } from 'flowbite-react';
import { HiHome, HiCalendar, HiUser, HiLogout } from 'react-icons/hi';

const DashboardPage = () => {
  const { user, logout } = useAuth();

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar aria-label="Dashboard sidebar">
        <Sidebar.Items>
          <Sidebar.ItemGroup>
            <Sidebar.Item href="#" icon={HiHome}>
              Dashboard
            </Sidebar.Item>
            <Sidebar.Item href="#" icon={HiCalendar}>
              Sessions
            </Sidebar.Item>
            <Sidebar.Item href="#" icon={HiUser}>
              Profile
            </Sidebar.Item>
          </Sidebar.ItemGroup>
        </Sidebar.Items>
      </Sidebar>

      {/* Main Content */}
      <div className="flex-1 p-8">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <Avatar 
              img={user?.photoUrl} 
              rounded 
              size="lg"
            />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Welcome, {user?.name}!
              </h1>
              <p className="text-gray-500">
                {user?.role === 'mentor' ? 'Mentor' : 'Mentee'}
              </p>
            </div>
          </div>
          <Button 
            color="light" 
            onClick={logout}
            className="flex items-center gap-2"
          >
            <HiLogout className="h-5 w-5" />
            Logout
          </Button>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm">
          <p className="text-gray-600">
            Welcome to your MentorHub dashboard. Select a service from the menu to get started.
          </p>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage; 