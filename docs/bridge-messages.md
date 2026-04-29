# `isaacsim.webrtc.bridge` 消息桥

这个客户端页面里的 `Custom Message` 面板，面向的是 Isaac Sim 侧的 `isaacsim.webrtc.bridge` 扩展。

它不是视频链路本身，而是建立在 Isaac Sim 4.5 native WebRTC 之上的结构化 JSON 消息通道。

## 服务端提供的事件

根据当前扩展实现，内置事件类型有：

- `isaacsim.webrtc.bridge.rpc`
- `isaacsim.webrtc.bridge.publish`
- `isaacsim.webrtc.bridge.session`
- `isaacsim.webrtc.bridge.status`
- `isaacsim.webrtc.bridge.heartbeat`

## 客户端请求格式

浏览器发给 Isaac Sim 的消息是完整 envelope，不是只填 payload。

示例：

```json
{
  "event_type": "isaacsim.webrtc.bridge.rpc",
  "payload": {
    "action": "get_status",
    "request_id": "req-1"
  }
}
```

页面默认填充的就是这个结构。

## 内置 RPC

当前扩展内置了三个 action：

- `ping`
- `echo`
- `get_status`

### `ping`

```json
{
  "event_type": "isaacsim.webrtc.bridge.rpc",
  "payload": {
    "action": "ping",
    "request_id": "req-ping-1"
  }
}
```

### `echo`

```json
{
  "event_type": "isaacsim.webrtc.bridge.rpc",
  "payload": {
    "action": "echo",
    "request_id": "req-echo-1",
    "payload": {
      "message": "hello"
    }
  }
}
```

### `get_status`

```json
{
  "event_type": "isaacsim.webrtc.bridge.rpc",
  "payload": {
    "action": "get_status",
    "request_id": "req-status-1"
  }
}
```

## 服务端返回格式

### 成功结果

```json
{
  "event_type": "isaacsim.webrtc.bridge.rpc.result",
  "payload": {
    "request_id": "req-status-1",
    "action": "get_status",
    "ok": true,
    "result": {}
  }
}
```

### 错误结果

```json
{
  "event_type": "isaacsim.webrtc.bridge.rpc.error",
  "payload": {
    "request_id": "req-status-1",
    "action": "get_status",
    "ok": false,
    "error": "..."
  }
}
```

## 自动推送事件

启用扩展后，服务端还会主动往浏览器发：

- `isaacsim.webrtc.bridge.session`
- `isaacsim.webrtc.bridge.status`
- `isaacsim.webrtc.bridge.heartbeat`

这些消息会通过客户端当前的 `onCustomEvent` 回调进入页面日志。

## `get_status` 里会带什么

当前扩展返回的状态快照会包含：

- `client_count`
- `client_connected`
- `app_ready`
- `rtx_ready`
- `app_name`
- `app_version`
- `kit_version`
- `livestream.port`
- `livestream.proto`
- `livestream.ipversion`
- `livestream.allow_resize`

以及一段关于 Isaac Sim 4.5 网络适用边界的说明。

## 扩展侧实现位置

当前工作目录里对应的 Isaac Sim 代码在：

- `extsUser/isaacsim.webrtc.bridge/isaacsim/webrtc/bridge/extension.py`
- `extsUser/isaacsim.webrtc.bridge/docs/README.md`
