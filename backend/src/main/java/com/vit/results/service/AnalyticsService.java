package com.vit.results.service;

import com.vit.results.dto.AnalyticsSummaryDto;
import com.vit.results.dto.MarksheetDto;
import com.vit.results.dto.ResultRowDto;
import com.vit.results.entity.Subject;
import com.vit.results.repository.SubjectRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import static com.vit.results.service.ResultService.round2;

@Service
public class AnalyticsService {

    /** Rendered in this order on the dashboard chart, best grade first. */
    private static final List<String> GRADE_ORDER = List.of("O", "A+", "A", "B+", "B", "C", "P", "F");

    private final ResultService resultService;
    private final SubjectRepository subjectRepository;

    public AnalyticsService(ResultService resultService, SubjectRepository subjectRepository) {
        this.resultService = resultService;
        this.subjectRepository = subjectRepository;
    }

    @Transactional(readOnly = true)
    public AnalyticsSummaryDto buildSummary() {
        List<MarksheetDto> sheets = resultService.getAllMarksheets();
        List<Subject> subjects = subjectRepository.findAllByOrderByDisplayOrderAscIdAsc();

        List<MarksheetDto> graded = sheets.stream()
                .filter(sheet -> !sheet.subjects().isEmpty())
                .toList();

        int passCount = (int) graded.stream().filter(s -> ResultService.STATUS_PASS.equals(s.status())).count();
        int failCount = (int) graded.stream().filter(s -> ResultService.STATUS_FAIL.equals(s.status())).count();

        double averageSgpa = graded.isEmpty() ? 0.0
                : round2(graded.stream().mapToDouble(MarksheetDto::sgpa).average().orElse(0.0));
        double passPercentage = graded.isEmpty() ? 0.0 : round2((double) passCount * 100 / graded.size());

        return new AnalyticsSummaryDto(
                sheets.size(),
                (int) sheets.stream().filter(MarksheetDto::complete).count(),
                averageSgpa,
                passPercentage,
                passCount,
                failCount,
                findTopper(graded),
                subjectAverages(subjects, graded),
                gradeDistribution(graded),
                divisionStats(graded));
    }

    private AnalyticsSummaryDto.TopperDto findTopper(List<MarksheetDto> sheets) {
        return sheets.stream()
                // A failed semester never tops the class, however high the raw SGPA.
                .filter(s -> ResultService.STATUS_PASS.equals(s.status()))
                .max(Comparator.comparingDouble(MarksheetDto::sgpa)
                        .thenComparing(s -> s.student().name(), Comparator.reverseOrder()))
                .map(s -> new AnalyticsSummaryDto.TopperDto(
                        s.student().prn(), s.student().name(), s.student().division(), s.sgpa()))
                .orElse(null);
    }

    private List<AnalyticsSummaryDto.SubjectAverageDto> subjectAverages(List<Subject> subjects,
                                                                        List<MarksheetDto> sheets) {
        Map<Long, List<ResultRowDto>> rowsBySubject = new LinkedHashMap<>();
        for (MarksheetDto sheet : sheets) {
            for (ResultRowDto row : sheet.subjects()) {
                rowsBySubject.computeIfAbsent(row.subjectId(), key -> new ArrayList<>()).add(row);
            }
        }

        List<AnalyticsSummaryDto.SubjectAverageDto> out = new ArrayList<>(subjects.size());
        for (Subject subject : subjects) {
            List<ResultRowDto> rows = rowsBySubject.getOrDefault(subject.getId(), List.of());
            out.add(new AnalyticsSummaryDto.SubjectAverageDto(
                    subject.getId(),
                    subject.getCode(),
                    subject.getShortName(),
                    subject.getName(),
                    subject.getCredits(),
                    round2(rows.stream().mapToInt(ResultRowDto::mseMarks).average().orElse(0.0)),
                    round2(rows.stream().mapToInt(ResultRowDto::eseMarks).average().orElse(0.0)),
                    round2(rows.stream().mapToInt(ResultRowDto::total).average().orElse(0.0)),
                    (int) rows.stream().filter(ResultRowDto::passed).count(),
                    (int) rows.stream().filter(row -> !row.passed()).count()));
        }
        return out;
    }

    private List<AnalyticsSummaryDto.GradeCountDto> gradeDistribution(List<MarksheetDto> sheets) {
        Map<String, Integer> counts = new LinkedHashMap<>();
        GRADE_ORDER.forEach(grade -> counts.put(grade, 0));

        for (MarksheetDto sheet : sheets) {
            for (ResultRowDto row : sheet.subjects()) {
                counts.merge(row.grade(), 1, Integer::sum);
            }
        }

        return counts.entrySet().stream()
                .map(e -> new AnalyticsSummaryDto.GradeCountDto(
                        e.getKey(), com.vit.results.util.GradeScale.pointsForGrade(e.getKey()), e.getValue()))
                .toList();
    }

    private List<AnalyticsSummaryDto.DivisionStatDto> divisionStats(List<MarksheetDto> sheets) {
        Map<String, List<MarksheetDto>> byDivision = new LinkedHashMap<>();
        sheets.stream()
                .sorted(Comparator.comparing(s -> s.student().division()))
                .forEach(s -> byDivision.computeIfAbsent(s.student().division(), key -> new ArrayList<>()).add(s));

        return byDivision.entrySet().stream()
                .map(entry -> {
                    List<MarksheetDto> group = entry.getValue();
                    long passed = group.stream().filter(s -> ResultService.STATUS_PASS.equals(s.status())).count();
                    return new AnalyticsSummaryDto.DivisionStatDto(
                            entry.getKey(),
                            group.size(),
                            round2(group.stream().mapToDouble(MarksheetDto::sgpa).average().orElse(0.0)),
                            round2((double) passed * 100 / group.size()));
                })
                .toList();
    }
}
