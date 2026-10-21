package com.vit.results.dto;

import java.util.List;

public record AnalyticsSummaryDto(
        int totalStudents,
        int studentsWithCompleteResults,
        double classAverageSgpa,
        double passPercentage,
        int passCount,
        int failCount,
        TopperDto topper,
        List<SubjectAverageDto> subjectAverages,
        List<GradeCountDto> gradeDistribution,
        List<DivisionStatDto> divisionStats
) {

    public record TopperDto(
            String prn,
            String name,
            String division,
            double sgpa
    ) {
    }

    public record SubjectAverageDto(
            Long subjectId,
            String code,
            String shortName,
            String name,
            int credits,
            double averageMse,
            double averageEse,
            double averageTotal,
            int passCount,
            int failCount
    ) {
    }

    public record GradeCountDto(
            String grade,
            int gradePoint,
            int count
    ) {
    }

    public record DivisionStatDto(
            String division,
            int studentCount,
            double averageSgpa,
            double passPercentage
    ) {
    }
}
