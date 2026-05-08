package com.velauto.service;

public interface EmailService {
    void sendStaffWelcomeEmail(String to, String fullName, String rawPassword);

    void sendHtmlEmail(String to, String subject, String content);

    void sendAppointmentStatusEmail(String to, String customerName, String plate, String status, String date, String notes);
}
