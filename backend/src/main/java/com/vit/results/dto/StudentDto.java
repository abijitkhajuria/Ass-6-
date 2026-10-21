package com.vit.results.dto;

public record StudentDto(
        Long id,
        String prn,
        String name,
        String division,
        String branch,
        Integer semester
) {
}
