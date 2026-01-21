package com.espe.gestion_productos.messagin;

import com.espe.gestion_productos.enums.EventType;
import com.espe.gestion_productos.enums.OrderStatus;
import com.espe.gestion_productos.models.Order;
import com.espe.gestion_productos.repositories.OrderRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class OrderConsumer {

    private final OrderRepository orderRepository;

    @RabbitListener(queues = "order.inventory.response.queue")
    public void handleInventoryResponse(OrderEvent event) {
        log.info("Received inventory response event for orderId: {}, eventType: {}", event.getOrderId(), event.getEventType());

        Order order = orderRepository.findById(event.getOrderId())
                .orElseThrow(() -> new RuntimeException("Order not found: " + event.getOrderId()));

        if (event.getEventType() == EventType.STOCK_RESERVED) {
            order.setStatus(OrderStatus.CONFIRMED);
            log.info("Order confirmed - Stock reserved for orderId: {}", event.getOrderId());
        } else if (event.getEventType() == EventType.STOCK_REJECTED) {
            order.setStatus(OrderStatus.CANCELLED);
            order.setReason("Stock not available for requested items");
            log.info("Order cancelled - Stock rejected for orderId: {}", event.getOrderId());
        }

        orderRepository.save(order);
    }
}
