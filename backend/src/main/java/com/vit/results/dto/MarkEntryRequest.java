package com.vit.results.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.util.List;

/**
 * Payload for the marks-entry screen: every subject for one student, saved in one go.
 * Existing rows are updated, missing rows are created.
 */
public record MarkEntryRequest(

        @NotEmpty(message = "At least one subject entry is required")
        @Valid
        List<Entry> entries
) {

    public record Entry(

            @NotNull(message = "subjectId is required")
            Long subjectId,

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
}
