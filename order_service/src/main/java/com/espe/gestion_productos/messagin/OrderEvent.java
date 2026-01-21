package com.espe.gestion_productos.messagin;

import com.espe.gestion_productos.enums.EventType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderEvent implements Serializable {
    private static final long serialVersionUID = 1L;

    private String orderId;
    private String customerId;
    private EventType eventType;
    private List<OrderItemEvent> items;
    private String shippingAddressJson;
    private long timestamp;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class OrderItemEvent implements Serializable {
        private String productId;
        private int quantity;
        private double unitPrice;
    }
}
