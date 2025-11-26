import { Platform } from 'react-native';

// Use localhost for web/iOS simulator, 10.0.2.2 for Android emulator, and local IP for real device
const API_URL = Platform.select({
    android: 'http://10.0.2.2:3000/api',
    ios: 'http://192.168.1.101:3000/api', // Your local IP
    default: 'http://localhost:3000/api',
});

export const api = {
    get: async (endpoint: string) => {
        const res = await fetch(`${API_URL}${endpoint}`);
        if (!res.ok) throw new Error('API Error');
        return res.json();
    },
    post: async (endpoint: string, body: any) => {
        const res = await fetch(`${API_URL}${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });
        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.error || 'API Error');
        }
        return res.json();
    },
    put: async (endpoint: string, body: any) => {
        const res = await fetch(`${API_URL}${endpoint}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });
        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.error || 'API Error');
        }
        return res.json();
    },
    delete: async (endpoint: string) => {
        const res = await fetch(`${API_URL}${endpoint}`, {
            method: 'DELETE',
        });
        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.error || 'API Error');
        }
        return res.json();
    },
};
