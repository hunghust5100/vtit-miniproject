package com.vdt.vtit.chatbot.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.regex.Pattern;

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
                
                THÔNG TIN CƠ SỞ DỮ LIỆU (SCHEMA):
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
                
                QUAN HỆ GIỮA CÁC BẢNG (JOIN PATH):
                - users.department_id → departments.id (Nhân viên thuộc phòng ban nào)
                - asset_instances.asset_model_id → asset_models.id (Thiết bị thuộc dòng máy nào)
                - asset_models.asset_type_id → asset_types.id (Dòng máy thuộc loại thiết bị nào)
                - allocations.asset_instance_id → asset_instances.id (Yêu cầu cấp phát cho thiết bị nào)
                - allocations.staff_id → users.id (Ai yêu cầu cấp phát)
                
                VÍ DỤ CÂU HỎI VÀ SQL TƯƠNG ỨNG:
                - "Có bao nhiêu laptop?" → SELECT COUNT(*) AS total FROM asset_instances ai JOIN asset_models am ON ai.asset_model_id = am.id JOIN asset_types at ON am.asset_type_id = at.id WHERE at.name ILIKE '%laptop%'
                - "Tổng giá trị tài sản?" → SELECT SUM(purchase_price) AS total_value FROM asset_instances
                - "Ai đang mượn thiết bị?" → SELECT u.full_name, am.name AS model_name, al.received_at FROM allocations al JOIN users u ON al.staff_id = u.id JOIN asset_instances ai ON al.asset_instance_id = ai.id JOIN asset_models am ON ai.asset_model_id = am.id WHERE al.status = 'USING'
                - "Bao nhiêu thiết bị đang rảnh?" → SELECT COUNT(*) AS total FROM asset_instances WHERE status = 'AVAILABLE'
                - "Tổng khấu hao?" → SELECT SUM(purchase_price - net_book_value) AS total_depreciation FROM asset_instances
                - "Danh sách phòng ban?" → SELECT id, name, category, location FROM departments
                - "Có bao nhiêu nhân viên?" → SELECT COUNT(*) AS total FROM users WHERE enabled = true
                
                QUY TẮC BẮT BUỘC:
                1. CHỈ trả ra đúng 1 câu SQL SELECT duy nhất. KHÔNG viết bất kỳ giải thích, comment, hoặc chữ nào khác.
                2. KHÔNG bao gồm các câu lệnh chỉnh sửa dữ liệu (INSERT, UPDATE, DELETE, ALTER, DROP, TRUNCATE...).
                3. KHÔNG thêm dấu chấm phẩy (;) ở cuối câu SQL.
                4. KHÔNG bao câu SQL trong markdown code block (```) hay bất kỳ ký tự đặc biệt nào.
                5. Khi so sánh chuỗi hoặc tên, sử dụng ILIKE và dấu %% để tìm kiếm gần đúng.
                6. Khi JOIN nhiều bảng, LUÔN dùng alias ngắn gọn (ví dụ: ai cho asset_instances, am cho asset_models, at cho asset_types, u cho users, d cho departments, al cho allocations).
                7. Giá trị enum status PHẢI viết đúng IN UPPER CASE và trong dấu nháy đơn (ví dụ: 'AVAILABLE', 'USING', 'PENDING').
                8. Nếu câu hỏi yêu cầu đếm, LUÔN dùng alias cho cột kết quả (ví dụ: COUNT(*) AS total).
                """;

        try {
            // 2. Gọi LLM sinh mã SQL
            String rawSqlResponse = chatClient.prompt()
                    .system(sqlSystemPrompt)
                    .user("Hãy viết câu lệnh SQL SELECT cho câu hỏi sau: " + question)
                    .call()
                    .content();

            log.info("Text-to-SQL: Phản hồi thô từ LLM: \n{}", rawSqlResponse);

            String sql = cleanSql(rawSqlResponse);
            log.info("Text-to-SQL: Mã SQL đã clean: \n{}", sql);

            // 3. Kiểm tra SQL trống
            if (sql.isBlank()) {
                log.warn("Text-to-SQL: LLM trả về SQL rỗng sau khi clean");
                return "Xin lỗi bạn, mình chưa thể hiểu câu hỏi này để truy vấn dữ liệu. Bạn thử hỏi cụ thể hơn nhé!";
            }

            // 4. Kiểm tra an toàn SQL (Read-Only)
            validateSafeQuery(sql);

            // 5. Thực thi truy vấn
            List<Map<String, Object>> queryResults = jdbcTemplate.queryForList(sql);
            log.info("Text-to-SQL: Kết quả truy vấn DB: {} dòng dữ liệu.", queryResults.size());

            // 6. Tổng hợp phản hồi tự nhiên cho người dùng
            String responseSystemPrompt = """
                    Bạn là Trợ lý ảo thông minh của Hệ thống Quản lý Tài sản VTIT.
                    Hãy trả lời câu hỏi của người dùng một cách thân thiện, xưng hô là "mình" và gọi người dùng là "bạn".
                    Bạn sẽ được cung cấp câu hỏi của người dùng, câu lệnh SQL đã chạy và kết quả thực tế từ cơ sở dữ liệu.
                    
                    QUY TẮC PHẢN HỒI:
                    1. Câu trả lời phải CỰC KỲ ngắn gọn, trực diện, không dài dòng. Đi thẳng vào số liệu ở câu đầu tiên.
                    2. Nếu kết quả truy vấn trống, rỗng hoặc giá trị bằng 0 (ví dụ: [], null, [{sum=null}], [{count=0}], [{count=null}]), hãy trả lời ngay là hiện tại hệ thống chưa có dữ liệu hoặc dữ liệu bằng 0. TUYỆT ĐỐI không bịa số liệu.
                    3. Không đề cập đến cấu trúc bảng hoặc code SQL trừ khi người dùng hỏi trực tiếp về kỹ thuật.
                    4. Trình bày kết quả rõ ràng. Nếu có danh sách thì dùng markdown list (dấu -). Nếu có nhiều cột dữ liệu thì dùng markdown table.
                    5. Số tiền VND thì format có dấu phân cách hàng nghìn (ví dụ: 15.000.000 VNĐ).
                    6. KHÔNG viết quá 200 từ.
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
            return "Yêu cầu của bạn chứa nội dung không được phép thực thi. Bạn vui lòng chỉ hỏi các thông tin thống kê, kiểm kê tài sản nhé.";
        } catch (Exception e) {
            log.error("Text-to-SQL: Lỗi khi xử lý câu hỏi: {}", e.getMessage(), e);
            return "Đã xảy ra lỗi trong quá trình truy vấn dữ liệu tài sản. Bạn vui lòng thử hỏi lại bằng cách khác nhé.";
        }
    }

    /**
     * Làm sạch output từ LLM: loại bỏ markdown code blocks, dấu ;, và comment SQL.
     * Chỉ loại bỏ comment dạng dòng riêng biệt (bắt đầu bằng --), giữ nguyên nội dung trong chuỗi.
     */
    private String cleanSql(String responseContent) {
        if (responseContent == null) {
            return "";
        }

        String sql = responseContent.trim();

        // Loại bỏ markdown code blocks
        if (sql.startsWith("```sql")) {
            sql = sql.substring(6);
        } else if (sql.startsWith("```")) {
            sql = sql.substring(3);
        }
        if (sql.endsWith("```")) {
            sql = sql.substring(0, sql.length() - 3);
        }
        sql = sql.trim();

        // Loại bỏ dấu ; ở cuối
        if (sql.endsWith(";")) {
            sql = sql.substring(0, sql.length() - 1);
        }

        // Loại bỏ các dòng comment (chỉ các dòng bắt đầu bằng --)
        // Không xóa -- inline để tránh ảnh hưởng đến chuỗi SQL hợp lệ
        String[] lines = sql.split("\n");
        StringBuilder sb = new StringBuilder();
        for (String line : lines) {
            String trimmedLine = line.trim();
            // Bỏ qua dòng chỉ chứa comment
            if (trimmedLine.startsWith("--")) {
                continue;
            }
            sb.append(line).append("\n");
        }

        return sb.toString().trim();
    }

    /**
     * Kiểm tra SQL chỉ chứa SELECT (Read-Only).
     * Sử dụng regex word-boundary để tránh false positive.
     */
    private void validateSafeQuery(String sql) {
        String cleaned = sql.trim().toUpperCase();

        // Phải bắt đầu bằng SELECT (hoặc WITH cho CTE)
        if (!cleaned.startsWith("SELECT") && !cleaned.startsWith("WITH")) {
            throw new IllegalArgumentException("Chỉ cho phép thực hiện các truy vấn đọc dữ liệu (SELECT).");
        }

        // Chặn multiple statements (dấu ; theo sau bởi chữ cái)
        if (Pattern.compile(";\\s*[A-Z]").matcher(cleaned).find()) {
            throw new IllegalArgumentException("Không cho phép thực thi nhiều câu lệnh SQL cùng lúc.");
        }

        // Chặn các từ khóa nguy hiểm sử dụng word-boundary để tránh false positive
        List<String> forbiddenKeywords = List.of(
                "INSERT", "UPDATE", "DELETE", "DROP", "ALTER", "TRUNCATE",
                "CREATE", "REPLACE", "GRANT", "REVOKE", "MERGE", "EXECUTE", "EXEC"
        );
        for (String keyword : forbiddenKeywords) {
            // Sử dụng word boundary \\b để khớp chính xác từ khóa
            Pattern pattern = Pattern.compile("\\b" + keyword + "\\b");
            if (pattern.matcher(cleaned).find()) {
                throw new IllegalArgumentException("Truy vấn chứa từ khóa không hợp lệ: " + keyword);
            }
        }
    }
}
