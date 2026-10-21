package com.vit.results.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record SubjectRequest(

        @NotBlank(message = "Subject code is required")
        @Size(max = 20, message = "Subject code must be at most 20 characters")
        String code,

        @NotBlank(message = "Subject name is required")
        @Size(max = 100, message = "Subject name must be at most 100 characters")
        String name,

        @NotBlank(message = "Short name is required")
        @Size(max = 20, message = "Short name must be at most 20 characters")
        String shortName,

        @NotNull(message = "Credits are required")
        @Min(value = 1, message = "Credits must be between 1 and 6")
        @Max(value = 6, message = "Credits must be between 1 and 6")
        Integer credits,

        Integer displayOrder
) {
}
