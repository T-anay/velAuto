package com.velauto.service.impl;

import com.velauto.constant.Messages;
import com.velauto.dto.AssignStaffDto;
import com.velauto.dto.VehicleCreateDto;
import com.velauto.dto.VehicleResponseDto;
import com.velauto.dto.VehicleUpdateDto;
import com.velauto.dto.VehicleWithHistoryDto;
import com.velauto.entity.Appointment;
import com.velauto.entity.Brand;
import com.velauto.entity.Customer;
import com.velauto.entity.ServiceForm;
import com.velauto.entity.Staff;
import com.velauto.entity.Vehicle;
import com.velauto.entity.VehicleModel;
import com.velauto.exception.BusinessException;
import com.velauto.mapper.VehicleMapper;
import com.velauto.repository.BrandRepository;
import com.velauto.repository.CustomerRepository;
import com.velauto.repository.StaffRepository;
import com.velauto.repository.VehicleRepository;
import com.velauto.repository.VehicleModelRepository;
import com.velauto.service.AuditLogService;
import com.velauto.service.VehicleService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;
@Slf4j
@Service
@RequiredArgsConstructor
public class VehicleServiceImpl implements VehicleService {

  private final VehicleRepository vehicleRepository;
  private final CustomerRepository customerRepository;
  private final StaffRepository staffRepository;
  private final BrandRepository brandRepository;
  private final VehicleModelRepository vehicleModelRepository;
  private final VehicleMapper vehicleMapper;
  private final AuditLogService auditLogService;

  @Override
  @Transactional
  public VehicleResponseDto createVehicle(VehicleCreateDto request, Integer currentUserId) {
    String licensePlate = request.getLicensePlate();
    if (licensePlate == null || licensePlate.isBlank()) {
      throw new BusinessException("Plaka boş bırakılamaz", HttpStatus.BAD_REQUEST);
    }

    if (vehicleRepository.findByLicensePlate(licensePlate).isPresent()) {
      throw new BusinessException("Bu plakaya ait araç zaten mevcut", HttpStatus.CONFLICT);
    }

    Brand brand = brandRepository.findById(request.getBrandId())
        .orElseThrow(() -> new BusinessException("Marka bulunamadı", HttpStatus.NOT_FOUND));

    VehicleModel vehicleModel = vehicleModelRepository.findById(request.getModelId())
        .orElseThrow(() -> new BusinessException("Model bulunamadı", HttpStatus.NOT_FOUND));

    Customer customer = null;
    if (request.getCustomerId() != null) {
      customer = customerRepository.findById(request.getCustomerId())
          .orElseThrow(() -> new BusinessException("Müşteri bulunamadı", HttpStatus.NOT_FOUND));
    }

    Vehicle vehicle = vehicleMapper.toVehicle(request, customer, brand, vehicleModel);
    Vehicle savedVehicle = vehicleRepository.save(vehicle);

    String customerName = (customer != null && customer.getUser() != null)
        ? customer.getUser().getFirstName() + " " + customer.getUser().getLastName()
        : "atanmamis";
    String auditDetails = String.format(
        "Arac olusturuldu: plaka=%s, musteri=%s, kilometre=%d, olusturan=%d, zaman=%s",
        licensePlate,
        customerName,
        request.getOdometer() != null ? request.getOdometer() : 0,
        currentUserId,
        LocalDateTime.now()
    );
    auditLogService.log(currentUserId, "VEHICLE_CREATED", "VEHICLE", savedVehicle.getId(), auditDetails);


    return vehicleMapper.toVehicleResponse(savedVehicle);
  }

  @Override
  @Transactional
  public VehicleResponseDto updateVehicle(Integer vehicleId, VehicleUpdateDto request, Integer currentUserId) {
    Vehicle vehicle = vehicleRepository.findById(vehicleId)
        .orElseThrow(() -> new BusinessException("Araç bulunamadı", HttpStatus.NOT_FOUND));

    if (vehicle.getDeletedAt() != null) {
      throw new BusinessException("Silinen araç güncellenemez", HttpStatus.GONE);
    }

    String oldPlate = vehicle.getLicensePlate();
    Integer oldOdometer = vehicle.getOdometer();
    Integer oldCustomerId = vehicle.getCustomer() != null ? vehicle.getCustomer().getId() : null;

    if (request.getLicensePlate() != null && !request.getLicensePlate().equals(oldPlate)) {
      if (vehicleRepository.findByLicensePlate(request.getLicensePlate()).isPresent()) {
        throw new BusinessException("Bu plakaya ait araç zaten mevcut", HttpStatus.CONFLICT);
      }
    }

    Customer newCustomer = null;
    if (request.getCustomerId() != null) {
      newCustomer = customerRepository.findById(request.getCustomerId())
          .orElseThrow(() -> new BusinessException("Müşteri bulunamadı", HttpStatus.NOT_FOUND));
    }

    vehicleMapper.updateVehicle(request, vehicle, newCustomer);
    vehicle.setUpdatedBy(currentUserId);

    Vehicle updatedVehicle = vehicleRepository.save(vehicle);

    String auditDetails = String.format(
        "Araç güncellendi: eski_plaka=%s, yeni_plaka=%s, eski_kilometre=%d, yeni_kilometre=%d, " +
        "eski_müşteri=%d, yeni_müşteri=%d, güncelleyen=%d, zaman=%s",
        oldPlate,
        updatedVehicle.getLicensePlate(),
        oldOdometer != null ? oldOdometer : 0,
        updatedVehicle.getOdometer() != null ? updatedVehicle.getOdometer() : 0,
        oldCustomerId != null ? oldCustomerId : 0,
        updatedVehicle.getCustomer() != null ? updatedVehicle.getCustomer().getId() : 0,
        currentUserId,
        LocalDateTime.now()
    );
    auditLogService.log(currentUserId, "VEHICLE_UPDATED", "VEHICLE", updatedVehicle.getId(), auditDetails);

    return vehicleMapper.toVehicleResponse(updatedVehicle);
  }

  @Override
  @Transactional(readOnly = true)
  public VehicleResponseDto getVehicleById(Integer vehicleId) {
    Vehicle vehicle = vehicleRepository.findById(vehicleId)
        .orElseThrow(() -> new BusinessException("Araç bulunamadı", HttpStatus.NOT_FOUND));

    if (vehicle.getDeletedAt() != null) {
      throw new BusinessException("Araç bulunamadı", HttpStatus.NOT_FOUND);
    }

    return vehicleMapper.toVehicleResponse(vehicle);
  }

  @Override
  @Transactional(readOnly = true)
  public VehicleResponseDto getByLicensePlate(String licensePlate) {
    if (licensePlate == null || licensePlate.isBlank()) {
      throw new BusinessException("Plaka boş bırakılamaz", HttpStatus.BAD_REQUEST);
    }

    Vehicle vehicle = vehicleRepository.findByLicensePlate(licensePlate)
        .orElseThrow(() -> new BusinessException("Plaka ile eşleşen araç bulunamadı", HttpStatus.NOT_FOUND));

    return vehicleMapper.toVehicleResponse(vehicle);
  }

  @Override
  @Transactional(readOnly = true)
  public VehicleWithHistoryDto getVehicleWithHistory(String licensePlate) {
    if (licensePlate == null || licensePlate.isBlank()) {
      throw new BusinessException("Plaka boş bırakılamaz", HttpStatus.BAD_REQUEST);
    }

    Vehicle vehicle = vehicleRepository.findByLicensePlateWithDetails(licensePlate)
        .orElseThrow(() -> new BusinessException("Plaka ile eşleşen araç bulunamadı", HttpStatus.NOT_FOUND));

    VehicleWithHistoryDto response = vehicleMapper.toVehicleWithHistoryResponse(vehicle);

    // FUTURE NOTE: ServiceForm ve Appointment geçmişi burada eklenmelidir
    // Bu işlem başka bir servis tarafından yapılabilir veya JOIN ile tek sorguya çekilebilir
    // Şu an placeholder bırakılmıştır

    return response;
  }

  @Override
  @Transactional(readOnly = true)
  public Page<VehicleResponseDto> getVehiclesByCustomer(Integer customerId, Pageable pageable) {
    // GUARD CLAUSE: Müşteri bulunması
    Customer customer = customerRepository.findById(customerId)
        .orElseThrow(() -> new BusinessException("Müşteri bulunamadı", HttpStatus.NOT_FOUND));

    // GUARD CLAUSE: Soft delete kontrol
    if (customer.getDeletedAt() != null) {
      throw new BusinessException("Müşteri bulunamadı", HttpStatus.NOT_FOUND);
    }

    Page<Vehicle> vehicles = vehicleRepository.findByCustomer(customer, pageable);
    return vehicles.map(vehicleMapper::toVehicleResponse);
  }

  @Override
  @Transactional(readOnly = true)
  public Page<VehicleResponseDto> getAssignedVehicles(Integer staffId, Pageable pageable) {
    // GUARD CLAUSE: Staff bulunması
    Staff staff = staffRepository.findById(staffId)
        .orElseThrow(() -> new BusinessException("Staff bulunamadı", HttpStatus.NOT_FOUND));

    // GUARD CLAUSE: Soft delete kontrol
    if (staff.getDeletedAt() != null) {
      throw new BusinessException("Staff bulunamadı", HttpStatus.NOT_FOUND);
    }

    Page<Vehicle> vehicles = vehicleRepository.findByAssignedStaff(staff, pageable);
    return vehicles.map(vehicleMapper::toVehicleResponse);
  }

  @Override
  @Transactional(readOnly = true)
  public Page<VehicleResponseDto> getAllVehicles(Integer tenantId, Pageable pageable) {
    // GUARD CLAUSE: Tenant ID validasyonu
    if (tenantId == null || tenantId <= 0) {
      throw new BusinessException("Geçersiz Tenant ID", HttpStatus.BAD_REQUEST);
    }

    Page<Vehicle> vehicles = vehicleRepository.findAllByTenant(tenantId, pageable);
    return vehicles.map(vehicleMapper::toVehicleResponse);
  }

  @Override
  @Transactional
  public VehicleResponseDto assignStaff(Integer vehicleId, AssignStaffDto request, Integer currentUserId) {
    Vehicle vehicle = vehicleRepository.findById(vehicleId)
        .orElseThrow(() -> new BusinessException("Araç bulunamadı", HttpStatus.NOT_FOUND));

    if (vehicle.getDeletedAt() != null) {
      throw new BusinessException("Silinen araç güncellenemez", HttpStatus.GONE);
    }

    Staff staff = null;
    if (request.getStaffId() != null) {
      staff = staffRepository.findById(request.getStaffId())
          .orElseThrow(() -> new BusinessException("Staff bulunamadı", HttpStatus.NOT_FOUND));

      if (staff.getDeletedAt() != null) {
        throw new BusinessException("Staff bulunamadı", HttpStatus.NOT_FOUND);
      }
    }

    Integer oldStaffId = vehicle.getAssignedStaff() != null ? vehicle.getAssignedStaff().getId() : null;

    vehicle.setAssignedStaff(staff);
    vehicle.setUpdatedBy(currentUserId);

    Vehicle updatedVehicle = vehicleRepository.save(vehicle);

    String auditDetails = String.format(
        "Staff atama: eski_staff=%d, yeni_staff=%d, araç_plaka=%s, atayan=%d, zaman=%s",
        oldStaffId != null ? oldStaffId : 0,
        staff != null ? staff.getId() : 0,
        vehicle.getLicensePlate(),
        currentUserId,
        LocalDateTime.now()
    );
    auditLogService.log(currentUserId, "VEHICLE_STAFF_ASSIGNED", "VEHICLE", updatedVehicle.getId(), auditDetails);

    return vehicleMapper.toVehicleResponse(updatedVehicle);
  }

  @Override
  @Transactional
  public void deleteVehicle(Integer vehicleId, Integer currentUserId) {
    Vehicle vehicle = vehicleRepository.findById(vehicleId)
        .orElseThrow(() -> new BusinessException("Araç bulunamadı", HttpStatus.NOT_FOUND));

    if (vehicle.getDeletedAt() != null) {
      throw new BusinessException("Araç zaten silinmiş", HttpStatus.GONE);
    }

    vehicle.setDeletedAt(LocalDateTime.now());
    vehicle.setDeletedBy(currentUserId);

    vehicleRepository.save(vehicle);

    String auditDetails = String.format(
        "Araç silindi (soft delete): araç_plaka=%s, silinen=%d, zaman=%s",
        vehicle.getLicensePlate(),
        currentUserId,
        LocalDateTime.now()
    );
    auditLogService.log(currentUserId, "VEHICLE_DELETED", "VEHICLE", vehicleId, auditDetails);
  }
}


