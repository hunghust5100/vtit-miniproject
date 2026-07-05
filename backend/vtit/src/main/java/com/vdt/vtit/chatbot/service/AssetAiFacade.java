package com.vdt.vtit.chatbot.service;

import com.vdt.vtit.chatbot.model.AssetQueryType;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.stereotype.Service;

@Service
public class AssetAiFacade {

    private final ChatClient chatClient;
    private final TextToSqlService textToSqlService;
    private final RagService ragService;

    public AssetAiFacade(ChatClient.Builder chatClientBuilder,
                         TextToSqlService textToSqlService,
                         RagService ragService) {
        this.chatClient = chatClientBuilder.build();
        this.textToSqlService = textToSqlService;
        this.ragService = ragService;
    }

    public String handleUserRequest(String userQuestion) {
        // 1. Dùng Prompt để phân loại câu hỏi
        String routerPrompt = String.format("""
                Bạn là bộ định tuyến ý định người dùng cho Hệ thống Quản lý Tài sản VTIT.
                Hãy phân loại câu hỏi sau vào một trong ba nhóm:
                - 'ANALYTICS_SQL': Nếu câu hỏi cần đếm số lượng, kiểm tra trạng thái, danh sách thiết bị, lịch sử bàn giao, tính toán khấu hao, tổng giá trị tài sản từ cơ sở dữ liệu. (Ví dụ: "hệ thống có bao nhiêu laptop Dell rảnh?", "ai đang mượn máy này?", "tổng số tài sản", "tổng giá trị khấu hao thiết bị", "tổng tiền mua thiết bị")
                - 'KNOWLEDGE_RAG': Nếu câu hỏi hỏi về định nghĩa, lý thuyết, chính sách chung, quy trình báo hỏng, quy định cấp phát, hướng dẫn sửa chữa hoặc cẩm nang thiết bị. (Ví dụ: "hướng dẫn bảo hành", "quy trình báo hỏng máy in", "khấu hao là gì", "quy định khấu hao")
                - 'GENERAL': Nếu câu hỏi là chào hỏi hoặc không liên quan đến tài sản. (Ví dụ: "xin chào", "bạn tên gì", "hôm nay thế nào")
                
                CÂU HỎI: "%s"
                
                Chỉ trả ra duy nhất một từ khóa thuộc tập hợp: [ANALYTICS_SQL, KNOWLEDGE_RAG, GENERAL]. Không giải thích gì thêm, không trả thêm dấu nháy hay ký tự khác.
                """, userQuestion);

        String decisionStr = chatClient.prompt()
                .user(routerPrompt)
                .call()
                .content()
                .trim();

        System.out.println("🤖 AI Router quyết định hướng đi: " + decisionStr);

        // 2. Điều hướng xử lý dựa trên quyết định của Router
        try {
            AssetQueryType queryType = AssetQueryType.valueOf(decisionStr);
            switch (queryType) {
                case ANALYTICS_SQL:
                    return textToSqlService.processNaturalLanguageQuery(userQuestion);
                case KNOWLEDGE_RAG:
                    return ragService.chatWithKnowledge(userQuestion);
                default:
                    return chatClient.prompt()
                            .user("Hãy trả lời câu hỏi sau một cách tự nhiên, thân thiện bằng tiếng Việt, xưng hô là 'mình' và gọi người dùng là 'bạn': " + userQuestion)
                            .call()
                            .content();
            }
        } catch (IllegalArgumentException e) {
            // Mặc định chạy fallback RAG nếu LLM trả về chuỗi lạ không nằm trong Enum
            return ragService.chatWithKnowledge(userQuestion);
        }
    }
}
