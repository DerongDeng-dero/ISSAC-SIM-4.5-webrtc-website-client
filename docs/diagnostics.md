# 浏览器侧诊断说明

客户端会在页面加载时对浏览器的 `RTCPeerConnection` 做一层轻量封装，把关键事件写进页面右侧的 `Event Log`。

## 会记录的事件

- `pc:create`
- `pc:signaling`
- `pc:iceGathering`
- `pc:iceConnection`
- `pc:connection`
- `pc:localCandidate`
- `pc:addRemoteCandidate`
- `pc:iceCandidateError`
- `pc:track`
- `pc:dataChannel`
- `pc:stats`

其中最有用的是：

- `pc:localCandidate ...`: 浏览器本地收集到了哪些 candidate
- `pc:addRemoteCandidate ...`: Isaac Sim 服务端返回了哪些 candidate
- `pc:iceConnection ...`: ICE 状态推进到哪里
- `pc:stats ...`: 当前选中的 candidate pair 是什么

## 常见判断方式

### 页面能连上，但一直没有视频

先看这些日志：

- 有没有 `pc:setRemoteDescription type=offer`
- 有没有 `pc:addRemoteCandidate ...`
- `pc:iceConnection` 是否到过 `connected` / `completed`
- `pc:stats ...` 是否出现成功的 candidate pair

### 常见错误码

当前页面对几个常见 SDK 错误码做了额外解释：

- `0xC0F22206`: ICE candidate pair 建立失败，通常是防火墙、IP 错误或网络不通
- `0xC0F22207`: signaling 已连上，但远端 peer 长时间没有建立成功
- `0xC0F2220C`: 媒体路径起来了，但一直没收到视频包
- `0xC0F2220F`: 浏览器没有收集到可用的本地 candidate
- `0xC0F22210`: 服务端没有提供可用的远端 candidate
- `0xC0F22219`: signaling 成功，但浏览器没有收到有效 offer
- `0xC0F22226`: signaling 成功，但浏览器没有收到 STUN 响应
- `0xC0F22227`: 收集到了 candidate，但一直没有 nominated pair
- `0xC0F22228`: 收集到了 candidate，但没有任何 pair 进入 succeeded

## 实际排查顺序

1. 先确认 Isaac Sim 服务端是不是刚启动，旧进程有没有清理干净
2. 再确认 `Server IP` 是否真的是 Isaac Sim 主机对浏览器可达的那个局域网 IP
3. 确认 `Signaling Port` 和 `Media Port` 没填错
4. 看浏览器是否收到了 `offer`
5. 看 `pc:iceConnection` 是否卡在 `checking`
6. 如果卡在 `checking`，优先排查 UDP 和防火墙

## 诊断实现位置

相关代码在：

- `src/webrtcDiagnostics.ts`
- `src/App.tsx`

如果后续要加更多统计项，优先扩展 `logSelectedCandidatePair()`。
