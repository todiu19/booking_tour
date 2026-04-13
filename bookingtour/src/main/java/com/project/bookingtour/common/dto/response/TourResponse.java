package com.project.bookingtour.common.dto.response;

import com.project.bookingtour.common.enums.TourStatus;
import com.project.bookingtour.domain.entity.Tour;
import com.project.bookingtour.domain.entity.TourImage;
import java.math.BigDecimal;
import java.util.Comparator;
import java.util.List;
import lombok.Data;

@Data
public class TourResponse {

    private Long id;
    private String code;
    private String name;
    private String description;
    private Integer durationDays;
    private String departureLocation;
    private BigDecimal basePrice;
    private String destinationList;
    private List<String> imageUrls;
    private String thumbnailUrl;
    private TourStatus status;

    public static TourResponse from(Tour t) {
        if (t == null) {
            return null;
        }
        TourResponse r = new TourResponse();
        r.setId(t.getId());
        r.setCode(t.getCode());
        r.setName(t.getName());
        r.setDescription(t.getDescription());
        r.setDurationDays(t.getDurationDays());
        r.setDepartureLocation(t.getDepartureLocation());
        r.setBasePrice(t.getBasePrice());
        r.setDestinationList(t.getDestinationList());
        List<String> urls =
                t.getImages() == null
                        ? List.of()
                        : t.getImages().stream()
                                .sorted(Comparator.comparing(TourImage::getDisplayOrder))
                                .map(TourImage::getImageUrl)
                                .toList();
        r.setImageUrls(urls);
        r.setThumbnailUrl(urls.isEmpty() ? null : urls.get(0));
        r.setStatus(t.getStatus());
        return r;
    }
}
