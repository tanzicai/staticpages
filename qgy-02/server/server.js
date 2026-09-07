"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server/server.ts
var import_http = require("http");
var import_express4 = __toESM(require("express"));

// server/routes/index.ts
var import_express2 = require("express");

// server/routes/task-routes.ts
var import_express = require("express");

// server/task-flow/store.ts
var TaskStore = class {
  constructor() {
    this.tasks = /* @__PURE__ */ new Map();
  }
  /**
   * 创建任务
   */
  create(task) {
    this.tasks.set(task.id, task);
    return task;
  }
  /**
   * 根据ID获取任务
   */
  get(taskId) {
    return this.tasks.get(taskId);
  }
  /**
   * 获取所有任务
   */
  getAll() {
    return Array.from(this.tasks.values());
  }
  /**
   * 更新任务状态
   */
  updateStatus(taskId, status) {
    const task = this.tasks.get(taskId);
    if (task) {
      task.status = status;
      task.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
      if (status === "running" && !task.startedAt) {
        task.startedAt = (/* @__PURE__ */ new Date()).toISOString();
      }
      if (status === "completed" || status === "failed") {
        task.completedAt = (/* @__PURE__ */ new Date()).toISOString();
      }
      this.tasks.set(taskId, task);
    }
    return task;
  }
  /**
   * 更新任务输出
   */
  updateOutput(taskId, output) {
    const task = this.tasks.get(taskId);
    if (task) {
      task.output = output;
      task.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
      this.tasks.set(taskId, task);
    }
    return task;
  }
  /**
   * 更新任务错误
   */
  updateError(taskId, error) {
    const task = this.tasks.get(taskId);
    if (task) {
      task.error = error;
      task.status = "failed";
      task.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
      task.completedAt = (/* @__PURE__ */ new Date()).toISOString();
      this.tasks.set(taskId, task);
    }
    return task;
  }
  /**
   * 更新步骤状态
   */
  updateStepStatus(taskId, stepId, status, message, result) {
    const task = this.tasks.get(taskId);
    if (task) {
      const step = task.steps.find((s) => s.id === stepId);
      if (step) {
        step.status = status;
        if (message) step.message = message;
        if (result !== void 0) step.result = result;
        task.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
        this.tasks.set(taskId, task);
      }
    }
    return task;
  }
  /**
   * 更新步骤进度
   */
  updateStepProgress(taskId, stepId, progress, message) {
    const task = this.tasks.get(taskId);
    if (task) {
      const step = task.steps.find((s) => s.id === stepId);
      if (step) {
        step.progress = Math.min(100, Math.max(0, progress));
        if (message) step.message = message;
        task.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
        this.tasks.set(taskId, task);
      }
    }
    return task;
  }
  /**
   * 添加流式文本
   */
  addStreamText(taskId, text) {
    const task = this.tasks.get(taskId);
    if (task) {
      if (!task.streamText) {
        task.streamText = [];
      }
      task.streamText.push(text);
      task.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
      this.tasks.set(taskId, task);
    }
    return task;
  }
  /**
   * 更新任务整体进度
   */
  updateProgress(taskId, progress) {
    const task = this.tasks.get(taskId);
    if (task) {
      task.progress = Math.min(100, Math.max(0, progress));
      task.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
      this.tasks.set(taskId, task);
    }
    return task;
  }
  /**
   * 删除任务
   */
  delete(taskId) {
    return this.tasks.delete(taskId);
  }
  /**
   * 清理过期任务（保留最近100条）
   */
  cleanup() {
    if (this.tasks.size > 100) {
      const tasks = Array.from(this.tasks.values()).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(100);
      tasks.forEach((t) => this.tasks.delete(t.id));
    }
  }
};
var taskStore = new TaskStore();

// server/task-flow/emitter.ts
var import_events = require("events");
var TaskEventEmitter = class extends import_events.EventEmitter {
  constructor(taskId) {
    super();
    this.subscribers = /* @__PURE__ */ new Set();
    this.taskId = taskId;
  }
  /**
   * 添加订阅者
   */
  addSubscriber(response) {
    this.subscribers.add(response);
  }
  /**
   * 移除订阅者
   */
  removeSubscriber(response) {
    this.subscribers.delete(response);
  }
  /**
   * 获取订阅者数量
   */
  get subscriberCount() {
    return this.subscribers.size;
  }
  /**
   * 发送事件给所有订阅者
   */
  broadcast(event) {
    const data = `data: ${JSON.stringify(event)}

`;
    const deadSubscribers = [];
    this.subscribers.forEach((response) => {
      try {
        response.write(data);
      } catch (error) {
        deadSubscribers.push(response);
      }
    });
    deadSubscribers.forEach((sub) => this.subscribers.delete(sub));
  }
  /**
   * 发送任务创建事件
   */
  emitTaskCreated() {
    const event = {
      type: "task_created",
      taskId: this.taskId,
      data: { taskId: this.taskId },
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    };
    this.broadcast(event);
  }
  /**
   * 发送步骤更新事件
   */
  emitStepUpdate(stepId, stepName, status, progress, message, result) {
    const data = {
      stepId,
      stepName,
      status,
      progress,
      message,
      result
    };
    const event = {
      type: "step_update",
      taskId: this.taskId,
      stepId,
      data,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    };
    this.broadcast(event);
  }
  /**
   * 发送进度更新事件
   */
  emitProgress(progress, message, stepId) {
    const data = { progress, message, stepId };
    const event = {
      type: "progress",
      taskId: this.taskId,
      stepId,
      data,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    };
    this.broadcast(event);
  }
  /**
   * 发送流式文本事件
   */
  emitStreamText(text, stepId) {
    const data = { text, stepId };
    const event = {
      type: "stream_text",
      taskId: this.taskId,
      stepId,
      data,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    };
    this.broadcast(event);
  }
  /**
   * 发送结果事件
   */
  emitResult(success, output) {
    const data = { success, output };
    const event = {
      type: "result",
      taskId: this.taskId,
      data,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    };
    this.broadcast(event);
  }
  /**
   * 发送错误事件
   */
  emitError(code, message, stepId) {
    const data = { code, message, stepId };
    const event = {
      type: "error",
      taskId: this.taskId,
      stepId,
      data,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    };
    this.broadcast(event);
  }
  /**
   * 关闭所有连接
   */
  close() {
    this.subscribers.forEach((response) => {
      try {
        response.end();
      } catch (error) {
      }
    });
    this.subscribers.clear();
    this.removeAllListeners();
  }
};
var EventEmitterManager = class {
  constructor() {
    this.emitters = /* @__PURE__ */ new Map();
  }
  /**
   * 获取或创建事件发射器
   */
  getOrCreate(taskId) {
    let emitter = this.emitters.get(taskId);
    if (!emitter) {
      emitter = new TaskEventEmitter(taskId);
      this.emitters.set(taskId, emitter);
    }
    return emitter;
  }
  /**
   * 获取事件发射器
   */
  get(taskId) {
    return this.emitters.get(taskId);
  }
  /**
   * 移除事件发射器
   */
  remove(taskId) {
    const emitter = this.emitters.get(taskId);
    if (emitter) {
      emitter.close();
      this.emitters.delete(taskId);
    }
  }
  /**
   * 检查是否有活动的发射器
   */
  hasActive(taskId) {
    const emitter = this.emitters.get(taskId);
    return emitter ? emitter.subscriberCount > 0 : false;
  }
};
var eventEmitterManager = new EventEmitterManager();

// server/task-flow/context.ts
var StepContext = class {
  constructor(taskId, stepId, taskType, previousResults, emitter, store) {
    this.taskId = taskId;
    this.stepId = stepId;
    this.taskType = taskType;
    this.previousResults = previousResults;
    this.emitter = emitter;
    this.store = store;
    this.result = void 0;
  }
  /**
   * 获取前一步骤的结果
   */
  getPreviousResult(stepId) {
    if (stepId) {
      return this.previousResults.get(stepId);
    }
    const values = Array.from(this.previousResults.values());
    return values.length > 0 ? values[values.length - 1] : void 0;
  }
  /**
   * 获取所有历史结果
   */
  getAllPreviousResults() {
    return new Map(this.previousResults);
  }
  /**
   * 记录结果（供后续步骤使用）
   */
  setResult(result) {
    this.result = result;
    this.previousResults.set(this.stepId, result);
  }
  /**
   * 获取当前结果
   */
  getResult() {
    return this.result;
  }
  /**
   * 发送进度更新
   */
  progress(progress, message) {
    this.emitter.emitProgress(progress, message, this.stepId);
    this.store.updateProgress(this.taskId, progress);
  }
  /**
   * 发送流式文本
   */
  streamText(text) {
    this.emitter.emitStreamText(text, this.stepId);
    this.store.addStreamText(this.taskId, text);
  }
  /**
   * 发送流式文本（带打字机效果延迟）
   */
  async streamTextWithDelay(text, delayMs = 0) {
    this.emitter.emitStreamText(text, this.stepId);
    this.store.addStreamText(this.taskId, text);
  }
  /**
   * 等待指定时间
   */
  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
  /**
   * 获取任务类型
   */
  getTaskType() {
    return this.taskType;
  }
};

// server/task-flow/orchestrator.ts
var import_uuid = require("uuid");
var workflows = {
  design: {
    type: "design",
    name: "\u6A21\u5177\u8BBE\u8BA1\u6A21\u5F0F",
    description: "\u57FA\u4E8E\u4EA7\u54C13D\u6A21\u578B\u751F\u6210\u6A21\u5177\u8BBE\u8BA1\u65B9\u6848",
    steps: [
      { id: "parse_model", name: "\u89E3\u67903D\u6A21\u578B", type: "design_parse_model" },
      { id: "extract_features", name: "\u63D0\u53D6\u4EA7\u54C1\u7279\u5F81", type: "extract_features" },
      { id: "query_knowledge", name: "\u68C0\u7D22\u77E5\u8BC6\u5E93", type: "query_knowledge" },
      { id: "analyze_requirements", name: "\u5206\u6790\u9700\u6C42", type: "analyze_requirements" },
      { id: "generate_options", name: "\u751F\u6210\u8BBE\u8BA1\u65B9\u6848", type: "generate_options" },
      { id: "optimize", name: "\u4F18\u5316\u65B9\u6848", type: "optimize" }
    ]
  },
  machining: {
    type: "machining",
    name: "\u52A0\u5DE5\u5DE5\u827A\u6A21\u5F0F",
    description: "\u57FA\u4E8E\u96F6\u4EF6\u6A21\u578B\u751F\u6210\u52A0\u5DE5\u5DE5\u827A",
    steps: [
      { id: "parse_model", name: "\u89E3\u6790\u96F6\u4EF6\u6A21\u578B", type: "parse_model" },
      { id: "identify_features", name: "\u8BC6\u522B\u52A0\u5DE5\u7279\u5F81", type: "identify_features" },
      { id: "query_machining_kb", name: "\u68C0\u7D22\u52A0\u5DE5\u77E5\u8BC6\u5E93", type: "query_machining_kb" },
      { id: "generate_process", name: "\u751F\u6210\u52A0\u5DE5\u5DE5\u5E8F", type: "generate_process" },
      { id: "optimize_params", name: "\u4F18\u5316\u52A0\u5DE5\u53C2\u6570", type: "optimize_params" }
    ]
  },
  injection: {
    type: "injection",
    name: "\u6CE8\u5851\u5DE5\u827A\u6A21\u5F0F",
    description: "\u57FA\u4E8E\u6750\u6599\u548C\u6A21\u5177\u4FE1\u606F\u751F\u6210\u6CE8\u5851\u53C2\u6570",
    steps: [
      { id: "analyze_material", name: "\u5206\u6790\u6750\u6599\u7279\u6027", type: "analyze_material" },
      { id: "query_injection_kb", name: "\u68C0\u7D22\u6CE8\u5851\u77E5\u8BC6\u5E93", type: "query_injection_kb" },
      { id: "calculate_params", name: "\u8BA1\u7B97\u5DE5\u827A\u53C2\u6570", type: "calculate_params" },
      { id: "optimize_process", name: "\u4F18\u5316\u6210\u578B\u5468\u671F", type: "optimize_process" }
    ]
  }
};
var TaskOrchestrator = class {
  constructor() {
    this.handlers = /* @__PURE__ */ new Map();
    this.runningTasks = /* @__PURE__ */ new Set();
  }
  /**
   * 注册步骤处理器
   */
  registerHandler(stepType, handler) {
    this.handlers.set(stepType, handler);
  }
  /**
   * 获取所有已注册的处理器
   */
  getRegisteredHandlers() {
    return Array.from(this.handlers.keys());
  }
  /**
   * 创建任务
   */
  createTask(type, input) {
    const workflow = workflows[type];
    if (!workflow) {
      throw new Error(`\u672A\u77E5\u4EFB\u52A1\u7C7B\u578B: ${type}`);
    }
    const taskId = (0, import_uuid.v4)();
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const task = {
      id: taskId,
      type,
      status: "pending",
      input,
      steps: workflow.steps.map((stepDef) => ({
        ...stepDef,
        status: "pending",
        progress: 0
      })),
      createdAt: now,
      updatedAt: now
    };
    taskStore.create(task);
    return task;
  }
  /**
   * 执行任务
   */
  async executeTask(taskId) {
    const task = taskStore.get(taskId);
    if (!task) {
      throw new Error(`\u4EFB\u52A1\u4E0D\u5B58\u5728: ${taskId}`);
    }
    if (this.runningTasks.has(taskId)) {
      throw new Error(`\u4EFB\u52A1\u6B63\u5728\u6267\u884C\u4E2D: ${taskId}`);
    }
    this.runningTasks.add(taskId);
    try {
      taskStore.updateStatus(taskId, "running");
      const emitter = eventEmitterManager.getOrCreate(taskId);
      const previousResults = /* @__PURE__ */ new Map();
      const startTime = Date.now();
      for (const step of task.steps) {
        if (!this.runningTasks.has(taskId)) {
          taskStore.updateStatus(taskId, "cancelled");
          return;
        }
        const stepResult = await this.executeStep(task, step, emitter, previousResults);
        previousResults.set(step.id, stepResult);
      }
      const output = this.aggregateResults(task, previousResults, Date.now() - startTime);
      taskStore.updateOutput(taskId, output);
      taskStore.updateStatus(taskId, "completed");
      emitter.emitResult(true, output);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "\u672A\u77E5\u9519\u8BEF";
      taskStore.updateError(taskId, errorMessage);
      const emitter = eventEmitterManager.get(taskId);
      if (emitter) {
        emitter.emitError("EXECUTION_ERROR", errorMessage);
      }
    } finally {
      this.runningTasks.delete(taskId);
      setTimeout(() => {
        if (!eventEmitterManager.hasActive(taskId)) {
          eventEmitterManager.remove(taskId);
        }
      }, 6e4);
    }
  }
  /**
   * 取消任务
   */
  cancelTask(taskId) {
    if (this.runningTasks.has(taskId)) {
      this.runningTasks.delete(taskId);
      taskStore.updateStatus(taskId, "cancelled");
      return true;
    }
    return false;
  }
  /**
   * 执行单个步骤
   */
  async executeStep(task, step, emitter, previousResults) {
    emitter.emitStepUpdate(step.id, step.name, "running", 0, "\u5F00\u59CB\u6267\u884C...");
    taskStore.updateStepStatus(task.id, step.id, "running");
    try {
      const handler = this.handlers.get(step.type);
      if (!handler) {
        throw new Error(`\u672A\u627E\u5230\u6B65\u9AA4\u5904\u7406\u5668: ${step.type}`);
      }
      const context = new StepContext(
        task.id,
        step.id,
        task.type,
        previousResults,
        emitter,
        taskStore
      );
      emitter.emitStepUpdate(step.id, step.name, "running", 10, "\u6B63\u5728\u5904\u7406...");
      taskStore.updateStepProgress(task.id, step.id, 10);
      const result = await handler(step.input || task.input, context);
      emitter.emitStepUpdate(step.id, step.name, "completed", 100, "\u5B8C\u6210", result);
      taskStore.updateStepStatus(task.id, step.id, "completed", "\u5B8C\u6210", result);
      taskStore.updateStepProgress(task.id, step.id, 100);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "\u6B65\u9AA4\u6267\u884C\u5931\u8D25";
      emitter.emitStepUpdate(step.id, step.name, "failed", 0, errorMessage);
      taskStore.updateStepStatus(task.id, step.id, "failed", errorMessage);
      throw error;
    }
  }
  /**
   * 汇总结果 - 模具设计模式返回固定数据
   */
  aggregateResults(task, results, processingTime) {
    if (task.type === "design") {
      return {
        success: true,
        recommendations: [],
        confidence: 0.95,
        summary: "\u53F6\u8F6E\u6A21\u5177\u667A\u80FD\u8BBE\u8BA1\u65B9\u6848\u5DF2\u5B8C\u6210",
        details: Object.fromEntries(results),
        taskInput: "\u53F6\u8F6E\u6A21\u5177\uFF0C\u5E74\u4EA7\u91CF10\u4E07\u4EF6\u3002\u8981\u6C42\uFF1A\u51CF\u91CD10%\u4EE5\u4E0A\uFF0C\u8010\u8150\u8680\u5BFF\u547D8\u5E74\u4EE5\u4E0A\uFF0C\u8868\u9762\u7C97\u7CD9\u5EA6Ra0.04\xB5m\u4EE5\u4E0B\u3002",
        modelAnalysis: `\u4ECE\u6A21\u578B\u622A\u56FE\u53EF\u89C1\uFF0C\u8BE5\u53F6\u8F6E\u4E3A\u5F00\u5F0F\u7ED3\u6784\uFF0C\u5E26\u67093\u7EC4\u53F6\u7247\uFF0C\u53F6\u7247\u4E0E\u8F6E\u6BC2\u4E3A\u4E00\u4F53\u6210\u578B\u7ED3\u6784\uFF0C\u8F6E\u6BC2\u4FA7\u58C1\u6709\u4E00\u5B9A\u539A\u5EA6\uFF0C\u53F6\u7247\u5448\u5F84\u5411\u5206\u5E03\u3002\u6F5C\u5728\u95EE\u9898\uFF1A1. \u8F6E\u6BC2\u58C1\u539A\u8F83\u5747\u5300\u4F46\u65E0\u660E\u663E\u51CF\u91CD\u7ED3\u6784\uFF0C\u96BE\u4EE5\u6EE1\u8DB3\u51CF\u91CD10%\u7684\u9700\u6C42\uFF1B2. \u53F6\u7247\u4E0E\u8F6E\u6BC2\u8FDE\u63A5\u5904\u5B58\u5728\u5E94\u529B\u96C6\u4E2D\u533A\u57DF\uFF0C\u6210\u578B\u540E\u6613\u51FA\u73B0\u7F29\u75D5\uFF1B3. \u53F6\u7247\u4FA7\u9762\u65E0\u660E\u663E\u8131\u6A21\u659C\u5EA6\uFF0C\u8131\u6A21\u65F6\u6613\u51FA\u73B0\u7C98\u6A21\u6216\u522E\u4F24\uFF0C\u5F71\u54CD\u8868\u9762\u7C97\u7CD9\u5EA6\uFF1B4. \u6574\u4F53\u7ED3\u6784\u7684\u58C1\u539A\u4E00\u81F4\u6027\u5F85\u4F18\u5316\uFF0C\u53EF\u80FD\u5BFC\u81F4\u6CE8\u5851\u6210\u578B\u65F6\u51B7\u5374\u4E0D\u5747\uFF0C\u4EA7\u751F\u53D8\u5F62\u3002`,
        userDecision: "\u6D47\u53E3\u7C7B\u578B: \u70B9\u6D47\u53E3, \u63A8\u51FA\u65B9\u5F0F: \u6241\u9876\u9488\u9876\u51FA, \u51B7\u5374\u6C34\u8DEF: \u968F\u5F62\u51B7\u5374",
        aiRecommendation: `1. \u7ED3\u6784\u4F18\u5316\uFF1A\u5728\u8F6E\u6BC2\u5185\u90E8\u6DFB\u52A0\u7F51\u683C\u72B6\u6216\u653E\u5C04\u72B6\u52A0\u5F3A\u7B4B\u66FF\u4EE3\u5B9E\u5FC3\u7ED3\u6784\uFF0C\u540C\u65F6\u5728\u53F6\u7247\u975E\u5DE5\u4F5C\u9762\u8BBE\u7F6E0.5\xB0-1\xB0\u7684\u8131\u6A21\u659C\u5EA6\uFF0C\u53F6\u7247\u6839\u90E8\u91C7\u7528R0.5-R1mm\u7684\u5706\u89D2\u8FC7\u6E21\uFF0C\u65E2\u5B9E\u73B0\u51CF\u91CD12%-15%\uFF0C\u53C8\u964D\u4F4E\u5E94\u529B\u96C6\u4E2D\uFF1B2. \u6750\u6599\u9009\u62E9\uFF1A\u9009\u7528ABS\uFF0BPTFE\u7EB3\u7C73\u7C89\u4F53\uFF0B\u73AF\u6C27\u77F3\u58A8\u70EF\uFF0B\u73BB\u7483\u7EA4\u7EF4\uFF0C\u5176\u8010\u8150\u8680\u6027\u80FD\u4F18\u5F02\uFF0C\u5728\u9178\u78B1\u73AF\u5883\u4E0B\u53EF\u6EE1\u8DB38\u5E74\u4EE5\u4E0A\u4F7F\u7528\u5BFF\u547D\uFF0C\u540C\u65F6\u9AD8\u5F3A\u5EA6\u73BB\u7EA4\u589E\u5F3A\u53EF\u62B5\u6D88\u51CF\u91CD\u5E26\u6765\u7684\u5F3A\u5EA6\u635F\u5931\uFF1B3. \u5DE5\u827A\u53C2\u6570\uFF1A\u6CE8\u5851\u6E29\u5EA6\u8BBE\u7F6E\u4E3A220-260\u2103\uFF0C\u4FDD\u538B\u538B\u529B\u4E3A\u6CE8\u5C04\u538B\u529B\u768460%-70%\uFF0C\u51B7\u5374\u65F6\u95F4\u63A7\u5236\u572815-20s\uFF0C\u786E\u4FDD\u6210\u578B\u8D28\u91CF\u4E0E\u8868\u9762\u7CBE\u5EA6\u3002`,
        designSteps: [
          {
            title: "\u4EA7\u54C1\u7ED3\u6784\u4F18\u5316\u4E0E\u6A21\u6D41\u5206\u6790",
            description: "\u5728\u8F6E\u6BC2\u5185\u90E8\u8BBE\u8BA1\u7F51\u683C\u51CF\u91CD\u7ED3\u6784\uFF0C\u53F6\u7247\u6DFB\u52A0\u8131\u6A21\u659C\u5EA6\u4E0E\u6839\u90E8\u5706\u89D2\uFF0C\u5BFC\u5165\u6A21\u6D41\u5206\u6790\u8F6F\u4EF6\u6A21\u62DF\u586B\u5145\u3001\u51B7\u5374\u8FC7\u7A0B\uFF0C\u9A8C\u8BC1\u51CF\u91CD\u540E\u7684\u6210\u578B\u53EF\u884C\u6027\uFF0C\u91CD\u70B9\u6392\u67E5\u7F29\u75D5\u3001\u53D8\u5F62\u98CE\u9669",
            keyPoints: ""
          },
          {
            title: "\u667A\u80FD\u6D47\u53E3\u7CFB\u7EDF\u8BBE\u8BA1",
            description: "\u91C7\u7528\u9488\u70B9\u5F0F\u6D47\u53E3\uFF0C\u5C06\u6D47\u53E3\u8BBE\u7F6E\u5728\u8F6E\u6BC2\u4E2D\u5FC3\u4F4D\u7F6E\uFF0C\u901A\u8FC7AI\u7B97\u6CD5\u4F18\u5316\u6D47\u53E3\u5C3A\u5BF8\u4E0E\u4F4D\u7F6E\uFF0C\u5B9E\u73B0\u7194\u4F53\u5747\u5300\u586B\u5145\uFF0C\u907F\u514D\u53F6\u7247\u51FA\u73B0\u7194\u63A5\u75D5\uFF0C\u4FDD\u969C\u8868\u9762\u7C97\u7CD9\u5EA6",
            keyPoints: ""
          },
          {
            title: "\u667A\u80FD\u63A8\u51FA\u7CFB\u7EDF\u8BBE\u8BA1",
            description: "\u91C7\u7528\u63A8\u6746\u63A8\u51FA\u673A\u6784\uFF0C\u63A8\u6746\u5206\u5E03\u5728\u8F6E\u6BC2\u5E95\u90E8\u975E\u5DE5\u4F5C\u9762\uFF0C\u8D34\u5408\u53F6\u7247\u6839\u90E8\uFF0C\u901A\u8FC7AI\u6A21\u62DF\u8131\u6A21\u529B\u5206\u5E03\uFF0C\u8BBE\u7F6E\u63A8\u51FA\u987A\u5E8F\u4E0E\u901F\u5EA6\uFF0C\u907F\u514D\u8131\u6A21\u522E\u4F24\u53F6\u7247\u8868\u9762",
            keyPoints: ""
          },
          {
            title: "\u667A\u80FD\u51B7\u5374\u6C34\u8DEF\u5E03\u5C40",
            description: "\u91C7\u7528\u968F\u5F62\u6C34\u8DEF\u8BBE\u8BA1\uFF0C\u56F4\u7ED5\u53F6\u7247\u4E0E\u8F6E\u6BC2\u5E03\u7F6E\u73AF\u5F62\uFF0C\u901A\u8FC7AI\u6E29\u63A7\u7CFB\u7EDF\u5B9E\u65F6\u8C03\u8282\u6C34\u8DEF\u6E29\u5EA6\uFF0C\u4FDD\u8BC1\u6A21\u5177\u5404\u533A\u57DF\u51B7\u5374\u5747\u5300\uFF0C\u51CF\u5C11\u6210\u578B\u53D8\u5F62\uFF0C\u540C\u65F6\u8BBE\u7F6E\u6C34\u8DEF\u629B\u5149\u5904\u7406\uFF0C\u964D\u4F4E\u6C34\u57A2\u5F71\u54CD",
            keyPoints: ""
          },
          {
            title: "\u6A21\u5177\u578B\u8154\u4E0E\u578B\u82AF\u7CBE\u52A0\u5DE5",
            description: "\u578B\u8154\u4E0E\u578B\u82AF\u91C7\u7528S136\u955C\u9762\u6A21\u5177\u94A2\uFF0C\u901A\u8FC7CNC\u3001EDM\u3001\u6162\u8D70\u4E1D\u7CBE\u52A0\u5DE5\u540E\u8FDB\u884C\u955C\u9762\u629B\u5149\uFF0C\u786E\u4FDD\u8868\u9762\u7C97\u7CD9\u5EA6\u8FBE\u5230Ra0.04\xB5m\u4EE5\u4E0B\uFF0C\u6241\u9876\u9488\u91C7\u7528\u6162\u8D70\u4E1D\u52A0\u5DE5\u4FDD\u8BC1\u5C3A\u5BF8\u7CBE\u5EA6",
            keyPoints: ""
          },
          {
            title: "\u8BD5\u6A21\u4E0E\u53C2\u6570\u4F18\u5316",
            description: "\u8FDB\u884C\u5C0F\u6279\u91CF\u8BD5\u6A21\uFF0C\u91C7\u96C6\u6210\u578B\u6570\u636E\uFF0C\u901A\u8FC7AI\u7CFB\u7EDF\u5206\u6790\u6CE8\u5851\u538B\u529B\u3001\u6E29\u5EA6\u3001\u51B7\u5374\u65F6\u95F4\u5BF9\u4EA7\u54C1\u8D28\u91CF\u7684\u5F71\u54CD\uFF0C\u4F18\u5316\u5DE5\u827A\u53C2\u6570\uFF0C\u9A8C\u8BC1\u51CF\u91CD\u6548\u679C\u3001\u8010\u8150\u8680\u6027\u80FD\u4E0E\u8868\u9762\u7CBE\u5EA6\u662F\u5426\u8FBE\u6807",
            keyPoints: ""
          },
          {
            title: "\u6A21\u5177\u540E\u671F\u7EF4\u62A4\u65B9\u6848\u5236\u5B9A",
            description: "\u9488\u5BF9\u73BB\u7EA4\u589E\u5F3A\u6750\u6599\u7684\u78E8\u635F\u7279\u6027\uFF0C\u5236\u5B9A\u5B9A\u671F\u629B\u5149\u578B\u8154\u3001\u6E05\u6D41\u9053\u629B\u5149\uFF0C\u4FDD\u969C\u6A21\u5177\u572810\u4E07\u4EF6\u751F\u4EA7\u5468\u671F\u5185\u7684\u7A33\u5B9A\u6027\uFF0C\u540C\u65F6\u9884\u7559\u6613\u635F\u4EF6\u66FF\u6362\u65B9\u6848",
            keyPoints: ""
          }
        ],
        moldStructureImageUrl: "https://p.cldisk.com/star4/a98df87f4816aec2b390091c2d3b2cd5/origin.jpg?rw=720&rh=1114&_fileSize=2411304&_orientation=1",
        moldStructureImageUrl2: "https://p.cldisk.com/star4/8ae17657312eba0355fd97d64d7d7e07/origin.jpg?rw=900&rh=1098&_fileSize=2970551&_orientation=1",
        conclusion: "\u672C\u65B9\u6848\u901A\u8FC7\u7ED3\u6784\u4F18\u5316\u3001\u6750\u6599\u9009\u578B\u4E0E\u667A\u80FD\u6A21\u5177\u7CFB\u7EDF\u8BBE\u8BA1\uFF0C\u53EF\u6EE1\u8DB3\u53F6\u8F6E\u51CF\u91CD10%\u4EE5\u4E0A\u30018\u5E74\u8010\u8150\u8680\u5BFF\u547D\u3001Ra0.04\xB5m\u4EE5\u4E0B\u8868\u9762\u7C97\u7CD9\u5EA6\u7684\u8981\u6C42\uFF0C\u540C\u65F6\u9002\u914D10\u4E07\u4EF6\u7684\u5E74\u4EA7\u91CF\u9700\u6C42\u3002\u65B9\u6848\u53EF\u884C\u6027\u5F3A\uFF0C\u70B9\u6D47\u53E3\u6241\u9876\u9488\u63A8\u51FA\u3001\u968F\u5F62\u51B7\u5374\u7CFB\u7EDF\u53EF\u6709\u6548\u4FDD\u969C\u6210\u578B\u8D28\u91CF\uFF0C\u5EFA\u8BAE\u6309\u7167\u8BBE\u8BA1\u6B65\u9AA4\u63A8\u8FDB\u6A21\u5177\u5F00\u53D1\uFF0C\u8BD5\u6A21\u9636\u6BB5\u91CD\u70B9\u9A8C\u8BC1\u51CF\u91CD\u540E\u7684\u7ED3\u6784\u5F3A\u5EA6\u4E0E\u8868\u9762\u7CBE\u5EA6\u3002",
        generatedTime: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
        metadata: {
          processingTime,
          dataSource: this.getDataSources(task.type)
        }
      };
    }
    if (task.type === "machining") {
      const machiningProcess = [
        { step: "1. \u4E0B\u6599", equipment: "\u952F\u5E8A", tool: "", speed: "\u2014", feed: "\u2014", allowance: "3" },
        { step: "2. \u9884\u70ED\u5904\u7406", equipment: "H13\u578B\u771F\u7A7A\u6DEC\u706B\u7089", tool: "\u6DEC\u706B\u5939\u5177", speed: "\u2014", feed: "\u2014", allowance: "\u2014" },
        { step: "3. \u516D\u9762\u7C97\u94E3", equipment: "\u4E09\u8F74\u52A0\u5DE5\u4E2D\u5FC3", tool: "\u786C\u8D28\u5408\u91D1\u7ACB\u94E3\u5200", speed: "5000", feed: "2000", allowance: "0.2" },
        { step: "4. \u87BA\u65CB\u66F2\u9762\u7C97\u52A0\u5DE5", equipment: "\u4E09\u8F74\u52A0\u5DE5\u4E2D\u5FC3", tool: "\u7403\u5934\u94E3\u5200", speed: "6000", feed: "2000", allowance: "0.2" },
        { step: "5. \u6241\u9876\u9488\u5B54\u7C97\u52A0\u5DE5", equipment: "\u7535\u706B\u82B1\u7A7F\u5B54\u673A", tool: "\u9EC4\u94DC\u7535\u6781", speed: "\u2014", feed: "\u2014", allowance: "\u2014" },
        { step: "6. \u5185\u5C16\u89D2\u7C97\u52A0\u5DE5", equipment: "\u4E09\u8F74\u52A0\u5DE5\u4E2D\u5FC3", tool: "\u5C0F\u5F84\u7ACB\u94E3\u5200", speed: "12000", feed: "1500", allowance: "0.1" },
        { step: "7. \u534A\u7CBE\u52A0\u5DE5", equipment: "\u4E09\u8F74\u52A0\u5DE5\u4E2D\u5FC3", tool: "CBN\u7403\u5934\u94E3\u5200", speed: "10000", feed: "1200", allowance: "0.08" },
        { step: "8. \u53BB\u5E94\u529B\u56DE\u706B", equipment: "\u4F4E\u6E29\u56DE\u706B\u7089", tool: "\u4E13\u7528\u5DE5\u88C5", speed: "\u2014", feed: "\u2014", allowance: "\u2014" },
        { step: "9. \u87BA\u65CB\u66F2\u9762\u7CBE\u52A0\u5DE5", equipment: "\u9AD8\u901F\u52A0\u5DE5\u4E2D\u5FC3", tool: "CBN\u7403\u5934\u94E3\u5200", speed: "10000", feed: "1200", allowance: "0" },
        { step: "10. \u7535\u706B\u82B1\u6210\u578B\u52A0\u5DE5", equipment: "\u7535\u706B\u82B1\u673A\u5E8A", tool: "\u7D2B\u94DC\u7535\u6781", speed: "\u2014", feed: "\u2014", allowance: "0" },
        { step: "11. \u6241\u9876\u9488\u5B54\u7CBE\u52A0\u5DE5", equipment: "\u6162\u8D70\u4E1D", tool: "\u94DC\u7535\u6781\u4E1D", speed: "\u2014", feed: "\u2014", allowance: "0" },
        { step: "12. \u8D28\u91CF\u68C0\u6D4B", equipment: "\u4E09\u5750\u6807\u3001\u7C97\u7CD9\u5EA6\u4EEA", tool: "", speed: "\u2014", feed: "\u2014", allowance: "\u2014" },
        { step: "13. \u87BA\u65CB\u66F2\u9762\u629B\u5149", equipment: "\u624B\u52A8\u629B\u5149\u5DE5\u5177", tool: "\u629B\u5149\u78E8\u5934", speed: "\u2014", feed: "\u2014", allowance: "\u2014" },
        { step: "14. \u8D28\u91CF\u68C0\u6D4B", equipment: "\u4E09\u5750\u6807\u3001\u7C97\u7CD9\u5EA6\u4EEA", tool: "", speed: "\u2014", feed: "\u2014", allowance: "\u2014" }
      ];
      return {
        success: true,
        recommendations: [],
        confidence: 0.95,
        summary: "\u53F6\u8F6E\u52A0\u5DE5\u5DE5\u827A\u65B9\u6848\u5DF2\u5B8C\u6210",
        details: Object.fromEntries(results),
        partName: "\u53F6\u8F6E",
        features: "\u87BA\u65CB\u66F2\u9762\u3001\u6241\u9876\u9488\u5B54\u3001\u5185\u5C16\u89D2",
        processTable: machiningProcess,
        conclusion: "\u672C\u65B9\u6848\u517114\u9053\u5DE5\u5E8F\uFF0C\u6DB5\u76D6\u7C97\u52A0\u5DE5\u3001\u534A\u7CBE\u52A0\u5DE5\u3001\u7CBE\u52A0\u5DE5\u53CA\u8868\u9762\u5904\u7406\u3002\u91C7\u7528\u9AD8\u901F\u52A0\u5DE5\u4E2D\u5FC3\u7ED3\u5408\u7535\u706B\u82B1\u3001\u6162\u8D70\u4E1D\u7B49\u7279\u79CD\u52A0\u5DE5\u65B9\u5F0F\uFF0C\u53EF\u6709\u6548\u4FDD\u8BC1\u53F6\u8F6E\u87BA\u65CB\u66F2\u9762\u3001\u6241\u9876\u9488\u5B54\u53CA\u5185\u5C16\u89D2\u7684\u52A0\u5DE5\u7CBE\u5EA6\u548C\u8868\u9762\u8D28\u91CF\u3002\u5EFA\u8BAE\u4E25\u683C\u6309\u7167\u5DE5\u5E8F\u987A\u5E8F\u52A0\u5DE5\uFF0C\u7279\u522B\u6CE8\u610F\u53BB\u5E94\u529B\u56DE\u706B\u5DE5\u5E8F\uFF0C\u4EE5\u6D88\u9664\u52A0\u5DE5\u6B8B\u4F59\u5E94\u529B\uFF0C\u4FDD\u8BC1\u4EA7\u54C1\u5C3A\u5BF8\u7A33\u5B9A\u6027\u3002",
        generatedTime: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
        metadata: {
          processingTime,
          dataSource: this.getDataSources(task.type)
        }
      };
    }
    if (task.type === "injection") {
      return {
        success: true,
        recommendations: [],
        confidence: 0.95,
        summary: "\u6CE8\u5851\u5DE5\u827A\u53C2\u6570\u65B9\u6848\u5DF2\u5B8C\u6210",
        details: Object.fromEntries(results),
        materialAnalysis: {
          name: "ABS\uFF0BPTFE\u7EB3\u7C73\u7C89\u4F53\uFF0B\u73AF\u6C27\u77F3\u58A8\u70EF\uFF0B\u73BB\u7483\u7EA4\u7EF4",
          characteristics: [
            "PTFE\u7EB3\u7C73\u7C89\u4F53(1.5phr\uFF09\uFF1A\u7247\u5C42\u7ED3\u6784\u5EF6\u957F\u8150\u8680\u4ECB\u8D28\u6E17\u900F\u8DEF\u5F84\uFF08\u63D0\u5347\u8010\u8680\u6027 \uFF09\uFF0C\u73AF\u6C27\u57FA\u56E2\u589E\u5F3A\u4E0E ABS\u3001\u73BB\u7483\u7EA4\u7EF4\u7684\u754C\u9762\u7ED3\u5408\u529B\u3002",
            "\u73AF\u6C27\u77F3\u58A8\u70EF\uFF1A\u81EA\u8EAB\u8D85\u758F\u6C34\u6027\u51CF\u5C11\u51B7\u5374\u6DB2\u9644\u7740\u586B\u5145\u77F3\u58A8\u70EF\u7247\u5C42\u95F4\u9699\uFF0C\u964D\u4F4E\u6E17\u900F\u901A\u9053\u98CE\u9669\u3002",
            "\u73BB\u7483\u7EA4\u7EF4\uFF1A\u63D0\u63D0\u5347\u6750\u6599\u62C9\u4F38\u5F3A\u5EA6\uFF08\u4ECE 45MPa \u589E\u81F3 65MPa\uFF09\u548C\u6A21\u91CF\uFF0C\u6EE1\u8DB3\u53F6\u7247\u627F\u8F7D\u9700\u6C42\uFF0C\u7EA4\u7EF4\u9AA8\u67B6\u6291\u5236\u57FA\u4F53\u56E0\u8150\u8680\u5BFC\u81F4\u7684\u5FAE\u89C2\u88C2\u7EB9\u6269\u5C55\u3002"
          ],
          specialNotes: "\u9700\u63A7\u5236\u526A\u5207\u901F\u7387\u907F\u514DPTFE\u5206\u89E3\uFF0C\u2FBC\u5149\u8981\u6C42\u9700\u5E73\u8861\u7194\u4F53\u6D41\u52A8\u6027\u4E0E\u6A21\u5177\u6E29\u5EA6\uFF0C\u4F4E\u6536\u7F29\u7279\u6027\u6709\u52A9\u4E8E\u51CF\u5C11\u7F29\u75D5\u2EDB\u9669"
        },
        temperature: {
          barrel: {
            range: "220\u2103-260\u2103",
            zones: [
              { zone: "1\u533A(\u8FDB\u6599)", temp: "225\u2103" },
              { zone: "2\u533A", temp: "235\u2103" },
              { zone: "3\u533A", temp: "240\u2103" },
              { zone: "\u8BA1\u91CF\u533A", temp: "240\u2103" }
            ]
          },
          nozzle: { range: "220\u2103-235\u2103", recommended: "220\u2103" },
          mold: {
            range: "60\u2103-70\u2103",
            fixed: "65\u2103",
            moving: "60\u2103"
          }
        },
        pressure: {
          injection: {
            range: "80MPa-120MPa",
            recommended: "100MPa",
            stages: [
              { phase: "0-90%\u586B\u5145", pressure: "120MPa", note: "\u5FEB\u901F\u586B\u5145\u578B\u8154\uFF0C\u4FDD\u8BC1\u2FBC\u5149\u2FAF\u6210\u578B" },
              { phase: "90%-98%\u586B\u5145", pressure: "90MPa", note: "\u964D\u4F4E\u538B\u2F12\u907F\u514D\u2EDC\u8FB9\uFF0C\u540C\u65F6\u4FDD\u8BC1\u578B\u8154\u5B8C\u5168\u586B\u5145" },
              { phase: "98%-100%\u586B\u5145", pressure: "70MPa", note: "\u4FDD\u538B\u5207\u6362\u524D\u7684\u7F13\u51B2\uFF0C\u51CF\u5C11\u526A\u5207\u5E94\u2F12" }
            ]
          },
          holding: { range: "40MPa-60MPa", recommended: "50MPa" },
          back: { range: "3MPa-8MPa", recommended: "5MPa" }
        },
        speed: {
          injection: { range: "80mm/s-120mm/s", recommended: "100mm/s" },
          screw: { range: "150rpm-250rpm", recommended: "200rpm" },
          suckBack: { distance: "2mm-3mm", note: "\u6162\u901F" }
        },
        time: {
          injection: { range: "0.8s-1.5s" },
          holding: { range: "2.0s-2.5s", recommended: "2.2s" },
          cooling: { range: "10s-20s", recommended: "15s" },
          cycle: {
            total: "25s",
            moldClosing: "1s",
            injectionHolding: "4s",
            cooling: "15s",
            moldOpenEject: "2s",
            total_cycle: "22s",
            target: "28\u79D2",
            status: "\u603B\u5468\u671F22s\uFF0C\u6EE1\u2F9C\u5C0F\u4E8E28\u79D2\u2F6C\u6807\u5468\u671F\u8981\u6C42"
          }
        },
        otherParameters: {
          holdPressureSwitch: "\u4F4D\u7F6E\u5207\u6362\uFF0C\u4F4D\u7F6E: 98%\u586B\u5145",
          cushion: "2mm-4mm"
        },
        defectPrevention: {
          flash_prevention: [
            "\u4E25\u683C\u63A7\u5236\u6CE8\u5C04\u538B\u2F12\u548C\u4FDD\u538B\u538B\u2F12\uFF0C\u907F\u514D\u8D85\u8FC7\u6A21\u5177\u9501\u6A21\u2F12",
            "\u4FDD\u8BC1\u6A21\u5177\u5206\u578B\u2FAF\u548C\u9576\u4EF6\u914D\u5408\u7CBE\u5EA6\uFF0C\u5B9A\u671F\u6E05\u7406\u5206\u578B\u2FAF\u6742\u7269",
            "\u91C7\u2F64\u5206\u6BB5\u6CE8\u5C04\u548C\u5206\u6BB5\u4FDD\u538B\u7B56\u7565\uFF0C\u5728\u586B\u5145\u540E\u671F\u964D\u4F4E\u538B\u2F12"
          ],
          sink_mark_prevention: [
            "\u91C7\u2F64\u5206\u6BB5\u4FDD\u538B\u7B56\u7565\uFF0C\u5EF6\u2ED3\u4FDD\u538B\u65F6\u95F4\u2F842.5s",
            "\u4FDD\u8BC1\u5408\u9002\u7684\u57AB\u6599\u8303\u56F42mm-4mm\uFF0C\u786E\u4FDD\u4FDD\u538B\u6709\u6548\u4F20\u9012",
            "\u63D0\u2FBC\u6A21\u5177\u6E29\u5EA6\u2F8460\u2103-70\u2103\uFF0C\u51CF\u5C11\u7194\u4F53\u51B7\u5374\u901F\u5EA6\u5DEE\u5F02"
          ],
          high_gloss_strategy: [
            "\u4FDD\u6301\u6A21\u5177\u8868\u2FAF\u5149\u6D01\u5EA6Ra\u22640.04\xB5m\uFF0C\u5B9A\u671F\u629B\u5149",
            "\u63A7\u5236\u6A21\u5177\u6E29\u5EA6\u572860\u2103-70\u2103\uFF0C\u907F\u514D\u7194\u4F53\u51B7\u5374\u8FC7\u5FEB",
            "\u91C7\u2F64\u2FBC\u901F\u6CE8\u5C04\u586B\u5145\uFF0C\u51CF\u5C11\u7194\u4F53\u5728\u578B\u8154\u4E2D\u7684\u505C\u7559\u65F6\u95F4"
          ]
        },
        setupChecklist: [
          "\u68C0\u67E5\u6A21\u5177\u5206\u578B\u2FAF\u548C\u9576\u4EF6\u914D\u5408\u7CBE\u5EA6\uFF0C\u786E\u4FDD\u2F46\u95F4\u9699",
          "\u6E05\u7406\u55B7\u5634\u548C\u6D47\u2F1D\u5904\u7684\u51B7\u6599\uFF0C\u4FDD\u8BC1\u7194\u4F53\u6D41\u52A8\u987A\u7545",
          "\u786E\u8BA4\u6A21\u5177\u51B7\u5374\u2F54\u8DEF\u7545\u901A\uFF0C\u6A21\u6E29\u5747\u5300\u7A33\u5B9A",
          "\u68C0\u67E5\u87BA\u6746\u2F4C\u9006\u9600\u529F\u80FD\uFF0C\u9632\u2F4C\u7194\u53CD\u6D41",
          "\u9A8C\u8BC1\u9501\u6A21\u2F12\u2F9C\u591F\uFF0C\u907F\u514D\u6CE8\u5C04\u65F6\u6A21\u5177\u6DA8\u5F00"
        ],
        troubleshooting: {
          flash_appears: "\u964D\u4F4E\u6CE8\u5C04\u538B\u2F12\u548C\u4FDD\u538B\u538B\u2F12\uFF0C\u68C0\u67E5\u6A21\u5177\u5206\u578B\u2FAF\u662F\u5426\u6709\u6742\u7269\u6216\u78E8\u635F\uFF0C\u786E\u8BA4\u9501\u6A21\u2F12\u662F\u5426\u2F9C\u591F",
          sink_mark_appears: "\u589E\u52A0\u4FDD\u538B\u65F6\u95F4\u2F842.5s\uFF0C\u63D0\u2FBC\u4FDD\u538B\u538B\u2F12\u2F8460MPa\uFF0C\u68C0\u67E5\u57AB\u6599\u662F\u5426\u2F9C\u591F\uFF0C\u786E\u4FDD\u6A21\u5177\u6E29\u5EA6\u5747\u5300",
          gloss_uneven: "\u8C03\u6574\u6A21\u5177\u6E29\u5EA6\u2F8465\u2103\uFF0C\u63D0\u2FBC\u6CE8\u5C04\u901F\u5EA6\u2F84120mm/s\uFF0C\u68C0\u67E5\u6A21\u5177\u8868\u2FAF\u662F\u5426\u6709\u5212\u75D5\u6216\u6C61\u6E0D\uFF0C\u6E05\u7406\u6D47\u2F1D\u5904\u51B7\u6599",
          cycle_too_long: "\u7F29\u77ED\u51B7\u5374\u65F6\u95F4\u2F840.5s\uFF0C\u63D0\u2FBC\u6CE8\u5C04\u901F\u5EA6\u2F84120mm/s\uFF0C\u4F18\u5316\u5F00\u6A21\u9876\u51FA\u52A8\u4F5C\uFF0C\u51CF\u5C11\u8F85\u52A9\u65F6\u95F4"
        },
        qualityIndicators: {
          surface_gloss: "\u226590GU\uFF0860\xB0\u2EC6\uFF09",
          dimensional_stability: "\xB10.1%",
          sink_mark_depth: "<0.05mm",
          flash_thickness: "<0.02mm"
        },
        recommendationSource: {
          data_points: 128,
          similar_cases: 36,
          confidence_score: 0.95,
          ai_model: "InjectionProcessOptimizer V2.1"
        },
        generatedTime: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
        metadata: {
          processingTime,
          dataSource: this.getDataSources(task.type)
        }
      };
    }
    const allResults = Array.from(results.values());
    const recommendations = [];
    allResults.forEach((result) => {
      if (result && result.recommendations) {
        recommendations.push(...result.recommendations);
      }
      if (result && result.options) {
        recommendations.push(...result.options);
      }
      if (result && result.parameters) {
        recommendations.push(...Object.entries(result.parameters).map(([key, value]) => ({
          category: key,
          value,
          reason: "\u57FA\u4E8E\u77E5\u8BC6\u5E93\u63A8\u8350"
        })));
      }
    });
    let finalData = null;
    allResults.forEach((result) => {
      if (result && result.result) {
        finalData = result.result;
      }
    });
    if (!finalData) {
      finalData = {
        taskInput: task.input?.description || "\u4EFB\u52A1\u63CF\u8FF0",
        modelAnalysis: "\u5DF2\u5B8C\u6210\u6A21\u578B\u5206\u6790",
        userDecision: "\u4F7F\u7528\u9ED8\u8BA4\u65B9\u6848",
        aiRecommendation: "\u63A8\u8350\u65B9\u6848\u5DF2\u751F\u6210",
        designSteps: recommendations.map((r, i) => ({
          title: r.category || `\u6B65\u9AA4${i + 1}`,
          description: r.description || r.value || "",
          keyPoints: r.reason || ""
        })),
        conclusion: "\u65B9\u6848\u5DF2\u5B8C\u6210\u5206\u6790",
        generatedTime: (/* @__PURE__ */ new Date()).toISOString().split("T")[0]
      };
    }
    return {
      success: true,
      recommendations,
      confidence: 0.85 + Math.random() * 0.1,
      summary: this.generateSummary(task.type, recommendations),
      details: Object.fromEntries(results),
      // 将最终数据展开到顶层，方便前端直接使用
      taskInput: finalData.taskInput || finalData.task_input,
      modelAnalysis: finalData.modelAnalysis || finalData.model_analysis,
      userDecision: finalData.userDecision || finalData.user_decision,
      aiRecommendation: finalData.aiRecommendation || finalData.ai_recommendation,
      designSteps: finalData.designSteps || finalData.design_steps || [],
      conclusion: finalData.conclusion,
      generatedTime: finalData.generatedTime || finalData.generated_time,
      moldStructureImageUrl: finalData.moldStructureImageUrl || finalData.mold_structure_image_url,
      metadata: {
        processingTime,
        dataSource: this.getDataSources(task.type)
      }
    };
  }
  /**
   * 生成摘要
   */
  generateSummary(type, recommendations) {
    const summaries = {
      design: (recs) => {
        const gate = recs.find((r) => r.category === "gate" || r.category === "\u6D47\u53E3\u7C7B\u578B");
        const ejection = recs.find((r) => r.category === "ejection" || r.category === "\u63A8\u51FA\u65B9\u5F0F");
        const cooling = recs.find((r) => r.category === "cooling" || r.category === "\u51B7\u5374\u7CFB\u7EDF");
        return `\u63A8\u8350\u4F7F\u7528${gate?.value || "\u70B9\u6D47\u53E3"}\u3001${ejection?.value || "\u6241\u9876\u9488"}\u63A8\u51FA\u3001${cooling?.value || "\u968F\u5F62\u6C34\u8DEF"}\u51B7\u5374\u7684\u6A21\u5177\u7ED3\u6784\u3002`;
      },
      machining: (recs) => {
        const processCount = recs.filter((r) => r.category === "\u5DE5\u5E8F").length;
        return `\u63A8\u8350${processCount || 6}\u9053\u52A0\u5DE5\u5DE5\u5E8F\uFF0C\u5305\u62EC\u7C97\u52A0\u5DE5\u3001\u7CBE\u52A0\u5DE5\u548C\u7279\u6B8A\u5904\u7406\u5DE5\u827A\u3002`;
      },
      injection: (recs) => {
        const temp = recs.find((r) => r.category === "\u6E29\u5EA6" || r.category === "temperature");
        const pressure = recs.find((r) => r.category === "\u538B\u529B" || r.category === "pressure");
        return `\u63A8\u8350\u6599\u7B52\u6E29\u5EA6${temp?.value || "220-240\u2103"}\u3001\u6CE8\u5C04\u538B\u529B${pressure?.value || "70-90MPa"}\u7684\u6CE8\u5851\u53C2\u6570\u3002`;
      }
    };
    return summaries[type]?.(recommendations) || "\u5DF2\u5B8C\u6210\u5206\u6790\uFF0C\u63A8\u8350\u65B9\u6848\u5DF2\u751F\u6210\u3002";
  }
  /**
   * 获取数据源
   */
  getDataSources(type) {
    const sources = {
      design: ["3\u4E07+\u8BBE\u8BA1\u53C2\u6570", "1\u4E07+\u8BD5\u6A21\u6570\u636E", "5000+\u52A0\u5DE5\u6848\u4F8B"],
      machining: ["3\u4E07+\u52A0\u5DE5\u53C2\u6570", "5000+\u5200\u5177\u5E93", "\u56FD\u5BB6\u6807\u51C6\u5200\u5177\u53C2\u6570"],
      injection: ["1\u4E07+\u8BD5\u6A21\u6570\u636E", "\u6750\u6599\u6570\u636E\u5E93", "\u8BBE\u5907\u5DE5\u827A\u5E93"]
    };
    return sources[type] || [];
  }
  /**
   * 获取工作流定义
   */
  getWorkflow(type) {
    return workflows[type];
  }
  /**
   * 检查任务是否正在运行
   */
  isTaskRunning(taskId) {
    return this.runningTasks.has(taskId);
  }
};
var orchestrator = new TaskOrchestrator();

// server/handlers/design-handlers.ts
var parseModelHandler = async (input, context) => {
  const { fileName } = input;
  await context.progress(100, "\u6A21\u578B\u89E3\u6790\u5B8C\u6210");
  await context.streamTextWithDelay(`\u2713 3D\u6A21\u578B\u89E3\u6790\u5B8C\u6210: ${fileName || "\u672A\u6307\u5B9A"}

`, 100);
  return {
    fileName,
    modelLoaded: true,
    format: fileName?.endsWith(".stp") || fileName?.endsWith(".step") ? "STEP" : "STL"
  };
};
var extractFeaturesHandler = async (input, context) => {
  const { fileName, fileBuffer } = input;
  const productType = fileName?.toLowerCase().includes("impeller") || fileName?.toLowerCase().includes("\u53F6\u8F6E") ? "\u53F6\u8F6E" : "\u7CBE\u5BC6\u96F6\u4EF6";
  const bladeCount = productType === "\u53F6\u8F6E" ? "6\u7247" : "\u672A\u77E5";
  const wallThickness = productType === "\u53F6\u8F6E" ? "\u53F6\u7247\u539A\u5EA62-3mm" : "\u58C1\u539A1-2mm";
  const matingSurfaces = productType === "\u53F6\u8F6E" ? "\u5185\u5B54\u4E0E\u7AEF\u9762" : "\u57FA\u51C6\u9762\u4E0E\u5B9A\u4F4D\u5B54";
  await context.progress(100, "\u7279\u5F81\u63D0\u53D6\u5B8C\u6210");
  await context.streamTextWithDelay(`\u2713 \u4EA7\u54C1\u7279\u5F81\u63D0\u53D6\u5B8C\u6210
`, 100);
  await context.streamTextWithDelay(`  \u4EA7\u54C1\u7C7B\u578B: ${productType}
`, 50);
  await context.streamTextWithDelay(`  \u53F6\u7247\u6570\u91CF: ${bladeCount}
`, 50);
  await context.streamTextWithDelay(`  \u8584\u58C1\u533A\u57DF: ${wallThickness}
`, 50);
  await context.streamTextWithDelay(`  \u914D\u5408\u9762: ${matingSurfaces}

`, 50);
  return {
    productType,
    bladeCount,
    wallThickness,
    matingSurfaces,
    volume: productType === "\u53F6\u8F6E" ? 125.6 : 85.2,
    boundingBox: { x: 80, y: 80, z: 35 },
    features: [
      { name: "\u53F6\u7247\u66F2\u9762", count: 6, complexity: "high" },
      { name: "\u5185\u5B54", count: 1, complexity: "medium" },
      { name: "\u7AEF\u9762", count: 2, complexity: "low" }
    ]
  };
};
var queryKnowledgeHandler = async (input, context) => {
  const { productType } = input;
  const designRecords = productType === "\u53F6\u8F6E" ? 127 : 89;
  const moldRecords = productType === "\u53F6\u8F6E" ? 89 : 67;
  const machiningRecords = productType === "\u53F6\u8F6E" ? 45 : 38;
  const similarCases = productType === "\u53F6\u8F6E" ? [
    { name: "\u53F6\u8F6E\u6A21\u5177_\u6C7D\u8F66\u6C34\u6CF5", similarity: 92 },
    { name: "\u53F6\u8F6E\u6A21\u5177_\u533B\u7597\u5668\u68B0", similarity: 85 },
    { name: "\u53F6\u8F6E\u6A21\u5177_\u822A\u7A7A\u53F6\u8F6E", similarity: 78 }
  ] : [
    { name: "\u7CBE\u5BC6\u96F6\u4EF6\u6A21\u5177_\u7535\u5B50\u5916\u58F3", similarity: 88 },
    { name: "\u7CBE\u5BC6\u96F6\u4EF6\u6A21\u5177_\u533B\u7597\u8BBE\u5907", similarity: 82 }
  ];
  await context.progress(100, "\u77E5\u8BC6\u5E93\u68C0\u7D22\u5B8C\u6210");
  await context.streamTextWithDelay(`\u2713 \u77E5\u8BC6\u5E93\u68C0\u7D22\u5B8C\u6210
`, 100);
  await context.streamTextWithDelay(`  \u8BBE\u8BA1\u53C2\u6570\u5E93: ${designRecords} \u6761\u8BB0\u5F55
`, 50);
  await context.streamTextWithDelay(`  \u8BD5\u6A21\u6570\u636E\u5E93: ${moldRecords} \u6761\u8BB0\u5F55
`, 50);
  await context.streamTextWithDelay(`  \u52A0\u5DE5\u6848\u4F8B\u5E93: ${machiningRecords} \u6761\u8BB0\u5F55
`, 50);
  await context.streamTextWithDelay(`  \u76F8\u4F3C\u6848\u4F8B:
`, 50);
  for (const c of similarCases) {
    await context.streamTextWithDelay(`    - ${c.name} (\u76F8\u4F3C\u5EA6${c.similarity}%)
`, 30);
  }
  await context.streamTextWithDelay(`
`, 30);
  return {
    designRecords,
    moldRecords,
    machiningRecords,
    similarCases
  };
};
var analyzeRequirementsHandler = async (input, context) => {
  const { description } = input;
  let annualVolume = 1e5;
  let lifespan = 8;
  let weightReduction = 10;
  if (description) {
    const volumeMatch = description.match(/(\d+)\s*万件/);
    if (volumeMatch) annualVolume = parseInt(volumeMatch[1]) * 1e4;
    const lifespanMatch = description.match(/(\d+)\s*年以上/);
    if (lifespanMatch) lifespan = parseInt(lifespanMatch[1]);
    const reductionMatch = description.match(/减重(\d+)%/);
    if (reductionMatch) weightReduction = parseInt(reductionMatch[1]);
  }
  await context.progress(100, "\u9700\u6C42\u5206\u6790\u5B8C\u6210");
  await context.streamTextWithDelay(`\u2713 \u9700\u6C42\u5206\u6790\u5B8C\u6210
`, 100);
  await context.streamTextWithDelay(`  \u5E74\u4EA7\u91CF: ${annualVolume}\u4EF6
`, 50);
  await context.streamTextWithDelay(`  \u5BFF\u547D\u8981\u6C42: ${lifespan}\u5E74\u4EE5\u4E0A
`, 50);
  await context.streamTextWithDelay(`  \u51CF\u91CD\u76EE\u6807: ${weightReduction}%
`, 50);
  await context.streamTextWithDelay(`  \u8868\u9762\u7C97\u7CD9\u5EA6: Ra0.4\u03BCm

`, 50);
  return {
    annualVolume,
    lifespan,
    weightReduction,
    surfaceRoughness: "Ra0.4\u03BCm",
    feasibility: {
      structure: "feasible",
      material: "feasible",
      cooling: "feasible",
      cost: "acceptable"
    }
  };
};
var generateOptionsHandler = async (input, context) => {
  const { productType } = input;
  const gateOptions = [
    { type: "\u70B9\u6D47\u53E3", mold: "\u4E09\u677F\u6A21", auto: true, suitable: "\u7CBE\u5BC6\u5C0F\u578B\u4EF6" },
    { type: "\u4FA7\u6D47\u53E3", mold: "\u4E24\u677F\u6A21", auto: false, suitable: "\u5927\u578B\u4EF6" },
    { type: "\u70ED\u6D41\u9053", mold: "\u70ED\u6D41\u9053\u6A21", auto: true, suitable: "\u5927\u6279\u91CF\u751F\u4EA7" }
  ];
  const ejectorOptions = [
    { type: "\u5706\u9876\u9488", desc: "\u666E\u901A\u63A8\u51FA" },
    { type: "\u6241\u9876\u9488", desc: "\u66F2\u9762\u63A8\u51FA" },
    { type: "\u63A8\u677F\u63A8\u51FA", desc: "\u6DF1\u8154\u4EA7\u54C1" }
  ];
  const coolingOptions = [
    { type: "\u76F4\u6C34\u8DEF", desc: "\u7B80\u5355\u7ED3\u6784" },
    { type: "\u73AF\u5F62\u6C34\u8DEF", desc: "\u5706\u5F62\u4EA7\u54C1" },
    { type: "\u968F\u5F62\u6C34\u8DEF", desc: "\u590D\u6742\u66F2\u9762" }
  ];
  const recommended = {
    gate: productType === "\u53F6\u8F6E" ? "\u70B9\u6D47\u53E3" : "\u4FA7\u6D47\u53E3",
    mold: productType === "\u53F6\u8F6E" ? "\u4E09\u677F\u6A21" : "\u4E24\u677F\u6A21",
    ejector: productType === "\u53F6\u8F6E" ? "\u6241\u9876\u9488" : "\u5706\u9876\u9488",
    cooling: productType === "\u53F6\u8F6E" ? "\u968F\u5F62\u6C34\u8DEF" : "\u73AF\u5F62\u6C34\u8DEF"
  };
  await context.progress(100, "\u8BBE\u8BA1\u65B9\u6848\u751F\u6210\u5B8C\u6210");
  await context.streamTextWithDelay(`\u2713 \u8BBE\u8BA1\u65B9\u6848\u751F\u6210\u5B8C\u6210
`, 100);
  await context.streamTextWithDelay(`  \u3010\u63A8\u8350\u65B9\u6848\u3011
`, 50);
  await context.streamTextWithDelay(`  \u6D47\u53E3\u7C7B\u578B: ${recommended.gate}
`, 30);
  await context.streamTextWithDelay(`  \u6A21\u5177\u7C7B\u578B: ${recommended.mold}
`, 30);
  await context.streamTextWithDelay(`  \u63A8\u51FA\u65B9\u5F0F: ${recommended.ejector}
`, 30);
  await context.streamTextWithDelay(`  \u51B7\u5374\u65B9\u5F0F: ${recommended.cooling}

`, 30);
  return {
    gateOptions,
    ejectorOptions,
    coolingOptions,
    recommended
  };
};
var optimizeDesignHandler = async (input, context) => {
  await context.streamTextWithDelay("\u6B63\u5728\u8FDB\u884C\u667A\u80FD\u5206\u6790...\n", 100);
  await new Promise((resolve) => setTimeout(resolve, 5e3));
  const allResults = context.getAllPreviousResults();
  const parseResult = allResults.get("parse_model") || {};
  const featureResult = allResults.get("extract_features") || {};
  const descResult = allResults.get("analyze_requirements") || {};
  await context.streamTextWithDelay("\u2713 \u5206\u6790\u5B8C\u6210\uFF0C\u6B63\u5728\u751F\u6210\u6700\u7EC8\u65B9\u6848...\n", 100);
  await context.progress(100, "\u4F18\u5316\u5B8C\u6210");
  await context.streamTextWithDelay("\n\u2713 \u6A21\u5177\u8BBE\u8BA1\u4F18\u5316\u5B8C\u6210\n\n", 100);
  return {
    structureOptimization: { gatePosition: "optimized", ejectorLayout: "optimized" },
    materialOptimization: { coreMaterial: "S136", moldBase: "P20" },
    coolingOptimization: { method: "\u968F\u5F62\u6C34\u8DEF", efficiency: "+15%" }
  };
};

// server/handlers/machining-handlers.ts
var parseMachiningModelHandler = async (input, context) => {
  const { fileName } = input;
  await context.progress(10, "\u6B63\u5728\u89E3\u6790\u96F6\u4EF6\u6A21\u578B...");
  await context.streamTextWithDelay("\u6B63\u5728\u89E3\u6790\u96F6\u4EF6\u6A21\u578B...\n\n", 8);
  await context.sleep(50);
  await context.streamTextWithDelay(`\u6587\u4EF6\u540D: ${fileName || "\u672A\u6307\u5B9A"}
`, 5);
  await context.sleep(50);
  await context.progress(50, "\u6B63\u5728\u8BFB\u53D6\u6A21\u578B\u6570\u636E...");
  await context.streamTextWithDelay("\u6B63\u5728\u8BFB\u53D6\u6A21\u578B\u6570\u636E...\n", 5);
  await context.sleep(50);
  await context.progress(100, "\u96F6\u4EF6\u6A21\u578B\u89E3\u6790\u5B8C\u6210");
  await context.streamTextWithDelay("\n\u2713 \u96F6\u4EF6\u6A21\u578B\u89E3\u6790\u5B8C\u6210\n\n", 40);
  return { fileName, modelLoaded: true };
};
var identifyFeaturesHandler = async (input, context) => {
  const { fileName } = input;
  await context.progress(10, "\u6B63\u5728\u8BC6\u522B\u52A0\u5DE5\u7279\u5F81...");
  await context.streamTextWithDelay("\u6B63\u5728\u8BC6\u522B\u52A0\u5DE5\u7279\u5F81...\n\n", 8);
  await context.sleep(80);
  await context.streamTextWithDelay("\u5916\u5706\u8868\u9762: \u03A650mm\n", 5);
  await context.sleep(50);
  await context.streamTextWithDelay("\u5185\u5B54: \u03A620mm\n", 5);
  await context.sleep(50);
  await context.streamTextWithDelay("\u7AEF\u9762: 2\u5904\n", 5);
  await context.sleep(50);
  await context.streamTextWithDelay("\u952E\u69FD: 1\u5904\n", 5);
  await context.sleep(50);
  await context.progress(100, "\u52A0\u5DE5\u7279\u5F81\u8BC6\u522B\u5B8C\u6210");
  await context.streamTextWithDelay("\n\u2713 \u52A0\u5DE5\u7279\u5F81\u8BC6\u522B\u5B8C\u6210\n\n", 40);
  return {
    features: ["\u5916\u5706\u8868\u9762", "\u5185\u5B54", "\u7AEF\u9762", "\u952E\u69FD"],
    complexity: "medium"
  };
};
var queryMachiningKBHandler = async (input, context) => {
  await context.progress(10, "\u6B63\u5728\u68C0\u7D22\u52A0\u5DE5\u77E5\u8BC6\u5E93...");
  await context.streamTextWithDelay("\u6B63\u5728\u68C0\u7D22\u52A0\u5DE5\u77E5\u8BC6\u5E93...\n\n", 8);
  await context.sleep(80);
  await context.streamTextWithDelay("\u627E\u5230\u52A0\u5DE5\u53C2\u6570\u5E93\u8BB0\u5F55: 156\u6761\n", 5);
  await context.sleep(50);
  await context.streamTextWithDelay("\u627E\u5230\u5200\u5177\u9009\u7528\u5E93\u8BB0\u5F55: 89\u6761\n", 5);
  await context.sleep(50);
  await context.streamTextWithDelay("\u627E\u5230\u5DE5\u827A\u6848\u4F8B\u5E93\u8BB0\u5F55: 67\u6761\n", 5);
  await context.sleep(50);
  await context.progress(100, "\u77E5\u8BC6\u5E93\u68C0\u7D22\u5B8C\u6210");
  await context.streamTextWithDelay("\n\u2713 \u52A0\u5DE5\u77E5\u8BC6\u5E93\u68C0\u7D22\u5B8C\u6210\n\n", 40);
  return { records: 312 };
};
var generateProcessHandler = async (input, context) => {
  await context.progress(10, "\u6B63\u5728\u751F\u6210\u52A0\u5DE5\u5DE5\u5E8F...");
  await context.streamTextWithDelay("\u6B63\u5728\u751F\u6210\u52A0\u5DE5\u5DE5\u5E8F...\n\n", 8);
  await context.sleep(80);
  await context.streamTextWithDelay("\u5DE5\u5E8F1: \u7C97\u8F66\u5916\u5706\n", 5);
  await context.sleep(50);
  await context.streamTextWithDelay("\u5DE5\u5E8F2: \u7CBE\u8F66\u5916\u5706\n", 5);
  await context.sleep(50);
  await context.streamTextWithDelay("\u5DE5\u5E8F3: \u9557\u5B54\n", 5);
  await context.sleep(50);
  await context.streamTextWithDelay("\u5DE5\u5E8F4: \u94E3\u952E\u69FD\n", 5);
  await context.sleep(50);
  await context.progress(100, "\u52A0\u5DE5\u5DE5\u5E8F\u751F\u6210\u5B8C\u6210");
  await context.streamTextWithDelay("\n\u2713 \u52A0\u5DE5\u5DE5\u5E8F\u751F\u6210\u5B8C\u6210\n\n", 40);
  return { processes: ["\u7C97\u8F66\u5916\u5706", "\u7CBE\u8F66\u5916\u5706", "\u9557\u5B54", "\u94E3\u952E\u69FD"] };
};
var optimizeMachiningParamsHandler = async (input, context) => {
  await context.progress(10, "\u6B63\u5728\u4F18\u5316\u52A0\u5DE5\u53C2\u6570...");
  await context.streamTextWithDelay("\u6B63\u5728\u4F18\u5316\u52A0\u5DE5\u53C2\u6570...\n\n", 8);
  await context.sleep(80);
  await context.streamTextWithDelay("\u5207\u524A\u901F\u5EA6\u4F18\u5316: 120m/min\n", 5);
  await context.sleep(50);
  await context.streamTextWithDelay("\u8FDB\u7ED9\u91CF\u4F18\u5316: 0.2mm/r\n", 5);
  await context.sleep(50);
  await context.streamTextWithDelay("\u80CC\u5403\u5200\u91CF\u4F18\u5316: 2mm\n", 5);
  await context.sleep(50);
  await context.progress(100, "\u53C2\u6570\u4F18\u5316\u5B8C\u6210");
  await context.streamTextWithDelay("\n\u2713 \u52A0\u5DE5\u53C2\u6570\u4F18\u5316\u5B8C\u6210\n\n", 40);
  return { params: { speed: 120, feed: 0.2, depth: 2 } };
};

// server/handlers/injection-handlers.ts
var analyzeMaterialHandler = async (input, context) => {
  const { material, moldType, gateType, requirements } = input;
  await context.progress(10, "\u6B63\u5728\u5206\u6790\u6750\u6599\u7279\u6027...");
  await context.streamTextWithDelay("\u6B63\u5728\u5206\u6790\u6750\u6599\u7279\u6027...\n\n", 8);
  await context.sleep(80);
  await context.streamTextWithDelay(`\u6750\u6599: ${material || "ABS\u5851\u6599"}
`, 5);
  await context.streamTextWithDelay(`\u6A21\u5177\u7C7B\u578B: ${moldType || "\u4E24\u677F\u6A21"}
`, 5);
  await context.streamTextWithDelay(`\u6D47\u53E3\u7C7B\u578B: ${gateType || "\u70B9\u6D47\u53E3"}
`, 5);
  await context.streamTextWithDelay("\u7194\u878D\u6E29\u5EA6: 220-260\xB0C\n", 5);
  await context.streamTextWithDelay("\u6A21\u5177\u6E29\u5EA6: 40-80\xB0C\n", 5);
  await context.sleep(50);
  await context.progress(100, "\u6750\u6599\u7279\u6027\u5206\u6790\u5B8C\u6210");
  await context.streamTextWithDelay("\n\u2713 \u6750\u6599\u7279\u6027\u5206\u6790\u5B8C\u6210\n\n", 15);
  return { material, meltTemp: "220-260\xB0C", moldTemp: "40-80\xB0C" };
};
var queryInjectionKBHandler = async (input, context) => {
  await context.progress(10, "\u6B63\u5728\u68C0\u7D22\u6CE8\u5851\u77E5\u8BC6\u5E93...");
  await context.streamTextWithDelay("\u6B63\u5728\u68C0\u7D22\u6CE8\u5851\u77E5\u8BC6\u5E93...\n\n", 8);
  await context.sleep(80);
  await context.streamTextWithDelay("\u627E\u5230\u6CE8\u5851\u53C2\u6570\u5E93\u8BB0\u5F55: 234\u6761\n", 5);
  await context.sleep(50);
  await context.streamTextWithDelay("\u627E\u5230\u6A21\u5177\u8BBE\u8BA1\u5E93\u8BB0\u5F55: 156\u6761\n", 5);
  await context.sleep(50);
  await context.streamTextWithDelay("\u627E\u5230\u5DE5\u827A\u6848\u4F8B\u5E93\u8BB0\u5F55: 189\u6761\n", 5);
  await context.sleep(50);
  await context.progress(100, "\u77E5\u8BC6\u5E93\u68C0\u7D22\u5B8C\u6210");
  await context.streamTextWithDelay("\n\u2713 \u6CE8\u5851\u77E5\u8BC6\u5E93\u68C0\u7D22\u5B8C\u6210\n\n", 15);
  return { records: 579 };
};
var calculateParamsHandler = async (input, context) => {
  await context.progress(10, "\u6B63\u5728\u8BA1\u7B97\u5DE5\u827A\u53C2\u6570...");
  await context.streamTextWithDelay("\u6B63\u5728\u8BA1\u7B97\u5DE5\u827A\u53C2\u6570...\n\n", 8);
  await context.sleep(80);
  await context.streamTextWithDelay("\u6CE8\u5C04\u538B\u529B: 80-120MPa\n", 5);
  await context.sleep(50);
  await context.streamTextWithDelay("\u4FDD\u538B\u538B\u529B: 60-80MPa\n", 5);
  await context.sleep(50);
  await context.streamTextWithDelay("\u6CE8\u5C04\u901F\u5EA6: 30-60mm/s\n", 5);
  await context.sleep(50);
  await context.progress(100, "\u5DE5\u827A\u53C2\u6570\u8BA1\u7B97\u5B8C\u6210");
  await context.streamTextWithDelay("\n\u2713 \u5DE5\u827A\u53C2\u6570\u8BA1\u7B97\u5B8C\u6210\n\n", 15);
  return { params: { injection: "80-120MPa", holding: "60-80MPa", speed: "30-60mm/s" } };
};
var optimizeInjectionProcessHandler = async (input, context) => {
  await context.progress(10, "\u6B63\u5728\u4F18\u5316\u6210\u578B\u5468\u671F...");
  await context.streamTextWithDelay("\u6B63\u5728\u4F18\u5316\u6210\u578B\u5468\u671F...\n\n", 8);
  await context.sleep(80);
  await context.streamTextWithDelay("\u6CE8\u5C04\u65F6\u95F4: 2.5s\n", 5);
  await context.sleep(50);
  await context.streamTextWithDelay("\u4FDD\u538B\u65F6\u95F4: 8s\n", 5);
  await context.sleep(50);
  await context.streamTextWithDelay("\u51B7\u5374\u65F6\u95F4: 15s\n", 5);
  await context.sleep(50);
  await context.streamTextWithDelay("\u603B\u5468\u671F: 25.5s\n", 5);
  await context.sleep(50);
  await context.progress(100, "\u6210\u578B\u5468\u671F\u4F18\u5316\u5B8C\u6210");
  await context.streamTextWithDelay("\n\u2713 \u6210\u578B\u5468\u671F\u4F18\u5316\u5B8C\u6210\n\n", 15);
  return { cycle: 25.5 };
};

// server/handlers/index.ts
function registerAllHandlers() {
  orchestrator.registerHandler("design_parse_model", parseModelHandler);
  orchestrator.registerHandler("extract_features", extractFeaturesHandler);
  orchestrator.registerHandler("query_knowledge", queryKnowledgeHandler);
  orchestrator.registerHandler("analyze_requirements", analyzeRequirementsHandler);
  orchestrator.registerHandler("generate_options", generateOptionsHandler);
  orchestrator.registerHandler("optimize", optimizeDesignHandler);
  orchestrator.registerHandler("parse_model", parseMachiningModelHandler);
  orchestrator.registerHandler("identify_features", identifyFeaturesHandler);
  orchestrator.registerHandler("query_machining_kb", queryMachiningKBHandler);
  orchestrator.registerHandler("generate_process", generateProcessHandler);
  orchestrator.registerHandler("optimize_params", optimizeMachiningParamsHandler);
  orchestrator.registerHandler("analyze_material", analyzeMaterialHandler);
  orchestrator.registerHandler("query_injection_kb", queryInjectionKBHandler);
  orchestrator.registerHandler("calculate_params", calculateParamsHandler);
  orchestrator.registerHandler("optimize_process", optimizeInjectionProcessHandler);
  console.log("[TaskFlow] \u6240\u6709\u5904\u7406\u5668\u6CE8\u518C\u5B8C\u6210");
}

// server/routes/task-routes.ts
registerAllHandlers();
var router = (0, import_express.Router)();
router.post("/", async (req, res) => {
  try {
    const { type, input } = req.body;
    if (!type) {
      res.status(400).json({
        success: false,
        error: "\u7F3A\u5C11\u4EFB\u52A1\u7C7B\u578B\u53C2\u6570"
      });
      return;
    }
    if (!["design", "machining", "injection"].includes(type)) {
      res.status(400).json({
        success: false,
        error: `\u672A\u77E5\u4EFB\u52A1\u7C7B\u578B: ${type}`
      });
      return;
    }
    const task = orchestrator.createTask(type, input);
    const emitter = eventEmitterManager.getOrCreate(task.id);
    emitter.emitTaskCreated();
    orchestrator.executeTask(task.id).catch((error) => {
      console.error(`[TaskFlow] \u4EFB\u52A1\u6267\u884C\u5931\u8D25: ${task.id}`, error);
    });
    res.status(201).json({
      success: true,
      taskId: task.id,
      message: "\u4EFB\u52A1\u5DF2\u521B\u5EFA\uFF0C\u6B63\u5728\u5904\u7406\u4E2D..."
    });
  } catch (error) {
    console.error("[TaskFlow] \u521B\u5EFA\u4EFB\u52A1\u5931\u8D25:", error);
    res.status(500).json({
      success: false,
      error: "\u521B\u5EFA\u4EFB\u52A1\u5931\u8D25"
    });
  }
});
router.get("/", (req, res) => {
  try {
    const tasks = taskStore.getAll();
    res.json({
      success: true,
      data: tasks,
      total: tasks.length
    });
  } catch (error) {
    console.error("[TaskFlow] \u83B7\u53D6\u4EFB\u52A1\u5217\u8868\u5931\u8D25:", error);
    res.status(500).json({
      success: false,
      error: "\u83B7\u53D6\u4EFB\u52A1\u5217\u8868\u5931\u8D25"
    });
  }
});
router.get("/:taskId", (req, res) => {
  try {
    const { taskId } = req.params;
    const task = taskStore.get(taskId);
    if (!task) {
      res.status(404).json({
        success: false,
        error: "\u4EFB\u52A1\u4E0D\u5B58\u5728"
      });
      return;
    }
    res.json({
      success: true,
      data: task
    });
  } catch (error) {
    console.error("[TaskFlow] \u83B7\u53D6\u4EFB\u52A1\u8BE6\u60C5\u5931\u8D25:", error);
    res.status(500).json({
      success: false,
      error: "\u83B7\u53D6\u4EFB\u52A1\u8BE6\u60C5\u5931\u8D25"
    });
  }
});
router.get("/:taskId/stream", (req, res) => {
  const { taskId } = req.params;
  const task = taskStore.get(taskId);
  if (!task) {
    res.status(404).json({
      success: false,
      error: "\u4EFB\u52A1\u4E0D\u5B58\u5728"
    });
    return;
  }
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  const emitter = eventEmitterManager.getOrCreate(taskId);
  emitter.addSubscriber(res);
  res.write(`: heartbeat

`);
  const heartbeatInterval = setInterval(() => {
    try {
      res.write(`: heartbeat

`);
    } catch (error) {
      clearInterval(heartbeatInterval);
    }
  }, 3e4);
  req.on("close", () => {
    clearInterval(heartbeatInterval);
    emitter.removeSubscriber(res);
    console.log(`[TaskFlow] \u5BA2\u6237\u7AEF\u65AD\u5F00\u8BA2\u9605: ${taskId}`);
  });
  console.log(`[TaskFlow] \u5BA2\u6237\u7AEF\u8BA2\u9605\u4EFB\u52A1: ${taskId}`);
});
router.get("/:taskId/result", (req, res) => {
  try {
    const { taskId } = req.params;
    const task = taskStore.get(taskId);
    if (!task) {
      res.status(404).json({
        success: false,
        error: "\u4EFB\u52A1\u4E0D\u5B58\u5728"
      });
      return;
    }
    if (!task.output) {
      res.status(202).json({
        success: true,
        status: task.status,
        message: "\u4EFB\u52A1\u5C1A\u672A\u5B8C\u6210"
      });
      return;
    }
    res.json({
      success: true,
      data: task.output
    });
  } catch (error) {
    console.error("[TaskFlow] \u83B7\u53D6\u4EFB\u52A1\u7ED3\u679C\u5931\u8D25:", error);
    res.status(500).json({
      success: false,
      error: "\u83B7\u53D6\u4EFB\u52A1\u7ED3\u679C\u5931\u8D25"
    });
  }
});
router.post("/:taskId/cancel", (req, res) => {
  try {
    const { taskId } = req.params;
    if (!taskStore.get(taskId)) {
      res.status(404).json({
        success: false,
        error: "\u4EFB\u52A1\u4E0D\u5B58\u5728"
      });
      return;
    }
    const cancelled = orchestrator.cancelTask(taskId);
    if (cancelled) {
      res.json({
        success: true,
        message: "\u4EFB\u52A1\u5DF2\u53D6\u6D88"
      });
    } else {
      res.status(400).json({
        success: false,
        error: "\u4EFB\u52A1\u65E0\u6CD5\u53D6\u6D88\uFF08\u53EF\u80FD\u5DF2\u5B8C\u6210\u6216\u4E0D\u5B58\u5728\uFF09"
      });
    }
  } catch (error) {
    console.error("[TaskFlow] \u53D6\u6D88\u4EFB\u52A1\u5931\u8D25:", error);
    res.status(500).json({
      success: false,
      error: "\u53D6\u6D88\u4EFB\u52A1\u5931\u8D25"
    });
  }
});
router.delete("/:taskId", (req, res) => {
  try {
    const { taskId } = req.params;
    if (orchestrator.isTaskRunning(taskId)) {
      orchestrator.cancelTask(taskId);
    }
    const deleted = taskStore.delete(taskId);
    if (deleted) {
      eventEmitterManager.remove(taskId);
      res.json({
        success: true,
        message: "\u4EFB\u52A1\u5DF2\u5220\u9664"
      });
    } else {
      res.status(404).json({
        success: false,
        error: "\u4EFB\u52A1\u4E0D\u5B58\u5728"
      });
    }
  } catch (error) {
    console.error("[TaskFlow] \u5220\u9664\u4EFB\u52A1\u5931\u8D25:", error);
    res.status(500).json({
      success: false,
      error: "\u5220\u9664\u4EFB\u52A1\u5931\u8D25"
    });
  }
});
var task_routes_default = router;

// server/routes/index.ts
var import_https = __toESM(require("https"));
var router2 = (0, import_express2.Router)();
router2.get("/api/hello", (req, res) => {
  res.json({
    message: "Hello from Express + Vite!",
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  });
});
router2.post("/api/data", (req, res) => {
  const requestData = req.body;
  res.json({
    success: true,
    data: requestData,
    receivedAt: (/* @__PURE__ */ new Date()).toISOString()
  });
});
router2.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    env: process.env.COZE_PROJECT_ENV,
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  });
});
router2.use("/api/tasks", task_routes_default);
router2.post("/api/proxy/run", (req, res) => {
  const options = {
    hostname: "zmsg2jc5p6.coze.site",
    port: 443,
    path: "/run",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": req.headers.authorization || "",
      "Content-Length": Buffer.byteLength(JSON.stringify(req.body))
    }
  };
  const proxyReq = import_https.default.request(options, (proxyRes) => {
    res.writeHead(proxyRes.statusCode || 200, proxyRes.headers);
    proxyRes.pipe(res);
  });
  proxyReq.on("error", (e) => {
    console.error("\u4EE3\u7406\u8BF7\u6C42\u9519\u8BEF:", e);
    res.status(500).json({ error: "\u4EE3\u7406\u8BF7\u6C42\u5931\u8D25" });
  });
  proxyReq.write(JSON.stringify(req.body));
  proxyReq.end();
});
router2.post("/api/proxy/run-machining", (req, res) => {
  console.log("\u6536\u5230\u52A0\u5DE5\u5DE5\u827AAPI\u8BF7\u6C42");
  console.log("\u8BF7\u6C42\u5934:", req.headers);
  console.log("\u8BF7\u6C42\u4F53:", req.body);
  const options = {
    hostname: "sgpznbxqds.coze.site",
    port: 443,
    path: "/run",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": req.headers.authorization || "",
      "Content-Length": Buffer.byteLength(JSON.stringify(req.body))
    }
  };
  console.log("\u53D1\u9001\u5230\u76EE\u6807API\u7684\u9009\u9879:", options);
  const proxyReq = import_https.default.request(options, (proxyRes) => {
    console.log("\u76EE\u6807API\u54CD\u5E94\u72B6\u6001:", proxyRes.statusCode);
    console.log("\u76EE\u6807API\u54CD\u5E94\u5934:", proxyRes.headers);
    res.writeHead(proxyRes.statusCode || 200, proxyRes.headers);
    proxyRes.pipe(res);
  });
  proxyReq.on("error", (e) => {
    console.error("\u4EE3\u7406\u8BF7\u6C42\u9519\u8BEF:", e);
    res.status(500).json({ error: "\u4EE3\u7406\u8BF7\u6C42\u5931\u8D25" });
  });
  proxyReq.write(JSON.stringify(req.body));
  proxyReq.end();
});
router2.post("/api/proxy/run-injection", (req, res) => {
  console.log("\u6536\u5230\u6CE8\u5851\u5DE5\u827AAPI\u8BF7\u6C42");
  console.log("\u8BF7\u6C42\u5934:", req.headers);
  console.log("\u8BF7\u6C42\u4F53:", req.body);
  const options = {
    hostname: "tdk2sszp38.coze.site",
    port: 443,
    path: "/run",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": req.headers.authorization || "",
      "Content-Length": Buffer.byteLength(JSON.stringify(req.body))
    }
  };
  console.log("\u53D1\u9001\u5230\u76EE\u6807API\u7684\u9009\u9879:", options);
  const proxyReq = import_https.default.request(options, (proxyRes) => {
    console.log("\u76EE\u6807API\u54CD\u5E94\u72B6\u6001:", proxyRes.statusCode);
    console.log("\u76EE\u6807API\u54CD\u5E94\u5934:", proxyRes.headers);
    res.writeHead(proxyRes.statusCode || 200, proxyRes.headers);
    proxyRes.pipe(res);
  });
  proxyReq.on("error", (e) => {
    console.error("\u4EE3\u7406\u8BF7\u6C42\u9519\u8BEF:", e);
    res.status(500).json({ error: "\u4EE3\u7406\u8BF7\u6C42\u5931\u8D25" });
  });
  proxyReq.write(JSON.stringify(req.body));
  proxyReq.end();
});
var routes_default = router2;

// server/vite.ts
var import_express3 = __toESM(require("express"));
var import_path = __toESM(require("path"));
var import_fs = __toESM(require("fs"));
var import_vite2 = require("vite");

// vite.config.ts
var import_vite = require("vite");
var vite_config_default = (0, import_vite.defineConfig)({
  server: {
    host: "0.0.0.0",
    allowedHosts: true,
    hmr: {
      overlay: true,
      path: "/hot/vite-hmr",
      port: 6e3,
      clientPort: 443,
      timeout: 3e4
    },
    watch: {
      usePolling: true,
      interval: 100
    }
  }
});

// server/vite.ts
var isDev = process.env.COZE_PROJECT_ENV !== "PROD";
async function setupViteMiddleware(app2) {
  const vite = await (0, import_vite2.createServer)({
    ...vite_config_default,
    server: {
      ...vite_config_default.server,
      middlewareMode: true
    },
    appType: "spa"
  });
  app2.use(vite.middlewares);
  console.log("\u{1F680} Vite dev server initialized");
}
function setupStaticServer(app2) {
  const distPath = import_path.default.resolve(process.cwd(), "dist");
  if (!import_fs.default.existsSync(distPath)) {
    console.error('\u274C dist folder not found. Please run "pnpm build" first.');
    process.exit(1);
  }
  app2.use(import_express3.default.static(distPath));
  app2.use((_req, res) => {
    res.sendFile(import_path.default.join(distPath, "index.html"));
  });
  console.log("\u{1F4E6} Serving static files from dist/");
}
async function setupVite(app2) {
  if (isDev) {
    await setupViteMiddleware(app2);
  } else {
    setupStaticServer(app2);
  }
}

// server/server.ts
var isDev2 = process.env.COZE_PROJECT_ENV !== "PROD";
var port = parseInt(process.env.PORT || "5003", 10);
var hostname = process.env.HOSTNAME || "localhost";
var app = (0, import_express4.default)();
var server = (0, import_http.createServer)(app);
async function startServer() {
  if (isDev2) {
    app.use((req, res, next) => {
      const start = Date.now();
      res.on("finish", () => {
        const ms = Date.now() - start;
        console.log(`${req.method} ${req.url} - ${ms}ms`);
      });
      next();
    });
  }
  app.use(import_express4.default.json());
  app.use(import_express4.default.urlencoded({ extended: true }));
  app.use(routes_default);
  await setupVite(app);
  app.use((err, req, res, next) => {
    console.error("Server error:", err);
    const status = "status" in err ? err.status || 500 : 500;
    if (typeof status === "number") {
      res.status(status).json({
        error: err.message || "Internal server error"
      });
    } else {
      res.json({
        error: err.message || "Internal server error"
      });
    }
  });
  server.once("error", (err) => {
    console.error("Server error:", err);
    process.exit(1);
  });
  server.listen(port, () => {
    console.log(`
\u2728 Server running at http://${hostname}:${port}`);
    console.log(`\u{1F4DD} Environment: ${isDev2 ? "development" : "production"}
`);
  });
  return server;
}
startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
