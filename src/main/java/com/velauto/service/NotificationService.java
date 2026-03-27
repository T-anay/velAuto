package com.velauto.service;

public interface NotificationService {

  void sendWelcomePassword(String phone, String rawPassword);

  void sendAppointmentConfirmation(String phone, String appointmentDetails);
}

