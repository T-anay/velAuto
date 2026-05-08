package com.velauto.controller;

import com.velauto.dto.AppointmentResponseDto;
import com.velauto.dto.PublicAppointmentRequestDto;
import com.velauto.service.AppointmentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/public")
@RequiredArgsConstructor
public class PublicController {

  private final AppointmentService appointmentService;

  @PostMapping(value = "/appointments", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
  public ResponseEntity<AppointmentResponseDto> createAppointment(
      @Valid @ModelAttribute PublicAppointmentRequestDto request
  ) {
    AppointmentResponseDto response = appointmentService.bookOnlineAppointment(request);
    return ResponseEntity.status(HttpStatus.CREATED).body(response);
  }

  @PostMapping(value = "/appointments", consumes = MediaType.APPLICATION_FORM_URLENCODED_VALUE)
  public ResponseEntity<AppointmentResponseDto> createAppointmentForm(
      @Valid @ModelAttribute PublicAppointmentRequestDto request
  ) {
    AppointmentResponseDto response = appointmentService.bookOnlineAppointment(request);
    return ResponseEntity.status(HttpStatus.CREATED).body(response);
  }

  @PostMapping(value = "/appointments", consumes = MediaType.APPLICATION_JSON_VALUE)
  public ResponseEntity<AppointmentResponseDto> createAppointmentJson(
      @Valid @RequestBody PublicAppointmentRequestDto request
  ) {
    AppointmentResponseDto response = appointmentService.bookOnlineAppointment(request);
    return ResponseEntity.status(HttpStatus.CREATED).body(response);
  }
}
