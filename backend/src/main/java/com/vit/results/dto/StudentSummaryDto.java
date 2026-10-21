package com.vit.results.dto;

/** Row shape for the student list: identity plus the computed result headline. */
public record StudentSummaryDto(
        Long id,
        String prn,
        String name,
        String division,
        String branch,
        Integer semester,
        double sgpa,
        String status,
        int failedSubjectCount,
        int subjectsRecorded,
        boolean complete
) {
}
