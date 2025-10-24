# tRPC API Reference

This document is auto-generated from the source routers. Do not edit by hand.

## Router: deploy

| Procedure | Type | Input | Notes |
|---|---|---|---|
| create | mutation | opaque |  |
| getDeployments | query | opaque |  |
| subscribe | subscription | opaque | Emits event frames; payload varies by topic. |

## Router: logs

| Procedure | Type | Input | Notes |
|---|---|---|---|
| recent | query | opaque |  |
| stream | subscription | opaque | Emits event frames; payload varies by topic. |

## Router: metrics

| Procedure | Type | Input | Notes |
|---|---|---|---|
| latest | query | opaque |  |
| live | subscription | opaque | Emits event frames; payload varies by topic. |

## Router: services

| Procedure | Type | Input | Notes |
|---|---|---|---|
| all | query | opaque |  |
| uptime | query | <br/>```ts<br/>{<br/>id: z.string()<br/>}<br/>```<br/> |  |

