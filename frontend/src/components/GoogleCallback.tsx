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
            console.log('Sending code to backend:', code);
            const response = await fetch(`http://localhost:5001/auth/google/callback?code=${code}`, {
                method: 'GET',
                credentials: 'include'
            });

            console.log('Response status:', response.status);

            if (!response.ok) {
                const errorData = await response.json();
                console.log('Error details:', errorData);
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('Response data:', data);

            if (data.token) {
                login({ token: data.token, user: data.user });
                // Si el usuario ya está registrado (tiene role distinto de 'pending')
                if (data.user.role && data.user.role !== 'pending') {
                    navigate('/dashboard');
                } else {
                    navigate('/register');
                }
            }
        } catch (error) {
            console.error('Error during callback:', error);
            navigate('/login');
        }
    }, [navigate, login]);

    useEffect(() => {
        handleCallback();
    }, []); // Solo se ejecuta una vez al montar el componente

    return <div>Processing login...</div>;
};

export default GoogleCallback; 