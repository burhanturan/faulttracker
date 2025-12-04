
import { Platform } from 'react-native';

// Use localhost for web/iOS simulator, 10.0.2.2 for Android emulator, and local IP for real device
// Use localhost for web/iOS simulator, 10.0.2.2 for Android emulator, and local IP for real device
// CHANGE THIS TO 'true' WHEN DEVELOPING LOCALLY
const IS_DEV = false;

export const BASE_URL = IS_DEV
    ? Platform.select({
        android: 'http://10.0.2.2:3000', // Android Emulator
        ios: 'http://192.168.1.102:3000', // Physical Device (Update with your PC IP)
        default: 'http://localhost:3000', // Web
    })
    : 'https://fault-tracker-backend.onrender.com';

const API_URL = `${BASE_URL}/api`;

export const api = {
    get: async (endpoint: string) => {
        const res = await fetch(`${API_URL}${endpoint}`);
        if (!res.ok) throw new Error('API Error');
        return res.json();
    },
    post: async (endpoint: string, body: any, isMultipart = false) => {
        const headers: any = isMultipart ? {} : { 'Content-Type': 'application/json' };
        const res = await fetch(`${API_URL}${endpoint}`, {
            method: 'POST',
            headers,
            body: isMultipart ? body : JSON.stringify(body),
        });
        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.error || 'API Error');
        }
        return res.json();
    },
    put: async (endpoint: string, body: any, isMultipart = false) => {
        const headers: any = isMultipart ? {} : { 'Content-Type': 'application/json' };
        const res = await fetch(`${API_URL}${endpoint}`, {
            method: 'PUT',
            headers,
            body: isMultipart ? body : JSON.stringify(body),
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
