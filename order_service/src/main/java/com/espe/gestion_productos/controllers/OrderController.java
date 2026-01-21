package com.espe.gestion_productos.controllers;

import com.espe.gestion_productos.dto.CreateOrderRequest;
import com.espe.gestion_productos.dto.CreateOrderResponse;
import com.espe.gestion_productos.dto.OrderDetailsResponse;
import com.espe.gestion_productos.services.OrderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
@Slf4j
public class OrderController {

    private final OrderService orderService;

    @PostMapping
    public ResponseEntity<CreateOrderResponse> createOrder(@Valid @RequestBody CreateOrderRequest request) {
        log.info("Received order creation request for customerId: {}", request.getCustomerId());
        CreateOrderResponse response = orderService.createOrder(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/{orderId}")
    public ResponseEntity<OrderDetailsResponse> getOrderDetails(@PathVariable String orderId) {
        log.info("Received request to fetch order details for orderId: {}", orderId);
        OrderDetailsResponse response = orderService.getOrderDetails(orderId);
        return ResponseEntity.ok(response);
    }
}
