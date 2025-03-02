// Servicio para manejar las solicitudes a la API
const API_URL = 'http://localhost:5001';

// Función para obtener el token del localStorage
const getToken = (): string | null => {
  const token = localStorage.getItem('token');
  
  // Depuración: Imprimir información sobre el token
  if (token) {
    console.log('Token encontrado en localStorage:', token.substring(0, 20) + '...');
    
    // Verificar si el token parece un JWT válido (formato: xxx.yyy.zzz)
    const tokenParts = token.split('.');
    if (tokenParts.length !== 3) {
      console.warn('El token no parece tener un formato JWT válido');
    }
  } else {
    console.warn('No se encontró token en localStorage');
  }
  
  return token;
};

// Función para renovar el token
export const renewToken = async () => {
  // Obtener información del usuario del localStorage
  const userStr = localStorage.getItem('user');
  if (!userStr) {
    throw new Error('No user data found');
  }
  
  const user = JSON.parse(userStr);
  
  try {
    // Hacer una solicitud para renovar el token
    const response = await fetch(`${API_URL}/renew-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email: user.email })
    });
    
    if (!response.ok) {
      throw new Error(`Failed to renew token: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Guardar el nuevo token en localStorage
    localStorage.setItem('token', data.token);
    
    return data.token;
  } catch (error) {
    console.error('Error renovando el token:', error);
    throw error;
  }
};

// Función para hacer solicitudes GET autenticadas
export const apiGet = async (endpoint: string) => {
  const token = getToken();
  
  if (!token) {
    console.error('No authentication token found. Redirecting to login...');
    // Redirigir al login después de un breve retraso
    setTimeout(() => {
      window.location.href = '/login';
    }, 100);
    throw new Error('No authentication token found');
  }
  
  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      
      // Si el error es de autenticación, intentar renovar el token
      if (response.status === 401) {
        console.warn('Token inválido. Intentando renovar...');
        try {
          // Intentar renovar el token (implementar esta función)
          const newToken = await renewToken();
          if (newToken) {
            // Reintentar la solicitud con el nuevo token
            const retryResponse = await fetch(`${API_URL}${endpoint}`, {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${newToken}`,
                'Content-Type': 'application/json'
              }
            });
            
            if (!retryResponse.ok) {
              throw new Error(`HTTP error after token renewal! status: ${retryResponse.status}`);
            }
            
            return retryResponse.json();
          }
        } catch (renewError) {
          console.error('Error renovando el token:', renewError);
          // Redirigir al login si no se puede renovar el token
          window.location.href = '/login';
          throw new Error('Failed to renew authentication token');
        }
      }
      
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorData.error || 'Unknown error'}`);
    }
    
    return response.json();
  } catch (error) {
    console.error(`Error in apiGet(${endpoint}):`, error);
    throw error;
  }
};

// Función para hacer solicitudes POST autenticadas
export const apiPost = async (endpoint: string, data: any) => {
  const token = getToken();
  
  if (!token) {
    throw new Error('No authentication token found');
  }
  
  const response = await fetch(`${API_URL}${endpoint}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`HTTP error! status: ${response.status}, message: ${errorData.error || 'Unknown error'}`);
  }
  
  return response.json();
};

// Función para hacer solicitudes PUT autenticadas
export const apiPut = async (endpoint: string, data: any) => {
  const token = getToken();
  
  if (!token) {
    throw new Error('No authentication token found');
  }
  
  const response = await fetch(`${API_URL}${endpoint}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`HTTP error! status: ${response.status}, message: ${errorData.error || 'Unknown error'}`);
  }
  
  return response.json();
};

// Función para hacer solicitudes DELETE autenticadas
export const apiDelete = async (endpoint: string) => {
  const token = getToken();
  
  if (!token) {
    throw new Error('No authentication token found');
  }
  
  const response = await fetch(`${API_URL}${endpoint}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`HTTP error! status: ${response.status}, message: ${errorData.error || 'Unknown error'}`);
  }
  
  return response.json();
};

// Función para probar el token
export const testToken = async () => {
  const token = getToken();
  
  if (!token) {
    return {
      valid: false,
      error: 'No authentication token found'
    };
  }
  
  try {
    const response = await fetch(`${API_URL}/test-token`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      console.error('Error en la prueba del token:', data);
      return {
        valid: false,
        error: data.error || 'Unknown error'
      };
    }
    
    return data;
  } catch (error) {
    console.error('Error al probar el token (posiblemente un problema de conexión):', error);
    // Si hay un error de conexión, asumimos que el token podría ser válido
    return {
      valid: true,  // Asumimos que es válido si no podemos verificarlo
      error: error instanceof Error ? error.message : 'Unknown error',
      connectionError: true
    };
  }
}; 