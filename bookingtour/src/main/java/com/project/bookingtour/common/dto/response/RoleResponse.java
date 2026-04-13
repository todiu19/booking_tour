package com.project.bookingtour.common.dto.response;

import com.project.bookingtour.domain.entity.Role;
import lombok.Data;

@Data
public class RoleResponse {

    private Long id;
    private String name;

    public static RoleResponse from(Role role) {
        if (role == null) {
            return null;
        }
        RoleResponse r = new RoleResponse();
        r.setId(role.getId());
        r.setName(role.getName());
        return r;
    }
}
