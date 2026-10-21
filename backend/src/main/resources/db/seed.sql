-- =====================================================================
--  VIT Semester Result Portal - seed data
--  15 Computer Engineering students, semester 5, four subjects each.
--
--  Run after schema.sql:
--      mysql -u root -p < seed.sql
--
--  Safe to re-run: every insert is idempotent on its natural key.
--  Marks are joined on prn/code rather than hard-coded ids so the file
--  does not depend on AUTO_INCREMENT values.
--
--  The cohort is deliberately mixed: one perfect scorer, a long middle
--  band, and three failures that exercise both fail conditions -
--  Kabir fails DBMS on the ESE floor alone (51/100 but ESE 25 < 28),
--  Arjun fails TOC on both conditions, Om fails DAA on both.
-- =====================================================================

USE vit_results;

-- ---------------------------------------------------------------------
-- Subjects: 14 credits total
-- ---------------------------------------------------------------------
INSERT INTO subjects (code, name, short_name, credits, display_order) VALUES
    ('CE3101', 'Database Management Systems',       'DBMS', 4, 1),
    ('CE3102', 'Operating Systems',                 'OS',   4, 2),
    ('CE3103', 'Theory of Computation',             'TOC',  3, 3),
    ('CE3104', 'Design and Analysis of Algorithms', 'DAA',  3, 4)
AS new
ON DUPLICATE KEY UPDATE
    name          = new.name,
    short_name    = new.short_name,
    credits       = new.credits,
    display_order = new.display_order;

-- ---------------------------------------------------------------------
-- Students
-- ---------------------------------------------------------------------
INSERT INTO students (prn, name, division, branch, semester) VALUES
    ('12310001', 'Aarav Deshmukh',  'A', 'Computer Engineering', 5),
    ('12310002', 'Ishita Kulkarni', 'A', 'Computer Engineering', 5),
    ('12310003', 'Rohan Patil',     'A', 'Computer Engineering', 5),
    ('12310004', 'Sanya Joshi',     'B', 'Computer Engineering', 5),
    ('12310005', 'Aditya Rane',     'B', 'Computer Engineering', 5),
    ('12310006', 'Neha Bhosale',    'B', 'Computer Engineering', 5),
    ('12310007', 'Kabir Shaikh',    'A', 'Computer Engineering', 5),
    ('12310008', 'Meera Nair',      'C', 'Computer Engineering', 5),
    ('12310009', 'Arjun Chavan',    'C', 'Computer Engineering', 5),
    ('12310010', 'Riya Gokhale',    'C', 'Computer Engineering', 5),
    ('12310011', 'Vivaan Marathe',  'A', 'Computer Engineering', 5),
    ('12310012', 'Ananya Kale',     'B', 'Computer Engineering', 5),
    ('12310013', 'Dhruv Sawant',    'B', 'Computer Engineering', 5),
    ('12310014', 'Tanvi Phadke',    'C', 'Computer Engineering', 5),
    ('12310015', 'Om Jadhav',       'C', 'Computer Engineering', 5)
AS new
ON DUPLICATE KEY UPDATE
    name     = new.name,
    division = new.division,
    branch   = new.branch,
    semester = new.semester;

-- ---------------------------------------------------------------------
-- Marks (mse out of 30, ese out of 70)
-- ---------------------------------------------------------------------
INSERT INTO marks (student_id, subject_id, mse_marks, ese_marks)
SELECT st.id, su.id, v.mse, v.ese
FROM (
    SELECT '12310001' AS prn, 'CE3101' AS code, 27 AS mse, 62 AS ese UNION ALL
    SELECT '12310001', 'CE3102', 26, 60 UNION ALL
    SELECT '12310001', 'CE3103', 24, 58 UNION ALL
    SELECT '12310001', 'CE3104', 28, 64 UNION ALL

    SELECT '12310002', 'CE3101', 29, 66 UNION ALL
    SELECT '12310002', 'CE3102', 28, 65 UNION ALL
    SELECT '12310002', 'CE3103', 27, 63 UNION ALL
    SELECT '12310002', 'CE3104', 28, 66 UNION ALL

    SELECT '12310003', 'CE3101', 22, 48 UNION ALL
    SELECT '12310003', 'CE3102', 20, 45 UNION ALL
    SELECT '12310003', 'CE3103', 19, 42 UNION ALL
    SELECT '12310003', 'CE3104', 21, 47 UNION ALL

    SELECT '12310004', 'CE3101', 25, 55 UNION ALL
    SELECT '12310004', 'CE3102', 24, 52 UNION ALL
    SELECT '12310004', 'CE3103', 23, 50 UNION ALL
    SELECT '12310004', 'CE3104', 26, 57 UNION ALL

    SELECT '12310005', 'CE3101', 18, 35 UNION ALL
    SELECT '12310005', 'CE3102', 16, 30 UNION ALL
    SELECT '12310005', 'CE3103', 15, 29 UNION ALL
    SELECT '12310005', 'CE3104', 17, 33 UNION ALL

    SELECT '12310006', 'CE3101', 21, 40 UNION ALL
    SELECT '12310006', 'CE3102', 23, 44 UNION ALL
    SELECT '12310006', 'CE3103', 20, 38 UNION ALL
    SELECT '12310006', 'CE3104', 22, 41 UNION ALL

    -- Kabir: DBMS total is 51 but the ESE floor of 28 fails him on that subject alone.
    SELECT '12310007', 'CE3101', 26, 25 UNION ALL
    SELECT '12310007', 'CE3102', 22, 46 UNION ALL
    SELECT '12310007', 'CE3103', 20, 40 UNION ALL
    SELECT '12310007', 'CE3104', 21, 44 UNION ALL

    SELECT '12310008', 'CE3101', 24, 54 UNION ALL
    SELECT '12310008', 'CE3102', 25, 56 UNION ALL
    SELECT '12310008', 'CE3103', 22, 49 UNION ALL
    SELECT '12310008', 'CE3104', 23, 52 UNION ALL

    -- Arjun: TOC fails on both conditions (total 37, ESE 25).
    SELECT '12310009', 'CE3101', 19, 38 UNION ALL
    SELECT '12310009', 'CE3102', 18, 36 UNION ALL
    SELECT '12310009', 'CE3103', 12, 25 UNION ALL
    SELECT '12310009', 'CE3104', 20, 40 UNION ALL

    SELECT '12310010', 'CE3101', 28, 63 UNION ALL
    SELECT '12310010', 'CE3102', 27, 61 UNION ALL
    SELECT '12310010', 'CE3103', 26, 59 UNION ALL
    SELECT '12310010', 'CE3104', 27, 62 UNION ALL

    SELECT '12310011', 'CE3101', 23, 51 UNION ALL
    SELECT '12310011', 'CE3102', 21, 47 UNION ALL
    SELECT '12310011', 'CE3103', 24, 53 UNION ALL
    SELECT '12310011', 'CE3104', 22, 49 UNION ALL

    SELECT '12310012', 'CE3101', 20, 43 UNION ALL
    SELECT '12310012', 'CE3102', 19, 41 UNION ALL
    SELECT '12310012', 'CE3103', 18, 37 UNION ALL
    SELECT '12310012', 'CE3104', 21, 45 UNION ALL

    SELECT '12310013', 'CE3101', 16, 31 UNION ALL
    SELECT '12310013', 'CE3102', 15, 28 UNION ALL
    SELECT '12310013', 'CE3103', 14, 28 UNION ALL
    SELECT '12310013', 'CE3104', 17, 34 UNION ALL

    SELECT '12310014', 'CE3101', 26, 58 UNION ALL
    SELECT '12310014', 'CE3102', 27, 60 UNION ALL
    SELECT '12310014', 'CE3103', 25, 56 UNION ALL
    SELECT '12310014', 'CE3104', 24, 54 UNION ALL

    -- Om: DAA fails on both conditions (total 36, ESE 26).
    SELECT '12310015', 'CE3101', 17, 33 UNION ALL
    SELECT '12310015', 'CE3102', 18, 35 UNION ALL
    SELECT '12310015', 'CE3103', 16, 32 UNION ALL
    SELECT '12310015', 'CE3104', 10, 26
) AS v
JOIN students st ON st.prn = v.prn
JOIN subjects su ON su.code = v.code
ON DUPLICATE KEY UPDATE
    mse_marks = v.mse,
    ese_marks = v.ese;
