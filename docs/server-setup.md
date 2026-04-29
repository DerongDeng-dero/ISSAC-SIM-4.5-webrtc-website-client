# Isaac Sim 4.5 服务端接入

这个客户端仓库只包含网页端，不包含 Isaac Sim 4.5 服务端本体。

当前客户端的前提是：

- Isaac Sim 4.5 服务端继续使用 native WebRTC livestream
- 浏览器端继续使用 NVIDIA 官方 `@nvidia/omniverse-webrtc-streaming-library`

## 推荐的服务端模式

### 1. 只要视频流

启用 Isaac Sim 4.5 原生 WebRTC streaming 即可。

当前客户端仓库根目录已经附带了同名启动脚本，推荐直接用：

```bat
isaac-sim.streaming.lan.bat
```

这个模式会固定：

- signaling port: `49100`
- media port: `47998`

同时它还会做两件事：

- 启动前清理旧的 streaming 进程
- 自动探测局域网 IPv4，并传给 `publicEndpointAddress`

如果自动探测出的 IP 不对，可以在启动前手工覆盖：

```bat
set ISAAC_SIM_ROOT=D:\isaac-sim
set ISAACSIM_PUBLIC_IP=192.168.1.20
isaac-sim.streaming.lan.bat
```

如果这个客户端仓库没有放在 `Isaac Sim/tools/webrtc-web-client` 下，启动前先设置：

```bat
set ISAAC_SIM_ROOT=D:\isaac-sim
```

### 2. 需要网页和 Isaac Sim 之间的结构化消息

如果要使用这个客户端里的 `Custom Message` 面板，服务端还需要启用
`isaacsim.webrtc.bridge` 扩展。

当前工作目录里的启动方式是：

```bat
isaac-sim.webrtc.bridge.bat
```

这个入口对应的 Isaac Sim kit 配置会加载：

- `omni.kit.livestream.core`
- `omni.kit.livestream.webrtc`
- `omni.kit.streamsdk.plugins`
- `isaacsim.webrtc.bridge`

## 页面里该填什么

当前客户端默认值是：

- `Server IP`: 当前网页 hostname
- `Signaling Port`: `49100`
- `Media Port`: `47998`

典型局域网使用方式：

1. 在 Isaac Sim 主机上启动 native WebRTC 服务端
2. 记录控制台打印的局域网 IP
3. 在浏览器里打开这个客户端
4. `Server IP` 填 Isaac Sim 主机 IP
5. `Signaling Port` 填 `49100`
6. `Media Port` 填 `47998`
7. 点击 `Connect`

## 适用边界

- Isaac Sim 4.5 更适合局域网或同网段环境
- 浏览器页面能打开，不代表媒体路径一定可通
- signaling 成功但没有视频时，优先排查 UDP、Windows 防火墙、双网卡和错误的公网/虚拟网卡 IP

## 这套客户端不做什么

这个仓库没有重写 Isaac Sim 原生 signaling 协议，也不是“脱离 NVIDIA 官方浏览器 SDK 的纯手写 thin client”。

如果目标是完全不用 `@nvidia/omniverse-webrtc-streaming-library`，那是另一条实现路线，需要自己维护：

- WebSocket 握手路径
- SDP offer/answer
- ICE candidate 交换
- DataChannel 和输入转发
