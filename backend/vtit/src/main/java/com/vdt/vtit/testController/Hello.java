package com.vdt.vtit.testController;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class Hello {

    @GetMapping("/")
    public String index() {
        return "Chạy thành công ứng dụng Spring";
    }
}
