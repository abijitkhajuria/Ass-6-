package com.vit.results.dto;

import java.util.List;

/**
 * The grading rules published as data.
 * <p>
 * The marks-entry screen needs to show a live total/grade/SGPA preview while the
 * user types, but the rules themselves must not be reimplemented in JavaScript.
 * Serving the bands and thresholds from here keeps this class the only definition:
 * the frontend interpolates the table it is given, and the saved result always
 * comes back from {@code /api/results/{prn}}.
 */
public record GradingScaleDto(
        int mseMax,
        int eseMax,
        int totalMax,
        int minTotalToPass,
        int minEseToPass,
        String failGrade,
        List<Band> bands
) {

    /** A band matches when the subject total is >= minTotal, tested from the top down. */
    public record Band(String grade, int point, int minTotal, int maxTotal) {
    }
}
