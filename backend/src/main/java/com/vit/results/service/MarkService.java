package com.vit.results.service;

import com.vit.results.dto.MarkDto;
import com.vit.results.dto.MarkEntryRequest;
import com.vit.results.dto.MarkRequest;
import com.vit.results.dto.MarkUpdateRequest;
import com.vit.results.dto.MarksheetDto;
import com.vit.results.entity.Mark;
import com.vit.results.entity.Student;
import com.vit.results.entity.Subject;
import com.vit.results.exception.BadRequestException;
import com.vit.results.exception.NotFoundException;
import com.vit.results.repository.MarkRepository;
import com.vit.results.repository.StudentRepository;
import com.vit.results.repository.SubjectRepository;
import com.vit.results.util.GradeScale;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
public class MarkService {

    private final MarkRepository markRepository;
    private final StudentRepository studentRepository;
    private final SubjectRepository subjectRepository;
    private final ResultService resultService;

    public MarkService(MarkRepository markRepository,
                       StudentRepository studentRepository,
                       SubjectRepository subjectRepository,
                       ResultService resultService) {
        this.markRepository = markRepository;
        this.studentRepository = studentRepository;
        this.subjectRepository = subjectRepository;
        this.resultService = resultService;
    }

    @Transactional(readOnly = true)
    public List<MarkDto> findAll() {
        return markRepository.findAllWithRelations().stream().map(MarkService::toDto).toList();
    }

    @Transactional(readOnly = true)
    public List<MarkDto> findByStudentId(Long studentId) {
        requireStudent(studentId);
        return markRepository.findByStudentIdWithSubject(studentId).stream().map(MarkService::toDto).toList();
    }

    @Transactional(readOnly = true)
    public MarkDto findById(Long id) {
        return toDto(requireMark(id));
    }

    @Transactional
    public MarkDto create(MarkRequest request) {
        Student student = requireStudent(request.studentId());
        Subject subject = requireSubject(request.subjectId());

        if (markRepository.existsByStudentIdAndSubjectId(student.getId(), subject.getId())) {
            throw new BadRequestException("Marks for " + subject.getShortName() + " are already recorded for "
                    + student.getName() + " (" + student.getPrn() + "). Edit the existing entry instead.");
        }

        validateRange(request.mseMarks(), request.eseMarks());
        Mark mark = new Mark(student, subject, request.mseMarks(), request.eseMarks());
        return toDto(markRepository.save(mark));
    }

    @Transactional
    public MarkDto update(Long id, MarkUpdateRequest request) {
        Mark mark = requireMark(id);
        validateRange(request.mseMarks(), request.eseMarks());
        mark.setMseMarks(request.mseMarks());
        mark.setEseMarks(request.eseMarks());
        return toDto(markRepository.save(mark));
    }

    @Transactional
    public void delete(Long id) {
        markRepository.delete(requireMark(id));
    }

    /**
     * Saves the whole marks-entry sheet for one student: upserts each subject row and
     * returns the freshly computed marksheet so the UI never has to derive anything.
     */
    @Transactional
    public MarksheetDto saveEntrySheet(Long studentId, MarkEntryRequest request) {
        Student student = requireStudent(studentId);

        Set<Long> seen = new HashSet<>();
        for (MarkEntryRequest.Entry entry : request.entries()) {
            if (!seen.add(entry.subjectId())) {
                Subject duplicate = requireSubject(entry.subjectId());
                throw new BadRequestException("Subject " + duplicate.getShortName()
                        + " appears more than once in this entry. Each subject may only be entered once per student.");
            }
        }

        for (MarkEntryRequest.Entry entry : request.entries()) {
            Subject subject = requireSubject(entry.subjectId());
            validateRange(entry.mseMarks(), entry.eseMarks());

            markRepository.findByStudentIdAndSubjectId(student.getId(), subject.getId())
                    .ifPresentOrElse(existing -> {
                        existing.setMseMarks(entry.mseMarks());
                        existing.setEseMarks(entry.eseMarks());
                        markRepository.save(existing);
                    }, () -> markRepository.save(
                            new Mark(student, subject, entry.mseMarks(), entry.eseMarks())));
        }

        return resultService.getMarksheetByStudentId(student.getId());
    }

    /**
     * Defence in depth: the same bounds are enforced by bean validation on the request,
     * by column constraints, and here, so no path can persist an out-of-range mark.
     */
    private void validateRange(Integer mse, Integer ese) {
        if (mse == null || ese == null) {
            throw new BadRequestException("Both MSE and ESE marks are required.");
        }
        if (mse < 0 || ese < 0) {
            throw new BadRequestException("Marks cannot be negative.");
        }
        if (mse > GradeScale.MSE_MAX) {
            throw new BadRequestException("MSE marks cannot exceed " + GradeScale.MSE_MAX + " (received " + mse + ").");
        }
        if (ese > GradeScale.ESE_MAX) {
            throw new BadRequestException("ESE marks cannot exceed " + GradeScale.ESE_MAX + " (received " + ese + ").");
        }
    }

    private Mark requireMark(Long id) {
        return markRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("No marks entry found with id " + id));
    }

    private Student requireStudent(Long id) {
        return studentRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("No student found with id " + id));
    }

    private Subject requireSubject(Long id) {
        return subjectRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("No subject found with id " + id));
    }

    static MarkDto toDto(Mark mark) {
        Subject subject = mark.getSubject();
        Student student = mark.getStudent();
        int total = mark.getTotal();
        String failReason = GradeScale.failReason(total, mark.getEseMarks());
        boolean passed = failReason == null;
        String grade = passed ? GradeScale.gradeForTotal(total) : GradeScale.FAIL_GRADE;

        return new MarkDto(mark.getId(), student.getId(), student.getPrn(), student.getName(),
                subject.getId(), subject.getCode(), subject.getShortName(), subject.getCredits(),
                mark.getMseMarks(), mark.getEseMarks(), total, grade,
                GradeScale.pointsForGrade(grade), passed, failReason);
    }
}
