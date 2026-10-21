package com.vit.results.controller;

import com.vit.results.dto.GradingScaleDto;
import com.vit.results.util.GradeScale;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/grading")
public class GradingController {

    @GetMapping("/scale")
    public GradingScaleDto scale() {
        return new GradingScaleDto(
                GradeScale.MSE_MAX,
                GradeScale.ESE_MAX,
                GradeScale.TOTAL_MAX,
                GradeScale.MIN_TOTAL_TO_PASS,
                GradeScale.MIN_ESE_TO_PASS,
                GradeScale.FAIL_GRADE,
                List.of(
                        band("O", 90, 100),
                        band("A+", 80, 89),
                        band("A", 70, 79),
                        band("B+", 60, 69),
                        band("B", 50, 59),
                        band("C", 45, 49),
                        band("P", 40, 44),
                        band("F", 0, 39)));
    }

    private GradingScaleDto.Band band(String grade, int min, int max) {
        return new GradingScaleDto.Band(grade, GradeScale.pointsForGrade(grade), min, max);
    }
}
