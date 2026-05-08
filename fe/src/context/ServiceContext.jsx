/* eslint-disable react-refresh/only-export-components */
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
  appointmentOverrides: 'velauto_admin_appointment_status_v1',
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

const normalizeText = (...args) => {
  for (let arg of args) {
    if (arg !== null && arg !== undefined && arg !== '') return String(arg);
  }
  return '';
};

const normalizePlate = (plate) => {
  if (!plate) return '';
  return plate.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
};

const normalizePhoneForBackend = (phone) => {
  const cleaned = normalizeText(phone).replace(/\D/g, '');
  if (!cleaned) return '';

  if (cleaned.startsWith('90') && cleaned.length >= 12) {
    return `+${cleaned}`;
  }

  if (cleaned.startsWith('0') && cleaned.length >= 11) {
    return `+90${cleaned.slice(1)}`;
  }

  return `+90${cleaned.slice(-10)}`;
};

const isBackendCompatibleIntegerId = (id) => {
  const numericId = Number(id);
  return Number.isInteger(numericId) && numericId > 0 && numericId <= 2147483647;
};

const splitFullName = (fullName) => {
  const parts = normalizeText(fullName).trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return { firstName: 'Yeni', lastName: 'Müşteri' };
  }

  if (parts.length === 1) {
    return { firstName: parts[0], lastName: '' };
  }

  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(' '),
  };
};

export const ServiceProvider = ({ children }) => {
  const savedTokens = getStoredTokens();
  const [user, setUser] = useState(() => (savedTokens.accessToken || savedTokens.refreshToken) ? loadJsonValue([CACHE_KEYS.user], null) : null);
  const [jobs, setJobs] = useState(() => loadJsonArray([CACHE_KEYS.jobs, 'velauto_jobs'], []));
  const [customers, setCustomers] = useState(() => loadJsonArray([CACHE_KEYS.customers, 'velauto_customers'], []));
  const [vehicles, setVehicles] = useState(() => loadJsonArray(['velauto_vehicles_cache', 'velauto_vehicles'], []));
  const [appointments, setAppointments] = useState(() => loadJsonArray([CACHE_KEYS.appointments, 'velauto_appointments'], []));
  const [payments, setPayments] = useState(() => loadJsonArray([CACHE_KEYS.payments, 'velauto_payments'], []));
  const [serviceCatalog, setServiceCatalog] = useState(() => loadJsonArray([CACHE_KEYS.serviceCatalog], []));
  const [appointmentOverrides, setAppointmentOverrides] = useState(() => loadJsonValue([CACHE_KEYS.appointmentOverrides], {}));
  const [isBootstrapping, setIsBootstrapping] = useState(Boolean(savedTokens.accessToken || savedTokens.refreshToken));
  const [error, setError] = useState('');
  const [isLoadingJob, setIsLoadingJob] = useState(false);

  useEffect(() => saveJson(CACHE_KEYS.user, user), [user]);
  useEffect(() => saveJson(CACHE_KEYS.jobs, jobs), [jobs]);
  useEffect(() => saveJson(CACHE_KEYS.customers, customers), [customers]);
  useEffect(() => saveJson('velauto_vehicles_cache', vehicles), [vehicles]);
  useEffect(() => saveJson(CACHE_KEYS.appointments, appointments), [appointments]);
  useEffect(() => saveJson(CACHE_KEYS.payments, payments), [payments]);
  useEffect(() => saveJson(CACHE_KEYS.serviceCatalog, serviceCatalog), [serviceCatalog]);
  useEffect(() => saveJson(CACHE_KEYS.appointmentOverrides, appointmentOverrides), [appointmentOverrides]);

  // Normalize any cached jobs/appointments on mount so older caches still have status metadata
  useEffect(() => {
    setJobs((prev) => (Array.isArray(prev) ? prev.map((j) => {
      try {
        const meta = deriveJobStatus(j.status || j.statusKey || j.raw?.status || 'IN_PROGRESS');
        return { ...j, statusKey: meta.key || meta.status, statusLabel: meta.label || meta.status, status: meta.status, color: meta.color };
      } catch {
        return j;
      }
    }) : prev));

    setAppointments((prev) => (Array.isArray(prev) ? prev.map((a) => {
      try {
        const meta = deriveJobStatus(a.status || a.statusKey || a.raw?.status || a.type || 'PENDING');
        return { ...a, statusKey: meta.key || meta.status, statusLabel: meta.label || meta.status, status: meta.status, color: meta.color };
      } catch {
        return a;
      }
    }) : prev));
  }, []);

  const isValidTurkishPlate = useCallback((plate) => {
    const normalizedPlate = normalizePlate(plate);
    const match = normalizedPlate.match(/^(\d{2})([A-Z]{1,3})(\d{2,4})$/);
    if (!match) return false;

    const provinceNum = parseInt(match[1], 10);
    if (provinceNum < 1 || provinceNum > 81) return false;

    return true;
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

      const storedUserStr = localStorage.getItem('user');
      const storedUser = storedUserStr ? JSON.parse(storedUserStr) : null;
      const tenantId = storedUser?.tenantId || 1;

      const query = `?page=0&size=50&tenantId=${tenantId}`;

      const [profileResponse, customersResponse, vehiclesResponse, appointmentsResponse, serviceFormsResponse, catalogResponse] = await Promise.all([
        api.auth.me().catch(() => null),
        api.customers.list(query).catch(() => []),
        api.vehicles.list(query).catch(() => []),
        api.appointments.list(query).catch(() => []),
        api.serviceForms.list(query).catch(() => []),
        api.serviceCatalog.list(query).catch(() => []), // Doğru endpoint: serviceCatalog (s takısı yok)
      ]);

      const normalizedCustomers = extractCollection(customersResponse).map(normalizeCustomer);
      const normalizedVehicles = extractCollection(vehiclesResponse);
      const normalizedAppointmentsRaw = extractCollection(appointmentsResponse);
      const normalizedServiceFormsRaw = extractCollection(serviceFormsResponse);
      const normalizedCatalog = extractCollection(catalogResponse).map(normalizeServiceCatalogItem);

      normalizedCustomers.forEach(customer => { if (!customer.plate) { const customerVehicle = normalizedVehicles.find(v => String(v.customerId) === String(customer.id) || String(v.customer?.id) === String(customer.id)); if (customerVehicle && customerVehicle.plate) { customer.plate = customerVehicle.plate; } } });

      const customerLookup = new Map(normalizedCustomers.map((customer) => [String(customer.id), customer]));
      const vehicleLookup = new Map(normalizedVehicles.map((vehicle) => [String(vehicle.id), vehicle]));

      const normalizedAppointments = normalizedAppointmentsRaw.map((appointment) => normalizeAppointment(appointment, customerLookup, vehicleLookup));
      const normalizedJobs = normalizeJobList(normalizedServiceFormsRaw, normalizedCustomers, normalizedVehicles);

      // Attach localized status metadata for UI (statusKey, statusLabel) while preserving `status` for logic
      const enrichedAppointments = (normalizedAppointments || []).map((a) => {
        const meta = deriveJobStatus(a.status || a.type || a.statusRaw || 'PENDING');
        return { ...a, statusKey: meta.key || meta.status, statusLabel: meta.label || meta.status, status: meta.status, color: meta.color };
      });

      const enrichedJobs = (normalizedJobs || []).map((j) => {
        const meta = deriveJobStatus(j.status || j.statusKey || j.raw?.status || j.type || 'IN_PROGRESS');
        return { ...j, statusKey: meta.key || meta.status, statusLabel: meta.label || meta.status, status: meta.status, color: meta.color };
      });

      const cachedUser = loadJsonValue([CACHE_KEYS.user], null);
      setUser(normalizeUser(profileResponse, cachedUser?.email || ''));
      setCustomers(normalizedCustomers);
      setVehicles(normalizedVehicles);
      setAppointments(enrichedAppointments);
      setJobs(enrichedJobs);
      setServiceCatalog(normalizedCatalog);

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

    api.auth.me()
      .then(profileResponse => {
        const cachedUser = loadJsonValue([CACHE_KEYS.user], null);
        setUser(normalizeUser(profileResponse, cachedUser?.email || ''));
      })
      .catch((err) => {
        console.warn("Oturum doğrulanamadı, token süresi dolmuş olabilir.", err);
      })
      .finally(() => {
        setIsBootstrapping(false);
      });

  }, []);

  const ensureCustomer = useCallback(async ({ fullName, phone, plate, address, notes }) => {
    const normalizedPlate = normalizePlate(plate);
    const normalizedPhone = normalizePhoneForBackend(phone);
    const existingCustomer = customers.find((customer) =>
      (normalizedPlate && normalizePlate(customer.plate) === normalizedPlate) ||
      (normalizeText(phone) && normalizeText(customer.phone) === normalizeText(phone))
    );
    if (existingCustomer) {
      return existingCustomer;
    }

    // Telefon ile backend ön-kontrol isteği (404) gürültü yaptığı için devre dışı.

    const { firstName, lastName } = splitFullName(fullName);
    const payload = {
      firstName,
      lastName,
      customer: normalizeText(fullName, 'Yeni Müşteri'),
      phone: normalizedPhone,
      address: normalizeText(address),
      notes: normalizeText(notes),
      plate: normalizedPlate,
    };

    const created = await api.customers.create(payload);
    const normalized = normalizeCustomer(created || { ...payload, id: Date.now() });
    setCustomers((prev) => [...prev.filter((customer) => String(customer.id) !== String(normalized.id)), normalized]);
    return normalized;
  }, [customers]);

  const ensureVehicle = useCallback(async ({ licensePlate, customerId, customerName, brand, model }) => {
    const normalizedPlate = normalizePlate(licensePlate);
    const customerLookup = new Map(customers.map((customer) => [String(customer.id), customer]));

    // Araç zaten var mı kontrol et
    const existingVehicle = vehicles?.find((vehicle) => normalizePlate(vehicle?.licensePlate || vehicle?.plate) === normalizedPlate);
    if (existingVehicle) {
      return existingVehicle;
    }

    const payload = {
      licensePlate: normalizedPlate,
      customerId,
      brand: normalizeText(brand),
      model: normalizeText(model)
    };

    let created;
    try {
      created = await api.vehicles.create(payload);
    } catch (err) {
      const status = err?.status || err?.response?.status;
      if (status !== 409) {
        throw err;
      }

      const storedUser = JSON.parse(localStorage.getItem('user') || 'null');
      const tenantId = storedUser?.tenantId || user?.raw?.tenantId || 1;
      const listResponse = await api.vehicles.list(`?page=0&size=100&tenantId=${tenantId}`).catch(() => null);
      const matched = extractCollection(listResponse)
        .find((vehicle) => normalizePlate(vehicle?.licensePlate || vehicle?.plate) === normalizedPlate);

      if (!matched) {
        throw err;
      }

      const normalizedMatched = normalizeVehicle(matched, customerLookup);
      normalizedMatched.plate = normalizedPlate;
      normalizedMatched.customer = normalizeText(customerName, normalizedMatched.customer, 'Müşteri');
      setVehicles((prev) => [
        ...prev.filter((vehicle) => String(vehicle.id) !== String(normalizedMatched.id)),
        normalizedMatched,
      ]);
      return normalizedMatched;
    }

    const normalized = normalizeVehicle(created || payload, customerLookup);
    normalized.plate = normalizedPlate;
    normalized.customer = normalizeText(customerName, normalized.customer, 'Müşteri');
    setVehicles((prev) => [
      ...prev.filter((vehicle) => String(vehicle.id) !== String(normalized.id)),
      normalized,
    ]);
    return normalized;
  }, [customers, user?.raw?.tenantId, vehicles]);

  const login = useCallback(async (backendUser) => {
    const normalizedUser = normalizeUser(backendUser, backendUser?.email);
    setUser(normalizedUser);
    return { success: true, user: normalizedUser };
  }, []);

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
    if (!normalizeText(newCustomer?.name, newCustomer?.fullName) || !normalizeText(newCustomer?.phone)) {
      throw new Error('Müşteri adı ve telefon zorunludur.');
    }

    const customer = await ensureCustomer({
      fullName: newCustomer.fullName || newCustomer.name,
      phone: newCustomer.phone,
      plate: newCustomer.plate,
      email: newCustomer.email,
      address: newCustomer.address,
      notes: newCustomer.notes,
    });

    if (customer?.id && newCustomer?.plate) {
      const normalizedPlate = normalizePlate(newCustomer.plate);
      await ensureVehicle({
        licensePlate: normalizedPlate,
        customerId: customer.id,
        customerName: customer.fullName,
        brand: '',
        model: '',
      });
    }

    pushToast({
      type: 'success',
      title: 'Müşteri eklendi',
      message: `${customer.fullName} kaydı oluşturuldu.`,
    });
    return { success: true, customer };
  }, [ensureCustomer]);

  const deleteCustomer = useCallback(async (id) => {
    try {
      await api.customers.remove(id);
      setCustomers((prev) => prev.filter((customer) => String(customer.id) !== String(id)));
      pushToast({ type: 'info', title: 'Müşteri silindi', message: 'Seçili müşteri kaydı kaldırıldı.' });
      return { success: true };
    } catch (err) {
      const message = (err && (err.message || err?.response?.data?.message)) || 'Müşteri silinirken hata oluştu.';
      pushToast({ type: 'danger', title: 'Silme Hatası', message });
      return { success: false, error: message };
    }
  }, []);

  const addAppointment = useCallback(async (appointment) => {

    const missingFields = {};
    if (!appointment.brand) missingFields.brand = true;
    if (!appointment.model) missingFields.model = true;

    if (Object.keys(missingFields).length > 0) {
      pushToast({
        type: 'warning',
        title: 'Eksik Bilgi',
        message: 'Lütfen kırmızı ile işaretlenmiş alanları doldurunuz.',
      });
      return { success: false, validationErrors: missingFields };
    }

    const customer = await ensureCustomer({
      fullName: appointment.customer,
      phone: appointment.phone,
      plate: appointment.plate,
    });


    let vehicleId = null;
    let createdVehicle = null;
    const normalizedPlate = normalizePlate(appointment.plate);
    const cachedVehicle = vehicles.find(v => normalizePlate(v.licensePlate || v.plate) === normalizedPlate);

    if (cachedVehicle && cachedVehicle.id) {
      vehicleId = cachedVehicle.id;
    } else {

      createdVehicle = await api.vehicles.create({
        licensePlate: normalizedPlate,
        customerId: customer.id,
        currentKm: 0,
        brand: appointment.brand || 'Diğer',
        model: appointment.model || 'Bilinmiyor'
      }).catch(() => null);

      if (createdVehicle?.id) {
        const customerLookup = new Map(customers.map((entry) => [String(entry.id), entry]));
        const normalizedCreatedVehicle = normalizeVehicle(createdVehicle, customerLookup);
        normalizedCreatedVehicle.plate = normalizedPlate;
        setVehicles((prev) => [
          ...prev.filter((vehicle) => String(vehicle.id) !== String(normalizedCreatedVehicle.id)),
          normalizedCreatedVehicle,
        ]);
      }

      vehicleId = createdVehicle?.id || null;
    }


    let created = null;
    try {

      let formattedDate = appointment.time;
      if (formattedDate && !formattedDate.includes(':00.000Z')) {

        formattedDate = new Date(appointment.time).toISOString();
      }

      created = await api.appointments.create({
        customerId: customer.id,
        vehicleId,
        appointmentDate: formattedDate,
        description: appointment.service,

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
        brand: appointment.brand,
        model: appointment.model,
      };
    }

    const vehicleSnapshot = cachedVehicle || createdVehicle || {};
    const normalizedAppointment = normalizeAppointment(
      created || appointment,
      new Map([[String(customer.id), customer]]),
      new Map([[String(vehicleId), {
        id: vehicleId,
        licensePlate: normalizedPlate,
        plate: normalizedPlate,
        brand: vehicleSnapshot.brand || appointment.brand,
        model: vehicleSnapshot.model || appointment.model,
      }]])
    );
    normalizedAppointment.plate = normalizedAppointment.plate || normalizedPlate;
    normalizedAppointment.brand = normalizedAppointment.brand || appointment.brand;
    normalizedAppointment.model = normalizedAppointment.model || appointment.model;

    setAppointments((prev) => [...prev.filter((item) => String(item.id) !== String(normalizedAppointment.id)), normalizedAppointment]);
    pushToast({
      type: created && typeof created.id !== 'string' ? 'success' : 'warning',
      title: 'Randevu kaydedildi',
      message: created && typeof created.id !== 'string' ? `${appointment.plate} için randevu oluşturuldu.` : `${appointment.plate} için yerel kayıt oluşturuldu.`,
    });
    return { success: true, appointment: normalizedAppointment };
  }, [customers, ensureCustomer, vehicles]); // <-- vehicles bağımlılığını eklemeyi unutma!

  const approveAppointment = useCallback(async (id) => {
    setAppointments((prev) => prev.map((appointment) => String(appointment.id) === String(id)
      ? { ...appointment, status: 'ONAYLI', type: 'green' }
      : appointment));

    await api.appointments.update(id, { status: 'APPROVED' }).catch(() => null);
    pushToast({ type: 'success', title: 'Randevu onaylandı', message: 'Randevu durumu güncellendi.' });
    return { success: true };
  }, []);

  const deleteAppointment = useCallback(async (id) => {
    if (isBackendCompatibleIntegerId(id)) {
      await api.appointments.remove(id).catch(() => null);
    }
    setAppointments((prev) => prev.filter((appointment) => String(appointment.id) !== String(id)));
    return { success: true };
  }, []);

  const reviseAppointment = useCallback(async (id, newDate, notes) => {
    try {
      const updated = await api.appointments.revise(id, { newDate, notes });
      const normalized = normalizeAppointment(updated);

      setAppointments((prev) => prev.map((app) => String(app.id) === String(id)
        ? { ...app, ...normalized, statusLabel: 'Revize Edildi', color: 'orange', status: 'REVISED' }
        : app));

      pushToast({ type: 'success', title: 'Randevu revize edildi', message: 'Müşteriye bilgilendirme maili gönderildi.' });
      return { success: true };
    } catch (err) {
      pushToast({ type: 'danger', title: 'Hata', message: err.message || 'Revize işlemi başarısız.' });
      return { success: false };
    }
  }, []);

  const setAppointmentOverride = useCallback((id, status) => {
    setAppointmentOverrides((prev) => ({
      ...prev,
      [id]: {
        status,
        at: status === 'CONVERTED' ? new Date().toISOString() : null,
      },
    }));
  }, []);

  const getAppointmentStatus = useCallback((appointment) => {
    const override = appointmentOverrides[appointment.id];
    if (override) return override;
    return {
      status: appointment.status === 'ONAYLI' ? 'APPROVED' : 'PENDING',
      at: null,
    };
  }, [appointmentOverrides]);

  const addJob = useCallback(async (newJob) => {
    if (isLoadingJob) {
      throw new Error('İş emri oluşturuluyor, lütfen bekleyin...');
    }

    setIsLoadingJob(true);
    try {
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

      const vehicle = await ensureVehicle({
        licensePlate: plate,
        customerId: customer.id,
        customerName: customer.fullName,
        brand: newJob.brand,
        model: newJob.model || newJob.customModel
      });

      const currentKm = toNumber(newJob.currentKm, 0);
      const complaint = newJob.complaint || newJob.description || 'Belirtilmedi';

      const serviceForm = { id: Date.now(), vehicleId: vehicle.id, customerId: customer.id, currentKm };

      const normalizedJob = normalizeServiceForm(serviceForm, new Map([[String(customer.id), customer]]), new Map([[String(vehicle.id), { ...vehicle, customer }]]));
      normalizedJob.plate = plate;
      normalizedJob.customer = customer.fullName;
      normalizedJob.brand = newJob.brand || normalizedJob.brand;
      normalizedJob.complaint = complaint || normalizedJob.complaint;
      normalizedJob.items = Array.isArray(newJob.items) ? newJob.items.map(normalizeServiceItem) : [];
      normalizedJob.total = toNumber(newJob.total, normalizedJob.items.reduce((sum, item) => sum + toNumber(item.price, 0), 0));
      const meta = deriveJobStatus(newJob.status || normalizedJob.status);
      normalizedJob.status = meta.status;
      normalizedJob.color = meta.color;
      normalizedJob.statusKey = meta.key || meta.status;
      normalizedJob.statusLabel = meta.label || meta.status;

      setJobs((prev) => [...prev.filter((job) => String(job.id) !== String(normalizedJob.id)), normalizedJob]);
      pushToast({
        type: 'success',
        title: 'İş emri oluşturuldu',
        message: `${plate} plakalı araç için servis kaydı açıldı.`,
      });
      return { success: true, job: normalizedJob };
    } finally {
      setIsLoadingJob(false);
    }
  }, [ensureCustomer, ensureVehicle, isValidTurkishPlate, isLoadingJob]);

  const deleteJob = useCallback(async (id) => {
    if (isBackendCompatibleIntegerId(id)) {
      await api.serviceForms.remove(id).catch(() => null);
    }
    setJobs((prev) => prev.filter((job) => String(job.id) !== String(id)));
    pushToast({ type: 'info', title: 'İş emri silindi', message: 'Servis kaydı kaldırıldı.' });
    return { success: true };
  }, []);

  const updateJob = useCallback(async (id, updatedFields) => {
    setJobs((prev) => prev.map((job) => String(job.id) === String(id) ? { ...job, ...updatedFields } : job));

    const currentJob = jobs.find((job) => String(job.id) === String(id));
    if (isBackendCompatibleIntegerId(currentJob?.serviceFormId)) {
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
    setJobs((prev) => prev.map((item) => String(item.id) === String(id) ? { ...item, status: statusMeta.status, color: statusMeta.color, statusKey: statusMeta.key || statusMeta.status, statusLabel: statusMeta.label || statusMeta.status } : item));

    if (isBackendCompatibleIntegerId(job.serviceFormId)) {
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

    /*pushToast({
      type: statusMeta.status === 'COMPLETED' ? 'success' : 'info',
      title: 'İş durumu güncellendi',
      message: `${job.plate} için durum ${statusMeta.status === 'COMPLETED' ? 'tamamlandı' : statusMeta.status === 'WAITING_PART' ? 'parça bekliyor' : 'işlemde'} olarak ayarlandı.`,
    });*/

    return { success: true };
  }, [jobs]);

  const completeJob = useCallback((id) => setJobStatus(id, 'COMPLETED'), [setJobStatus]);

  const addServiceItem = useCallback(async (jobId, item) => {
    const job = jobs.find((entry) => String(entry.id) === String(jobId));
    if (!job) throw new Error('İş emri bulunamadı.');

    const normalizedItem = normalizeServiceItem(item);

    if (isBackendCompatibleIntegerId(job.serviceFormId)) {
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
    if (!isBackendCompatibleIntegerId(current?.serviceFormId)) return current || null;

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
    isLoadingJob,
    refreshData: syncRemoteData,
    jobs,
    customers,
    vehicles,
    appointments,
    payments,
    serviceCatalog,
    appointmentOverrides,
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
    reviseAppointment,
    setAppointmentOverride,
    getAppointmentStatus,
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
    appointmentOverrides,
    completeJob,
    customers,
    deleteAppointment,
    deleteCustomer,
    deleteJob,
    error,
    isBootstrapping,
    isLoadingJob,
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
    vehicles,
    setAppointmentOverride,
    getAppointmentStatus,
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