package com.vdt.vtit.department.controller;

import com.vdt.vtit.department.dto.DepartmentCreateRequest;
import com.vdt.vtit.department.dto.DepartmentResponse;
import com.vdt.vtit.department.dto.DepartmentUpdateRequest;
import com.vdt.vtit.department.service.DepartmentService;
import com.vdt.vtit.user.dto.UserResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/department")
@RequiredArgsConstructor
public class DepartmentController{
    private final DepartmentService departmentService;

    @PostMapping
    public ResponseEntity<DepartmentResponse> createDepartment(@Valid  @RequestBody DepartmentCreateRequest request) {
        return new ResponseEntity<>(departmentService.createDepartment(request), HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<Page<DepartmentResponse>> getDepartment(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "asc") String sortDir
    ) {
        return ResponseEntity.ok(departmentService.getAllDepartmentsPagination(page, size, sortBy, sortDir));
    }

    @GetMapping("/{id}")
    public ResponseEntity<DepartmentResponse> getDepartmentById(@PathVariable Long id) {
        return ResponseEntity.ok(departmentService.getDepartmentById(id));
    }

    @GetMapping("/{id}/staffs")
    public ResponseEntity<Page<UserResponse>> getStaffFromDepartment(
            @PathVariable Long id,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "asc") String sortDir
    ) {
        return ResponseEntity.ok(departmentService.getStaffFromDepartment(id, page, size, sortBy, sortDir));
    }

    @PutMapping("/{id}")
    public ResponseEntity<DepartmentResponse> updateDepartment(@PathVariable Long id, @Valid @RequestBody DepartmentUpdateRequest request) {
        return ResponseEntity.ok(departmentService.updateDepartment(id, request));
    }

    @PutMapping("/{departmentId}/staff/{staffId}")
    public ResponseEntity<DepartmentResponse> addStaffToDepartment(
            @PathVariable Long departmentId,
            @PathVariable Long staffId) {
        return ResponseEntity.ok(departmentService.addStaffToDepartment(departmentId, staffId));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> deleteDepartment(Long id) {
        departmentService.deleteDepartment(id);
        return ResponseEntity.ok(Map.of("String", "Xóa phòng ban thành công"));
    }

    @DeleteMapping("/{departmentId}/staff/{staffId}")
    public ResponseEntity<DepartmentResponse> removeStaffFromDepartment(
            @PathVariable Long departmentId,
            @PathVariable Long staffId
    ) {
        return ResponseEntity.ok(departmentService.removeStaffFromDepartment(departmentId, staffId));
    }

}
