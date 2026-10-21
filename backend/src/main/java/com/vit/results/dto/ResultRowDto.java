package com.vit.results.dto;

/** One subject line on a marksheet. */
public record ResultRowDto(
        Long subjectId,
        String code,
        String name,
        String shortName,
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
