package com.espe.gestion_productos.messagin;

import com.espe.gestion_productos.enums.EventType;
import com.espe.gestion_productos.models.Order;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
@Slf4j
public class OrderProducer {

    private final RabbitTemplate rabbitTemplate;
    private final tools.jackson.databind.ObjectMapper objectMapper;

    public void publishOrderCreatedEvent(Order order) {
        try {
            List<OrderEvent.OrderItemEvent> items = order.getItems().stream()
                    .map(item -> OrderEvent.OrderItemEvent.builder()
                            .productId(item.getProductId())
                            .quantity(item.getQuantity())
                            .unitPrice(item.getUnitPrice())
                            .build())
                    .collect(Collectors.toList());

            String shippingAddressJson = objectMapper.writeValueAsString(order.getShippingAddress());

            OrderEvent event = OrderEvent.builder()
                    .orderId(order.getOrderId())
                    .customerId(order.getCustomerId())
                    .eventType(EventType.ORDER_CREATED)
                    .items(items)
                    .shippingAddressJson(shippingAddressJson)
                    .timestamp(System.currentTimeMillis())
                    .build();

            rabbitTemplate.convertAndSend(
                    "order.exchange",
                    "order.created",
                    event
            );

            log.info("Order created event published for orderId: {}", order.getOrderId());
        } catch (Exception e) {
            log.error("Error publishing order created event for orderId: {}", order.getOrderId(), e);
            throw new RuntimeException("Failed to publish order created event", e);
        }
    }
}
