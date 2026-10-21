package com.vit.results.exception;

/** Maps to HTTP 400 with a readable message the UI shows as a toast. */
public class BadRequestException extends RuntimeException {

    public BadRequestException(String message) {
        super(message);
    }
}
