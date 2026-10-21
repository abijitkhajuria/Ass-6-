package com.vit.results.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

@Entity
@Table(name = "subjects", uniqueConstraints = @UniqueConstraint(name = "uk_subject_code", columnNames = "code"))
public class Subject {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Subject code is required")
    @Size(max = 20, message = "Subject code must be at most 20 characters")
    @Column(nullable = false, length = 20, unique = true)
    private String code;

    @NotBlank(message = "Subject name is required")
    @Size(max = 100, message = "Subject name must be at most 100 characters")
    @Column(nullable = false, length = 100)
    private String name;

    @NotBlank(message = "Short name is required")
    @Size(max = 20, message = "Short name must be at most 20 characters")
    @Column(name = "short_name", nullable = false, length = 20)
    private String shortName;

    @NotNull(message = "Credits are required")
    @Min(value = 1, message = "Credits must be between 1 and 6")
    @Max(value = 6, message = "Credits must be between 1 and 6")
    @Column(nullable = false)
    private Integer credits;

    @Column(name = "display_order", nullable = false)
    private Integer displayOrder = 0;

    public Subject() {
    }

    public Subject(String code, String name, String shortName, Integer credits, Integer displayOrder) {
        this.code = code;
        this.name = name;
        this.shortName = shortName;
        this.credits = credits;
        this.displayOrder = displayOrder;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getShortName() {
        return shortName;
    }

    public void setShortName(String shortName) {
        this.shortName = shortName;
    }

    public Integer getCredits() {
        return credits;
    }

    public void setCredits(Integer credits) {
        this.credits = credits;
    }

    public Integer getDisplayOrder() {
        return displayOrder;
    }

    public void setDisplayOrder(Integer displayOrder) {
        this.displayOrder = displayOrder;
    }
}
