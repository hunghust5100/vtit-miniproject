package com.vdt.vtit.chatbot.service;

import com.vdt.vtit.chatbot.model.AssetQueryType;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.stereotype.Service;

@Service
@Slf4j
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
                - 'ANALYTICS_SQL': Nếu câu hỏi cần đếm số lượng, kiểm tra trạng thái, danh sách thiết bị, lịch sử bàn giao, tính toán khấu hao, tổng giá trị tài sản, hỏi về nhân viên cụ thể, phòng ban cụ thể, hoặc bất kỳ thông tin nào cần truy vấn từ cơ sở dữ liệu. (Ví dụ: "hệ thống có bao nhiêu laptop Dell rảnh?", "ai đang mượn máy này?", "tổng số tài sản", "tổng giá trị khấu hao thiết bị", "tổng tiền mua thiết bị", "liệt kê các phòng ban", "có bao nhiêu nhân viên")
                - 'KNOWLEDGE_RAG': Nếu câu hỏi hỏi về định nghĩa, lý thuyết, chính sách chung, quy trình báo hỏng, quy định cấp phát, hướng dẫn sửa chữa hoặc cẩm nang thiết bị. (Ví dụ: "hướng dẫn bảo hành", "quy trình báo hỏng máy in", "khấu hao là gì", "quy định khấu hao")
                - 'GENERAL': Nếu câu hỏi là chào hỏi hoặc không liên quan đến tài sản. (Ví dụ: "xin chào", "bạn tên gì", "hôm nay thế nào")
                
                CÂU HỎI: "%s"
                
                CHỈ trả ra DUY NHẤT một từ khóa trong tập: ANALYTICS_SQL, KNOWLEDGE_RAG, GENERAL
                KHÔNG thêm bất kỳ ký tự nào khác (không dấu nháy, không dấu chấm, không giải thích).
                """, userQuestion);

        String decisionStr = chatClient.prompt()
                .user(routerPrompt)
                .call()
                .content();

        // Làm sạch kết quả: loại bỏ khoảng trắng, dấu nháy, dấu chấm, xuống dòng
        decisionStr = decisionStr.trim()
                .replaceAll("['\"`.,!\\s]", "")
                .toUpperCase();

        log.info("🤖 AI Router quyết định hướng đi: {} (cho câu hỏi: {})", decisionStr, userQuestion);

        // 2. Điều hướng xử lý dựa trên quyết định của Router
        try {
            AssetQueryType queryType = AssetQueryType.valueOf(decisionStr);
            switch (queryType) {
                case ANALYTICS_SQL:
                    return textToSqlService.processNaturalLanguageQuery(userQuestion);
                case KNOWLEDGE_RAG:
                    return ragService.chatWithKnowledge(userQuestion);
                default:
                    return handleGeneralChat(userQuestion);
            }
        } catch (IllegalArgumentException e) {
            log.warn("Router: LLM trả về giá trị không hợp lệ: '{}'. Fallback sang phân tích từ khóa.", decisionStr);

            // Fallback: phân tích từ khóa cơ bản thay vì luôn đi RAG
            String lowerQuestion = userQuestion.toLowerCase();
            if (containsAnalyticsKeywords(lowerQuestion)) {
                log.info("Router fallback: Phát hiện từ khóa analytics, chuyển sang Text-to-SQL");
                return textToSqlService.processNaturalLanguageQuery(userQuestion);
            } else if (containsKnowledgeKeywords(lowerQuestion)) {
                log.info("Router fallback: Phát hiện từ khóa knowledge, chuyển sang RAG");
                return ragService.chatWithKnowledge(userQuestion);
            }
            return handleGeneralChat(userQuestion);
        }
    }

    private String handleGeneralChat(String userQuestion) {
        return chatClient.prompt()
                .user("Hãy trả lời câu hỏi sau một cách tự nhiên, thân thiện bằng tiếng Việt, xưng hô là 'mình' và gọi người dùng là 'bạn': " + userQuestion)
                .call()
                .content();
    }

    /**
     * Kiểm tra câu hỏi có chứa từ khóa liên quan đến truy vấn dữ liệu không
     */
    private boolean containsAnalyticsKeywords(String question) {
        String[] keywords = {
                "bao nhiêu", "tổng", "đếm", "danh sách", "liệt kê", "thống kê",
                "ai đang", "thiết bị", "laptop", "máy in", "màn hình", "tài sản",
                "khấu hao", "giá trị", "phòng ban", "nhân viên", "mượn", "cấp phát",
                "trạng thái", "sẵn sàng", "đang sử dụng", "thanh lý", "serial",
                "rảnh", "available", "using", "pending"
        };
        for (String keyword : keywords) {
            if (question.contains(keyword)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Kiểm tra câu hỏi có chứa từ khóa liên quan đến kiến thức/chính sách không
     */
    private boolean containsKnowledgeKeywords(String question) {
        String[] keywords = {
                "quy trình", "quy định", "hướng dẫn", "chính sách", "cẩm nang",
                "bảo hành", "bảo trì", "sửa chữa", "báo hỏng", "là gì", "nghĩa là gì"
        };
        for (String keyword : keywords) {
            if (question.contains(keyword)) {
                return true;
            }
        }
        return false;
    }
}
