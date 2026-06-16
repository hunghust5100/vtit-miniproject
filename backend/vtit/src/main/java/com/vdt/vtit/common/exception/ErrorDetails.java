package com.vdt.vtit.common.exception;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
public class ErrorDetails {
    private LocalDateTime timestamp;
    private int status;
    private String error;
    private String message;
    private String details;
}
