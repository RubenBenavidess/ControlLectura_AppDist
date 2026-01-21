package com.espe.gestion_productos.config;

import org.springframework.amqp.core.*;
import org.springframework.amqp.rabbit.config.SimpleRabbitListenerContainerFactory;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitMQConfig {

    // Order Service Exchanges and Queues
    public static final String ORDER_EXCHANGE = "order.exchange";
    public static final String ORDER_QUEUE = "order.queue";
    public static final String ORDER_ROUTING_KEY = "order.created";

    // Inventory Response Exchanges and Queues
    public static final String INVENTORY_RESPONSE_EXCHANGE = "inventory.response.exchange";
    public static final String INVENTORY_RESPONSE_QUEUE = "order.inventory.response.queue";
    public static final String STOCK_RESERVED_ROUTING_KEY = "stock.reserved";
    public static final String STOCK_REJECTED_ROUTING_KEY = "stock.rejected";

    // Order Exchange (for publishing OrderCreated events)
    @Bean
    public TopicExchange orderExchange() {
        return new TopicExchange(ORDER_EXCHANGE, true, false);
    }

    @Bean
    public Queue orderQueue() {
        return QueueBuilder.durable(ORDER_QUEUE)
                .build();
    }

    @Bean
    public Binding orderBinding(Queue orderQueue, TopicExchange orderExchange) {
        return BindingBuilder.bind(orderQueue)
                .to(orderExchange)
                .with(ORDER_ROUTING_KEY);
    }

    // Inventory Response Exchange (for consuming StockReserved/StockRejected events)
    @Bean
    public TopicExchange inventoryResponseExchange() {
        return new TopicExchange(INVENTORY_RESPONSE_EXCHANGE, true, false);
    }

    @Bean
    public Queue inventoryResponseQueue() {
        return QueueBuilder.durable(INVENTORY_RESPONSE_QUEUE)
                .build();
    }

    @Bean
    public Binding stockReservedBinding(Queue inventoryResponseQueue, TopicExchange inventoryResponseExchange) {
        return BindingBuilder.bind(inventoryResponseQueue)
                .to(inventoryResponseExchange)
                .with(STOCK_RESERVED_ROUTING_KEY);
    }

    @Bean
    public Binding stockRejectedBinding(Queue inventoryResponseQueue, TopicExchange inventoryResponseExchange) {
        return BindingBuilder.bind(inventoryResponseQueue)
                .to(inventoryResponseExchange)
                .with(STOCK_REJECTED_ROUTING_KEY);
    }

    @Bean
    public Jackson2JsonMessageConverter messageConverter() {
        return new Jackson2JsonMessageConverter();
    }

    @Bean
    public RabbitTemplate rabbitTemplate(ConnectionFactory connectionFactory) {
        RabbitTemplate rabbitTemplate = new RabbitTemplate(connectionFactory);
        rabbitTemplate.setMessageConverter(messageConverter());
        return rabbitTemplate;
    }

    @Bean
    public SimpleRabbitListenerContainerFactory rabbitListenerContainerFactory(
            ConnectionFactory connectionFactory,
            Jackson2JsonMessageConverter messageConverter) {
        SimpleRabbitListenerContainerFactory factory = new SimpleRabbitListenerContainerFactory();
        factory.setConnectionFactory(connectionFactory);
        factory.setMessageConverter(messageConverter);
        return factory;
    }
}