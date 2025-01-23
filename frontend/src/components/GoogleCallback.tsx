import { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const GoogleCallback = () => {
    const navigate = useNavigate();
    const { login } = useAuth();

    const handleCallback = useCallback(async () => {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');

        if (!code) {
            console.error('No code found in URL');
            navigate('/login');
            return;
        }

        try {
            console.log('Iniciando proceso de callback con código:', code.substring(0, 10) + '...');
            
            const response = await fetch(`http://localhost:5001/auth/google/callback?code=${code}`, {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                }
            });

            console.log('Respuesta del servidor:', {
                status: response.status,
                statusText: response.statusText,
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error('Error detallado del servidor:', errorData);
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('Datos recibidos:', {
                hasToken: !!data.token,
                hasUser: !!data.user,
                userRole: data.user?.role
            });

            if (data.token) {
                login(data);
                if (data.user.role && data.user.role !== 'pending') {
                    navigate('/dashboard');
                } else {
                    navigate('/profile');
                }
            }
        } catch (error) {
            console.error('Error completo durante el callback:', error);
            navigate('/login');
        }
    }, [navigate, login]);

    useEffect(() => {
        handleCallback();
    }, [handleCallback]);

    return <div className="text-white">Procesando autenticación...</div>;
};

export default GoogleCallback; 