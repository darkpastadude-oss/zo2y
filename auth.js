const API_BASE = '/api/auth';

async function signUp(userData) {
    try {
        const response = await fetch(`${API_BASE}/signup`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(userData)
        });

        const data = await response.json();
        
        if (response.ok) {
            if (data?.token) localStorage.setItem('token', data.token);
            if (data?.user) localStorage.setItem('user', JSON.stringify(data.user));
            return { success: true, message: data.message || 'Account created successfully.' };
        } else {
            return { success: false, message: data.message || 'Could not create account.' };
        }
    } catch (error) {
        console.error('Signup error:', error);
        return { success: false, message: 'Network error. Please try again.' };
    }
}

async function login(userData) {
    try {
        const response = await fetch(`${API_BASE}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(userData)
        });

        const data = await response.json();
        
        if (response.ok) {
            if (data?.token) localStorage.setItem('token', data.token);
            if (data?.user) localStorage.setItem('user', JSON.stringify(data.user));
            return { success: true, message: data.message || 'Logged in successfully.' };
        } else {
            return { success: false, message: data.message || 'Login failed.' };
        }
    } catch (error) {
        console.error('Login error:', error);
        return { success: false, message: 'Network error. Please try again.' };
    }
}
