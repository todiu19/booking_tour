package com.project.bookingtour.common.dto.response;

import com.project.bookingtour.common.enums.ReviewStatus;
import com.project.bookingtour.domain.entity.Destination;
import com.project.bookingtour.domain.entity.Hotel;
import com.project.bookingtour.domain.entity.HotelImage;
import com.project.bookingtour.domain.entity.HotelReview;
import com.project.bookingtour.domain.entity.HotelType;
import java.util.Comparator;
import java.util.List;
import java.math.BigDecimal;
import lombok.Data;

@Data
public class HotelResponse {
    private Long id;
    private String name;
    private String address;
    private String location;
    private String description;
    private BigDecimal basePrice;
    private Integer roomCapacity;
    private Long destinationId;
    private String destinationName;
    private Long hotelTypeId;
    private String hotelTypeName;
    private Double averageRating;
    private Long reviewCount;
    private String thumbnailUrl;
    private List<String> imageUrls;

    public static HotelResponse from(Hotel hotel) {
        if (hotel == null) {
            return null;
        }
        HotelResponse r = new HotelResponse();
        r.setId(hotel.getId());
        r.setName(hotel.getName());
        r.setAddress(hotel.getAddress());
        r.setLocation(hotel.getLocation());
        r.setDescription(hotel.getDescription());
        r.setBasePrice(hotel.getBasePrice());
        r.setRoomCapacity(hotel.getRoomCapacity());
        Destination destination = hotel.getDestination();
        r.setDestinationId(destination == null ? null : destination.getId());
        r.setDestinationName(destination == null ? null : destination.getName());
        HotelType hotelType = hotel.getHotelType();
        r.setHotelTypeId(hotelType == null ? null : hotelType.getId());
        r.setHotelTypeName(hotelType == null ? null : hotelType.getName());
        List<String> urls =
                hotel.getImages() == null
                        ? List.of()
                        : hotel.getImages().stream()
                                .sorted(
                                        Comparator.comparing(
                                                i -> i.getDisplayOrder() == null ? Integer.MAX_VALUE : i.getDisplayOrder()))
                                .map(HotelImage::getImageUrl)
                                .filter(java.util.Objects::nonNull)
                                .toList();
        r.setImageUrls(urls);
        r.setThumbnailUrl(urls.isEmpty() ? null : urls.get(0));
        List<Short> ratings =
                hotel.getReviews() == null
                        ? List.of()
                        : hotel.getReviews().stream()
                                .filter(hr -> hr.getStatus() == ReviewStatus.visible)
                                .map(HotelReview::getRating)
                                .filter(java.util.Objects::nonNull)
                                .toList();
        long reviewCount = ratings.size();
        double average = reviewCount == 0 ? 0d : ratings.stream().mapToDouble(Short::doubleValue).average().orElse(0d);
        r.setReviewCount(reviewCount);
        r.setAverageRating(average);
        return r;
    }
}
