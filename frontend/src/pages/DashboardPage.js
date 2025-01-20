import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { fetchData } from '../services/apiService';

const DashboardPage = () => {
  const { t } = useTranslation();
  const [sessions, setSessions] = useState([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [mentors, setMentors] = useState(0);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const sessionsData = await fetchData('sessions');
        const statsData = await fetchData('stats');
        setSessions(sessionsData);
        setTotalUsers(statsData.totalUsers);
        setMentors(statsData.mentors);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      }
    };

    loadDashboardData();
  }, []);

  return (
    <div className="p-8 bg-white min-h-screen">
      <h1 className="text-3xl font-bold mb-6">{t('dashboard.title')}</h1>

      <div className="mb-6">
        <h2 className="text-xl font-bold">{t('dashboard.upcomingSessions')}</h2>
        <ul>
          {sessions.map(session => (
            <li key={session.id} className="text-gray-700">
              {session.title} - {session.date}
            </li>
          ))}
        </ul>
        <Link to="/sessions" className="text-blue-500">
          {t('dashboard.viewAllSessions')}
        </Link>
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-bold">{t('dashboard.userStats')}</h2>
        <p className="text-gray-700">
          {t('dashboard.totalUsers')}: {totalUsers}
        </p>
        <p className="text-gray-700">
          {t('dashboard.mentors')}: {mentors}
        </p>
      </div>

      <Link to="/profile" className="text-blue-500">
        <i className="fas fa-user"></i> {t('dashboard.profile')}
      </Link>
    </div>
  );
};

export default DashboardPage;
