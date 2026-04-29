# Isaac Sim 4.5 Official Browser SDK Beginner Guide

本文档专门说明“官方浏览器 SDK 路线”。

这条路线的定义是：

- Isaac Sim 4.5 服务端继续使用原生 WebRTC
- 浏览器端保留 NVIDIA 官方 SDK
- 页面 UI 完全由业务工程控制
- 不使用 NVIDIA 官方桌面客户端

如果当前目标是稳定接入、快速验证，这份文档最直接。

配套文档：

- [Native WebRTC LAN Guide](./ISAAC_SIM_45_NATIVE_WEBRTC_LAN_GUIDE.md)
- [LAN Stability Fix Guide](./ISAAC_SIM_45_LAN_STABILITY_FIX.md)

---

## 1. 先把一句话说清楚

当前运行在 `3000` 端口的页面：

- 不是 NVIDIA 官方现成网页
- 是当前仓库的自定义网页壳
- 但内部调用了 NVIDIA 官方浏览器 SDK

准确的工程表述应该是：

- 页面层由本仓库实现
- Isaac Sim 浏览器端连接适配层由 `@nvidia/omniverse-webrtc-streaming-library` 提供

---

## 2. 架构图

```text
Isaac Sim host
  └─ native WebRTC streaming
     ├─ signaling: 49100
     └─ media path

Custom web page
  └─ React / TypeScript UI
     └─ NVIDIA official browser SDK

Remote LAN browser
  └─ opens the page and watches the stream
```

这里最容易混淆的是两个“客户端”：

- NVIDIA 官方桌面 Client
- 集成了 NVIDIA 浏览器 SDK 的网页客户端

两者都可以接入 Isaac Sim 原生 WebRTC，但不是同一个程序。

---

## 3. 官方桌面 Client 和官方浏览器 SDK 的区别

### 3.1 官方桌面 Client

特点：

- 是独立桌面程序
- 页面和 UI 不是业务工程的一部分
- 部署控制粒度较低

### 3.2 官方浏览器 SDK

特点：

- 是浏览器侧连接能力，不是完整页面
- 可以嵌入任意网页外壳
- 更适合业务系统、运维页、设备页、监控页

当前仓库使用的是第二种方案。

---

## 4. 当前仓库里到底用了什么

主要依赖：

- `react`
- `vite`
- `typescript`
- `@nvidia/omniverse-webrtc-streaming-library`

关键入口：

- [`src/App.tsx`](../src/App.tsx)
- [`src/defaultConfig.ts`](../src/defaultConfig.ts)
- [`src/webrtcDiagnostics.ts`](../src/webrtcDiagnostics.ts)

当前页面做的事情很简单：

1. 提供一层可改造的网页外壳
2. 收集连接参数
3. 调用 NVIDIA SDK 建立连接
4. 把视频挂到页面的 `<video>` 元素
5. 把诊断事件写入日志区域

---

## 5. 维护者视角的启动方式

### 5.1 启动 Isaac Sim streaming

推荐：

```bat
set ISAAC_SIM_ROOT=D:\isaac-sim
isaac-sim.streaming.lan.bat
```

### 5.2 启动网页客户端

开发模式：

```bat
install.bat
dev.bat
```

构建预览：

```bat
build.bat
preview.bat
```

或者：

```bat
isaac-sim.webrtc.web.bat
```

---

## 6. 使用者视角的访问方式

对浏览器使用者而言，操作可以压缩成下面几步：

1. 打开维护者提供的页面地址
2. 确认 `Server IP`、`Signaling Port`、`Media Port`
3. 点击 `Connect`
4. 等待视频进入 `Streaming`

如果页面部署在 Isaac Sim 主机本机，默认配置通常已经足够。

如果页面部署在另一台主机，需要确保：

- `Server IP` 指向 Isaac Sim 主机
- `Signaling Port` 指向 `49100`
- `Media Port` 与服务端固定端口策略一致

---

## 7. 为什么这条路线适合作为第一阶段方案

第一阶段更关心的是“稳定出画面”，而不是“完全自研浏览器端协议”。

这条路线的价值在于：

- 最大限度保留官方链路
- 最小化浏览器端协议实现风险
- 最快得到可以嵌入业务页面的结果

对于多数接入任务，这是更合理的工程起点。

---

## 8. 页面层可以改到什么程度

当前仓库只保留了一个最小控制面板，但页面层其实可以大幅改造：

- 改成业务系统页面
- 改成设备控制台
- 改成监控面板
- 改成多标签页工具

通常不建议删掉的部分：

- 视频元素
- 连接参数区
- 连接状态区
- 事件日志区

这些区域在排障阶段非常有价值。

---

## 9. 常见问题

### 9.1 `3000` 上跑的到底是什么

是当前仓库的网页页面，不是 NVIDIA 官方现成页面。

### 9.2 为什么页面是自定义的，但又说用了官方 SDK

因为“页面壳”和“浏览器连接适配层”是两个层次。

页面壳可以完全自定义，底层连接能力仍然可以继续使用官方 SDK。

### 9.3 其他电脑是否需要安装 Isaac Sim 或官方桌面 Client

不需要。

只要浏览器能访问页面，并且网络能到达 Isaac Sim 主机，就可以使用。

### 9.4 后续能否再替换 SDK

可以，但那会进入另一条实现路线，复杂度和维护成本都会显著上升。

---

## 10. 推荐理解方式

推荐把当前方案理解成两层：

1. 下层是 Isaac Sim 原生 streaming + NVIDIA 浏览器 SDK
2. 上层是业务工程控制的网页 UI

只要这两层边界清楚，后续做 UI 重构、参数面板重构、消息桥接扩展，都会更容易。
