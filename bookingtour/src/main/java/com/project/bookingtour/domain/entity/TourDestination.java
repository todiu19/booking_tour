package com.project.bookingtour.domain.entity;

import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.MapsId;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "tour_destinations")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TourDestination {

    @EmbeddedId
    private TourDestinationId id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @MapsId("tourId")
    @JoinColumn(name = "tour_id", nullable = false, columnDefinition = "BIGINT UNSIGNED")
    private Tour tour;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @MapsId("destinationId")
    @JoinColumn(name = "destination_id", nullable = false, columnDefinition = "BIGINT UNSIGNED")
    private Destination destination;

    private Integer dayNumber;
}
