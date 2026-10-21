package com.vit.results.service;

import com.vit.results.dto.StudentDto;
import com.vit.results.dto.StudentRequest;
import com.vit.results.entity.Student;
import com.vit.results.exception.BadRequestException;
import com.vit.results.exception.NotFoundException;
import com.vit.results.repository.StudentRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class StudentService {

    private final StudentRepository studentRepository;

    public StudentService(StudentRepository studentRepository) {
        this.studentRepository = studentRepository;
    }

    @Transactional(readOnly = true)
    public List<StudentDto> findAll() {
        return studentRepository.findAll().stream()
                .sorted((a, b) -> a.getPrn().compareToIgnoreCase(b.getPrn()))
                .map(ResultService::toStudentDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public StudentDto findById(Long id) {
        return ResultService.toStudentDto(requireStudent(id));
    }

    @Transactional(readOnly = true)
    public StudentDto findByPrn(String prn) {
        Student student = studentRepository.findByPrn(prn)
                .orElseThrow(() -> new NotFoundException("No student found with PRN " + prn));
        return ResultService.toStudentDto(student);
    }

    @Transactional(readOnly = true)
    public List<String> findDivisions() {
        return studentRepository.findDistinctDivisions();
    }

    @Transactional
    public StudentDto create(StudentRequest request) {
        String prn = request.prn().trim();
        if (studentRepository.existsByPrn(prn)) {
            throw new BadRequestException("A student with PRN " + prn + " already exists.");
        }
        Student student = new Student(prn, request.name().trim(), request.division().trim().toUpperCase(),
                request.branch().trim(), request.semester());
        return ResultService.toStudentDto(studentRepository.save(student));
    }

    @Transactional
    public StudentDto update(Long id, StudentRequest request) {
        Student student = requireStudent(id);
        String prn = request.prn().trim();

        if (!student.getPrn().equalsIgnoreCase(prn) && studentRepository.existsByPrn(prn)) {
            throw new BadRequestException("A student with PRN " + prn + " already exists.");
        }

        student.setPrn(prn);
        student.setName(request.name().trim());
        student.setDivision(request.division().trim().toUpperCase());
        student.setBranch(request.branch().trim());
        student.setSemester(request.semester());
        return ResultService.toStudentDto(studentRepository.save(student));
    }

    @Transactional
    public void delete(Long id) {
        Student student = requireStudent(id);
        // Marks cascade with the student, so the result history goes with them.
        studentRepository.delete(student);
    }

    private Student requireStudent(Long id) {
        return studentRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("No student found with id " + id));
    }
}
