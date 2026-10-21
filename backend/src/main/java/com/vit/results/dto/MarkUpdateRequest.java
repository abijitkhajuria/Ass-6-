package com.vit.results.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record MarkUpdateRequest(

        @NotNull(message = "MSE marks are required")
        @Min(value = 0, message = "MSE marks cannot be negative")
        @Max(value = 30, message = "MSE marks cannot exceed 30")
        Integer mseMarks,

        @NotNull(message = "ESE marks are required")
        @Min(value = 0, message = "ESE marks cannot be negative")
        @Max(value = 70, message = "ESE marks cannot exceed 70")
        Integer eseMarks
) {
}
