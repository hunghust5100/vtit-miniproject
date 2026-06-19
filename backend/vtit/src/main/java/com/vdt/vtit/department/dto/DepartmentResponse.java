package com.vdt.vtit.department.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class DepartmentResponse {
    private Long id;
    private String name;
    private String description;
    private String location;
    private String category;
    private Long headManagerId;
    private String headManagerName;
    private int staffAmount;
}
