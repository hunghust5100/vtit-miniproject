# 🛰️ REST API GENERATION RULES (SPRING BOOT 4 & JAVA 25)

> **Dành cho Agent:** Khi được yêu cầu tạo bất kỳ tính năng hoặc module REST API nào, bạn PHẢI tuân thủ nghiêm ngặt quy trình sinh mã nguồn theo đúng thứ tự 5 bước dưới đây. Tuyệt đối không nhảy bước.

---

## 🔄 QUY TRÌNH 5 BƯỚC TRIỂN KHAI (STEP-BY-STEP FLOW)

Bạn phải sinh code theo đúng thứ tự từ tầng thấp nhất lên tầng cao nhất:
1. **Entity** ➡️ 2. **DTOs** ➡️ 3. **Repository** ➡️ 4. **Service (Interface trước, Impl sau)** ➡️ 5. **Controller**

---

## 🛠️ CHI TIẾT QUY CHUẨN TỪNG TẦNG

### 1. Tầng Entity (`package ...entity`)
*   **Đặt tên:** Danh từ số ít, viết hoa chữ cái đầu (Ví dụ: `Department`, `Product`).
*   **Annotation bắt buộc:** `@Entity`, `@Table(name = "tên_bảng_số_nhiều")`.
*   **Lombok:** Luôn sử dụng bộ combo: `@Getter`, `@Setter`, `@NoArgsConstructor`, `@AllArgsConstructor`, `@Builder`.
*   **Khóa chính:** Luôn dùng `Long id` với `@Id` và `@GeneratedValue(strategy = GenerationType.IDENTITY)`.

### 2. Tầng Data Transfer Object (`package ...dto`)
Tuyệt đối không dùng class thông thường. 
*   `[Name]CreateRequest`: Chứa các trường dữ liệu để tạo mới. Bắt buộc có các annotation validate dữ liệu đầu vào (`@NotBlank`, `@NotNull`, `@Size`,...).
*   `[Name]UpdateRequest`: Chứa các trường dữ liệu cho phép cập nhật.
*   `[Name]Response`: Cấu trúc dữ liệu trả về cho client.

### 3. Tầng Repository (`package ...repository`)
*   **Đặt tên:** `[Name]Repository`.
*   **Định dạng:** Là một `interface` mở rộng từ `JpaRepository<[Entity], Long>`.
*   **Annotation:** `@Repository`.
*   Chỉ viết thêm các hàm truy vấn tùy chỉnh (Query Method) khi thực sự có nhu cầu logic kiểm tra dữ liệu ở tầng Service (Ví dụ: `existsByCode`, `findBySlug`).

### 4. Tầng Service (`package ...service`)
Tách biệt hoàn toàn giữa khai báo (Interface) và triển khai (Implementation):

*   **Interface (`[Name]Service`):** Chỉ khai báo các hàm nghiệp vụ, đầu vào là các `Request DTO`, đầu ra là `Response DTO` hoặc `List<Response DTO>`. Không bao giờ truyền Entity qua Interface.
*   **Implementation (`[Name]ServiceImpl`):**
    *   Phải triển khai (implement) từ `[Name]Service`.
    *   Annotation: `@Service` và `@RequiredArgsConstructor` (để tự động inject các Bean qua Constructor). Không dùng `@Autowired`.
    *   **Transaction:** Sử dụng `@Transactional` của Spring cho các hàm ghi (tạo, sửa, xóa). Đối với các hàm đọc (lấy dữ liệu), sử dụng `@Transactional(readOnly = true)`.
    *   **Xử lý dữ liệu:** Sử dụng Java Stream API tiên tiến (như `.toList()`) để map từ Entity sang Response DTO.

### 5. Tầng Controller (`package ...controller`)
*   **Đặt tên:** `[Name]Controller`.
*   **Annotation:** `@RestController`, `@RequestMapping("/api/v1/tên-resource-số-nhiều")`, `@RequiredArgsConstructor`.
*   **HTTP Methods:** Sử dụng đúng chuẩn RESTful:
    *   `@PostMapping` cho hành động tạo mới (Return HTTP Status 201 Created).
    *   `@PutMapping("/{id}")` cho hành động cập nhật.
    *   `@GetMapping("/{id}")` và `@GetMapping` cho hành động lấy dữ liệu.
    *   `@DeleteMapping("/{id}")` cho hành động xóa (Return HTTP Status 204 No Content).
*   **Validation:** Luôn thêm `@Valid` trước `@RequestBody` để kích hoạt bộ kiểm tra dữ liệu của DTO.