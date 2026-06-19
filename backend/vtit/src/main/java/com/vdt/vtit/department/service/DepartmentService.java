package com.vdt.vtit.department.service;

import com.vdt.vtit.department.dto.DepartmentCreateRequest;
import com.vdt.vtit.department.dto.DepartmentResponse;
import com.vdt.vtit.department.dto.DepartmentUpdateRequest;
import com.vdt.vtit.user.dto.UserResponse;
import org.springframework.data.domain.Page;

import java.util.List;

public interface DepartmentService {

    DepartmentResponse createDepartment(DepartmentCreateRequest request);

    DepartmentResponse getDepartmentById(Long id);

    List<DepartmentResponse> getAllDepartments();

    Page<DepartmentResponse> getAllDepartmentsPagination(int page, int size, String sortBy, String sortDir);

    DepartmentResponse updateDepartment(Long id, DepartmentUpdateRequest request);

    void deleteDepartment(Long id);

    DepartmentResponse addStaffToDepartment(Long departmentId, Long staffId);

    DepartmentResponse removeStaffFromDepartment(Long departmentId, Long staffId);

    Page<UserResponse>  getStaffFromDepartment(Long departmentId, int page, int size, String sortBy, String sortDir);
}
