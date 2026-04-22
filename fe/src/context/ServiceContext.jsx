import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  api,
  clearStoredTokens,
  getStoredTokens,
  normalizeAppointment,
  normalizeCustomer,
  normalizeServiceCatalogItem,
  normalizeServiceForm,
  normalizeServiceItem,
  normalizeVehicle,
  normalizeText,
  normalizePlate,
  setStoredTokens,
  toNumber,
  deriveJobStatus,
  writeStorage,
  refreshToken,
} from '../api/velautoApi';
import { pushToast } from '../lib/toastBus';

const ServiceContext = createContext(null);

const CACHE_KEYS = {
  user: 'velauto_user_profile',
  jobs: 'velauto_jobs_cache',
  customers: 'velauto_customers_cache',
  appointments: 'velauto_appointments_cache',
  payments: 'velauto_pending_payments_cache',
  serviceCatalog: 'velauto_service_catalog_cache',
};

const loadJsonArray = (keys, fallback = []) => {
  for (const key of keys) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      // ignore cache read errors
    }
  }
  return fallback;
};

const loadJsonValue = (keys, fallback = null) => {
  for (const key of keys) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      return JSON.parse(raw);
    } catch {
      // ignore cache read errors
    }
  }
  return fallback;
};

const saveJson = (key, value) => writeStorage(key, value);

const extractCollection = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== 'object') return [];
  return payload.content || payload.items || payload.data || payload.results || payload.list || [];
};

const normalizeUser = (profile, fallbackEmail = '') => ({
  id: profile?.id ?? profile?.userId ?? profile?.sub ?? fallbackEmail,
  email: normalizeText(profile?.email, fallbackEmail),
  fullName: normalizeText(profile?.fullName, profile?.name, profile?.username, profile?.firstName, fallbackEmail),
  phone: normalizeText(profile?.phone, profile?.phoneNumber),
  role: normalizeText(profile?.role, profile?.authority, profile?.type, 'USER'),
  raw: profile || null,
});

const buildPendingPayment = (job) => ({
  id: `pending-${job.id}`,
  serviceFormId: job.serviceFormId ?? job.id,
  vehicleId: job.vehicleId ?? null,
  customerId: job.customerId ?? null,
  plate: job.plate,
  owner: job.customer,
  amount: toNumber(job.total, 0),
  status: 'PENDING',
  method: '',
  transactionId: '',
  createdAt: new Date().toISOString(),
});

const normalizeJobList = (serviceForms, customers, vehicles) => {
  const customerLookup = new Map(customers.map((customer) => [String(customer.id), customer]));
  const vehicleLookup = new Map(vehicles.map((vehicle) => [String(vehicle.id), vehicle]));

  const jobs = serviceForms.map((form) => normalizeServiceForm(form, customerLookup, vehicleLookup));
  if (jobs.length > 0) return jobs;

  return vehicles.map((vehicle) => normalizeVehicle(vehicle, customerLookup));
};

export const ServiceProvider = ({ children }) => {
  const savedTokens = getStoredTokens();
  const [user, setUser] = useState(() => (savedTokens.accessToken || savedTokens.refreshToken) ? loadJsonValue([CACHE_KEYS.user], null) : null);
  const [jobs, setJobs] = useState(() => loadJsonArray([CACHE_KEYS.jobs, 'velauto_jobs'], []));
  const [customers, setCustomers] = useState(() => loadJsonArray([CACHE_KEYS.customers, 'velauto_customers'], []));
  const [appointments, setAppointments] = useState(() => loadJsonArray([CACHE_KEYS.appointments, 'velauto_appointments'], []));
  const [payments, setPayments] = useState(() => loadJsonArray([CACHE_KEYS.payments, 'velauto_payments'], []));
  const [serviceCatalog, setServiceCatalog] = useState(() => loadJsonArray([CACHE_KEYS.serviceCatalog], []));
  const [isBootstrapping, setIsBootstrapping] = useState(Boolean(savedTokens.accessToken || savedTokens.refreshToken));
  const [error, setError] = useState('');

  useEffect(() => saveJson(CACHE_KEYS.user, user), [user]);
  useEffect(() => saveJson(CACHE_KEYS.jobs, jobs), [jobs]);
  useEffect(() => saveJson(CACHE_KEYS.customers, customers), [customers]);
  useEffect(() => saveJson(CACHE_KEYS.appointments, appointments), [appointments]);
  useEffect(() => saveJson(CACHE_KEYS.payments, payments), [payments]);
  useEffect(() => saveJson(CACHE_KEYS.serviceCatalog, serviceCatalog), [serviceCatalog]);

  const isValidTurkishPlate = useCallback((plate) => {
    const parts = normalizePlate(plate).split(/\s+/);
    if (parts.length !== 3) return false;

    const [province, letters, digits] = parts;
    const provinceNum = parseInt(province, 10);

    if (provinceNum < 1 || provinceNum > 81) return false;
    if (!/^[A-Z]{1,3}$/.test(letters)) return false;
    if (!/^\d{2,4}$/.test(digits)) return false;

    const totalChars = province.length + letters.length + digits.length;

    if (province === '34') {
      return totalChars === 7 || totalChars === 8;
    }

    return totalChars === 7;
  }, []);

  const syncRemoteData = useCallback(async () => {
    const tokens = getStoredTokens();
    if (!tokens.accessToken && !tokens.refreshToken) {
      setIsBootstrapping(false);
      return;
    }

    setIsBootstrapping(true);
    setError('');

    try {
      if (!tokens.accessToken && tokens.refreshToken) {
        await refreshToken(tokens.refreshToken);
      }

      const [profileResponse, customersResponse, vehiclesResponse, appointmentsResponse, serviceFormsResponse, catalogResponse] = await Promise.all([
        api.auth.me().catch(() => null),
        api.customers.list('?page=0&size=200').catch(() => []),
        api.vehicles.list('?page=0&size=200').catch(() => []),
        api.appointments.list('?page=0&size=200').catch(() => []),
        api.serviceForms.list('?page=0&size=200').catch(() => []),
        api.serviceCatalog.list('?page=0&size=200').catch(() => []),
      ]);

      const normalizedCustomers = extractCollection(customersResponse).map(normalizeCustomer);
      const normalizedVehicles = extractCollection(vehiclesResponse);
      const normalizedAppointmentsRaw = extractCollection(appointmentsResponse);
      const normalizedServiceFormsRaw = extractCollection(serviceFormsResponse);
      const normalizedCatalog = extractCollection(catalogResponse).map(normalizeServiceCatalogItem);

      const customerLookup = new Map(normalizedCustomers.map((customer) => [String(customer.id), customer]));
      const vehicleLookup = new Map(normalizedVehicles.map((vehicle) => [String(vehicle.id), vehicle]));

      const normalizedAppointments = normalizedAppointmentsRaw.map((appointment) => normalizeAppointment(appointment, customerLookup, vehicleLookup));
      const normalizedJobs = normalizeJobList(normalizedServiceFormsRaw, normalizedCustomers, normalizedVehicles);

      const cachedUser = loadJsonValue([CACHE_KEYS.user], null);
      setUser(normalizeUser(profileResponse, cachedUser?.email || ''));
      setCustomers(normalizedCustomers);
      setAppointments(normalizedAppointments);
      setJobs(normalizedJobs);
      setServiceCatalog(normalizedCatalog);

      // Keep any pending payment queue that already exists locally, but clean up stale entries.
      setPayments((currentPayments) => {
        const queue = Array.isArray(currentPayments) ? currentPayments : [];
        const jobIds = new Set(normalizedJobs.map((job) => String(job.id)));
        return queue.filter((payment) => jobIds.has(String(payment.serviceFormId ?? payment.id)) || payment.status === 'PENDING');
      });
    } catch (syncError) {
      setError(syncError.message || 'Veriler yüklenemedi.');
      pushToast({
        type: 'warning',
        title: 'Veri senkronu tamamlanamadı',
        message: 'Yerel kayıtlar kullanılmaya devam ediyor.',
      });
    } finally {
      setIsBootstrapping(false);
    }
  }, []);

  useEffect(() => {
    const tokens = getStoredTokens();
    if (!tokens.accessToken && !tokens.refreshToken) {
      setIsBootstrapping(false);
      return;
    }

    void syncRemoteData();
  }, [syncRemoteData]);

  const ensureCustomer = useCallback(async ({ fullName, phone, plate, email, address, notes }) => {
    const normalizedPlate = normalizePlate(plate);
    const existingCustomer = customers.find((customer) => normalizePlate(customer.plate) === normalizedPlate || normalizeText(customer.phone) === normalizeText(phone));
    if (existingCustomer) {
      return existingCustomer;
    }

    const payload = {
      fullName: normalizeText(fullName, email, 'Yeni Müşteri'),
      phone: normalizeText(phone),
      email: normalizeText(email),
      address: normalizeText(address),
      notes: normalizeText(notes),
    };

    let created = null;
    try {
      created = await api.customers.create(payload);
    } catch {
      created = null;
    }

    const normalized = normalizeCustomer(created || { ...payload, id: Date.now() });
    setCustomers((prev) => [...prev.filter((customer) => String(customer.id) !== String(normalized.id)), normalized]);
    return normalized;
  }, [customers]);

  const ensureVehicle = useCallback(async ({ licensePlate, customerId, customerName, brand, model, currentKm, chassisNo, status, complaint, appointmentId }) => {
    const normalizedPlate = normalizePlate(licensePlate);
    const payload = {
      licensePlate: normalizedPlate,
      customerId,
      brand: normalizeText(brand),
      model: normalizeText(model),
      currentKm: toNumber(currentKm, 0),
      chassisNo: normalizeText(chassisNo),
      status: normalizeText(status, 'IN_PROGRESS'),
      complaint: normalizeText(complaint),
      appointmentId,
      customerName: normalizeText(customerName),
    };

    const created = await api.vehicles.create(payload);
    const normalized = normalizeVehicle(created || payload, new Map(customers.map((customer) => [String(customer.id), customer])));
    normalized.plate = normalizedPlate;
    normalized.customer = normalizeText(customerName, normalized.customer, 'Müşteri');
    return normalized;
  }, [customers]);

  const login = useCallback(async ({ email, username, password }) => {
    const loginEmail = normalizeText(email, username);
    const normalizedUser = normalizeUser(
      {
        email: loginEmail,
        fullName: loginEmail || 'Demo Kullanıcı',
        role: 'ADMIN',
      },
      loginEmail,
    );

    clearStoredTokens();
    setUser(normalizedUser);

    return { success: true, user: normalizedUser };
  }, [syncRemoteData]);

  const logout = useCallback(async () => {
    try {
      await api.auth.logout();
    } catch {
      // ignore logout errors
    } finally {
      clearStoredTokens();
      setUser(null);
    }
  }, []);

  const addCustomer = useCallback(async (newCustomer) => {
    if (!normalizeText(newCustomer?.name, newCustomer?.fullName) || !normalizeText(newCustomer?.phone) || !normalizeText(newCustomer?.plate)) {
      throw new Error('Müşteri adı, telefon ve plaka zorunludur.');
    }

    const customer = await ensureCustomer({
      fullName: newCustomer.fullName || newCustomer.name,
      phone: newCustomer.phone,
      plate: newCustomer.plate,
      email: newCustomer.email,
      address: newCustomer.address,
      notes: newCustomer.notes,
    });

    pushToast({
      type: 'success',
      title: 'Müşteri eklendi',
      message: `${customer.fullName} kaydı oluşturuldu.`,
    });
    return { success: true, customer };
  }, [ensureCustomer]);

  const deleteCustomer = useCallback(async (id) => {
    await api.customers.remove(id).catch(() => null);
    setCustomers((prev) => prev.filter((customer) => String(customer.id) !== String(id)));
    pushToast({ type: 'info', title: 'Müşteri silindi', message: 'Seçili müşteri kaydı kaldırıldı.' });
    return { success: true };
  }, []);

  const addAppointment = useCallback(async (appointment) => {
    const customer = await ensureCustomer({
      fullName: appointment.customer,
      phone: appointment.phone,
      plate: appointment.plate,
    });

    const vehicle = await api.vehicles.list(`?page=0&size=200`).then((result) => {
      const collection = extractCollection(result);
      return collection.find((item) => normalizePlate(item?.licensePlate, item?.plate) === normalizePlate(appointment.plate)) || null;
    }).catch(() => null);

    let vehicleId = vehicle?.id || null;
    if (!vehicleId) {
      const createdVehicle = await api.vehicles.create({
        licensePlate: normalizePlate(appointment.plate),
        customerId: customer.id,
        currentKm: 0,
      }).catch(() => null);
      vehicleId = createdVehicle?.id || null;
      void createdVehicle;
    }

    let created = null;
    try {
      created = await api.appointments.create({
        customerId: customer.id,
        vehicleId,
        appointmentDate: appointment.time,
        description: appointment.service,
        status: 'PENDING',
      });
    } catch {
      created = {
        id: Date.now(),
        customerId: customer.id,
        vehicleId,
        appointmentDate: appointment.time,
        description: appointment.service,
        status: 'PENDING',
        plate: appointment.plate,
        customerName: appointment.customer,
        phone: appointment.phone,
      };
    }

    const normalizedAppointment = normalizeAppointment(created || appointment, new Map([[String(customer.id), customer]]), new Map([[String(vehicleId), { id: vehicleId, licensePlate: appointment.plate }]]));

    setAppointments((prev) => [...prev.filter((item) => String(item.id) !== String(normalizedAppointment.id)), normalizedAppointment]);
    pushToast({
      type: created ? 'success' : 'warning',
      title: 'Randevu kaydedildi',
      message: created ? `${appointment.plate} için randevu oluşturuldu.` : `${appointment.plate} için yerel kayıt oluşturuldu.`,
    });
    return { success: true, appointment: normalizedAppointment };
  }, [ensureCustomer]);

  const approveAppointment = useCallback(async (id) => {
    setAppointments((prev) => prev.map((appointment) => String(appointment.id) === String(id)
      ? { ...appointment, status: 'ONAYLI', type: 'green' }
      : appointment));

    await api.appointments.update(id, { status: 'APPROVED' }).catch(() => null);
    pushToast({ type: 'success', title: 'Randevu onaylandı', message: 'Randevu durumu güncellendi.' });
    return { success: true };
  }, []);

  const deleteAppointment = useCallback(async (id) => {
    await api.appointments.remove(id).catch(() => null);
    setAppointments((prev) => prev.filter((appointment) => String(appointment.id) !== String(id)));
    pushToast({ type: 'info', title: 'Randevu silindi', message: 'Takvim kaydı kaldırıldı.' });
    return { success: true };
  }, []);

  const addJob = useCallback(async (newJob) => {
    const plate = normalizePlate(newJob?.plate);
    if (!plate || !isValidTurkishPlate(plate)) {
      throw new Error('Geçersiz plaka formatı: 34 ABC 123');
    }

    const customer = await ensureCustomer({
      fullName: newJob.customer,
      phone: newJob.phone,
      plate,
      email: newJob.email,
      address: newJob.address,
      notes: newJob.notes,
    });

    let vehicle = null;
    try {
      vehicle = await ensureVehicle({
        licensePlate: plate,
        customerId: customer.id,
        customerName: customer.fullName,
        brand: newJob.brand,
        model: newJob.model || newJob.customModel,
        currentKm: newJob.currentKm,
        chassisNo: newJob.chassisNo,
        status: newJob.status || 'IN_PROGRESS',
        complaint: newJob.complaint,
        appointmentId: newJob.appointmentId || null,
      });
    } catch {
      vehicle = normalizeVehicle({
        id: Date.now(),
        licensePlate: plate,
        customerId: customer.id,
        customerName: customer.fullName,
        brand: newJob.brand,
        model: newJob.model || newJob.customModel,
        status: newJob.status || 'IN_PROGRESS',
        complaint: newJob.complaint,
      }, new Map([[String(customer.id), customer]]));
    }

    let serviceForm = null;
    try {
      serviceForm = await api.serviceForms.create({
        vehicleId: vehicle.id,
        appointmentId: newJob.appointmentId || null,
        description: newJob.complaint || newJob.description || 'Belirtilmedi',
        status: newJob.status || 'IN_PROGRESS',
      });
    } catch {
      serviceForm = {
        id: Date.now(),
        vehicleId: vehicle.id,
        appointmentId: newJob.appointmentId || null,
        description: newJob.complaint || newJob.description || 'Belirtilmedi',
        status: newJob.status || 'IN_PROGRESS',
      };
    }

    const normalizedJob = normalizeServiceForm(serviceForm, new Map([[String(customer.id), customer]]), new Map([[String(vehicle.id), { ...vehicle, customer }]]));
    normalizedJob.plate = plate;
    normalizedJob.customer = customer.fullName;
    normalizedJob.brand = newJob.brand || normalizedJob.brand;
    normalizedJob.complaint = newJob.complaint || normalizedJob.complaint;
    normalizedJob.items = Array.isArray(newJob.items) ? newJob.items.map(normalizeServiceItem) : [];
    normalizedJob.total = toNumber(newJob.total, normalizedJob.items.reduce((sum, item) => sum + toNumber(item.price, 0), 0));
    normalizedJob.status = deriveJobStatus(newJob.status || normalizedJob.status).status;
    normalizedJob.color = deriveJobStatus(newJob.status || normalizedJob.status).color;

    setJobs((prev) => [...prev.filter((job) => String(job.id) !== String(normalizedJob.id)), normalizedJob]);
    pushToast({
      type: 'success',
      title: 'İş emri oluşturuldu',
      message: `${plate} plakalı araç için servis kaydı açıldı.`,
    });
    return { success: true, job: normalizedJob };
  }, [ensureCustomer, ensureVehicle, isValidTurkishPlate]);

  const deleteJob = useCallback(async (id) => {
    await api.serviceForms.remove(id).catch(() => null);
    setJobs((prev) => prev.filter((job) => String(job.id) !== String(id)));
    pushToast({ type: 'info', title: 'İş emri silindi', message: 'Servis kaydı kaldırıldı.' });
    return { success: true };
  }, []);

  const updateJob = useCallback(async (id, updatedFields) => {
    setJobs((prev) => prev.map((job) => String(job.id) === String(id) ? { ...job, ...updatedFields } : job));

    const currentJob = jobs.find((job) => String(job.id) === String(id));
    if (currentJob?.serviceFormId) {
      await api.serviceForms.update(currentJob.serviceFormId, {
        description: updatedFields.complaint || updatedFields.description,
        status: updatedFields.status,
        total: updatedFields.total,
        totalAmount: updatedFields.total,
      }).catch(() => null);
    }

    return { success: true };
  }, [jobs]);

  const setJobStatus = useCallback(async (id, status) => {
    const job = jobs.find((item) => String(item.id) === String(id));
    if (!job) return { success: false, message: 'İş emri bulunamadı.' };

    const statusMeta = deriveJobStatus(status);
    setJobs((prev) => prev.map((item) => String(item.id) === String(id) ? { ...item, status: statusMeta.status, color: statusMeta.color } : item));

    if (job.serviceFormId) {
      await api.serviceForms.update(job.serviceFormId, {
        status: statusMeta.status,
        description: job.complaint,
        totalAmount: job.total,
      }).catch(() => null);
    }

    if (statusMeta.status === 'COMPLETED' && toNumber(job.total, 0) > 0) {
      setPayments((prev) => {
        const exists = prev.some((payment) => String(payment.serviceFormId ?? payment.id) === String(job.serviceFormId ?? job.id));
        if (exists) return prev;
        return [...prev, buildPendingPayment(job)];
      });
    }

    pushToast({
      type: statusMeta.status === 'COMPLETED' ? 'success' : 'info',
      title: 'İş durumu güncellendi',
      message: `${job.plate} için durum ${statusMeta.status === 'COMPLETED' ? 'tamamlandı' : statusMeta.status === 'WAITING_PART' ? 'parça bekliyor' : 'işlemde'} olarak ayarlandı.`,
    });

    return { success: true };
  }, [jobs]);

  const completeJob = useCallback((id) => setJobStatus(id, 'COMPLETED'), [setJobStatus]);

  const addServiceItem = useCallback(async (jobId, item) => {
    const job = jobs.find((entry) => String(entry.id) === String(jobId));
    if (!job) throw new Error('İş emri bulunamadı.');

    const normalizedItem = normalizeServiceItem(item);

    if (job.serviceFormId) {
      await api.serviceFormItems.create({
        serviceFormId: job.serviceFormId,
        itemName: normalizedItem.name,
        unitPrice: normalizedItem.unitPrice,
        quantity: normalizedItem.quantity,
        taxRate: normalizedItem.taxRate,
      }).catch(() => null);
    }

    const nextItems = [...(job.items || []), normalizedItem];
    const nextTotal = nextItems.reduce((sum, entry) => sum + toNumber(entry.price, 0), 0);

    setJobs((prev) => prev.map((entry) => String(entry.id) === String(jobId) ? { ...entry, items: nextItems, total: nextTotal } : entry));

    return { success: true, item: normalizedItem };
  }, [jobs]);

  const removeServiceItem = useCallback((jobId, itemId) => {
    const job = jobs.find((entry) => String(entry.id) === String(jobId));
    if (!job) return;

    const nextItems = (job.items || []).filter((item) => String(item.id) !== String(itemId));
    const nextTotal = nextItems.reduce((sum, entry) => sum + toNumber(entry.price, 0), 0);
    setJobs((prev) => prev.map((entry) => String(entry.id) === String(jobId) ? { ...entry, items: nextItems, total: nextTotal } : entry));
  }, [jobs]);

  const refreshJob = useCallback(async (jobId) => {
    const current = jobs.find((entry) => String(entry.id) === String(jobId));
    if (!current?.serviceFormId) return current || null;

    const detail = await api.serviceForms.get(current.serviceFormId).catch(() => null);
    if (!detail) return current;

    const customerLookup = new Map(customers.map((customer) => [String(customer.id), customer]));
    const vehicleLookup = new Map();
    const normalized = normalizeServiceForm(detail, customerLookup, vehicleLookup);

    setJobs((prev) => prev.map((entry) => String(entry.id) === String(jobId) ? { ...entry, ...normalized, items: normalized.items.length ? normalized.items : entry.items } : entry));
    return normalized;
  }, [customers, jobs]);

  const processPayment = useCallback(async (id, method = 'NAKİT', amountToPay = null, options = {}) => {
    const { suppressToast = false } = options;
    const payment = payments.find((entry) => String(entry.id) === String(id));
    if (!payment) return { success: false, message: 'Ödeme bulunamadı.' };

    const remainingAmount = toNumber(payment.amount, 0);
    const requestedAmount = amountToPay === null ? remainingAmount : toNumber(amountToPay, 0);

    if (!Number.isFinite(requestedAmount) || requestedAmount <= 0) {
      const message = 'Geçerli bir ödeme tutarı giriniz.';
      if (!suppressToast) {
        pushToast({ type: 'error', title: 'Tahsilat başarısız', message });
      }
      return { success: false, message };
    }

    if (requestedAmount > remainingAmount) {
      const message = 'Ödeme tutarı kalan bakiyeden büyük olamaz.';
      if (!suppressToast) {
        pushToast({ type: 'error', title: 'Tahsilat başarısız', message });
      }
      return { success: false, message };
    }

    const nextRemaining = Math.max(remainingAmount - requestedAmount, 0);
    const isFullyPaid = nextRemaining === 0;

    const payload = {
      serviceFormId: payment.serviceFormId ?? null,
      amount: requestedAmount,
      paymentMethod: method,
      transactionId: payment.transactionId || `TRX-${Date.now()}`,
      status: isFullyPaid ? 'PAID' : 'PARTIAL',
    };

    const created = await api.payments.create(payload).catch(() => null);

    if (isFullyPaid) {
      setPayments((prev) => prev.filter((entry) => String(entry.id) !== String(id)));
    } else {
      setPayments((prev) => prev.map((entry) => String(entry.id) === String(id)
        ? { ...entry, amount: nextRemaining, status: 'PENDING' }
        : entry));
    }

    if (isFullyPaid && (created?.serviceFormId || payment.serviceFormId)) {
      setJobs((prev) => prev.map((job) => String(job.serviceFormId ?? job.id) === String(payment.serviceFormId ?? payment.id)
        ? { ...job, paid: true }
        : job));
    }

    if (!suppressToast) {
      pushToast({
        type: isFullyPaid ? 'success' : 'info',
        title: isFullyPaid ? 'Tahsilat tamamlandı' : 'Kısmi tahsilat alındı',
        message: `${payment.plate} için ${requestedAmount.toLocaleString('tr-TR')} TL ödeme yapıldı.`,
      });
    }

    return {
      success: true,
      payment: created || payload,
      paidAmount: requestedAmount,
      remainingAmount: nextRemaining,
      isFullyPaid,
    };
  }, [payments]);

  const updateUserProfile = useCallback(async (payload) => {
    const currentRaw = user?.raw || {};
    const response = await api.auth.updateProfile(payload).catch(() => null);
    const mergedRaw = { ...currentRaw, ...payload, ...(response || {}) };
    const normalized = normalizeUser(mergedRaw, user?.email || '');
    normalized.raw = mergedRaw;
    setUser(normalized);
    pushToast({ type: 'success', title: 'Profil güncellendi', message: 'Kullanıcı bilgileri kaydedildi.' });
    return { success: true, user: normalized };
  }, [user]);

  const changeUserPassword = useCallback(async (payload) => {
    await api.auth.changePassword(payload);
    pushToast({ type: 'success', title: 'Parola güncellendi', message: 'Yeni parola başarıyla kaydedildi.' });
    return { success: true };
  }, []);

  const value = useMemo(() => ({
    user,
    login,
    logout,
    error,
    isBootstrapping,
    refreshData: syncRemoteData,
    jobs,
    customers,
    appointments,
    payments,
    serviceCatalog,
    addJob,
    deleteJob,
    updateJob,
    setJobStatus,
    completeJob,
    addServiceItem,
    removeServiceItem,
    refreshJob,
    addCustomer,
    deleteCustomer,
    addAppointment,
    approveAppointment,
    deleteAppointment,
    processPayment,
    updateUserProfile,
    changeUserPassword,
    isValidTurkishPlate,
  }), [
    addAppointment,
    addCustomer,
    addJob,
    addServiceItem,
    approveAppointment,
    appointments,
    completeJob,
    customers,
    deleteAppointment,
    deleteCustomer,
    deleteJob,
    error,
    isBootstrapping,
    isValidTurkishPlate,
    jobs,
    login,
    logout,
    payments,
    processPayment,
    updateUserProfile,
    changeUserPassword,
    refreshJob,
    removeServiceItem,
    serviceCatalog,
    setJobStatus,
    syncRemoteData,
    updateJob,
    user,
  ]);

  return (
    <ServiceContext.Provider value={value}>
      {children}
    </ServiceContext.Provider>
  );
};

export const useService = () => {
  const context = useContext(ServiceContext);
  if (!context) {
    throw new Error('useService must be used within ServiceProvider');
  }
  return context;
};