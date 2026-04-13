package com.project.bookingtour.common.dto.response;

import java.util.List;
import lombok.Data;
import org.springframework.data.domain.Page;

@Data
public class PageResponse<T> {

    private List<T> content;
    private int page;
    private int size;
    private long totalElements;
    private int totalPages;
    private boolean last;
    private boolean first;

    public static <T> PageResponse<T> of(
            List<T> content, int page, int size, long totalElements, int totalPages) {
        PageResponse<T> r = new PageResponse<>();
        r.setContent(content);
        r.setPage(page);
        r.setSize(size);
        r.setTotalElements(totalElements);
        r.setTotalPages(totalPages);
        r.setLast(totalPages == 0 || page >= totalPages - 1);
        r.setFirst(page == 0);
        return r;
    }

    public static <T> PageResponse<T> fromPage(Page<T> page) {
        return of(
                page.getContent(),
                page.getNumber(),
                page.getSize(),
                page.getTotalElements(),
                page.getTotalPages());
    }
}
