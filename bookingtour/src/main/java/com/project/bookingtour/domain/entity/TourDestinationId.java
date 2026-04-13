package com.project.bookingtour.domain.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import java.io.Serializable;
import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Embeddable
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode
public class TourDestinationId implements Serializable {

    @Column(name = "tour_id", columnDefinition = "BIGINT UNSIGNED")
    private Long tourId;

    @Column(name = "destination_id", columnDefinition = "BIGINT UNSIGNED")
    private Long destinationId;
}
