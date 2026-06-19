package com.vdt.vtit.department.dto;

import lombok.Data;

@Data
public class DepartmentUpdateRequest {
    private String name;
    private String location;
    private Long headManagerId;
    private String category;
    private String description;
}
