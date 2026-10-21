package com.vit.results.controller;

import com.vit.results.dto.MarksheetDto;
import com.vit.results.service.ResultService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/results")
public class ResultController {

    private final ResultService resultService;

    public ResultController(ResultService resultService) {
        this.resultService = resultService;
    }

    @GetMapping
    public List<MarksheetDto> all() {
        return resultService.getAllMarksheets();
    }

    @GetMapping("/{prn}")
    public MarksheetDto byPrn(@PathVariable String prn) {
        return resultService.getMarksheetByPrn(prn);
    }
}
