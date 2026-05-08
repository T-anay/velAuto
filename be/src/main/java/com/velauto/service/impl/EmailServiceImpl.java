package com.velauto.service.impl;

import com.velauto.service.EmailService;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailServiceImpl implements EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromEmail;

    @Async
    @Override
    public void sendStaffWelcomeEmail(String to, String fullName, String rawPassword) {
        String subject = "VelAuto - Personel Hesabınız Oluşturuldu";
        String content = String.format(
                "<html>" +
                        "<body style='font-family: Arial, sans-serif;'>" +
                        "<h2>Merhaba %s,</h2>" +
                        "<p>VelAuto sistemine personel olarak kaydınız başarıyla tamamlanmıştır.</p>" +
                        "<p>Giriş bilgileriniz aşağıdadır:</p>" +
                        "<div style='background-color: #f4f4f4; padding: 15px; border-radius: 5px;'>" +
                        "<p><strong>E-posta:</strong> %s</p>" +
                        "<p><strong>Geçici Şifre:</strong> <span style='color: #d9534f; font-weight: bold;'>%s</span></p>"
                        +
                        "</div>" +
                        "<p>Lütfen sisteme giriş yaptıktan sonra şifrenizi değiştirmeyi unutmayın.</p>" +
                        "<p>İyi çalışmalar dileriz.</p>" +
                        "<hr>" +
                        "<p style='font-size: 0.8em; color: #777;'>Bu bir otomatik mesajdır, lütfen cevaplamayınız.</p>"
                        +
                        "</body>" +
                        "</html>",
                fullName, to, rawPassword);

        sendHtmlEmail(to, subject, content);
    }

    @Async
    @Override
    public void sendAppointmentStatusEmail(String to, String customerName, String plate, String status, String date, String notes) {
        String subject = "VelAuto - Randevu Durumu Güncellendi: " + plate;
        
        String color = "#00adb5"; // Default brand color
        if (status.equalsIgnoreCase("APPROVED") || status.equalsIgnoreCase("Onaylandı")) color = "#28a745";
        if (status.equalsIgnoreCase("CANCELLED") || status.equalsIgnoreCase("İptal Edildi")) color = "#dc3545";
        if (status.equalsIgnoreCase("REVISED") || status.equalsIgnoreCase("Revize Edildi")) color = "#fd7e14";

        String content = String.format(
            "<html>" +
            "<body style='font-family: sans-serif; background-color: #f9f9f9; padding: 20px;'>" +
            "  <div style='max-width: 600px; margin: 0 auto; background: white; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.05);'>" +
            "    <div style='background: #1b1d21; padding: 30px; text-align: center;'>" +
            "      <h1 style='color: #00adb5; margin: 0; font-size: 24px;'>VeloAuto Service</h1>" +
            "      <p style='color: #666; margin: 5px 0 0; text-transform: uppercase; letter-spacing: 2px; font-size: 10px;'>Profesyonel Otomotiv Çözümleri</p>" +
            "    </div>" +
            "    <div style='padding: 40px;'>" +
            "      <h2 style='color: #333; margin-top: 0;'>Sayın %s,</h2>" +
            "      <p style='color: #555; line-height: 1.6;'><strong>%s</strong> plakalı aracınız için oluşturulan randevu talebi güncellenmiştir.</p>" +
            "      <div style='margin: 30px 0; padding: 20px; background: #f8f9fa; border-left: 4px solid %s; border-radius: 8px;'>" +
            "        <p style='margin: 0 0 10px; color: #777; font-size: 12px; text-transform: uppercase; font-weight: bold;'>Yeni Durum</p>" +
            "        <p style='margin: 0; color: %s; font-size: 18px; font-weight: 900;'>%s</p>" +
            "        <p style='margin: 15px 0 0; color: #777; font-size: 12px; text-transform: uppercase; font-weight: bold;'>Tarih / Saat</p>" +
            "        <p style='margin: 0; color: #333; font-size: 16px; font-weight: bold;'>%s</p>" +
            "      </div>" +
            (notes != null && !notes.isEmpty() ? 
            "      <div style='margin-bottom: 30px;'>" +
            "        <p style='color: #777; font-size: 12px; text-transform: uppercase; font-weight: bold;'>Servis Notu:</p>" +
            "        <p style='color: #555; font-style: italic; background: #fff8f0; padding: 15px; border-radius: 10px; border-left: 3px solid #fd7e14;'>%s</p>" +
            "      </div>" : "") +
            "      <p style='color: #555; line-height: 1.6;'>Detaylı bilgi için servisimizle iletişime geçebilirsiniz.</p>" +
            "      <p style='color: #333; font-weight: bold; margin-top: 30px;'>İyi günler dileriz,<br>VelAuto Ekibi</p>" +
            "    </div>" +
            "    <div style='background: #f4f4f4; padding: 20px; text-align: center; font-size: 11px; color: #999;'>" +
            "      Bu e-posta otomatik olarak gönderilmiştir. Lütfen cevaplamayınız." +
            "    </div>" +
            "  </div>" +
            "</body>" +
            "</html>",
            customerName, plate, color, color, status, date, notes
        );

        sendHtmlEmail(to, subject, content);
    }

    @Async
    @Override
    public void sendHtmlEmail(String to, String subject, String content) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(content, true);

            mailSender.send(message);
            log.info("Email sent successfully to: {}", to);
        } catch (MessagingException e) {
            log.error("Failed to send email to: {}. Error: {}", to, e.getMessage());
        }
    }
}
