const STORAGE_KEYS = {
  accessToken: 'velauto_access_token',
  refreshToken: 'velauto_refresh_token',
  baseUrl: 'velauto_api_base_url',
};

const DEFAULT_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8090';

const readStorage = (key, fallback = null) => {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
};

const writeStorage = (key, value) => {
  try {
    if (value === undefined || value === null) {
      localStorage.removeItem(key);
      return;
    }
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore storage errors
  }
};

export const getApiBaseUrl = () => localStorage.getItem(STORAGE_KEYS.baseUrl) || DEFAULT_BASE_URL;

export const setApiBaseUrl = (baseUrl) => {
  if (!baseUrl) return;
  localStorage.setItem(STORAGE_KEYS.baseUrl, baseUrl.replace(/\/$/, ''));
};

export const getStoredTokens = () => ({
  accessToken: readStorage(STORAGE_KEYS.accessToken, ''),
  refreshToken: readStorage(STORAGE_KEYS.refreshToken, ''),
});

export const setStoredTokens = ({ accessToken, refreshToken }) => {
  writeStorage(STORAGE_KEYS.accessToken, accessToken || '');
  writeStorage(STORAGE_KEYS.refreshToken, refreshToken || '');
};

export const clearStoredTokens = () => {
  localStorage.removeItem(STORAGE_KEYS.accessToken);
  localStorage.removeItem(STORAGE_KEYS.refreshToken);
};

const normalizeText = (...values) => {
  for (const value of values) {
    if (value === null || value === undefined) continue;
    const text = String(value).trim();
    if (text) return text;
  }
  return '';
};

const normalizePhoneDigits = (phone) => {
  if (!phone) return '';
  let s = String(phone).replace(/\D/g, '');
  if (s.length > 10) s = s.slice(-10);
  return s;
};

const normalizePlate = (...values) => normalizeText(...values).toUpperCase().replace(/\s+/g, ' ').trim();

const toNumber = (value, fallback = 0) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
};

const deriveJobStatus = (status) => {
  const normalized = normalizeText(status, 'IN_PROGRESS').toUpperCase();

  if (['COMPLETED', 'TAMAMLANDI', 'DONE'].includes(normalized)) {
    return { status: 'COMPLETED', key: 'COMPLETED', label: 'Tamamlandı', color: 'green' };
  }

  if (['WAITING_PART', 'PARÇA BEKLİYOR', 'PARTS_WAITING'].includes(normalized)) {
    return { status: 'WAITING_PART', key: 'WAITING_PART', label: 'Parça Bekliyor', color: 'orange' };
  }

  if (['PENDING', 'BEKLEMEDE', 'ONAY BEKLİYOR', 'ONAYLI'].includes(normalized)) {
    return { status: 'PENDING', key: 'PENDING', label: 'Beklemede', color: 'amber' };
  }

  return { status: 'IN_PROGRESS', key: 'IN_PROGRESS', label: 'İşlemde', color: 'blue' };
};

const normalizeServiceItem = (item) => ({
  id: item?.id ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`,
  name: normalizeText(item?.itemName, item?.name, item?.description, 'Kalem'),
  price: toNumber(item?.price ?? item?.unitPrice ?? item?.amount, 0) * toNumber(item?.quantity, 1),
  quantity: toNumber(item?.quantity, 1),
  unitPrice: toNumber(item?.unitPrice ?? item?.price ?? item?.amount, 0),
  taxRate: toNumber(item?.taxRate, 0),
});

export const normalizeCustomer = (customer) => ({
  id: customer?.id,
  name: normalizeText(
    customer?.fullName,
    [customer?.firstName, customer?.lastName].filter(Boolean).join(' '),
    customer?.name,
    customer?.customerName,
    'Müşteri'
  ),
  fullName: normalizeText(
    customer?.fullName,
    [customer?.firstName, customer?.lastName].filter(Boolean).join(' '),
    customer?.name,
    customer?.customerName,
    'Müşteri'
  ),
  phone: normalizePhoneDigits(normalizeText(customer?.phone, customer?.mobile, customer?.phoneNumber)),
  email: normalizeText(customer?.email),
  address: normalizeText(customer?.address),
  plate: normalizePlate(customer?.plate, customer?.licensePlate),
  notes: normalizeText(customer?.notes, customer?.description),
});

export const normalizeVehicle = (vehicle, customerLookup = new Map()) => {
  const customer = customerLookup.get(String(vehicle?.customerId ?? vehicle?.customer?.id ?? '')) || vehicle?.customer || null;
  const brand = normalizeText(vehicle?.brand, vehicle?.make, vehicle?.brandName);
  const model = normalizeText(vehicle?.model, vehicle?.modelName);
  const plate = normalizePlate(vehicle?.licensePlate, vehicle?.plate);
  const derivedStatus = deriveJobStatus(vehicle?.status);

  return {
    id: vehicle?.id,
    vehicleId: vehicle?.id,
    customerId: vehicle?.customerId ?? vehicle?.customer?.id ?? null,
    plate,
    customer: normalizeText(vehicle?.customerName, vehicle?.ownerName, customer?.fullName, customer?.name, 'Müşteri'),
    brand: normalizeText(vehicle?.brandModel, [brand, model].filter(Boolean).join(' '), brand, model, 'Araç'),
    model,
    complaint: normalizeText(vehicle?.complaint, vehicle?.description),
    status: derivedStatus.status,
    color: derivedStatus.color,
    items: [],
    total: toNumber(vehicle?.totalAmount ?? vehicle?.total, 0),
    serviceFormId: vehicle?.serviceFormId ?? null,
    appointmentId: vehicle?.appointmentId ?? null,
    paid: Boolean(vehicle?.paid),
  };
};

export const normalizeAppointment = (appointment, customerLookup = new Map(), vehicleLookup = new Map()) => {
  const customer = customerLookup.get(String(appointment?.customerId ?? appointment?.customer?.id ?? '')) || appointment?.customer || null;
  const vehicle = vehicleLookup.get(String(appointment?.vehicleId ?? appointment?.vehicle?.id ?? '')) || appointment?.vehicle || null;
  const statusRaw = normalizeText(appointment?.status, appointment?.approvalStatus).toUpperCase();
  const approved = ['APPROVED', 'ONAYLI', 'CONFIRMED', 'ACCEPTED'].includes(statusRaw);

  return {
    id: appointment?.id,
    customerId: appointment?.customerId ?? customer?.id ?? null,
    vehicleId: appointment?.vehicleId ?? vehicle?.id ?? null,
    plate: normalizePlate(appointment?.plate, appointment?.licensePlate, vehicle?.licensePlate, vehicle?.plate),
    customer: normalizeText(appointment?.customerName, customer?.fullName, customer?.name, appointment?.customer, 'Müşteri'),
    phone: normalizePhoneDigits(normalizeText(appointment?.phone, customer?.phone)),
    service: normalizeText(appointment?.service, appointment?.description, appointment?.note, 'Bakım'),
    time: normalizeText(appointment?.appointmentDate, appointment?.time, appointment?.dateTime),
    status: approved ? 'ONAYLI' : 'ONAY BEKLİYOR',
    type: approved ? 'green' : 'red',
    brand: normalizeText(appointment?.brand, appointment?.make, vehicle?.brand),
    model: normalizeText(appointment?.model, appointment?.modelName, vehicle?.model),
  };
};

export const normalizeServiceCatalogItem = (item) => ({
  id: item?.id,
  name: normalizeText(item?.name, item?.serviceName, 'Servis'),
  description: normalizeText(item?.description),
  price: toNumber(item?.basePrice ?? item?.price, 0),
});

const isBackendCompatibleIntegerId = (id) => {
  const numericId = Number(id);
  return Number.isInteger(numericId) && numericId > 0 && numericId <= 2147483647;
};

export const normalizeServiceForm = (form, customerLookup = new Map(), vehicleLookup = new Map()) => {
  const vehicle = vehicleLookup.get(String(form?.vehicleId ?? form?.vehicle?.id ?? '')) || form?.vehicle || null;
  const customer = customerLookup.get(String(form?.customerId ?? vehicle?.customerId ?? vehicle?.customer?.id ?? '')) || form?.customer || vehicle?.customer || null;
  const jobStatus = deriveJobStatus(form?.status ?? vehicle?.status);

  const items = Array.isArray(form?.items)
    ? form.items.map(normalizeServiceItem)
    : Array.isArray(form?.serviceFormItems)
      ? form.serviceFormItems.map(normalizeServiceItem)
      : [];

  const totalFromItems = items.reduce((sum, item) => sum + toNumber(item.price), 0);

  return {
    id: form?.id,
    serviceFormId: isBackendCompatibleIntegerId(form?.id) ? form.id : null,
    customerId: form?.customerId ?? customer?.id ?? null,
    vehicleId: form?.vehicleId ?? vehicle?.id ?? null,
    appointmentId: form?.appointmentId ?? null,
    plate: normalizePlate(form?.plate, vehicle?.licensePlate, vehicle?.plate),
    customer: normalizeText(form?.customerName, customer?.fullName, customer?.name, vehicle?.customerName, 'Müşteri'),
    brand: normalizeText(form?.brandModel, vehicle?.brandModel, [vehicle?.brand, vehicle?.model].filter(Boolean).join(' '), 'Araç'),
    complaint: normalizeText(form?.description, form?.complaint, vehicle?.complaint),
    status: jobStatus.status,
    color: jobStatus.color,
    items,
    total: toNumber(form?.totalAmount ?? form?.total, totalFromItems),
    paid: Boolean(form?.paid),
    raw: form,
  };
};

export const normalizePayment = (payment, customerLookup = new Map(), vehicleLookup = new Map(), serviceFormLookup = new Map()) => {
  const serviceForm = serviceFormLookup.get(String(payment?.serviceFormId ?? payment?.serviceForm?.id ?? '')) || payment?.serviceForm || null;
  const vehicle = vehicleLookup.get(String(payment?.vehicleId ?? payment?.vehicle?.id ?? serviceForm?.vehicleId ?? '')) || payment?.vehicle || serviceForm?.vehicle || null;
  const customer = customerLookup.get(String(payment?.customerId ?? payment?.customer?.id ?? serviceForm?.customerId ?? vehicle?.customerId ?? '')) || payment?.customer || serviceForm?.customer || vehicle?.customer || null;

  return {
    id: payment?.id ?? serviceForm?.id ?? vehicle?.id ?? Date.now(),
    serviceFormId: payment?.serviceFormId ?? serviceForm?.id ?? null,
    vehicleId: payment?.vehicleId ?? vehicle?.id ?? null,
    customerId: payment?.customerId ?? customer?.id ?? null,
    plate: normalizePlate(payment?.plate, vehicle?.licensePlate, vehicle?.plate, serviceForm?.plate),
    owner: normalizeText(payment?.owner, payment?.customerName, customer?.fullName, customer?.name, 'Müşteri'),
    amount: toNumber(payment?.amount ?? payment?.totalAmount ?? serviceForm?.total, 0),
    method: normalizeText(payment?.paymentMethod, payment?.method),
    transactionId: normalizeText(payment?.transactionId),
    status: normalizeText(payment?.status, 'PENDING').toUpperCase(),
    createdAt: payment?.createdAt ?? null,
  };
};

const buildUrl = (path) => `${getApiBaseUrl()}${path.startsWith('/') ? path : `/${path}`}`;

const parseResponseBody = async (response, responseType) => {
  if (response.status === 204) return null;

  const contentType = response.headers.get('content-type') || '';
  if (responseType === 'blob') return response.blob();
  if (contentType.includes('application/json')) return response.json();
  return response.text();
};

const request = async (path, options = {}, retry = true) => {
  const {
    method = 'GET',
    body,
    headers = {},
    auth = true,
    responseType = 'json',
  } = options;

  const finalHeaders = { ...headers };
  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;

  if (!isFormData && body !== undefined && body !== null && !finalHeaders['Content-Type']) {
    finalHeaders['Content-Type'] = 'application/json';
  }

  const tokens = getStoredTokens();
  if (auth && tokens.accessToken) {
    finalHeaders.Authorization = `Bearer ${tokens.accessToken}`;
  }

  const requestBody = isFormData
    ? body
    : body !== undefined && body !== null && finalHeaders['Content-Type'] === 'application/json'
      ? JSON.stringify(body)
      : body;

  let response;
  try {
    response = await fetch(buildUrl(path), {
      method,
      headers: finalHeaders,
      body: requestBody,
    });
  } catch {
    throw new Error(`API sunucusuna ulaşılamadı: ${buildUrl(path)}. Sunucu çalışıyor mu, CORS açık mı ve API URL doğru mu kontrol edin.`);
  }

  if (response.ok) {
    return parseResponseBody(response, responseType);
  }

  if (response.status === 401 && auth && retry && tokens.refreshToken) {
    const refreshed = await refreshToken(tokens.refreshToken);
    if (refreshed?.accessToken) {
      const retryHeaders = { ...finalHeaders, Authorization: `Bearer ${refreshed.accessToken}` };
      let retryResponse;
      try {
        retryResponse = await fetch(buildUrl(path), {
          method,
          headers: retryHeaders,
          body: requestBody,
        });
      } catch {
        throw new Error(`Yeniden denemede de API sunucusuna ulaşılamadı: ${buildUrl(path)}.`);
      }

      if (retryResponse.ok) {
        return parseResponseBody(retryResponse, responseType);
      }

      const retryErrorPayload = await parseResponseBody(retryResponse, responseType).catch(() => null);
      throw new Error(extractApiError(retryErrorPayload, retryResponse.status));
    }
  }

  const errorPayload = await parseResponseBody(response, responseType).catch(() => null);
  throw new Error(extractApiError(errorPayload, response.status));
};

const extractApiError = (payload, status) => {
  if (!payload) return `API isteği başarısız oldu (${status}).`;

  if (typeof payload === 'string') return payload;
  if (payload.message) return payload.message;
  if (payload.error) return payload.error;
  if (payload.detail) return payload.detail;
  if (payload.title) return payload.title;
  return `API isteği başarısız oldu (${status}).`;
};

export const refreshToken = async (refreshTokenValue) => {
  if (!refreshTokenValue) return null;

  try {
    const data = await request('/api/v1/auth/refresh', {
      method: 'POST',
      auth: false,
      body: { refreshToken: refreshTokenValue },
    }, false);

    if (data?.accessToken || data?.refreshToken) {
      setStoredTokens({
        accessToken: data.accessToken || readStorage(STORAGE_KEYS.accessToken, ''),
        refreshToken: data.refreshToken || refreshTokenValue,
      });
    }

    return data;
  } catch {
    return null;
  }
};

export const api = {
  request,
  auth: {
    login: (payload) => request('/api/v1/auth/login', { method: 'POST', auth: false, body: payload }),
    register: (payload) => request('/api/v1/auth/register', { method: 'POST', auth: false, body: payload }),
    me: () => request('/api/v1/users/me'),
    logout: () => request('/api/v1/auth/logout', { method: 'POST' }),
    forgotPassword: (payload) => request('/api/v1/auth/forgot-password', { method: 'POST', auth: false, body: payload }),
    resetPassword: (payload) => request('/api/v1/auth/reset-password', { method: 'POST', auth: false, body: payload }),
    changePassword: (payload) => request('/api/v1/auth/change-password', { method: 'POST', body: payload }),
    updateProfile: (payload) => request('/api/v1/users/profile', { method: 'PUT', body: payload }),
    createAdmin: (payload) => request('/api/v1/auth/admin/create', { method: 'POST', body: payload }),
    createStaff: (payload) => request('/api/v1/auth/staff/create', { method: 'POST', body: payload }),
  },
  customers: {
    list: (params = '') => request(`/api/v1/customers${params}`),
    get: (id) => request(`/api/v1/customers/${id}`),
    getByPhone: (phone) => request(`/api/v1/customers/phone/${encodeURIComponent(phone)}`),
    create: (payload) => request('/api/v1/customers', { method: 'POST', body: payload }),
    update: (id, payload) => request(`/api/v1/customers/${id}`, { method: 'PUT', body: payload }),
    remove: (id) => request(`/api/v1/customers/${id}`, { method: 'DELETE' }),
  },
  vehicles: {
    list: (params = '') => request(`/api/v1/vehicles${params}`),
    get: (id) => request(`/api/v1/vehicles/${id}`),
    create: (payload) => request('/api/v1/vehicles', { method: 'POST', body: payload }),
    update: (id, payload) => request(`/api/v1/vehicles/${id}`, { method: 'PUT', body: payload }),
    remove: (id) => request(`/api/v1/vehicles/${id}`, { method: 'DELETE' }),
    assignStaff: (id, payload) => request(`/api/v1/vehicles/${id}/assign-staff`, { method: 'POST', body: payload }),
  },
  appointments: {
    list: (params = '') => request(`/api/v1/appointments${params}`),
    get: (id) => request(`/api/v1/appointments/${id}`),
    create: (payload) => request('/api/v1/appointments', { method: 'POST', body: payload }),
    update: (id, payload) => request(`/api/v1/appointments/${id}`, { method: 'PUT', body: payload }),
    remove: (id) => request(`/api/v1/appointments/${id}`, { method: 'DELETE' }),
  },
  serviceCatalog: {
    list: (params = '') => request(`/api/v1/service-catalogs${params}`),
    get: (id) => request(`/api/v1/service-catalogs/${id}`),
    create: (payload) => request('/api/v1/service-catalogs', { method: 'POST', body: payload }),
    update: (id, payload) => request(`/api/v1/service-catalogs/${id}`, { method: 'PUT', body: payload }),
    remove: (id) => request(`/api/v1/service-catalogs/${id}`, { method: 'DELETE' }),
  },
  serviceForms: {
    list: (params = '') => request(`/api/v1/service-forms${params}`),
    get: (id) => request(`/api/v1/service-forms/${id}`),
    create: (payload) => request('/api/v1/service-forms/direct', { method: 'POST', body: payload }),
    update: (id, payload) => request(`/api/v1/service-forms/${id}`, { method: 'PUT', body: payload }),
    remove: (id) => request(`/api/v1/service-forms/${id}`, { method: 'DELETE' }),
  },
  serviceFormItems: {
    get: (id) => request(`/api/v1/service-form-items/${id}`),
    create: (payload) => request('/api/v1/service-form-items', { method: 'POST', body: payload }),
  },
  payments: {
    list: (params = '') => request(`/api/v1/payments${params}`),
    get: (id) => request(`/api/v1/payments/${id}`),
    create: (payload) => request('/api/v1/payments', { method: 'POST', body: payload }),
  },
  invoices: {
    generate: (serviceFormId) => request(`/api/v1/invoices/generate/${serviceFormId}`, { method: 'POST' }),
    download: (id) => request(`/api/v1/invoices/${id}/download`, { method: 'GET', responseType: 'blob' }),
  },
};

export {
  normalizeText,
  normalizePlate,
  toNumber,
  deriveJobStatus,
  normalizeServiceItem,
  readStorage,
  writeStorage,
};