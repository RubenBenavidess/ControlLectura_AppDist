package com.espe.gestion_productos.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;


import com.espe.gestion_productos.enums.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class OrderDetailsResponse {
    
    private String orderId;
    private String customerId;
    private OrderStatus status;
    private String reason;
    private String paymentReference;
    private List<OrderItemResponse> items;
    private ShippingAddressRequest shippingAddress;
}