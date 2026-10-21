package com.vit.results.util;

/**
 * The single source of truth for grade banding and pass/fail rules.
 * <p>
 * Grade bands are applied to the subject total (MSE + ESE, out of 100):
 * 90-100 O(10), 80-89 A+(9), 70-79 A(8), 60-69 B+(7), 50-59 B(6),
 * 45-49 C(5), 40-44 P(4), below 40 F(0).
 * <p>
 * A subject is failed when the total is below {@link #MIN_TOTAL_TO_PASS}
 * OR the ESE component is below {@link #MIN_ESE_TO_PASS}.
 */
public final class GradeScale {

    public static final int MSE_MAX = 30;
    public static final int ESE_MAX = 70;
    public static final int TOTAL_MAX = MSE_MAX + ESE_MAX;

    public static final int MIN_TOTAL_TO_PASS = 40;
    public static final int MIN_ESE_TO_PASS = 28;

    public static final String FAIL_GRADE = "F";

    private GradeScale() {
    }

    /**
     * Letter grade derived from the subject total, before the ESE floor is applied.
     */
    public static String gradeForTotal(int total) {
        if (total >= 90) return "O";
        if (total >= 80) return "A+";
        if (total >= 70) return "A";
        if (total >= 60) return "B+";
        if (total >= 50) return "B";
        if (total >= 45) return "C";
        if (total >= 40) return "P";
        return FAIL_GRADE;
    }

    public static int pointsForGrade(String grade) {
        return switch (grade) {
            case "O" -> 10;
            case "A+" -> 9;
            case "A" -> 8;
            case "B+" -> 7;
            case "B" -> 6;
            case "C" -> 5;
            case "P" -> 4;
            default -> 0;
        };
    }

    public static boolean failsOnTotal(int total) {
        return total < MIN_TOTAL_TO_PASS;
    }

    public static boolean failsOnEse(int ese) {
        return ese < MIN_ESE_TO_PASS;
    }

    /**
     * Human-readable explanation of why a subject was failed, or {@code null} when passed.
     * Both conditions are reported when both are true.
     */
    public static String failReason(int total, int ese) {
        boolean totalFail = failsOnTotal(total);
        boolean eseFail = failsOnEse(ese);

        if (totalFail && eseFail) {
            return "Total " + total + "/" + TOTAL_MAX + " is below " + MIN_TOTAL_TO_PASS
                    + " and ESE " + ese + "/" + ESE_MAX + " is below " + MIN_ESE_TO_PASS;
        }
        if (totalFail) {
            return "Total " + total + "/" + TOTAL_MAX + " is below the minimum of " + MIN_TOTAL_TO_PASS;
        }
        if (eseFail) {
            return "ESE " + ese + "/" + ESE_MAX + " is below the minimum of " + MIN_ESE_TO_PASS;
        }
        return null;
    }
}
