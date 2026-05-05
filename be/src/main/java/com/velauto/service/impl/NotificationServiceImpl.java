package com.velauto.service.impl;

import com.velauto.service.NotificationService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Slf4j
@Service
public class NotificationServiceImpl implements NotificationService {

  @Override
  public void sendWelcomePassword(String phone, String rawPassword) {
    System.out.println("=".repeat(80));
    System.out.println("📧 MOCK NOTIFICATION: Welcome Password");
    System.out.println("=".repeat(80));
    System.out.println("TO: " + phone);
    System.out.println("SUBJECT: velAuto Hoşgeldiniz!");
    System.out.println("MESSAGE:");
    System.out.println("---");
    System.out.println("velAuto Oto Servis sistemine hoş geldiniz!");
    System.out.println("Aşağıdaki bilgilerle giriş yapabilirsiniz:");
    System.out.println("Telefon/Kullanıcı Adı: " + phone);
    System.out.println("Geçici Şifre: " + rawPassword);
    System.out.println("(Şifrenizi güvenli tutunuz!)");
    System.out.println("---");
    System.out.println("İletişim: support@velauto.com");
    System.out.println("=".repeat(80));
  }

  @Override
  public void sendAppointmentConfirmation(String phone, String appointmentDetails) {
    System.out.println("=".repeat(80));
    System.out.println("📧 MOCK NOTIFICATION: Appointment Confirmation");
    System.out.println("=".repeat(80));
    System.out.println("TO: " + phone);
    System.out.println("SUBJECT: Randevu Onayı");
    System.out.println("MESSAGE:");
    System.out.println("---");
    System.out.println("Randevu talebiniz alınmıştır:");
    System.out.println(appointmentDetails);
    System.out.println("En kısa zamanda size dönüş yapılacaktır.");
    System.out.println("---");
    System.out.println("İletişim: support@velauto.com");
    System.out.println("=".repeat(80));
  }
}

