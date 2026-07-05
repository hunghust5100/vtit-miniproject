package com.vdt.vtit.department.service;

import com.vdt.vtit.common.exception.BadRequestException;
import com.vdt.vtit.department.dto.DepartmentCreateRequest;
import com.vdt.vtit.department.dto.DepartmentResponse;
import com.vdt.vtit.department.dto.DepartmentUpdateRequest;
import com.vdt.vtit.department.entity.Department;
import com.vdt.vtit.department.repository.DepartmentRepository;
import com.vdt.vtit.user.dto.UserResponse;
import com.vdt.vtit.user.entity.User;
import com.vdt.vtit.user.repository.UserRepository;
import com.vdt.vtit.user.service.UserService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class DepartmentServiceImpl implements DepartmentService{

    private final DepartmentRepository departmentRepository;
    private final UserService userService;
    private final UserRepository userRepository;

    @Override
    public DepartmentResponse createDepartment(DepartmentCreateRequest request) {

        User user = userRepository.findById(request.getHeadManagerId())
                .orElseThrow(() -> new BadRequestException("Không tìm thấy người dùng"));

        Department department = Department.builder()
                .name(request.getName())
                .category(request.getCategory())
                .description(request.getDescription())
                .location(request.getLocation())
                .headManagerId(user.getId())
                .build();

        Department department1 = departmentRepository.save(department);

        user.setDepartment(department1);
        user.setRole("MANAGER");
        userRepository.save(user);

        return mapToDepartmentResponse(department1);
    }

    @Override
    public DepartmentResponse getDepartmentById(Long id) {
        Department department = departmentRepository.findById(id)
                .orElseThrow(() -> new BadRequestException("Không tìm thấy phòng ban"));

        return mapToDepartmentResponse(department);
    }

    @Override
    public List<DepartmentResponse> getAllDepartments() {
        return List.of();
    }

    @Override
    public Page<DepartmentResponse> getAllDepartmentsPagination(int page, int size, String sortBy, String sortDir) {
        Sort sort = sortDir.equalsIgnoreCase(Sort.Direction.ASC.name()) ?
                Sort.by(sortBy).ascending() :
                Sort.by(sortBy).descending();

        Pageable pageable = PageRequest.of(page, size, sort);

        Page<Department> departmentPage = departmentRepository.findAll(pageable);

        return departmentPage.map(this::mapToDepartmentResponse);
    }

    @Override
    public DepartmentResponse updateDepartment(Long id, DepartmentUpdateRequest request) {
        Department department = departmentRepository.findById(id)
                .orElseThrow(() -> new BadRequestException("Không tìm thấy phòng ban"));

        User user = userRepository.findById(request.getHeadManagerId())
                .orElseThrow(() -> new BadRequestException("Không tìm thấy người dùng"));
        user.setRole("MANAGER");
        userRepository.save(user);

        if (department.getHeadManagerId() != null) {
            User oldManager = userRepository.findById(department.getHeadManagerId())
                    .orElseThrow(() -> new BadRequestException("Không tìm thấy trưởng phòng cũ"));

            oldManager.setRole("USER");
            userRepository.save(oldManager);
        }


        department.setCategory(request.getCategory());
        department.setName(request.getName());
        department.setDescription(request.getDescription());
        department.setLocation(request.getLocation());
        department.setHeadManagerId(request.getHeadManagerId());

        Department department1 = departmentRepository.save(department);

        user.setDepartment(department1);
        userRepository.save(user);

        return mapToDepartmentResponse(department1);

    }

    @Override
    public void deleteDepartment(Long id) {
        Department department = departmentRepository.findById(id)
                .orElseThrow(() -> new BadRequestException("Không tìm thấy phòng ban"));

        departmentRepository.deleteById(id);
    }

    @Override
    public DepartmentResponse addStaffToDepartment(Long departmentId, Long staffId) {

        Department department = departmentRepository.findById(departmentId)
                .orElseThrow(() -> new BadRequestException("Không tìm thấy phòng ban"));

        User staff = userRepository.findById(staffId)
                .orElseThrow(() -> new BadRequestException("Không tìm thấy người dùng"));

        staff.setDepartment(department);
        userRepository.save(staff);

        department = departmentRepository.findById(departmentId)
                .orElseThrow(() -> new BadRequestException("Không tìm thấy phòng ban"));

        return mapToDepartmentResponse(department);
    }

    @Override
    public DepartmentResponse removeStaffFromDepartment(Long departmentId, Long staffId) {
        Department department = departmentRepository.findById(departmentId)
                .orElseThrow(() -> new BadRequestException("Không tìm thấy phòng ban"));

        User staff = userRepository.findById(staffId)
                .orElseThrow(() -> new BadRequestException("Không tìm thấy người dùng"));

        if (staff.getDepartment() == null ||
                !staff.getDepartment().getId().equals(departmentId)) {

            throw new BadRequestException(
                    "Nhân viên không thuộc phòng ban");
        }

        staff.setDepartment(null);
        userRepository.save(staff);

        department = departmentRepository.findById(departmentId)
                .orElseThrow(() -> new BadRequestException("Không tìm thấy phòng ban"));

        return mapToDepartmentResponse(department);
    }

    @Override
    public Page<UserResponse> getStaffFromDepartment(Long departmentId, int page, int size, String sortBy, String sortDir) {
        Sort sort = sortDir.equalsIgnoreCase(Sort.Direction.ASC.name()) ?
                Sort.by(sortBy).ascending() :
                Sort.by(sortBy).descending();

        Pageable pageable = PageRequest.of(page, size, sort);

        Page<User> staffs = userRepository.findByDepartmentId(departmentId, pageable);

        return staffs.map(this::mapToUserResponse);
    }

    private DepartmentResponse mapToDepartmentResponse(Department department) {
        return DepartmentResponse.builder()
                .id(department.getId())
                .name(department.getName())
                .description(department.getDescription())
                .location(department.getLocation())
                .category(department.getCategory())
                .headManagerId(department.getHeadManagerId())
                .headManagerName(userService.getUserById(department.getHeadManagerId()).getFullName())
                .staffAmount(department.getStaffs() == null ? 0 : department.getStaffs().size())
                .build();
    }

    private UserResponse mapToUserResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .phoneNumber(user.getPhoneNumber())
                .role(user.getRole())
                .birthday(user.getBirthday())
                .createdAt(user.getCreatedAt())
                .build();
    }
}
