package com.vdt.vtit.chatbot.service;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.stereotype.Service;

@Service
public class RagServiceImpl implements RagService {

    private final ChatClient chatClient;

    public RagServiceImpl(ChatClient.Builder chatClientBuilder) {
        this.chatClient = chatClientBuilder.build();
    }

    @Override
    public String chatWithKnowledge(String question) {
        String prompt = String.format("""
                Bạn là Trợ lý tri thức của Hệ thống Quản lý Tài sản VTIT. 
                Hiện tại dữ liệu cẩm nang/chính sách (Vector RAG) chưa được nạp đầy đủ vào hệ thống.
                Tuy nhiên, hãy cố gắng trả lời câu hỏi sau một cách thông thái, thân thiện bằng tiếng Việt.
                Xưng hô là "mình" và gọi người dùng là "bạn".
                
                CÂU HỎI: "%s"
                """, question);

        return chatClient.prompt()
                .user(prompt)
                .call()
                .content();
    }
}
