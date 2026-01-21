package com.espe.gestion_productos.models;

import jakarta.persistence.Embeddable;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

@Embeddable
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ShippingAddress implements Serializable {
    
    @JsonProperty("country")
    private String country;
    
    @JsonProperty("city")
    private String city;
    
    @JsonProperty("street")
    private String street;
    
    @JsonProperty("zipCode")
    private String zipCode;

    @JsonProperty("state")
    private String state;
}