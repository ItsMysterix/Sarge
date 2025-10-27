export type EventTopic = 'service.lifecycle' | 'resource.change' | 'snapshot.created' | 'telemetry.ingest';
export interface Event<T = unknown> {
    topic: EventTopic;
    timestamp: number;
    payload: T;
}
export type EventHandler<T = unknown> = (event: Event<T>) => void | Promise<void>;
export interface EventBus {
    publish<T = unknown>(topic: EventTopic, payload: T): void | Promise<void>;
    subscribe<T = unknown>(topic: EventTopic, handler: EventHandler<T>): () => void;
}
export interface ServiceLifecycleEventPayload {
    serviceId: string;
    from: string;
    to: string;
}
