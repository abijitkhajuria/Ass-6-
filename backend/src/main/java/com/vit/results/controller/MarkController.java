package com.vit.results.controller;

import com.vit.results.dto.MarkDto;
import com.vit.results.dto.MarkEntryRequest;
import com.vit.results.dto.MarkRequest;
import com.vit.results.dto.MarkUpdateRequest;
import com.vit.results.dto.MarksheetDto;
import com.vit.results.service.MarkService;
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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/marks")
public class MarkController {

    private final MarkService markService;

    public MarkController(MarkService markService) {
        this.markService = markService;
    }

    @GetMapping
    public List<MarkDto> list(@RequestParam(required = false) Long studentId) {
        return studentId == null ? markService.findAll() : markService.findByStudentId(studentId);
    }

    @GetMapping("/{id}")
    public MarkDto get(@PathVariable Long id) {
        return markService.findById(id);
    }

    @PostMapping
    public ResponseEntity<MarkDto> create(@Valid @RequestBody MarkRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(markService.create(request));
    }

    @PutMapping("/{id}")
    public MarkDto update(@PathVariable Long id, @Valid @RequestBody MarkUpdateRequest request) {
        return markService.update(id, request);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        markService.delete(id);
        return ResponseEntity.noContent().build();
    }

    /** Marks-entry screen: upsert every subject for one student and return the computed marksheet. */
    @PutMapping("/student/{studentId}")
    public MarksheetDto saveEntrySheet(@PathVariable Long studentId, @Valid @RequestBody MarkEntryRequest request) {
        return markService.saveEntrySheet(studentId, request);
    }
}
