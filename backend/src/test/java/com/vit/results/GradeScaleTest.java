package com.vit.results;

import com.vit.results.util.GradeScale;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

class GradeScaleTest {

    @Test
    void gradeBandsCoverEveryBoundary() {
        assertEquals("O", GradeScale.gradeForTotal(100));
        assertEquals("O", GradeScale.gradeForTotal(90));
        assertEquals("A+", GradeScale.gradeForTotal(89));
        assertEquals("A+", GradeScale.gradeForTotal(80));
        assertEquals("A", GradeScale.gradeForTotal(79));
        assertEquals("A", GradeScale.gradeForTotal(70));
        assertEquals("B+", GradeScale.gradeForTotal(69));
        assertEquals("B+", GradeScale.gradeForTotal(60));
        assertEquals("B", GradeScale.gradeForTotal(59));
        assertEquals("B", GradeScale.gradeForTotal(50));
        assertEquals("C", GradeScale.gradeForTotal(49));
        assertEquals("C", GradeScale.gradeForTotal(45));
        assertEquals("P", GradeScale.gradeForTotal(44));
        assertEquals("P", GradeScale.gradeForTotal(40));
        assertEquals("F", GradeScale.gradeForTotal(39));
        assertEquals("F", GradeScale.gradeForTotal(0));
    }

    @Test
    void gradePointsMatchTheScale() {
        assertEquals(10, GradeScale.pointsForGrade("O"));
        assertEquals(9, GradeScale.pointsForGrade("A+"));
        assertEquals(8, GradeScale.pointsForGrade("A"));
        assertEquals(7, GradeScale.pointsForGrade("B+"));
        assertEquals(6, GradeScale.pointsForGrade("B"));
        assertEquals(5, GradeScale.pointsForGrade("C"));
        assertEquals(4, GradeScale.pointsForGrade("P"));
        assertEquals(0, GradeScale.pointsForGrade("F"));
    }

    @Test
    void passingSubjectHasNoFailReason() {
        assertNull(GradeScale.failReason(75, 50));
        assertNull(GradeScale.failReason(40, 28));
    }

    @Test
    void eseFloorFailsASubjectThatOtherwisePasses() {
        // 26 + 25 = 51, comfortably over 40, but the ESE component is under 28.
        String reason = GradeScale.failReason(51, 25);
        assertNotNull(reason);
        assertTrue(reason.contains("ESE"));
        assertFalse(reason.contains("Total"));
    }

    @Test
    void lowTotalFailsEvenWithAdequateEse() {
        String reason = GradeScale.failReason(38, 30);
        assertNotNull(reason);
        assertTrue(reason.contains("Total"));
    }

    @Test
    void bothConditionsAreReportedTogether() {
        String reason = GradeScale.failReason(37, 25);
        assertNotNull(reason);
        assertTrue(reason.contains("Total"));
        assertTrue(reason.contains("ESE"));
    }
}
