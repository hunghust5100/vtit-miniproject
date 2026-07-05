package com.vdt.vtit.chatbot.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
@Slf4j
public class TextToSqlServiceImpl implements TextToSqlService {

    private final ChatClient chatClient;
    private final JdbcTemplate jdbcTemplate;

    public TextToSqlServiceImpl(ChatClient.Builder chatClientBuilder, JdbcTemplate jdbcTemplate) {
        this.chatClient = chatClientBuilder.build();
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public String processNaturalLanguageQuery(String question) {
        log.info("Text-to-SQL: Nhận câu hỏi: {}", question);

        // 1. Tạo System Prompt mô tả cấu trúc DB chính xác
        String sqlSystemPrompt = """
                Bạn là chuyên gia cơ sở dữ liệu PostgreSQL cho Hệ thống Quản lý Tài sản VTIT.
                Hãy chuyển câu hỏi tiếng Việt của người dùng thành một câu lệnh SQL SELECT hợp lệ duy nhất để chạy trên cơ sở dữ liệu PostgreSQL.
                
                THÔNG TIN CƠ SÀ DỮ LIỆU (SCHEMA):
                1. Bảng `departments` (Phòng ban):
                   - `id` (BIGINT, Khóa chính)
                   - `name` (VARCHAR, Tên phòng ban)
                   - `category` (VARCHAR, Phân loại)
                   - `description` (VARCHAR, Mô tả)
                   - `location` (VARCHAR, Vị trí/Văn phòng)
                   - `head_manager_id` (BIGINT, ID quản lý trưởng phòng)
                
                2. Bảng `users` (Nhân viên):
                   - `id` (BIGINT, Khóa chính)
                   - `email` (VARCHAR, Email đăng nhập)
                   - `full_name` (VARCHAR, Họ và tên)
                   - `role` (VARCHAR, Vai trò: ADMIN, MANAGER, STAFF)
                   - `phone_number` (VARCHAR, Số điện thoại)
                   - `department_id` (BIGINT, Foreign Key liên kết `departments.id`)
                   - `enabled` (BOOLEAN, Trạng thái tài khoản)
                
                3. Bảng `asset_types` (Loại thiết bị):
                   - `id` (BIGINT, Khóa chính)
                   - `name` (VARCHAR, Tên loại thiết bị, ví dụ: Laptop, Máy in, Màn hình)
                   - `code` (VARCHAR, Mã loại thiết bị)
                
                4. Bảng `asset_models` (Dòng máy/Model):
                   - `id` (BIGINT, Khóa chính)
                   - `asset_type_id` (BIGINT, Foreign Key liên kết `asset_types.id`)
                   - `name` (VARCHAR, Tên dòng máy, ví dụ: Macbook Pro 14, Dell Latitude 5420)
                   - `code` (VARCHAR, Ký hiệu code dòng máy)
                   - `manufacturer` (VARCHAR, Nhà sản xuất, ví dụ: Apple, Dell, HP)
                
                5. Bảng `asset_instances` (Thiết bị/Tài sản vật lý cụ thể):
                   - `id` (BIGINT, Khóa chính)
                   - `asset_model_id` (BIGINT, Foreign Key liên kết `asset_models.id`)
                   - `serial` (VARCHAR, Số Serial)
                   - `status` (VARCHAR, Trạng thái thiết bị: AVAILABLE - Sẵn sàng, PENDING - Chờ bàn giao, USING - Đang sử dụng, LIQUIDATED - Thanh lý)
                   - `purchase_price` (BIGINT, Đơn giá thu mua VND)
                   - `net_book_value` (BIGINT, Giá trị còn lại sau khấu hao)
                   - Lưu ý: Giá trị khấu hao đã trích lập của mỗi thiết bị = (purchase_price - net_book_value). Do đó, "tổng giá trị khấu hao thiết bị" = SUM(purchase_price - net_book_value).
                
                6. Bảng `allocations` (Yêu cầu cấp phát / mượn thiết bị):
                   - `id` (BIGINT, Khóa chính)
                   - `asset_instance_id` (BIGINT, Foreign Key liên kết `asset_instances.id`)
                   - `staff_id` (BIGINT, Foreign Key liên kết `users.id`)
                   - `request_at` (TIMESTAMP, Ngày yêu cầu)
                   - `status` (VARCHAR, Trạng thái yêu cầu: PENDING, APPROVED, REJECTED, USING, CANCELED, RETURNED)
                   - `received_at` (TIMESTAMP, Ngày nhận thiết bị thực tế)
                   - `returned_at` (TIMESTAMP, Ngày trả thiết bị thực tế)
                
                QUY TẮC BẮT BUỘC:
                1. Chỉ trả ra câu lệnh SQL SELECT duy nhất, KHÔNG viết bất cứ chữ giải thích nào khác.
                2. KHÔNG bao gồm các câu lệnh chỉnh sửa dữ liệu (INSERT, UPDATE, DELETE, ALTER, DROP, TRUNCATE...).
                3. Khi so sánh chuỗi hoặc tên dòng máy, sử dụng ILIKE và dấu % để tìm kiếm gần đúng (ví dụ: am.name ILIKE '%Dell%').
                4. Hãy thực hiện kết nối bảng (JOIN) chính xác nếu câu hỏi yêu cầu dữ liệu liên quan giữa các bảng.
                """;

        try {
            // 2. Gọi LLM sinh mã SQL
            String rawSqlResponse = chatClient.prompt()
                    .system(sqlSystemPrompt)
                    .user("Hãy viết câu lệnh SQL SELECT cho câu hỏi sau: " + question)
                    .call()
                    .content();

            String sql = cleanSql(rawSqlResponse);
            log.info("Text-to-SQL: Mã SQL được sinh ra: \n{}", sql);

            // 3. Kiểm tra an toàn SQL (Read-Only)
            validateSafeQuery(sql);

            // 4. Thực thi truy vấn
            List<Map<String, Object>> queryResults = jdbcTemplate.queryForList(sql);
            log.info("Text-to-SQL: Kết quả truy vấn DB: {} dòng dữ liệu.", queryResults.size());

            // 5. Tổng hợp phản hồi tự nhiên cho người dùng
            String responseSystemPrompt = """
                    Bạn là Trợ lý ảo thông minh của Hệ thống Quản lý Tài sản VTIT.
                    Hãy trả lời câu hỏi của người dùng một cách thân thiện, xưng hô là "mình" và gọi người dùng là "bạn".
                    Bạn sẽ được cung cấp câu hỏi của người dùng, câu lệnh SQL đã chạy và kết quả thực tế từ cơ sở dữ liệu.
                    
                    QUY TẮC PHẢN HỒI:
                    1. Câu trả lời phải CỰC KỲ ngắn gọn, trực diện, không dài dòng. Đi thẳng vào số liệu ở câu đầu tiên.
                    2. Nếu kết quả truy vấn trống, rỗng hoặc giá trị bằng 0 (ví dụ: [], null, [{sum=null}], [{count=0}], [{count=null}]), hãy trả lời ngay là hiện tại hệ thống chưa có dữ liệu hoặc dữ liệu bằng 0. TUYỆT ĐỐI không bịa số liệu, không giải thích lý thuyết hay lấy cớ hệ thống chưa nạp cẩm nang/chính sách RAG.
                    3. Không đề cập đến cấu trúc bảng hoặc code SQL trừ khi người dùng hỏi trực tiếp về kỹ thuật.
                    4. Trình bày kết quả rõ ràng, nếu có danh sách thì dùng markdown list hoặc bảng biểu.
                    """;

            String responseUserPrompt = String.format("""
                    CÂU HỎI CỦA BẠN: "%s"
                    CÂU LỆNH SQL ĐÃ CHẠY: "%s"
                    KẾT QUẢ TRUY VẤN THỰC TẾ: %s
                    """, question, sql, queryResults.toString());

            return chatClient.prompt()
                    .system(responseSystemPrompt)
                    .user(responseUserPrompt)
                    .call()
                    .content();

        } catch (IllegalArgumentException e) {
            log.warn("Text-to-SQL: Cảnh báo bảo mật: {}", e.getMessage());
            return "Yêu cầu của bạn chứa nội dung không được phép thực thi hoặc mình không thể truy cập dữ liệu sửa đổi. Bạn vui lòng chỉ hỏi các thông tin thống kê, kiểm kê tài sản nhé.";
        } catch (Exception e) {
            log.error("Text-to-SQL: Lỗi khi xử lý câu hỏi", e);
            return "Đã xảy ra lỗi trong quá trình truy vấn dữ liệu tài sản. Bạn vui lòng kiểm tra lại câu hỏi hoặc thử lại sau nhé.";
        }
    }

    private String cleanSql(String responseContent) {
        String sql = responseContent.trim();
        if (sql.startsWith("```sql")) {
            sql = sql.substring(6);
        } else if (sql.startsWith("```")) {
            sql = sql.substring(3);
        }
        if (sql.endsWith("```")) {
            sql = sql.substring(0, sql.length() - 3);
        }
        sql = sql.trim();
        if (sql.endsWith(";")) {
            sql = sql.substring(0, sql.length() - 1);
        }
        
        // Remove single-line comments starting with '--' and inline comments
        String[] lines = sql.split("\n");
        StringBuilder sb = new StringBuilder();
        for (String line : lines) {
            String trimmedLine = line.trim();
            if (trimmedLine.startsWith("--")) {
                continue;
            }
            int commentIndex = line.indexOf("--");
            if (commentIndex >= 0) {
                sb.append(line.substring(0, commentIndex)).append("\n");
            } else {
                sb.append(line).append("\n");
            }
        }
        return sb.toString().trim();
    }

    private void validateSafeQuery(String sql) {
        String cleaned = sql.trim().toUpperCase();
        if (!cleaned.startsWith("SELECT")) {
            throw new IllegalArgumentException("Chỉ cho phép thực hiện các truy vấn đọc dữ liệu (SELECT).");
        }

        // Chặn SQL injection sửa đổi cấu trúc/dữ liệu hoặc multiple statements
        List<String> forbiddenKeywords = List.of(
                "INSERT ", "UPDATE ", "DELETE ", "DROP ", "ALTER ", "TRUNCATE ", "CREATE ", "REPLACE ",
                "GRANT ", "REVOKE ", "MERGE ", "EXECUTE ", "EXEC ", ";", "--"
        );
        for (String keyword : forbiddenKeywords) {
            if (cleaned.contains(keyword)) {
                throw new IllegalArgumentException("Truy vấn chứa từ khóa không hợp lệ: " + keyword.trim());
            }
        }
    }
}
