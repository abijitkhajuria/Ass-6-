package com.vit.results.dto;

public record SubjectDto(
        Long id,
        String code,
        String name,
        String shortName,
        Integer credits,
        Integer displayOrder
) {
}
