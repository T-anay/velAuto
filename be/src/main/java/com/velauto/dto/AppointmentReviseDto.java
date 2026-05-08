package com.velauto.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class AppointmentReviseDto {
    private LocalDateTime newDate;
    private String notes;
}
