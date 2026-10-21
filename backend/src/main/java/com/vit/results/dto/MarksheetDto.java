package com.vit.results.dto;

import java.util.List;

/**
 * The fully computed marksheet for one student. Every derived value here
 * (total, grade, grade point, SGPA, status) is calculated server-side.
 */
public record MarksheetDto(
        StudentDto student,
        List<ResultRowDto> subjects,
        int totalCredits,
        int creditsEarned,
        int totalMarks,
        int maxMarks,
        double percentage,
        double sgpa,
        String status,
        int failedSubjectCount,
        boolean complete
) {
}
