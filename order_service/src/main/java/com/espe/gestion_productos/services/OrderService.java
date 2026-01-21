package com.espe.gestion_productos.services;

import com.espe.gestion_productos.dto.CreateOrderRequest;
import com.espe.gestion_productos.dto.CreateOrderResponse;
import com.espe.gestion_productos.dto.OrderDetailsResponse;
import com.espe.gestion_productos.messagin.OrderProducer;
import com.espe.gestion_productos.models.Order;
import com.espe.gestion_productos.models.OrderItem;
import com.espe.gestion_productos.models.ShippingAddress;
import com.espe.gestion_productos.repositories.OrderRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class OrderService {

    private final OrderRepository orderRepository;
    private final OrderProducer orderProducer;

    @Transactional
    public CreateOrderResponse createOrder(CreateOrderRequest request) {
        log.info("Creating new order for customerId: {}", request.getCustomerId());

        // Create Order entity
        Order order = Order.builder()
                .customerId(request.getCustomerId())
                .paymentReference(request.getPaymentReference())
                .shippingAddress(ShippingAddress.builder()
                        .street(request.getShippingAddress().getStreet())
                        .city(request.getShippingAddress().getCity())
                        .state(request.getShippingAddress().getState())
                        .zipCode(request.getShippingAddress().getZipCode())
                        .country(request.getShippingAddress().getCountry())
                        .build())
                .build();

        // Add items to order
        request.getItems().forEach(itemRequest -> {
            OrderItem item = OrderItem.builder()
                    .productId(itemRequest.getProductId())
                    .quantity(itemRequest.getQuantity())
                    .unitPrice(itemRequest.getUnitPrice())
                    .build();
            order.addItem(item);
        });

        // Save order to database
        Order savedOrder = orderRepository.save(order);
        log.info("Order created with orderId: {} in PENDING status", savedOrder.getOrderId());

        // Publish OrderCreated event to RabbitMQ
        orderProducer.publishOrderCreatedEvent(savedOrder);

        return CreateOrderResponse.builder()
                .orderId(savedOrder.getOrderId())
                .status(savedOrder.getStatus())
                .message("Order created successfully. Waiting for inventory validation.")
                .build();
    }

    @Transactional(readOnly = true)
    public OrderDetailsResponse getOrderDetails(String orderId) {
        log.info("Fetching order details for orderId: {}", orderId);

        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found: " + orderId));

        return OrderDetailsResponse.builder()
                .orderId(order.getOrderId())
                .customerId(order.getCustomerId())
                .status(order.getStatus())
                .reason(order.getReason())
                .paymentReference(order.getPaymentReference())
                .items(order.getItems().stream()
                        .map(item -> com.espe.gestion_productos.dto.OrderItemResponse.builder()
                                .productId(item.getProductId())
                                .quantity(item.getQuantity())
                                .unitPrice(item.getUnitPrice())
                                .build())
                        .collect(Collectors.toList()))
                .shippingAddress(com.espe.gestion_productos.dto.ShippingAddressRequest.builder()
                        .street(order.getShippingAddress().getStreet())
                        .city(order.getShippingAddress().getCity())
                        .state(order.getShippingAddress().getState())
                        .zipCode(order.getShippingAddress().getZipCode())
                        .country(order.getShippingAddress().getCountry())
                        .build())
                .build();
    }
}
