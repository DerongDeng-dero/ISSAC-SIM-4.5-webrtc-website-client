# Isaac Sim 4.5 Native WebRTC LAN Integration Guide

本文档对应当前仓库的主接入路线：

- 服务端继续使用 Isaac Sim 4.5 原生 WebRTC streaming
- 浏览器端继续使用 NVIDIA 官方浏览器 SDK
- 页面 UI 改为自定义网页外壳
- 目标环境限定为局域网 / 同网段

如果目标是完全绕开 `@nvidia/omniverse-webrtc-streaming-library`，自行实现浏览器侧 signaling / SDP / ICE / data channel，这属于另一条“纯自研 thin client”路线，不在本文范围内。

相关补充文档：

- [Official Browser SDK Guide](./ISAAC_SIM_45_OFFICIAL_BROWSER_SDK_BEGINNER_GUIDE.md)
- [LAN Stability Fix Guide](./ISAAC_SIM_45_LAN_STABILITY_FIX.md)
- [Server Setup](./server-setup.md)

---

## 1. 方案边界

这套方案不是重写 Isaac Sim 的视频推流链路，而是在保留原生服务端的前提下，把客户端从桌面程序替换成网页。

可以安全修改的部分：

- 页面布局
- 表单和按钮
- 业务面板
- 日志展示
- 自定义消息交互

不建议在这个阶段替换的部分：

- Isaac Sim 原生 WebRTC 服务端
- NVIDIA 浏览器 SDK 内部协议适配层
- 浏览器端媒体协商细节

当前仓库的工程定位，就是“稳定保留原生视频路径，同时提供可嵌入的网页壳”。

---

## 2. 工程组成

### 2.1 Isaac Sim 服务端入口

服务端原生入口仍然在 Isaac Sim 安装目录：

- `isaac-sim.streaming.bat`
- `apps/isaacsim.exp.full.streaming.kit`

其中：

- `isaac-sim.streaming.bat` 是常用启动脚本
- `isaacsim.exp.full.streaming.kit` 是启用 `omni.kit.livestream.webrtc` 的体验配置

### 2.2 当前仓库的网页客户端

当前仓库的主要前端工程文件：

- [`package.json`](../package.json)
- [`src/App.tsx`](../src/App.tsx)
- [`src/defaultConfig.ts`](../src/defaultConfig.ts)
- [`src/webrtcDiagnostics.ts`](../src/webrtcDiagnostics.ts)

### 2.3 当前仓库附带的 Windows 启动脚本

根目录已附带一组常用脚本：

- [`isaac-sim.streaming.bat`](../isaac-sim.streaming.bat)
- [`isaac-sim.streaming.lan.bat`](../isaac-sim.streaming.lan.bat)
- [`isaac-sim.streaming.stop.bat`](../isaac-sim.streaming.stop.bat)
- [`isaac-sim.webrtc.bridge.bat`](../isaac-sim.webrtc.bridge.bat)
- [`isaac-sim.webrtc.web.bat`](../isaac-sim.webrtc.web.bat)

详细说明见 [Windows Scripts](./windows-scripts.md)。

---

## 3. 架构理解

推荐按下面的结构理解：

```text
Isaac Sim 4.5 host
  └─ native WebRTC streaming
     ├─ signaling: 49100
     └─ media: peer-to-peer / fixed host port mode

Web client
  └─ custom React page shell
     └─ NVIDIA browser SDK

LAN browser
  └─ opens the page and connects to Isaac Sim through the embedded SDK
```

关键点：

- `3000` 是网页服务端口，不是 Isaac Sim streaming 端口
- `49100` 是 Isaac Sim WebRTC signaling 端口
- 媒体路径和 signaling 是两层不同链路

---

## 4. 服务端启动

推荐使用当前仓库根目录里的局域网包装脚本：

```bat
set ISAAC_SIM_ROOT=D:\isaac-sim
isaac-sim.streaming.lan.bat
```

这个脚本会做几件事：

- 停止旧的 streaming 进程
- 自动探测局域网 IPv4
- 固定 signaling port 为 `49100`
- 固定 media/public endpoint port 为 `47998`
- 将探测到的 IPv4 传给 `publicEndpointAddress`

如果自动探测 IP 不符合当前网段预期，可以手动覆盖：

```bat
set ISAAC_SIM_ROOT=D:\isaac-sim
set ISAACSIM_PUBLIC_IP=192.168.1.20
isaac-sim.streaming.lan.bat
```

如果仓库本身就位于 `ISAAC_SIM_ROOT\tools\webrtc-web-client`，`ISAAC_SIM_ROOT` 也可以省略。

---

## 5. 网页端启动

开发模式：

```bat
install.bat
dev.bat
```

构建并预览：

```bat
build.bat
preview.bat
```

或者直接使用根目录封装：

```bat
isaac-sim.webrtc.web.bat
```

默认访问地址：

- `http://127.0.0.1:3000`
- `http://<host-ip>:3000`

---

## 6. 默认连接配置

默认值定义在 [`src/defaultConfig.ts`](../src/defaultConfig.ts)：

- `server`: 当前页面 hostname
- `signalingPort`: `49100`
- `mediaPort`: `47998`
- `width`: `1920`
- `height`: `1080`
- `fps`: `60`

这套默认值的设计目标是：

- 页面部署到哪台主机，就默认连哪台主机
- signaling 固定指向 Isaac Sim 默认 WebRTC 入口
- 媒体端口优先走已经收敛过的 LAN 配置

如果部署环境需要调整端口，可以：

1. 直接在页面里修改
2. 修改 [`src/defaultConfig.ts`](../src/defaultConfig.ts)

---

## 7. 首次连通验证

建议用下面的顺序做第一次验证：

1. 启动 Isaac Sim LAN streaming
2. 启动网页客户端
3. 在 Isaac Sim 主机本机浏览器访问 `http://127.0.0.1:3000`
4. 点击 `Connect`
5. 观察是否出现画面
6. 再从同网段另一台机器访问 `http://<host-ip>:3000`
7. 再次点击 `Connect`

期望结果：

- 页面能够打开
- `Connect` 后状态进入 `Connecting`
- 成功后状态进入 `Streaming`
- `Event Log` 中能看到 WebRTC 事件推进

---

## 8. 页面内诊断能力

当前客户端对浏览器 `RTCPeerConnection` 做了轻量级事件记录，日志会输出到页面的 `Event Log`。

重点事件包括：

- `pc:localCandidate`
- `pc:addRemoteCandidate`
- `pc:iceConnection`
- `pc:stats`

这套诊断主要用于区分几类问题：

- 页面打不开
- signaling 未建立
- 收不到 offer
- candidate 收集失败
- ICE 能协商但媒体不通

详细说明见 [Diagnostics](./diagnostics.md)。

---

## 9. 嵌入业务页面时至少需要保留什么

如果当前仓库只是原型壳，后续要嵌入更完整的业务页面，至少建议保留下面几类能力：

- 一个视频元素
- 一组连接参数
- 一个 `Connect` / `Disconnect` 控制入口
- 一块事件日志区域
- 一块自定义消息调试区域

当前实现里，对应的是：

- 视频/音频元素：[`src/App.tsx`](../src/App.tsx)
- 默认参数：[`src/defaultConfig.ts`](../src/defaultConfig.ts)
- 诊断逻辑：[`src/webrtcDiagnostics.ts`](../src/webrtcDiagnostics.ts)

业务 UI 可以重做，但这些基础能力不建议在调通之前删掉。

---

## 10. 常见误解

### 10.1 `49100` 不是网页访问端口

`49100` 是 signaling 端口，不是网页页面端口。

正确访问方式：

- 网页：`http://<host-ip>:3000`
- signaling：由页面内部 SDK 自动连接 `49100`

### 10.2 当前页面不是 NVIDIA 官方现成网页

当前仓库运行在 `3000` 的页面是自定义网页壳，内部使用 NVIDIA 官方浏览器 SDK。

### 10.3 当前路线不是纯自研浏览器协议栈

如果目标是完全去掉 NVIDIA 浏览器 SDK，需要自行维护：

- WebSocket 握手
- SDP offer/answer
- ICE candidate 交换
- data channel 和输入转发

这不是当前仓库的目标。

---

## 11. 推荐操作顺序

推荐把工作拆成三步：

1. 先用当前仓库跑通 LAN 画面
2. 再把页面壳改造成目标业务 UI
3. 最后再引入桥接消息、状态订阅和自定义交互

这条顺序的好处是，视频路径、页面路径和业务路径被拆开验证，排障成本明显更低。
