package com.vdt.vtit.chatbot.controller;

import com.vdt.vtit.chatbot.service.AssetAiFacade;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import org.springframework.security.access.prepost.PreAuthorize;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/asset-assistant")
@RequiredArgsConstructor
@PreAuthorize("hasRole('USER')")
public class AssetAiController {

    private final AssetAiFacade assetAiFacade;

    /**
     * Trợ lý ảo quản lý tài sản đa năng (Text-to-SQL + General chat)
     * GET /api/v1/asset-assistant/ask?q=...
     */
    @GetMapping("/ask")
    public ResponseEntity<Map<String, String>> askAssistant(@RequestParam("q") String question) {
        String answer = assetAiFacade.handleUserRequest(question);
        return ResponseEntity.ok(Map.of("answer", answer));
    }
}
