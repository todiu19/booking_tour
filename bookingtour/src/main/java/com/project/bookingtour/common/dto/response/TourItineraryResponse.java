package com.project.bookingtour.common.dto.response;

import com.project.bookingtour.domain.entity.TourItinerary;
import java.util.Comparator;
import java.util.List;
import lombok.Data;

@Data
public class TourItineraryResponse {
    private Long id;
    private Integer dayNumber;
    private String title;
    private String description;
    private List<TourItineraryHotelResponse> hotels;

    public static TourItineraryResponse from(TourItinerary itinerary) {
        if (itinerary == null) {
            return null;
        }
        TourItineraryResponse r = new TourItineraryResponse();
        r.setId(itinerary.getId());
        r.setDayNumber(itinerary.getDayNumber());
        r.setTitle(itinerary.getTitle());
        r.setDescription(itinerary.getDescription());
        List<TourItineraryHotelResponse> hotelResponses =
                itinerary.getItineraryHotels() == null
                        ? List.of()
                        : itinerary.getItineraryHotels().stream()
                                .sorted(Comparator.comparing(i -> i.getId() == null ? 0L : i.getId()))
                                .map(TourItineraryHotelResponse::from)
                                .toList();
        r.setHotels(hotelResponses);
        return r;
    }
}
