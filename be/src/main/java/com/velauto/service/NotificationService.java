package com.velauto.service;

public interface NotificationService {

  void sendWelcomePassword(String phone, String rawPassword);

  void sendStaffWelcomeEmail(String email, String rawPassword);

  void sendAppointmentConfirmation(String phone, String appointmentDetails);
}

