package com.vit.results.controller;

import com.vit.results.dto.StudentDto;
import com.vit.results.dto.StudentRequest;
import com.vit.results.dto.StudentSummaryDto;
import com.vit.results.service.ResultService;
import com.vit.results.service.StudentService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/students")
public class StudentController {

    private final StudentService studentService;
    private final ResultService resultService;

    public StudentController(StudentService studentService, ResultService resultService) {
        this.studentService = studentService;
        this.resultService = resultService;
    }

    @GetMapping
    public List<StudentDto> list() {
        return studentService.findAll();
    }

    /** Student list rows enriched with server-computed SGPA and pass/fail status. */
    @GetMapping("/summaries")
    public List<StudentSummaryDto> summaries() {
        return resultService.getAllSummaries();
    }

    @GetMapping("/divisions")
    public List<String> divisions() {
        return studentService.findDivisions();
    }

    @GetMapping("/{id}")
    public StudentDto get(@PathVariable Long id) {
        return studentService.findById(id);
    }

    @GetMapping("/prn/{prn}")
    public StudentDto getByPrn(@PathVariable String prn) {
        return studentService.findByPrn(prn);
    }

    @PostMapping
    public ResponseEntity<StudentDto> create(@Valid @RequestBody StudentRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(studentService.create(request));
    }

    @PutMapping("/{id}")
    public StudentDto update(@PathVariable Long id, @Valid @RequestBody StudentRequest request) {
        return studentService.update(id, request);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        studentService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
