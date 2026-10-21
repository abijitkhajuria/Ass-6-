package com.vit.results.dto;

public record MarkDto(
        Long id,
        Long studentId,
        String studentPrn,
        String studentName,
        Long subjectId,
        String subjectCode,
        String subjectShortName,
        Integer credits,
        Integer mseMarks,
        Integer eseMarks,
        Integer total,
        String grade,
        Integer gradePoint,
        boolean passed,
        String failReason
) {
}
