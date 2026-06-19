package com.vdt.vtit.department.repository;

import com.vdt.vtit.department.entity.Department;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DepartmentRepository extends JpaRepository<Department, Long> {
}
