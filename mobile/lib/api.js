import { getAccessToken } from './supabase';

const API_URL = 'http://localhost:3000/api';

class ApiClient {
    static async getHeaders() {
        const token = await getAccessToken();
        return {
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : '',
        };
    }

    static async get(endpoint) {
        const headers = await this.getHeaders();
        const response = await fetch(`${API_URL}${endpoint}`, { headers });
        if (!response.ok) throw new Error('API request failed');
        return response.json();
    }

    static async post(endpoint, data) {
        const headers = await this.getHeaders();
        const response = await fetch(`${API_URL}${endpoint}`, {
            method: 'POST',
            headers,
            body: JSON.stringify(data),
        });
        if (!response.ok) throw new Error('API request failed');
        return response.json();
    }

    static async put(endpoint, data) {
        const headers = await this.getHeaders();
        const response = await fetch(`${API_URL}${endpoint}`, {
            method: 'PUT',
            headers,
            body: JSON.stringify(data),
        });
        if (!response.ok) throw new Error('API request failed');
        return response.json();
    }

    static async delete(endpoint) {
        const headers = await this.getHeaders();
        const response = await fetch(`${API_URL}${endpoint}`, {
            method: 'DELETE',
            headers,
        });
        if (!response.ok) throw new Error('API request failed');
        return response.json();
    }
}

// API methods for each endpoint
export const api = {
    // Transactions
    transactions: {
        getAll: (params = {}) => ApiClient.get('/transactions' + new URLSearchParams(params)),
        getById: (id) => ApiClient.get(`/transactions/${id}`),
        create: (data) => ApiClient.post('/transactions', data),
        update: (id, data) => ApiClient.put(`/transactions/${id}`, data),
        delete: (id) => ApiClient.delete(`/transactions/${id}`),
        getByDate: (date) => ApiClient.get(`/transactions/${date}`),
    },

    // Categories
    categories: {
        getAll: () => ApiClient.get('/categories'),
        getById: (id) => ApiClient.get(`/categories/${id}`),
        create: (data) => ApiClient.post('/categories', data),
        update: (id, data) => ApiClient.put(`/categories/${id}`, data),
        delete: (id) => ApiClient.delete(`/categories/${id}`),
        getSummary: (year, month, type) => 
            ApiClient.get(`/categories/summary?year=${year}&month=${month}&type=${type}`),
        getBreakdown: (year, month, type) => 
            ApiClient.get(`/categories/breakdown?year=${year}&month=${month}&type=${type}`),
    },

    // Profile
    profile: {
        get: () => ApiClient.get('/profiles'),
        update: (data) => ApiClient.put('/profiles', data),
        delete: () => ApiClient.delete('/profiles'),
    },
};
