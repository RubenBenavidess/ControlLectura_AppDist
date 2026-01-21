package com.espe.gestion_productos.models;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import com.espe.gestion_productos.enums.*;

@Entity
@Table(name = "orders")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Order {
    
    @Id
    @Column(name = "order_id", nullable = false, length = 36)
    private String orderId;
    
    @Column(name = "customer_id", nullable = false, length = 36)
    private String customerId;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private OrderStatus status;
    
    @Column(columnDefinition = "TEXT")
    private String reason;
    
    @Column(name = "payment_reference", nullable = false)
    private String paymentReference;
    
    @Embedded
    private ShippingAddress shippingAddress;
    
    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private List<OrderItem> items = new ArrayList<>();
    
    @PrePersist
    public void generateId() {
        if (this.orderId == null) {
            this.orderId = UUID.randomUUID().toString();
        }
        if (this.status == null) {
            this.status = OrderStatus.PENDING;
        }
    }
    
    public void addItem(OrderItem item) {
        items.add(item);
        item.setOrder(this);
    }
    
    public void removeItem(OrderItem item) {
        items.remove(item);
        item.setOrder(null);
    }
}