package com.vit.results.config;

import com.vit.results.entity.Mark;
import com.vit.results.entity.Student;
import com.vit.results.entity.Subject;
import com.vit.results.repository.MarkRepository;
import com.vit.results.repository.StudentRepository;
import com.vit.results.repository.SubjectRepository;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Loads the same cohort as {@code db/seed.sql} when the tables are empty, so a fresh
 * clone has a populated dashboard on first run without touching the MySQL client.
 * Existing data is never modified - each step is skipped if its table already has rows.
 * <p>
 * Seeding runs from {@code @PostConstruct} rather than an {@code ApplicationRunner}
 * deliberately: runners fire after the web server is already accepting connections,
 * which leaves a window where a request can collide with the seed inserts.
 */
@Component
@ConditionalOnProperty(name = "app.seed.enabled", havingValue = "true", matchIfMissing = true)
public class DataSeeder {

    private static final Logger log = LoggerFactory.getLogger(DataSeeder.class);

    private static final String BRANCH = "Computer Engineering";
    private static final int SEMESTER = 5;

    private final StudentRepository studentRepository;
    private final SubjectRepository subjectRepository;
    private final MarkRepository markRepository;

    public DataSeeder(StudentRepository studentRepository,
                      SubjectRepository subjectRepository,
                      MarkRepository markRepository) {
        this.studentRepository = studentRepository;
        this.subjectRepository = subjectRepository;
        this.markRepository = markRepository;
    }

    @PostConstruct
    @Transactional
    public void seed() {

        Map<String, Subject> subjects = new LinkedHashMap<>();
        if (subjectRepository.count() == 0) {
            List<Subject> created = subjectRepository.saveAll(List.of(
                    new Subject("CE3101", "Database Management Systems", "DBMS", 4, 1),
                    new Subject("CE3102", "Operating Systems", "OS", 4, 2),
                    new Subject("CE3103", "Theory of Computation", "TOC", 3, 3),
                    new Subject("CE3104", "Design and Analysis of Algorithms", "DAA", 3, 4)));
            created.forEach(s -> subjects.put(s.getCode(), s));
            log.info("Seeded {} subjects", created.size());
        } else {
            subjectRepository.findAll().forEach(s -> subjects.put(s.getCode(), s));
        }

        if (studentRepository.count() > 0) {
            log.info("Students already present - skipping student and marks seed");
            return;
        }

        List<SeedRow> rows = cohort();
        List<Mark> marks = new ArrayList<>();

        for (SeedRow row : rows) {
            Student student = studentRepository.save(
                    new Student(row.prn(), row.name(), row.division(), BRANCH, SEMESTER));

            int[][] scores = row.scores();
            String[] codes = {"CE3101", "CE3102", "CE3103", "CE3104"};
            for (int i = 0; i < codes.length; i++) {
                Subject subject = subjects.get(codes[i]);
                if (subject == null) {
                    continue;
                }
                if (!markRepository.existsByStudentIdAndSubjectId(student.getId(), subject.getId())) {
                    marks.add(new Mark(student, subject, scores[i][0], scores[i][1]));
                }
            }
        }

        markRepository.saveAll(marks);
        log.info("Seeded {} students and {} marks entries", rows.size(), marks.size());
    }

    private record SeedRow(String prn, String name, String division, int[][] scores) {
    }

    /**
     * Mirrors db/seed.sql exactly. Scores are {MSE, ESE} per subject in
     * DBMS, OS, TOC, DAA order.
     */
    private List<SeedRow> cohort() {
        return List.of(
                new SeedRow("12310001", "Aarav Deshmukh", "A",
                        new int[][]{{27, 62}, {26, 60}, {24, 58}, {28, 64}}),
                new SeedRow("12310002", "Ishita Kulkarni", "A",
                        new int[][]{{29, 66}, {28, 65}, {27, 63}, {28, 66}}),
                new SeedRow("12310003", "Rohan Patil", "A",
                        new int[][]{{22, 48}, {20, 45}, {19, 42}, {21, 47}}),
                new SeedRow("12310004", "Sanya Joshi", "B",
                        new int[][]{{25, 55}, {24, 52}, {23, 50}, {26, 57}}),
                new SeedRow("12310005", "Aditya Rane", "B",
                        new int[][]{{18, 35}, {16, 30}, {15, 29}, {17, 33}}),
                new SeedRow("12310006", "Neha Bhosale", "B",
                        new int[][]{{21, 40}, {23, 44}, {20, 38}, {22, 41}}),
                // DBMS totals 51 but the ESE floor of 28 fails this subject on its own.
                new SeedRow("12310007", "Kabir Shaikh", "A",
                        new int[][]{{26, 25}, {22, 46}, {20, 40}, {21, 44}}),
                new SeedRow("12310008", "Meera Nair", "C",
                        new int[][]{{24, 54}, {25, 56}, {22, 49}, {23, 52}}),
                // TOC fails on both conditions: total 37 and ESE 25.
                new SeedRow("12310009", "Arjun Chavan", "C",
                        new int[][]{{19, 38}, {18, 36}, {12, 25}, {20, 40}}),
                new SeedRow("12310010", "Riya Gokhale", "C",
                        new int[][]{{28, 63}, {27, 61}, {26, 59}, {27, 62}}),
                new SeedRow("12310011", "Vivaan Marathe", "A",
                        new int[][]{{23, 51}, {21, 47}, {24, 53}, {22, 49}}),
                new SeedRow("12310012", "Ananya Kale", "B",
                        new int[][]{{20, 43}, {19, 41}, {18, 37}, {21, 45}}),
                new SeedRow("12310013", "Dhruv Sawant", "B",
                        new int[][]{{16, 31}, {15, 28}, {14, 28}, {17, 34}}),
                new SeedRow("12310014", "Tanvi Phadke", "C",
                        new int[][]{{26, 58}, {27, 60}, {25, 56}, {24, 54}}),
                // DAA fails on both conditions: total 36 and ESE 26.
                new SeedRow("12310015", "Om Jadhav", "C",
                        new int[][]{{17, 33}, {18, 35}, {16, 32}, {10, 26}}));
    }
}
