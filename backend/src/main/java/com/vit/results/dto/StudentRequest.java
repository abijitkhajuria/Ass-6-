package com.vit.results.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record StudentRequest(

        @NotBlank(message = "PRN is required")
        @Pattern(regexp = "^[0-9A-Za-z]{6,20}$", message = "PRN must be 6-20 alphanumeric characters")
        String prn,

        @NotBlank(message = "Name is required")
        @Size(max = 100, message = "Name must be at most 100 characters")
        String name,

        @NotBlank(message = "Division is required")
        @Size(max = 10, message = "Division must be at most 10 characters")
        String division,

        @NotBlank(message = "Branch is required")
        @Size(max = 80, message = "Branch must be at most 80 characters")
        String branch,

        @NotNull(message = "Semester is required")
        @Min(value = 1, message = "Semester must be between 1 and 8")
        @Max(value = 8, message = "Semester must be between 1 and 8")
        Integer semester
) {
}
