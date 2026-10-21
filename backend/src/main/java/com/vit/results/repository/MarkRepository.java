package com.vit.results.repository;

import com.vit.results.entity.Mark;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface MarkRepository extends JpaRepository<Mark, Long> {

    @Query("select m from Mark m join fetch m.subject where m.student.id = :studentId order by m.subject.displayOrder")
    List<Mark> findByStudentIdWithSubject(Long studentId);

    Optional<Mark> findByStudentIdAndSubjectId(Long studentId, Long subjectId);

    boolean existsByStudentIdAndSubjectId(Long studentId, Long subjectId);

    long countBySubjectId(Long subjectId);

    @Query("select m from Mark m join fetch m.subject join fetch m.student")
    List<Mark> findAllWithRelations();
}
