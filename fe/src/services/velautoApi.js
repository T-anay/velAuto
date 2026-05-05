import axios from 'axios';

const API_BASE_URL = 'http://localhost:8090/api/v1';

// 1. AXIOS INSTANCE OLUŞTURMA
const axiosInstance = axios.create({
    baseURL: API_BASE_URL,
});

// 2. TOKEN & STORAGE YÖNETİMİ
export const getStoredTokens = () => {
    return {
        accessToken: localStorage.getItem('token') || localStorage.getItem('velauto_access_token'),
        refreshToken: localStorage.getItem('velauto_refresh_token') || ''
    };
};

export const setStoredTokens = ({ accessToken, refreshToken }) => {
    if (accessToken) {
        localStorage.setItem('token', accessToken);
        localStorage.setItem('velauto_access_token', accessToken);
    }
    if (refreshToken) {
        localStorage.setItem('velauto_refresh_token', refreshToken);
    }
};

export const clearStoredTokens = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('velauto_access_token');
    localStorage.removeItem('velauto_refresh_token');
    localStorage.removeItem('user');
};

export const writeStorage = (key, value) => {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
        console.error('Storage yazma hatası', e);
    }
};

// 3. AXIOS INTERCEPTOR (Tüm isteklere otomatik Token ve TenantId ekler)
axiosInstance.interceptors.request.use((config) => {
    const tokens = getStoredTokens();
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;

    // Kullanıcının tenantId'si varsa onu al, yoksa varsayılan olarak 1 kullan
    const tenantId = user?.tenantId || 1;

    // Login hariç tüm isteklere Token ekle
    if (tokens.accessToken && !config.url.includes('/auth/login')) {
        config.headers.Authorization = `Bearer ${tokens.accessToken}`;
    }

    // Auth işlemleri hariç TÜM isteklere Tenant ID ekle (500 hatasını ve 403'leri çözer)
    if (!config.url.includes('/auth/')) {
        config.params = {
            ...config.params,
            tenantId: tenantId
        };
    }

    return config;
}, (error) => Promise.reject(error));

// 4. API ENDPOINT'LERİ (ServiceContext'in kullandığı tüm adresler)
export const refreshToken = async (token) => {
    const res = await axiosInstance.post('/auth/refresh', { refreshToken: token });
    if (res.data && res.data.accessToken) {
        setStoredTokens({ accessToken: res.data.accessToken, refreshToken: res.data.refreshToken || token });
    }
    return res.data;
};

export const api = {
    auth: {
        me: () => axiosInstance.get('/users/profile').then(res => res.data),
        login: (credentials) => axiosInstance.post('/auth/login', credentials).then(res => res.data),
        logout: () => axiosInstance.post('/auth/logout').then(res => res.data),
        updateProfile: (payload) => axiosInstance.put('/users/profile', payload).then(res => res.data),
        changePassword: (payload) => axiosInstance.post('/auth/change-password', payload).then(res => res.data),
    },
    customers: {
        list: (query = '') => axiosInstance.get(`/customers${query}`).then(res => res.data),
        get: (id) => axiosInstance.get(`/customers/${id}`).then(res => res.data),
        create: (payload) => axiosInstance.post('/customers', payload).then(res => res.data),
        update: (id, payload) => axiosInstance.put(`/customers/${id}`, payload).then(res => res.data),
        remove: (id) => axiosInstance.delete(`/customers/${id}`).then(res => res.data),
    },
    vehicles: {
        list: (query = '') => axiosInstance.get(`/vehicles${query}`).then(res => res.data),
        create: (payload) => axiosInstance.post('/vehicles', payload).then(res => res.data),
        update: (id, payload) => axiosInstance.put(`/vehicles/${id}`, payload).then(res => res.data),
        remove: (id) => axiosInstance.delete(`/vehicles/${id}`).then(res => res.data),
    },
    appointments: {
        list: (query = '') => axiosInstance.get(`/appointments${query}`).then(res => res.data),
        create: (payload) => axiosInstance.post('/appointments', payload).then(res => res.data),
        update: (id, payload) => axiosInstance.put(`/appointments/${id}`, payload).then(res => res.data),
        remove: (id) => axiosInstance.delete(`/appointments/${id}`).then(res => res.data),
    },
    serviceForms: {
        list: (query = '') => axiosInstance.get(`/service-forms${query}`).then(res => res.data),
        get: (id) => axiosInstance.get(`/service-forms/${id}`).then(res => res.data),
        create: (payload) => axiosInstance.post('/service-forms', payload).then(res => res.data),
        update: (id, payload) => axiosInstance.put(`/service-forms/${id}`, payload).then(res => res.data),
        remove: (id) => axiosInstance.delete(`/service-forms/${id}`).then(res => res.data),
    },
    serviceFormItems: {
        create: (payload) => axiosInstance.post('/service-form-items', payload).then(res => res.data),
    },
    serviceCatalog: {
         list: (query = '') => axiosInstance.get(`/service-catalog${query}`).then(res => res.data),
    },
    payments: {
        create: (payload) => axiosInstance.post('/payments', payload).then(res => res.data),
    }
};

// 5. YARDIMCI VE NORMALİZASYON FONKSİYONLARI (ServiceContext'in aradığı metotlar)
export const normalizeText = (...args) => {
    for (let arg of args) {
        if (arg !== null && arg !== undefined && arg !== '') return String(arg);
    }
    return '';
};

export const normalizePlate = (plate) => {
    if (!plate) return '';
    return plate.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
};

export const toNumber = (val, fallback = 0) => {
    const parsed = parseFloat(val);
    return isNaN(parsed) ? fallback : parsed;
};

export const deriveJobStatus = (status) => {
    const s = String(status || '').toUpperCase();
    if (s === 'COMPLETED' || s === 'TAMAMLANDI') return { key: 'COMPLETED', label: 'Tamamlandı', color: 'green' };
    if (s === 'WAITING_PART' || s === 'PARCA_BEKLIYOR') return { key: 'WAITING_PART', label: 'Parça Bekliyor', color: 'orange' };
    if (s === 'PENDING' || s === 'BEKLEMEDE' || s === 'BEKLEYEN') return { key: 'PENDING', label: 'Beklemede', color: 'amber' };
    if (s === 'IN_PROGRESS' || s === 'ISLEMDE' || s === 'DEVAM_EDIYOR') return { key: 'IN_PROGRESS', label: 'İşlemde', color: 'blue' };
    return { key: s || 'UNKNOWN', label: 'Bilinmiyor', color: 'gray' };
};

export const normalizeCustomer = (raw) => ({
    id: raw?.id || Date.now(),
    fullName: normalizeText(raw?.fullName, (raw?.firstName || '') + ' ' + (raw?.lastName || ''), raw?.name, 'Bilinmeyen Müşteri').trim(),
    phone: normalizeText(raw?.phone, raw?.phoneNumber, ''),
    email: normalizeText(raw?.email, ''),
    plate: normalizeText(raw?.plate, ''),
    address: normalizeText(raw?.address, ''),
    notes: normalizeText(raw?.notes, '')
});

export const normalizeVehicle = (raw, customerMap = new Map()) => {
    const customer = customerMap.get(String(raw?.customerId)) || {};
    return {
        id: raw?.id || Date.now(),
        customerId: raw?.customerId,
        licensePlate: normalizePlate(raw?.licensePlate || raw?.plate),
        plate: normalizePlate(raw?.licensePlate || raw?.plate),
        brand: normalizeText(raw?.brand, ''),
        model: normalizeText(raw?.model, ''),
        currentKm: toNumber(raw?.currentKm, 0),
        chassisNo: normalizeText(raw?.chassisNo, ''),
        customer: customer?.fullName || raw?.customerName || 'Bilinmiyor',
        status: raw?.status || 'IN_PROGRESS'
    };
};

export const normalizeAppointment = (raw, customerMap = new Map(), vehicleMap = new Map()) => {
    const customer = customerMap.get(String(raw?.customerId)) || {};
    const vehicle = vehicleMap.get(String(raw?.vehicleId)) || {};
    return {
        id: raw?.id || Date.now(),
        customerId: raw?.customerId,
        vehicleId: raw?.vehicleId,
        customer: customer?.fullName || raw?.customerName || 'Bilinmiyor',
        phone: customer?.phone || raw?.phone || '',
        plate: vehicle?.licensePlate || vehicle?.plate || raw?.plate || '',
        time: raw?.appointmentDate || raw?.time || new Date().toISOString(),
        service: raw?.description || raw?.service || '',
        status: raw?.status || 'PENDING'
    };
};

export const normalizeServiceForm = (raw, customerMap = new Map(), vehicleMap = new Map()) => {
    const vehicle = vehicleMap.get(String(raw?.vehicleId)) || {};
    const customer = customerMap.get(String(vehicle.customerId)) || customerMap.get(String(raw?.customerId)) || {};
    return {
        id: raw?.id || Date.now(),
        serviceFormId: raw?.id,
        vehicleId: raw?.vehicleId,
        customerId: customer?.id || raw?.customerId,
        plate: vehicle?.licensePlate || raw?.plate || '',
        customer: customer?.fullName || raw?.customerName || '',
        phone: customer?.phone || raw?.phone || '',
        brand: vehicle?.brand || raw?.brand || '',
        complaint: raw?.description || raw?.complaint || '',
        status: raw?.status || 'IN_PROGRESS',
        total: toNumber(raw?.totalAmount, raw?.total, 0),
        items: Array.isArray(raw?.items) ? raw?.items.map(normalizeServiceItem) : []
    };
};

export const normalizeServiceItem = (raw) => ({
    id: raw?.id || Date.now(),
    name: normalizeText(raw?.itemName, raw?.name, ''),
    unitPrice: toNumber(raw?.unitPrice, raw?.price, 0),
    quantity: toNumber(raw?.quantity, 1),
    taxRate: toNumber(raw?.taxRate, 18),
    price: toNumber(raw?.unitPrice, raw?.price, 0) * toNumber(raw?.quantity, 1)
});

export const normalizeServiceCatalogItem = (raw) => ({
    id: raw?.id || Date.now(),
    name: normalizeText(raw?.name, raw?.itemName, ''),
    price: toNumber(raw?.price, raw?.unitPrice, 0)
});

export const velautoApi = api;