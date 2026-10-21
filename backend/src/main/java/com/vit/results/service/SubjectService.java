package com.vit.results.service;

import com.vit.results.dto.SubjectDto;
import com.vit.results.dto.SubjectRequest;
import com.vit.results.entity.Subject;
import com.vit.results.exception.BadRequestException;
import com.vit.results.exception.NotFoundException;
import com.vit.results.repository.MarkRepository;
import com.vit.results.repository.SubjectRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class SubjectService {

    private final SubjectRepository subjectRepository;
    private final MarkRepository markRepository;

    public SubjectService(SubjectRepository subjectRepository, MarkRepository markRepository) {
        this.subjectRepository = subjectRepository;
        this.markRepository = markRepository;
    }

    @Transactional(readOnly = true)
    public List<SubjectDto> findAll() {
        return subjectRepository.findAllByOrderByDisplayOrderAscIdAsc().stream()
                .map(SubjectService::toDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public SubjectDto findById(Long id) {
        return toDto(requireSubject(id));
    }

    @Transactional
    public SubjectDto create(SubjectRequest request) {
        String code = request.code().trim().toUpperCase();
        if (subjectRepository.existsByCode(code)) {
            throw new BadRequestException("A subject with code " + code + " already exists.");
        }
        int order = request.displayOrder() == null ? (int) subjectRepository.count() : request.displayOrder();
        Subject subject = new Subject(code, request.name().trim(), request.shortName().trim(),
                request.credits(), order);
        return toDto(subjectRepository.save(subject));
    }

    @Transactional
    public SubjectDto update(Long id, SubjectRequest request) {
        Subject subject = requireSubject(id);
        String code = request.code().trim().toUpperCase();

        if (!subject.getCode().equalsIgnoreCase(code) && subjectRepository.existsByCode(code)) {
            throw new BadRequestException("A subject with code " + code + " already exists.");
        }

        subject.setCode(code);
        subject.setName(request.name().trim());
        subject.setShortName(request.shortName().trim());
        subject.setCredits(request.credits());
        if (request.displayOrder() != null) {
            subject.setDisplayOrder(request.displayOrder());
        }
        return toDto(subjectRepository.save(subject));
    }

    @Transactional
    public void delete(Long id) {
        Subject subject = requireSubject(id);
        long recorded = markRepository.countBySubjectId(id);
        if (recorded > 0) {
            throw new BadRequestException("Cannot delete " + subject.getShortName() + ": " + recorded
                    + " marks entries reference it. Delete those marks first.");
        }
        subjectRepository.delete(subject);
    }

    private Subject requireSubject(Long id) {
        return subjectRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("No subject found with id " + id));
    }

    static SubjectDto toDto(Subject subject) {
        return new SubjectDto(subject.getId(), subject.getCode(), subject.getName(),
                subject.getShortName(), subject.getCredits(), subject.getDisplayOrder());
    }
}
