-- =====================================================================
--  VIT Semester Result Portal - schema
--  MySQL 9.x
--
--  Run this once before starting the backend:
--      mysql -u root -p < schema.sql
--
--  Hibernate runs with ddl-auto=update, so it will also create/patch
--  these tables on first boot. This file exists so the schema is
--  explicit, reviewable, and reproducible without the application.
-- =====================================================================

CREATE DATABASE IF NOT EXISTS vit_results
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE vit_results;

-- ---------------------------------------------------------------------
-- students
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS students (
    id        BIGINT       NOT NULL AUTO_INCREMENT,
    prn       VARCHAR(20)  NOT NULL,
    name      VARCHAR(100) NOT NULL,
    division  VARCHAR(10)  NOT NULL,
    branch    VARCHAR(80)  NOT NULL,
    semester  INT          NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_student_prn UNIQUE (prn),
    CONSTRAINT ck_student_semester CHECK (semester BETWEEN 1 AND 8)
) ENGINE = InnoDB;

CREATE INDEX idx_student_division ON students (division);

-- ---------------------------------------------------------------------
-- subjects
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS subjects (
    id            BIGINT       NOT NULL AUTO_INCREMENT,
    code          VARCHAR(20)  NOT NULL,
    name          VARCHAR(100) NOT NULL,
    short_name    VARCHAR(20)  NOT NULL,
    credits       INT          NOT NULL,
    display_order INT          NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    CONSTRAINT uk_subject_code UNIQUE (code),
    CONSTRAINT ck_subject_credits CHECK (credits BETWEEN 1 AND 6)
) ENGINE = InnoDB;

-- ---------------------------------------------------------------------
-- marks
--   mse_marks is the 30% component (out of 30)
--   ese_marks is the 70% component (out of 70)
--   total (out of 100) is computed by the application, never stored,
--   so the grading rules only ever live in one place.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS marks (
    id         BIGINT NOT NULL AUTO_INCREMENT,
    student_id BIGINT NOT NULL,
    subject_id BIGINT NOT NULL,
    mse_marks  INT    NOT NULL,
    ese_marks  INT    NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_mark_student_subject UNIQUE (student_id, subject_id),
    CONSTRAINT fk_mark_student FOREIGN KEY (student_id) REFERENCES students (id) ON DELETE CASCADE,
    CONSTRAINT fk_mark_subject FOREIGN KEY (subject_id) REFERENCES subjects (id),
    CONSTRAINT ck_mark_mse CHECK (mse_marks BETWEEN 0 AND 30),
    CONSTRAINT ck_mark_ese CHECK (ese_marks BETWEEN 0 AND 70)
) ENGINE = InnoDB;
