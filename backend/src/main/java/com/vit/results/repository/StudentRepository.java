package com.vit.results.repository;

import com.vit.results.entity.Student;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface StudentRepository extends JpaRepository<Student, Long> {

    Optional<Student> findByPrn(String prn);

    boolean existsByPrn(String prn);

    @Query("select distinct s.division from Student s order by s.division")
    List<String> findDistinctDivisions();
}
