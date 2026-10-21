package com.vit.results.service;

import com.vit.results.dto.MarksheetDto;
import com.vit.results.dto.ResultRowDto;
import com.vit.results.dto.StudentDto;
import com.vit.results.dto.StudentSummaryDto;
import com.vit.results.entity.Mark;
import com.vit.results.entity.Student;
import com.vit.results.entity.Subject;
import com.vit.results.exception.NotFoundException;
import com.vit.results.repository.MarkRepository;
import com.vit.results.repository.StudentRepository;
import com.vit.results.repository.SubjectRepository;
import com.vit.results.util.GradeScale;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Owns all result computation. Grades, grade points, SGPA and pass/fail status are
 * derived here and nowhere else - the frontend only renders what this service returns.
 */
@Service
public class ResultService {

    public static final String STATUS_PASS = "PASS";
    public static final String STATUS_FAIL = "FAIL";
    public static final String STATUS_INCOMPLETE = "INCOMPLETE";

    private final StudentRepository studentRepository;
    private final SubjectRepository subjectRepository;
    private final MarkRepository markRepository;

    public ResultService(StudentRepository studentRepository,
                         SubjectRepository subjectRepository,
                         MarkRepository markRepository) {
        this.studentRepository = studentRepository;
        this.subjectRepository = subjectRepository;
        this.markRepository = markRepository;
    }

    @Transactional(readOnly = true)
    public MarksheetDto getMarksheetByPrn(String prn) {
        Student student = studentRepository.findByPrn(prn)
                .orElseThrow(() -> new NotFoundException("No student found with PRN " + prn));
        return buildMarksheet(student, markRepository.findByStudentIdWithSubject(student.getId()));
    }

    @Transactional(readOnly = true)
    public MarksheetDto getMarksheetByStudentId(Long studentId) {
        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new NotFoundException("No student found with id " + studentId));
        return buildMarksheet(student, markRepository.findByStudentIdWithSubject(student.getId()));
    }

    /** Student list rows with their computed SGPA and status, in one pass over the data. */
    @Transactional(readOnly = true)
    public List<StudentSummaryDto> getAllSummaries() {
        List<Student> students = studentRepository.findAll();
        Map<Long, List<Mark>> marksByStudent = markRepository.findAllWithRelations().stream()
                .collect(Collectors.groupingBy(m -> m.getStudent().getId()));
        int subjectCount = (int) subjectRepository.count();

        return students.stream()
                .map(student -> {
                    List<Mark> marks = marksByStudent.getOrDefault(student.getId(), List.of());
                    MarksheetDto sheet = buildMarksheet(student, marks, subjectCount);
                    return new StudentSummaryDto(
                            student.getId(), student.getPrn(), student.getName(), student.getDivision(),
                            student.getBranch(), student.getSemester(), sheet.sgpa(), sheet.status(),
                            sheet.failedSubjectCount(), marks.size(), sheet.complete());
                })
                .sorted(Comparator.comparing(StudentSummaryDto::prn))
                .toList();
    }

    /** Every marksheet in the cohort, computed once - used by the analytics service. */
    @Transactional(readOnly = true)
    public List<MarksheetDto> getAllMarksheets() {
        Map<Long, List<Mark>> marksByStudent = markRepository.findAllWithRelations().stream()
                .collect(Collectors.groupingBy(m -> m.getStudent().getId()));
        int subjectCount = (int) subjectRepository.count();

        return studentRepository.findAll().stream()
                .map(student -> buildMarksheet(
                        student, marksByStudent.getOrDefault(student.getId(), List.of()), subjectCount))
                .toList();
    }

    private MarksheetDto buildMarksheet(Student student, List<Mark> marks) {
        return buildMarksheet(student, marks, (int) subjectRepository.count());
    }

    private MarksheetDto buildMarksheet(Student student, List<Mark> marks, int expectedSubjectCount) {
        List<Mark> ordered = new ArrayList<>(marks);
        ordered.sort(Comparator
                .comparing((Mark m) -> m.getSubject().getDisplayOrder(), Comparator.nullsLast(Integer::compareTo))
                .thenComparing(m -> m.getSubject().getId()));

        List<ResultRowDto> rows = new ArrayList<>(ordered.size());
        int totalCredits = 0;
        int creditsEarned = 0;
        int weightedPoints = 0;
        int totalMarks = 0;
        int failedCount = 0;

        for (Mark mark : ordered) {
            Subject subject = mark.getSubject();
            int mse = mark.getMseMarks();
            int ese = mark.getEseMarks();
            int total = mse + ese;
            int credits = subject.getCredits();

            String failReason = GradeScale.failReason(total, ese);
            boolean passed = failReason == null;
            // The ESE floor overrides the band: you cannot earn a passing grade on it.
            String grade = passed ? GradeScale.gradeForTotal(total) : GradeScale.FAIL_GRADE;
            int points = GradeScale.pointsForGrade(grade);

            rows.add(new ResultRowDto(subject.getId(), subject.getCode(), subject.getName(), subject.getShortName(),
                    credits, mse, ese, total, grade, points, passed, failReason));

            totalCredits += credits;
            totalMarks += total;
            weightedPoints += points * credits;
            if (passed) {
                creditsEarned += credits;
            } else {
                failedCount++;
            }
        }

        double sgpa = totalCredits == 0 ? 0.0 : round2((double) weightedPoints / totalCredits);
        int maxMarks = rows.size() * GradeScale.TOTAL_MAX;
        double percentage = maxMarks == 0 ? 0.0 : round2((double) totalMarks * 100 / maxMarks);

        boolean complete = !rows.isEmpty() && rows.size() >= expectedSubjectCount;
        String status;
        if (rows.isEmpty()) {
            status = STATUS_INCOMPLETE;
        } else if (failedCount > 0) {
            status = STATUS_FAIL;
        } else if (!complete) {
            status = STATUS_INCOMPLETE;
        } else {
            status = STATUS_PASS;
        }

        return new MarksheetDto(toStudentDto(student), rows, totalCredits, creditsEarned, totalMarks, maxMarks,
                percentage, sgpa, status, failedCount, complete);
    }

    public static StudentDto toStudentDto(Student student) {
        return new StudentDto(student.getId(), student.getPrn(), student.getName(),
                student.getDivision(), student.getBranch(), student.getSemester());
    }

    static double round2(double value) {
        return BigDecimal.valueOf(value).setScale(2, RoundingMode.HALF_UP).doubleValue();
    }

    static <T> Map<Long, T> indexById(List<T> items, Function<T, Long> idFn) {
        return items.stream().collect(Collectors.toMap(idFn, Function.identity()));
    }
}
