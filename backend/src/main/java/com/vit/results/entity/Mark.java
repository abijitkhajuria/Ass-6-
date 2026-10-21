package com.vit.results.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.ForeignKey;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.Transient;
import jakarta.persistence.UniqueConstraint;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

@Entity
@Table(name = "marks", uniqueConstraints = @UniqueConstraint(
        name = "uk_mark_student_subject", columnNames = {"student_id", "subject_id"}))
public class Mark {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "student_id", nullable = false, foreignKey = @ForeignKey(name = "fk_mark_student"))
    private Student student;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "subject_id", nullable = false, foreignKey = @ForeignKey(name = "fk_mark_subject"))
    private Subject subject;

    @NotNull(message = "MSE marks are required")
    @Min(value = 0, message = "MSE marks cannot be negative")
    @Max(value = 30, message = "MSE marks cannot exceed 30")
    @Column(name = "mse_marks", nullable = false)
    private Integer mseMarks;

    @NotNull(message = "ESE marks are required")
    @Min(value = 0, message = "ESE marks cannot be negative")
    @Max(value = 70, message = "ESE marks cannot exceed 70")
    @Column(name = "ese_marks", nullable = false)
    private Integer eseMarks;

    public Mark() {
    }

    public Mark(Student student, Subject subject, Integer mseMarks, Integer eseMarks) {
        this.student = student;
        this.subject = subject;
        this.mseMarks = mseMarks;
        this.eseMarks = eseMarks;
    }

    @Transient
    public int getTotal() {
        return (mseMarks == null ? 0 : mseMarks) + (eseMarks == null ? 0 : eseMarks);
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Student getStudent() {
        return student;
    }

    public void setStudent(Student student) {
        this.student = student;
    }

    public Subject getSubject() {
        return subject;
    }

    public void setSubject(Subject subject) {
        this.subject = subject;
    }

    public Integer getMseMarks() {
        return mseMarks;
    }

    public void setMseMarks(Integer mseMarks) {
        this.mseMarks = mseMarks;
    }

    public Integer getEseMarks() {
        return eseMarks;
    }

    public void setEseMarks(Integer eseMarks) {
        this.eseMarks = eseMarks;
    }
}
