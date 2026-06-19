package com.vdt.vtit.department.dto;

import lombok.Data;

@Data
public class DepartmentCreateRequest {
    private String name;
    private String description;
    private Long headManagerId;
    private String category;
    private String location;
}
