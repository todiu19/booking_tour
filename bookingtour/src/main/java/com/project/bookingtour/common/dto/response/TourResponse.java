package com.project.bookingtour.common.dto.response;

import com.project.bookingtour.common.enums.TourStatus;
import com.project.bookingtour.domain.entity.TourItinerary;
import com.project.bookingtour.domain.entity.Tour;
import com.project.bookingtour.domain.entity.TourImage;
import java.math.BigDecimal;
import java.time.LocalDate;
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
    private List<LocalDate> departureDates;
    private BigDecimal basePrice;
    private String destinationList;
    /** Điểm xuất phát / tập trung khách (HN, HCM, ĐN, …). */
    private String departurePoint;
    private Double averageRating;
    private Long reviewCount;
    private List<TourItineraryResponse> itineraries;
    private List<String> imageUrls;
    private String thumbnailUrl;
    private TourStatus status;

    public static TourResponse from(Tour t) {
        return from(t, List.of());
    }

    public static TourResponse from(Tour t, List<LocalDate> departureDates) {
        if (t == null) {
            return null;
        }
        TourResponse r = new TourResponse();
        r.setId(t.getId());
        r.setCode(t.getCode());
        r.setName(t.getName());
        r.setDescription(t.getDescription());
        r.setDurationDays(t.getDurationDays());
        List<LocalDate> normalizedDepartureDates =
                departureDates == null
                        ? List.of()
                        : departureDates.stream()
                                .filter(java.util.Objects::nonNull)
                                .distinct()
                                .sorted()
                                .toList();
        r.setDepartureDates(normalizedDepartureDates);
        r.setBasePrice(t.getBasePrice());
        r.setDestinationList(t.getDestinationList());
        r.setDeparturePoint(t.getDeparturePoint());
        List<TourItineraryResponse> itineraryResponses =
                t.getItineraries() == null
                        ? List.of()
                        : t.getItineraries().stream()
                                .sorted(Comparator.comparing(TourItinerary::getDayNumber))
                                .map(TourItineraryResponse::from)
                                .toList();
        r.setItineraries(itineraryResponses);
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
