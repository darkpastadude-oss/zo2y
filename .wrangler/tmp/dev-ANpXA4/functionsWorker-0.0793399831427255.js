var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// .wrangler/tmp/pages-nKy1Vn/functionsWorker-0.0793399831427255.mjs
import { Writable } from "node:stream";
import { EventEmitter } from "node:events";
import libDefault from "path";
import libDefault2 from "crypto";
import crypto2 from "crypto";
var __create = Object.create;
var __defProp2 = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __name2 = /* @__PURE__ */ __name((target, value) => __defProp2(target, "name", { value, configurable: true }), "__name");
var __esm = /* @__PURE__ */ __name((fn, res) => /* @__PURE__ */ __name(function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
}, "__init"), "__esm");
var __commonJS = /* @__PURE__ */ __name((cb, mod) => /* @__PURE__ */ __name(function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
}, "__require"), "__commonJS");
var __export = /* @__PURE__ */ __name((target, all) => {
  for (var name in all)
    __defProp2(target, name, { get: all[name], enumerable: true });
}, "__export");
var __copyProps = /* @__PURE__ */ __name((to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp2(to, key, { get: /* @__PURE__ */ __name(() => from[key], "get"), enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
}, "__copyProps");
var __toESM = /* @__PURE__ */ __name((mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp2(target, "default", { value: mod, enumerable: true }) : target,
  mod
)), "__toESM");
// @__NO_SIDE_EFFECTS__
function createNotImplementedError(name) {
  return new Error(`[unenv] ${name} is not implemented yet!`);
}
__name(createNotImplementedError, "createNotImplementedError");
// @__NO_SIDE_EFFECTS__
function notImplemented(name) {
  const fn = /* @__PURE__ */ __name2(() => {
    throw /* @__PURE__ */ createNotImplementedError(name);
  }, "fn");
  return Object.assign(fn, { __unenv__: true });
}
__name(notImplemented, "notImplemented");
// @__NO_SIDE_EFFECTS__
function notImplementedAsync(name) {
  const fn = /* @__PURE__ */ notImplemented(name);
  fn.__promisify__ = () => /* @__PURE__ */ notImplemented(name + ".__promisify__");
  fn.native = fn;
  return fn;
}
__name(notImplementedAsync, "notImplementedAsync");
// @__NO_SIDE_EFFECTS__
function notImplementedClass(name) {
  return class {
    __unenv__ = true;
    constructor() {
      throw new Error(`[unenv] ${name} is not implemented yet!`);
    }
  };
}
__name(notImplementedClass, "notImplementedClass");
var init_utils = __esm({
  "../../../../AppData/Roaming/npm/node_modules/wrangler/node_modules/unenv/dist/runtime/_internal/utils.mjs"() {
    init_functionsRoutes_0_04524570753253654();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    __name2(createNotImplementedError, "createNotImplementedError");
    __name2(notImplemented, "notImplemented");
    __name2(notImplementedAsync, "notImplementedAsync");
    __name2(notImplementedClass, "notImplementedClass");
  }
});
var _timeOrigin;
var _performanceNow;
var nodeTiming;
var PerformanceEntry;
var PerformanceMark;
var PerformanceMeasure;
var PerformanceResourceTiming;
var PerformanceObserverEntryList;
var Performance;
var PerformanceObserver;
var performance;
var init_performance = __esm({
  "../../../../AppData/Roaming/npm/node_modules/wrangler/node_modules/unenv/dist/runtime/node/internal/perf_hooks/performance.mjs"() {
    init_functionsRoutes_0_04524570753253654();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_utils();
    _timeOrigin = globalThis.performance?.timeOrigin ?? Date.now();
    _performanceNow = globalThis.performance?.now ? globalThis.performance.now.bind(globalThis.performance) : () => Date.now() - _timeOrigin;
    nodeTiming = {
      name: "node",
      entryType: "node",
      startTime: 0,
      duration: 0,
      nodeStart: 0,
      v8Start: 0,
      bootstrapComplete: 0,
      environment: 0,
      loopStart: 0,
      loopExit: 0,
      idleTime: 0,
      uvMetricsInfo: {
        loopCount: 0,
        events: 0,
        eventsWaiting: 0
      },
      detail: void 0,
      toJSON() {
        return this;
      }
    };
    PerformanceEntry = class {
      static {
        __name(this, "PerformanceEntry");
      }
      static {
        __name2(this, "PerformanceEntry");
      }
      __unenv__ = true;
      detail;
      entryType = "event";
      name;
      startTime;
      constructor(name, options) {
        this.name = name;
        this.startTime = options?.startTime || _performanceNow();
        this.detail = options?.detail;
      }
      get duration() {
        return _performanceNow() - this.startTime;
      }
      toJSON() {
        return {
          name: this.name,
          entryType: this.entryType,
          startTime: this.startTime,
          duration: this.duration,
          detail: this.detail
        };
      }
    };
    PerformanceMark = class PerformanceMark2 extends PerformanceEntry {
      static {
        __name(this, "PerformanceMark2");
      }
      static {
        __name2(this, "PerformanceMark");
      }
      entryType = "mark";
      constructor() {
        super(...arguments);
      }
      get duration() {
        return 0;
      }
    };
    PerformanceMeasure = class extends PerformanceEntry {
      static {
        __name(this, "PerformanceMeasure");
      }
      static {
        __name2(this, "PerformanceMeasure");
      }
      entryType = "measure";
    };
    PerformanceResourceTiming = class extends PerformanceEntry {
      static {
        __name(this, "PerformanceResourceTiming");
      }
      static {
        __name2(this, "PerformanceResourceTiming");
      }
      entryType = "resource";
      serverTiming = [];
      connectEnd = 0;
      connectStart = 0;
      decodedBodySize = 0;
      domainLookupEnd = 0;
      domainLookupStart = 0;
      encodedBodySize = 0;
      fetchStart = 0;
      initiatorType = "";
      name = "";
      nextHopProtocol = "";
      redirectEnd = 0;
      redirectStart = 0;
      requestStart = 0;
      responseEnd = 0;
      responseStart = 0;
      secureConnectionStart = 0;
      startTime = 0;
      transferSize = 0;
      workerStart = 0;
      responseStatus = 0;
    };
    PerformanceObserverEntryList = class {
      static {
        __name(this, "PerformanceObserverEntryList");
      }
      static {
        __name2(this, "PerformanceObserverEntryList");
      }
      __unenv__ = true;
      getEntries() {
        return [];
      }
      getEntriesByName(_name, _type) {
        return [];
      }
      getEntriesByType(type2) {
        return [];
      }
    };
    Performance = class {
      static {
        __name(this, "Performance");
      }
      static {
        __name2(this, "Performance");
      }
      __unenv__ = true;
      timeOrigin = _timeOrigin;
      eventCounts = /* @__PURE__ */ new Map();
      _entries = [];
      _resourceTimingBufferSize = 0;
      navigation = void 0;
      timing = void 0;
      timerify(_fn, _options) {
        throw /* @__PURE__ */ createNotImplementedError("Performance.timerify");
      }
      get nodeTiming() {
        return nodeTiming;
      }
      eventLoopUtilization() {
        return {};
      }
      markResourceTiming() {
        return new PerformanceResourceTiming("");
      }
      onresourcetimingbufferfull = null;
      now() {
        if (this.timeOrigin === _timeOrigin) {
          return _performanceNow();
        }
        return Date.now() - this.timeOrigin;
      }
      clearMarks(markName) {
        this._entries = markName ? this._entries.filter((e) => e.name !== markName) : this._entries.filter((e) => e.entryType !== "mark");
      }
      clearMeasures(measureName) {
        this._entries = measureName ? this._entries.filter((e) => e.name !== measureName) : this._entries.filter((e) => e.entryType !== "measure");
      }
      clearResourceTimings() {
        this._entries = this._entries.filter((e) => e.entryType !== "resource" || e.entryType !== "navigation");
      }
      getEntries() {
        return this._entries;
      }
      getEntriesByName(name, type2) {
        return this._entries.filter((e) => e.name === name && (!type2 || e.entryType === type2));
      }
      getEntriesByType(type2) {
        return this._entries.filter((e) => e.entryType === type2);
      }
      mark(name, options) {
        const entry = new PerformanceMark(name, options);
        this._entries.push(entry);
        return entry;
      }
      measure(measureName, startOrMeasureOptions, endMark) {
        let start;
        let end;
        if (typeof startOrMeasureOptions === "string") {
          start = this.getEntriesByName(startOrMeasureOptions, "mark")[0]?.startTime;
          end = this.getEntriesByName(endMark, "mark")[0]?.startTime;
        } else {
          start = Number.parseFloat(startOrMeasureOptions?.start) || this.now();
          end = Number.parseFloat(startOrMeasureOptions?.end) || this.now();
        }
        const entry = new PerformanceMeasure(measureName, {
          startTime: start,
          detail: {
            start,
            end
          }
        });
        this._entries.push(entry);
        return entry;
      }
      setResourceTimingBufferSize(maxSize) {
        this._resourceTimingBufferSize = maxSize;
      }
      addEventListener(type2, listener, options) {
        throw /* @__PURE__ */ createNotImplementedError("Performance.addEventListener");
      }
      removeEventListener(type2, listener, options) {
        throw /* @__PURE__ */ createNotImplementedError("Performance.removeEventListener");
      }
      dispatchEvent(event) {
        throw /* @__PURE__ */ createNotImplementedError("Performance.dispatchEvent");
      }
      toJSON() {
        return this;
      }
    };
    PerformanceObserver = class {
      static {
        __name(this, "PerformanceObserver");
      }
      static {
        __name2(this, "PerformanceObserver");
      }
      __unenv__ = true;
      static supportedEntryTypes = [];
      _callback = null;
      constructor(callback) {
        this._callback = callback;
      }
      takeRecords() {
        return [];
      }
      disconnect() {
        throw /* @__PURE__ */ createNotImplementedError("PerformanceObserver.disconnect");
      }
      observe(options) {
        throw /* @__PURE__ */ createNotImplementedError("PerformanceObserver.observe");
      }
      bind(fn) {
        return fn;
      }
      runInAsyncScope(fn, thisArg, ...args) {
        return fn.call(thisArg, ...args);
      }
      asyncId() {
        return 0;
      }
      triggerAsyncId() {
        return 0;
      }
      emitDestroy() {
        return this;
      }
    };
    performance = globalThis.performance && "addEventListener" in globalThis.performance ? globalThis.performance : new Performance();
  }
});
var init_perf_hooks = __esm({
  "../../../../AppData/Roaming/npm/node_modules/wrangler/node_modules/unenv/dist/runtime/node/perf_hooks.mjs"() {
    init_functionsRoutes_0_04524570753253654();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_performance();
  }
});
var init_performance2 = __esm({
  "../../../../AppData/Roaming/npm/node_modules/wrangler/node_modules/@cloudflare/unenv-preset/dist/runtime/polyfill/performance.mjs"() {
    init_perf_hooks();
    if (!("__unenv__" in performance)) {
      const proto = Performance.prototype;
      for (const key of Object.getOwnPropertyNames(proto)) {
        if (key !== "constructor" && !(key in performance)) {
          const desc = Object.getOwnPropertyDescriptor(proto, key);
          if (desc) {
            Object.defineProperty(performance, key, desc);
          }
        }
      }
    }
    globalThis.performance = performance;
    globalThis.Performance = Performance;
    globalThis.PerformanceEntry = PerformanceEntry;
    globalThis.PerformanceMark = PerformanceMark;
    globalThis.PerformanceMeasure = PerformanceMeasure;
    globalThis.PerformanceObserver = PerformanceObserver;
    globalThis.PerformanceObserverEntryList = PerformanceObserverEntryList;
    globalThis.PerformanceResourceTiming = PerformanceResourceTiming;
  }
});
var noop_default;
var init_noop = __esm({
  "../../../../AppData/Roaming/npm/node_modules/wrangler/node_modules/unenv/dist/runtime/mock/noop.mjs"() {
    init_functionsRoutes_0_04524570753253654();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    noop_default = Object.assign(() => {
    }, { __unenv__: true });
  }
});
var _console;
var _ignoreErrors;
var _stderr;
var _stdout;
var log;
var info;
var trace;
var debug;
var table;
var error;
var warn;
var createTask;
var clear;
var count;
var countReset;
var dir;
var dirxml;
var group;
var groupEnd;
var groupCollapsed;
var profile;
var profileEnd;
var time;
var timeEnd;
var timeLog;
var timeStamp;
var Console;
var _times;
var _stdoutErrorHandler;
var _stderrErrorHandler;
var init_console = __esm({
  "../../../../AppData/Roaming/npm/node_modules/wrangler/node_modules/unenv/dist/runtime/node/console.mjs"() {
    init_functionsRoutes_0_04524570753253654();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_noop();
    init_utils();
    _console = globalThis.console;
    _ignoreErrors = true;
    _stderr = new Writable();
    _stdout = new Writable();
    log = _console?.log ?? noop_default;
    info = _console?.info ?? log;
    trace = _console?.trace ?? info;
    debug = _console?.debug ?? log;
    table = _console?.table ?? log;
    error = _console?.error ?? log;
    warn = _console?.warn ?? error;
    createTask = _console?.createTask ?? /* @__PURE__ */ notImplemented("console.createTask");
    clear = _console?.clear ?? noop_default;
    count = _console?.count ?? noop_default;
    countReset = _console?.countReset ?? noop_default;
    dir = _console?.dir ?? noop_default;
    dirxml = _console?.dirxml ?? noop_default;
    group = _console?.group ?? noop_default;
    groupEnd = _console?.groupEnd ?? noop_default;
    groupCollapsed = _console?.groupCollapsed ?? noop_default;
    profile = _console?.profile ?? noop_default;
    profileEnd = _console?.profileEnd ?? noop_default;
    time = _console?.time ?? noop_default;
    timeEnd = _console?.timeEnd ?? noop_default;
    timeLog = _console?.timeLog ?? noop_default;
    timeStamp = _console?.timeStamp ?? noop_default;
    Console = _console?.Console ?? /* @__PURE__ */ notImplementedClass("console.Console");
    _times = /* @__PURE__ */ new Map();
    _stdoutErrorHandler = noop_default;
    _stderrErrorHandler = noop_default;
  }
});
var workerdConsole;
var assert;
var clear2;
var context;
var count2;
var countReset2;
var createTask2;
var debug2;
var dir2;
var dirxml2;
var error2;
var group2;
var groupCollapsed2;
var groupEnd2;
var info2;
var log2;
var profile2;
var profileEnd2;
var table2;
var time2;
var timeEnd2;
var timeLog2;
var timeStamp2;
var trace2;
var warn2;
var console_default;
var init_console2 = __esm({
  "../../../../AppData/Roaming/npm/node_modules/wrangler/node_modules/@cloudflare/unenv-preset/dist/runtime/node/console.mjs"() {
    init_functionsRoutes_0_04524570753253654();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_console();
    workerdConsole = globalThis["console"];
    ({
      assert,
      clear: clear2,
      context: (
        // @ts-expect-error undocumented public API
        context
      ),
      count: count2,
      countReset: countReset2,
      createTask: (
        // @ts-expect-error undocumented public API
        createTask2
      ),
      debug: debug2,
      dir: dir2,
      dirxml: dirxml2,
      error: error2,
      group: group2,
      groupCollapsed: groupCollapsed2,
      groupEnd: groupEnd2,
      info: info2,
      log: log2,
      profile: profile2,
      profileEnd: profileEnd2,
      table: table2,
      time: time2,
      timeEnd: timeEnd2,
      timeLog: timeLog2,
      timeStamp: timeStamp2,
      trace: trace2,
      warn: warn2
    } = workerdConsole);
    Object.assign(workerdConsole, {
      Console,
      _ignoreErrors,
      _stderr,
      _stderrErrorHandler,
      _stdout,
      _stdoutErrorHandler,
      _times
    });
    console_default = workerdConsole;
  }
});
var init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console = __esm({
  "../../../../AppData/Roaming/npm/node_modules/wrangler/_virtual_unenv_global_polyfill-@cloudflare-unenv-preset-node-console"() {
    init_console2();
    globalThis.console = console_default;
  }
});
var hrtime;
var init_hrtime = __esm({
  "../../../../AppData/Roaming/npm/node_modules/wrangler/node_modules/unenv/dist/runtime/node/internal/process/hrtime.mjs"() {
    init_functionsRoutes_0_04524570753253654();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    hrtime = /* @__PURE__ */ Object.assign(/* @__PURE__ */ __name2(/* @__PURE__ */ __name(function hrtime2(startTime) {
      const now = Date.now();
      const seconds = Math.trunc(now / 1e3);
      const nanos = now % 1e3 * 1e6;
      if (startTime) {
        let diffSeconds = seconds - startTime[0];
        let diffNanos = nanos - startTime[0];
        if (diffNanos < 0) {
          diffSeconds = diffSeconds - 1;
          diffNanos = 1e9 + diffNanos;
        }
        return [diffSeconds, diffNanos];
      }
      return [seconds, nanos];
    }, "hrtime2"), "hrtime"), { bigint: /* @__PURE__ */ __name2(/* @__PURE__ */ __name(function bigint() {
      return BigInt(Date.now() * 1e6);
    }, "bigint"), "bigint") });
  }
});
var ReadStream;
var init_read_stream = __esm({
  "../../../../AppData/Roaming/npm/node_modules/wrangler/node_modules/unenv/dist/runtime/node/internal/tty/read-stream.mjs"() {
    init_functionsRoutes_0_04524570753253654();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    ReadStream = class {
      static {
        __name(this, "ReadStream");
      }
      static {
        __name2(this, "ReadStream");
      }
      fd;
      isRaw = false;
      isTTY = false;
      constructor(fd) {
        this.fd = fd;
      }
      setRawMode(mode) {
        this.isRaw = mode;
        return this;
      }
    };
  }
});
var WriteStream;
var init_write_stream = __esm({
  "../../../../AppData/Roaming/npm/node_modules/wrangler/node_modules/unenv/dist/runtime/node/internal/tty/write-stream.mjs"() {
    init_functionsRoutes_0_04524570753253654();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    WriteStream = class {
      static {
        __name(this, "WriteStream");
      }
      static {
        __name2(this, "WriteStream");
      }
      fd;
      columns = 80;
      rows = 24;
      isTTY = false;
      constructor(fd) {
        this.fd = fd;
      }
      clearLine(dir3, callback) {
        callback && callback();
        return false;
      }
      clearScreenDown(callback) {
        callback && callback();
        return false;
      }
      cursorTo(x, y, callback) {
        callback && typeof callback === "function" && callback();
        return false;
      }
      moveCursor(dx, dy, callback) {
        callback && callback();
        return false;
      }
      getColorDepth(env2) {
        return 1;
      }
      hasColors(count3, env2) {
        return false;
      }
      getWindowSize() {
        return [this.columns, this.rows];
      }
      write(str, encoding, cb) {
        if (str instanceof Uint8Array) {
          str = new TextDecoder().decode(str);
        }
        try {
          console.log(str);
        } catch {
        }
        cb && typeof cb === "function" && cb();
        return false;
      }
    };
  }
});
var init_tty = __esm({
  "../../../../AppData/Roaming/npm/node_modules/wrangler/node_modules/unenv/dist/runtime/node/tty.mjs"() {
    init_functionsRoutes_0_04524570753253654();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_read_stream();
    init_write_stream();
  }
});
var NODE_VERSION;
var init_node_version = __esm({
  "../../../../AppData/Roaming/npm/node_modules/wrangler/node_modules/unenv/dist/runtime/node/internal/process/node-version.mjs"() {
    init_functionsRoutes_0_04524570753253654();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    NODE_VERSION = "22.14.0";
  }
});
var Process;
var init_process = __esm({
  "../../../../AppData/Roaming/npm/node_modules/wrangler/node_modules/unenv/dist/runtime/node/internal/process/process.mjs"() {
    init_functionsRoutes_0_04524570753253654();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_tty();
    init_utils();
    init_node_version();
    Process = class _Process extends EventEmitter {
      static {
        __name(this, "_Process");
      }
      static {
        __name2(this, "Process");
      }
      env;
      hrtime;
      nextTick;
      constructor(impl) {
        super();
        this.env = impl.env;
        this.hrtime = impl.hrtime;
        this.nextTick = impl.nextTick;
        for (const prop of [...Object.getOwnPropertyNames(_Process.prototype), ...Object.getOwnPropertyNames(EventEmitter.prototype)]) {
          const value = this[prop];
          if (typeof value === "function") {
            this[prop] = value.bind(this);
          }
        }
      }
      // --- event emitter ---
      emitWarning(warning, type2, code) {
        console.warn(`${code ? `[${code}] ` : ""}${type2 ? `${type2}: ` : ""}${warning}`);
      }
      emit(...args) {
        return super.emit(...args);
      }
      listeners(eventName) {
        return super.listeners(eventName);
      }
      // --- stdio (lazy initializers) ---
      #stdin;
      #stdout;
      #stderr;
      get stdin() {
        return this.#stdin ??= new ReadStream(0);
      }
      get stdout() {
        return this.#stdout ??= new WriteStream(1);
      }
      get stderr() {
        return this.#stderr ??= new WriteStream(2);
      }
      // --- cwd ---
      #cwd = "/";
      chdir(cwd2) {
        this.#cwd = cwd2;
      }
      cwd() {
        return this.#cwd;
      }
      // --- dummy props and getters ---
      arch = "";
      platform = "";
      argv = [];
      argv0 = "";
      execArgv = [];
      execPath = "";
      title = "";
      pid = 200;
      ppid = 100;
      get version() {
        return `v${NODE_VERSION}`;
      }
      get versions() {
        return { node: NODE_VERSION };
      }
      get allowedNodeEnvironmentFlags() {
        return /* @__PURE__ */ new Set();
      }
      get sourceMapsEnabled() {
        return false;
      }
      get debugPort() {
        return 0;
      }
      get throwDeprecation() {
        return false;
      }
      get traceDeprecation() {
        return false;
      }
      get features() {
        return {};
      }
      get release() {
        return {};
      }
      get connected() {
        return false;
      }
      get config() {
        return {};
      }
      get moduleLoadList() {
        return [];
      }
      constrainedMemory() {
        return 0;
      }
      availableMemory() {
        return 0;
      }
      uptime() {
        return 0;
      }
      resourceUsage() {
        return {};
      }
      // --- noop methods ---
      ref() {
      }
      unref() {
      }
      // --- unimplemented methods ---
      umask() {
        throw /* @__PURE__ */ createNotImplementedError("process.umask");
      }
      getBuiltinModule() {
        return void 0;
      }
      getActiveResourcesInfo() {
        throw /* @__PURE__ */ createNotImplementedError("process.getActiveResourcesInfo");
      }
      exit() {
        throw /* @__PURE__ */ createNotImplementedError("process.exit");
      }
      reallyExit() {
        throw /* @__PURE__ */ createNotImplementedError("process.reallyExit");
      }
      kill() {
        throw /* @__PURE__ */ createNotImplementedError("process.kill");
      }
      abort() {
        throw /* @__PURE__ */ createNotImplementedError("process.abort");
      }
      dlopen() {
        throw /* @__PURE__ */ createNotImplementedError("process.dlopen");
      }
      setSourceMapsEnabled() {
        throw /* @__PURE__ */ createNotImplementedError("process.setSourceMapsEnabled");
      }
      loadEnvFile() {
        throw /* @__PURE__ */ createNotImplementedError("process.loadEnvFile");
      }
      disconnect() {
        throw /* @__PURE__ */ createNotImplementedError("process.disconnect");
      }
      cpuUsage() {
        throw /* @__PURE__ */ createNotImplementedError("process.cpuUsage");
      }
      setUncaughtExceptionCaptureCallback() {
        throw /* @__PURE__ */ createNotImplementedError("process.setUncaughtExceptionCaptureCallback");
      }
      hasUncaughtExceptionCaptureCallback() {
        throw /* @__PURE__ */ createNotImplementedError("process.hasUncaughtExceptionCaptureCallback");
      }
      initgroups() {
        throw /* @__PURE__ */ createNotImplementedError("process.initgroups");
      }
      openStdin() {
        throw /* @__PURE__ */ createNotImplementedError("process.openStdin");
      }
      assert() {
        throw /* @__PURE__ */ createNotImplementedError("process.assert");
      }
      binding() {
        throw /* @__PURE__ */ createNotImplementedError("process.binding");
      }
      // --- attached interfaces ---
      permission = { has: /* @__PURE__ */ notImplemented("process.permission.has") };
      report = {
        directory: "",
        filename: "",
        signal: "SIGUSR2",
        compact: false,
        reportOnFatalError: false,
        reportOnSignal: false,
        reportOnUncaughtException: false,
        getReport: /* @__PURE__ */ notImplemented("process.report.getReport"),
        writeReport: /* @__PURE__ */ notImplemented("process.report.writeReport")
      };
      finalization = {
        register: /* @__PURE__ */ notImplemented("process.finalization.register"),
        unregister: /* @__PURE__ */ notImplemented("process.finalization.unregister"),
        registerBeforeExit: /* @__PURE__ */ notImplemented("process.finalization.registerBeforeExit")
      };
      memoryUsage = Object.assign(() => ({
        arrayBuffers: 0,
        rss: 0,
        external: 0,
        heapTotal: 0,
        heapUsed: 0
      }), { rss: /* @__PURE__ */ __name2(() => 0, "rss") });
      // --- undefined props ---
      mainModule = void 0;
      domain = void 0;
      // optional
      send = void 0;
      exitCode = void 0;
      channel = void 0;
      getegid = void 0;
      geteuid = void 0;
      getgid = void 0;
      getgroups = void 0;
      getuid = void 0;
      setegid = void 0;
      seteuid = void 0;
      setgid = void 0;
      setgroups = void 0;
      setuid = void 0;
      // internals
      _events = void 0;
      _eventsCount = void 0;
      _exiting = void 0;
      _maxListeners = void 0;
      _debugEnd = void 0;
      _debugProcess = void 0;
      _fatalException = void 0;
      _getActiveHandles = void 0;
      _getActiveRequests = void 0;
      _kill = void 0;
      _preload_modules = void 0;
      _rawDebug = void 0;
      _startProfilerIdleNotifier = void 0;
      _stopProfilerIdleNotifier = void 0;
      _tickCallback = void 0;
      _disconnect = void 0;
      _handleQueue = void 0;
      _pendingMessage = void 0;
      _channel = void 0;
      _send = void 0;
      _linkedBinding = void 0;
    };
  }
});
var globalProcess;
var getBuiltinModule;
var workerdProcess;
var unenvProcess;
var exit;
var features;
var platform;
var _channel;
var _debugEnd;
var _debugProcess;
var _disconnect;
var _events;
var _eventsCount;
var _exiting;
var _fatalException;
var _getActiveHandles;
var _getActiveRequests;
var _handleQueue;
var _kill;
var _linkedBinding;
var _maxListeners;
var _pendingMessage;
var _preload_modules;
var _rawDebug;
var _send;
var _startProfilerIdleNotifier;
var _stopProfilerIdleNotifier;
var _tickCallback;
var abort;
var addListener;
var allowedNodeEnvironmentFlags;
var arch;
var argv;
var argv0;
var assert2;
var availableMemory;
var binding;
var channel;
var chdir;
var config;
var connected;
var constrainedMemory;
var cpuUsage;
var cwd;
var debugPort;
var disconnect;
var dlopen;
var domain;
var emit;
var emitWarning;
var env;
var eventNames;
var execArgv;
var execPath;
var exitCode;
var finalization;
var getActiveResourcesInfo;
var getegid;
var geteuid;
var getgid;
var getgroups;
var getMaxListeners;
var getuid;
var hasUncaughtExceptionCaptureCallback;
var hrtime3;
var initgroups;
var kill;
var listenerCount;
var listeners;
var loadEnvFile;
var mainModule;
var memoryUsage;
var moduleLoadList;
var nextTick;
var off;
var on;
var once;
var openStdin;
var permission;
var pid;
var ppid;
var prependListener;
var prependOnceListener;
var rawListeners;
var reallyExit;
var ref;
var release;
var removeAllListeners;
var removeListener;
var report;
var resourceUsage;
var send;
var setegid;
var seteuid;
var setgid;
var setgroups;
var setMaxListeners;
var setSourceMapsEnabled;
var setuid;
var setUncaughtExceptionCaptureCallback;
var sourceMapsEnabled;
var stderr;
var stdin;
var stdout;
var throwDeprecation;
var title;
var traceDeprecation;
var umask;
var unref;
var uptime;
var version;
var versions;
var _process;
var process_default;
var init_process2 = __esm({
  "../../../../AppData/Roaming/npm/node_modules/wrangler/node_modules/@cloudflare/unenv-preset/dist/runtime/node/process.mjs"() {
    init_functionsRoutes_0_04524570753253654();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_hrtime();
    init_process();
    globalProcess = globalThis["process"];
    getBuiltinModule = globalProcess.getBuiltinModule;
    workerdProcess = getBuiltinModule("node:process");
    unenvProcess = new Process({
      env: globalProcess.env,
      hrtime,
      // `nextTick` is available from workerd process v1
      nextTick: workerdProcess.nextTick
    });
    ({ exit, features, platform } = workerdProcess);
    ({
      _channel,
      _debugEnd,
      _debugProcess,
      _disconnect,
      _events,
      _eventsCount,
      _exiting,
      _fatalException,
      _getActiveHandles,
      _getActiveRequests,
      _handleQueue,
      _kill,
      _linkedBinding,
      _maxListeners,
      _pendingMessage,
      _preload_modules,
      _rawDebug,
      _send,
      _startProfilerIdleNotifier,
      _stopProfilerIdleNotifier,
      _tickCallback,
      abort,
      addListener,
      allowedNodeEnvironmentFlags,
      arch,
      argv,
      argv0,
      assert: assert2,
      availableMemory,
      binding,
      channel,
      chdir,
      config,
      connected,
      constrainedMemory,
      cpuUsage,
      cwd,
      debugPort,
      disconnect,
      dlopen,
      domain,
      emit,
      emitWarning,
      env,
      eventNames,
      execArgv,
      execPath,
      exitCode,
      finalization,
      getActiveResourcesInfo,
      getegid,
      geteuid,
      getgid,
      getgroups,
      getMaxListeners,
      getuid,
      hasUncaughtExceptionCaptureCallback,
      hrtime: hrtime3,
      initgroups,
      kill,
      listenerCount,
      listeners,
      loadEnvFile,
      mainModule,
      memoryUsage,
      moduleLoadList,
      nextTick,
      off,
      on,
      once,
      openStdin,
      permission,
      pid,
      ppid,
      prependListener,
      prependOnceListener,
      rawListeners,
      reallyExit,
      ref,
      release,
      removeAllListeners,
      removeListener,
      report,
      resourceUsage,
      send,
      setegid,
      seteuid,
      setgid,
      setgroups,
      setMaxListeners,
      setSourceMapsEnabled,
      setuid,
      setUncaughtExceptionCaptureCallback,
      sourceMapsEnabled,
      stderr,
      stdin,
      stdout,
      throwDeprecation,
      title,
      traceDeprecation,
      umask,
      unref,
      uptime,
      version,
      versions
    } = unenvProcess);
    _process = {
      abort,
      addListener,
      allowedNodeEnvironmentFlags,
      hasUncaughtExceptionCaptureCallback,
      setUncaughtExceptionCaptureCallback,
      loadEnvFile,
      sourceMapsEnabled,
      arch,
      argv,
      argv0,
      chdir,
      config,
      connected,
      constrainedMemory,
      availableMemory,
      cpuUsage,
      cwd,
      debugPort,
      dlopen,
      disconnect,
      emit,
      emitWarning,
      env,
      eventNames,
      execArgv,
      execPath,
      exit,
      finalization,
      features,
      getBuiltinModule,
      getActiveResourcesInfo,
      getMaxListeners,
      hrtime: hrtime3,
      kill,
      listeners,
      listenerCount,
      memoryUsage,
      nextTick,
      on,
      off,
      once,
      pid,
      platform,
      ppid,
      prependListener,
      prependOnceListener,
      rawListeners,
      release,
      removeAllListeners,
      removeListener,
      report,
      resourceUsage,
      setMaxListeners,
      setSourceMapsEnabled,
      stderr,
      stdin,
      stdout,
      title,
      throwDeprecation,
      traceDeprecation,
      umask,
      uptime,
      version,
      versions,
      // @ts-expect-error old API
      domain,
      initgroups,
      moduleLoadList,
      reallyExit,
      openStdin,
      assert: assert2,
      binding,
      send,
      exitCode,
      channel,
      getegid,
      geteuid,
      getgid,
      getgroups,
      getuid,
      setegid,
      seteuid,
      setgid,
      setgroups,
      setuid,
      permission,
      mainModule,
      _events,
      _eventsCount,
      _exiting,
      _maxListeners,
      _debugEnd,
      _debugProcess,
      _fatalException,
      _getActiveHandles,
      _getActiveRequests,
      _kill,
      _preload_modules,
      _rawDebug,
      _startProfilerIdleNotifier,
      _stopProfilerIdleNotifier,
      _tickCallback,
      _disconnect,
      _handleQueue,
      _pendingMessage,
      _channel,
      _send,
      _linkedBinding
    };
    process_default = _process;
  }
});
var init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process = __esm({
  "../../../../AppData/Roaming/npm/node_modules/wrangler/_virtual_unenv_global_polyfill-@cloudflare-unenv-preset-node-process"() {
    init_process2();
    globalThis.process = process_default;
  }
});
var access;
var copyFile;
var cp;
var open;
var opendir;
var rename;
var truncate;
var rm;
var rmdir;
var mkdir;
var readdir;
var readlink;
var symlink;
var lstat;
var stat;
var link;
var unlink;
var chmod;
var lchmod;
var lchown;
var chown;
var utimes;
var lutimes;
var realpath;
var mkdtemp;
var writeFile;
var appendFile;
var readFile;
var watch;
var statfs;
var glob;
var init_promises = __esm({
  "../../../../AppData/Roaming/npm/node_modules/wrangler/node_modules/unenv/dist/runtime/node/internal/fs/promises.mjs"() {
    init_functionsRoutes_0_04524570753253654();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_utils();
    access = /* @__PURE__ */ notImplemented("fs.access");
    copyFile = /* @__PURE__ */ notImplemented("fs.copyFile");
    cp = /* @__PURE__ */ notImplemented("fs.cp");
    open = /* @__PURE__ */ notImplemented("fs.open");
    opendir = /* @__PURE__ */ notImplemented("fs.opendir");
    rename = /* @__PURE__ */ notImplemented("fs.rename");
    truncate = /* @__PURE__ */ notImplemented("fs.truncate");
    rm = /* @__PURE__ */ notImplemented("fs.rm");
    rmdir = /* @__PURE__ */ notImplemented("fs.rmdir");
    mkdir = /* @__PURE__ */ notImplemented("fs.mkdir");
    readdir = /* @__PURE__ */ notImplemented("fs.readdir");
    readlink = /* @__PURE__ */ notImplemented("fs.readlink");
    symlink = /* @__PURE__ */ notImplemented("fs.symlink");
    lstat = /* @__PURE__ */ notImplemented("fs.lstat");
    stat = /* @__PURE__ */ notImplemented("fs.stat");
    link = /* @__PURE__ */ notImplemented("fs.link");
    unlink = /* @__PURE__ */ notImplemented("fs.unlink");
    chmod = /* @__PURE__ */ notImplemented("fs.chmod");
    lchmod = /* @__PURE__ */ notImplemented("fs.lchmod");
    lchown = /* @__PURE__ */ notImplemented("fs.lchown");
    chown = /* @__PURE__ */ notImplemented("fs.chown");
    utimes = /* @__PURE__ */ notImplemented("fs.utimes");
    lutimes = /* @__PURE__ */ notImplemented("fs.lutimes");
    realpath = /* @__PURE__ */ notImplemented("fs.realpath");
    mkdtemp = /* @__PURE__ */ notImplemented("fs.mkdtemp");
    writeFile = /* @__PURE__ */ notImplemented("fs.writeFile");
    appendFile = /* @__PURE__ */ notImplemented("fs.appendFile");
    readFile = /* @__PURE__ */ notImplemented("fs.readFile");
    watch = /* @__PURE__ */ notImplemented("fs.watch");
    statfs = /* @__PURE__ */ notImplemented("fs.statfs");
    glob = /* @__PURE__ */ notImplemented("fs.glob");
  }
});
var constants_exports = {};
__export(constants_exports, {
  COPYFILE_EXCL: /* @__PURE__ */ __name(() => COPYFILE_EXCL, "COPYFILE_EXCL"),
  COPYFILE_FICLONE: /* @__PURE__ */ __name(() => COPYFILE_FICLONE, "COPYFILE_FICLONE"),
  COPYFILE_FICLONE_FORCE: /* @__PURE__ */ __name(() => COPYFILE_FICLONE_FORCE, "COPYFILE_FICLONE_FORCE"),
  EXTENSIONLESS_FORMAT_JAVASCRIPT: /* @__PURE__ */ __name(() => EXTENSIONLESS_FORMAT_JAVASCRIPT, "EXTENSIONLESS_FORMAT_JAVASCRIPT"),
  EXTENSIONLESS_FORMAT_WASM: /* @__PURE__ */ __name(() => EXTENSIONLESS_FORMAT_WASM, "EXTENSIONLESS_FORMAT_WASM"),
  F_OK: /* @__PURE__ */ __name(() => F_OK, "F_OK"),
  O_APPEND: /* @__PURE__ */ __name(() => O_APPEND, "O_APPEND"),
  O_CREAT: /* @__PURE__ */ __name(() => O_CREAT, "O_CREAT"),
  O_DIRECT: /* @__PURE__ */ __name(() => O_DIRECT, "O_DIRECT"),
  O_DIRECTORY: /* @__PURE__ */ __name(() => O_DIRECTORY, "O_DIRECTORY"),
  O_DSYNC: /* @__PURE__ */ __name(() => O_DSYNC, "O_DSYNC"),
  O_EXCL: /* @__PURE__ */ __name(() => O_EXCL, "O_EXCL"),
  O_NOATIME: /* @__PURE__ */ __name(() => O_NOATIME, "O_NOATIME"),
  O_NOCTTY: /* @__PURE__ */ __name(() => O_NOCTTY, "O_NOCTTY"),
  O_NOFOLLOW: /* @__PURE__ */ __name(() => O_NOFOLLOW, "O_NOFOLLOW"),
  O_NONBLOCK: /* @__PURE__ */ __name(() => O_NONBLOCK, "O_NONBLOCK"),
  O_RDONLY: /* @__PURE__ */ __name(() => O_RDONLY, "O_RDONLY"),
  O_RDWR: /* @__PURE__ */ __name(() => O_RDWR, "O_RDWR"),
  O_SYNC: /* @__PURE__ */ __name(() => O_SYNC, "O_SYNC"),
  O_TRUNC: /* @__PURE__ */ __name(() => O_TRUNC, "O_TRUNC"),
  O_WRONLY: /* @__PURE__ */ __name(() => O_WRONLY, "O_WRONLY"),
  R_OK: /* @__PURE__ */ __name(() => R_OK, "R_OK"),
  S_IFBLK: /* @__PURE__ */ __name(() => S_IFBLK, "S_IFBLK"),
  S_IFCHR: /* @__PURE__ */ __name(() => S_IFCHR, "S_IFCHR"),
  S_IFDIR: /* @__PURE__ */ __name(() => S_IFDIR, "S_IFDIR"),
  S_IFIFO: /* @__PURE__ */ __name(() => S_IFIFO, "S_IFIFO"),
  S_IFLNK: /* @__PURE__ */ __name(() => S_IFLNK, "S_IFLNK"),
  S_IFMT: /* @__PURE__ */ __name(() => S_IFMT, "S_IFMT"),
  S_IFREG: /* @__PURE__ */ __name(() => S_IFREG, "S_IFREG"),
  S_IFSOCK: /* @__PURE__ */ __name(() => S_IFSOCK, "S_IFSOCK"),
  S_IRGRP: /* @__PURE__ */ __name(() => S_IRGRP, "S_IRGRP"),
  S_IROTH: /* @__PURE__ */ __name(() => S_IROTH, "S_IROTH"),
  S_IRUSR: /* @__PURE__ */ __name(() => S_IRUSR, "S_IRUSR"),
  S_IRWXG: /* @__PURE__ */ __name(() => S_IRWXG, "S_IRWXG"),
  S_IRWXO: /* @__PURE__ */ __name(() => S_IRWXO, "S_IRWXO"),
  S_IRWXU: /* @__PURE__ */ __name(() => S_IRWXU, "S_IRWXU"),
  S_IWGRP: /* @__PURE__ */ __name(() => S_IWGRP, "S_IWGRP"),
  S_IWOTH: /* @__PURE__ */ __name(() => S_IWOTH, "S_IWOTH"),
  S_IWUSR: /* @__PURE__ */ __name(() => S_IWUSR, "S_IWUSR"),
  S_IXGRP: /* @__PURE__ */ __name(() => S_IXGRP, "S_IXGRP"),
  S_IXOTH: /* @__PURE__ */ __name(() => S_IXOTH, "S_IXOTH"),
  S_IXUSR: /* @__PURE__ */ __name(() => S_IXUSR, "S_IXUSR"),
  UV_DIRENT_BLOCK: /* @__PURE__ */ __name(() => UV_DIRENT_BLOCK, "UV_DIRENT_BLOCK"),
  UV_DIRENT_CHAR: /* @__PURE__ */ __name(() => UV_DIRENT_CHAR, "UV_DIRENT_CHAR"),
  UV_DIRENT_DIR: /* @__PURE__ */ __name(() => UV_DIRENT_DIR, "UV_DIRENT_DIR"),
  UV_DIRENT_FIFO: /* @__PURE__ */ __name(() => UV_DIRENT_FIFO, "UV_DIRENT_FIFO"),
  UV_DIRENT_FILE: /* @__PURE__ */ __name(() => UV_DIRENT_FILE, "UV_DIRENT_FILE"),
  UV_DIRENT_LINK: /* @__PURE__ */ __name(() => UV_DIRENT_LINK, "UV_DIRENT_LINK"),
  UV_DIRENT_SOCKET: /* @__PURE__ */ __name(() => UV_DIRENT_SOCKET, "UV_DIRENT_SOCKET"),
  UV_DIRENT_UNKNOWN: /* @__PURE__ */ __name(() => UV_DIRENT_UNKNOWN, "UV_DIRENT_UNKNOWN"),
  UV_FS_COPYFILE_EXCL: /* @__PURE__ */ __name(() => UV_FS_COPYFILE_EXCL, "UV_FS_COPYFILE_EXCL"),
  UV_FS_COPYFILE_FICLONE: /* @__PURE__ */ __name(() => UV_FS_COPYFILE_FICLONE, "UV_FS_COPYFILE_FICLONE"),
  UV_FS_COPYFILE_FICLONE_FORCE: /* @__PURE__ */ __name(() => UV_FS_COPYFILE_FICLONE_FORCE, "UV_FS_COPYFILE_FICLONE_FORCE"),
  UV_FS_O_FILEMAP: /* @__PURE__ */ __name(() => UV_FS_O_FILEMAP, "UV_FS_O_FILEMAP"),
  UV_FS_SYMLINK_DIR: /* @__PURE__ */ __name(() => UV_FS_SYMLINK_DIR, "UV_FS_SYMLINK_DIR"),
  UV_FS_SYMLINK_JUNCTION: /* @__PURE__ */ __name(() => UV_FS_SYMLINK_JUNCTION, "UV_FS_SYMLINK_JUNCTION"),
  W_OK: /* @__PURE__ */ __name(() => W_OK, "W_OK"),
  X_OK: /* @__PURE__ */ __name(() => X_OK, "X_OK")
});
var UV_FS_SYMLINK_DIR;
var UV_FS_SYMLINK_JUNCTION;
var O_RDONLY;
var O_WRONLY;
var O_RDWR;
var UV_DIRENT_UNKNOWN;
var UV_DIRENT_FILE;
var UV_DIRENT_DIR;
var UV_DIRENT_LINK;
var UV_DIRENT_FIFO;
var UV_DIRENT_SOCKET;
var UV_DIRENT_CHAR;
var UV_DIRENT_BLOCK;
var EXTENSIONLESS_FORMAT_JAVASCRIPT;
var EXTENSIONLESS_FORMAT_WASM;
var S_IFMT;
var S_IFREG;
var S_IFDIR;
var S_IFCHR;
var S_IFBLK;
var S_IFIFO;
var S_IFLNK;
var S_IFSOCK;
var O_CREAT;
var O_EXCL;
var UV_FS_O_FILEMAP;
var O_NOCTTY;
var O_TRUNC;
var O_APPEND;
var O_DIRECTORY;
var O_NOATIME;
var O_NOFOLLOW;
var O_SYNC;
var O_DSYNC;
var O_DIRECT;
var O_NONBLOCK;
var S_IRWXU;
var S_IRUSR;
var S_IWUSR;
var S_IXUSR;
var S_IRWXG;
var S_IRGRP;
var S_IWGRP;
var S_IXGRP;
var S_IRWXO;
var S_IROTH;
var S_IWOTH;
var S_IXOTH;
var F_OK;
var R_OK;
var W_OK;
var X_OK;
var UV_FS_COPYFILE_EXCL;
var COPYFILE_EXCL;
var UV_FS_COPYFILE_FICLONE;
var COPYFILE_FICLONE;
var UV_FS_COPYFILE_FICLONE_FORCE;
var COPYFILE_FICLONE_FORCE;
var init_constants = __esm({
  "../../../../AppData/Roaming/npm/node_modules/wrangler/node_modules/unenv/dist/runtime/node/internal/fs/constants.mjs"() {
    init_functionsRoutes_0_04524570753253654();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    UV_FS_SYMLINK_DIR = 1;
    UV_FS_SYMLINK_JUNCTION = 2;
    O_RDONLY = 0;
    O_WRONLY = 1;
    O_RDWR = 2;
    UV_DIRENT_UNKNOWN = 0;
    UV_DIRENT_FILE = 1;
    UV_DIRENT_DIR = 2;
    UV_DIRENT_LINK = 3;
    UV_DIRENT_FIFO = 4;
    UV_DIRENT_SOCKET = 5;
    UV_DIRENT_CHAR = 6;
    UV_DIRENT_BLOCK = 7;
    EXTENSIONLESS_FORMAT_JAVASCRIPT = 0;
    EXTENSIONLESS_FORMAT_WASM = 1;
    S_IFMT = 61440;
    S_IFREG = 32768;
    S_IFDIR = 16384;
    S_IFCHR = 8192;
    S_IFBLK = 24576;
    S_IFIFO = 4096;
    S_IFLNK = 40960;
    S_IFSOCK = 49152;
    O_CREAT = 64;
    O_EXCL = 128;
    UV_FS_O_FILEMAP = 0;
    O_NOCTTY = 256;
    O_TRUNC = 512;
    O_APPEND = 1024;
    O_DIRECTORY = 65536;
    O_NOATIME = 262144;
    O_NOFOLLOW = 131072;
    O_SYNC = 1052672;
    O_DSYNC = 4096;
    O_DIRECT = 16384;
    O_NONBLOCK = 2048;
    S_IRWXU = 448;
    S_IRUSR = 256;
    S_IWUSR = 128;
    S_IXUSR = 64;
    S_IRWXG = 56;
    S_IRGRP = 32;
    S_IWGRP = 16;
    S_IXGRP = 8;
    S_IRWXO = 7;
    S_IROTH = 4;
    S_IWOTH = 2;
    S_IXOTH = 1;
    F_OK = 0;
    R_OK = 4;
    W_OK = 2;
    X_OK = 1;
    UV_FS_COPYFILE_EXCL = 1;
    COPYFILE_EXCL = 1;
    UV_FS_COPYFILE_FICLONE = 2;
    COPYFILE_FICLONE = 2;
    UV_FS_COPYFILE_FICLONE_FORCE = 4;
    COPYFILE_FICLONE_FORCE = 4;
  }
});
var promises_default;
var init_promises2 = __esm({
  "../../../../AppData/Roaming/npm/node_modules/wrangler/node_modules/unenv/dist/runtime/node/fs/promises.mjs"() {
    init_functionsRoutes_0_04524570753253654();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_promises();
    init_constants();
    init_promises();
    promises_default = {
      constants: constants_exports,
      access,
      appendFile,
      chmod,
      chown,
      copyFile,
      cp,
      glob,
      lchmod,
      lchown,
      link,
      lstat,
      lutimes,
      mkdir,
      mkdtemp,
      open,
      opendir,
      readFile,
      readdir,
      readlink,
      realpath,
      rename,
      rm,
      rmdir,
      stat,
      statfs,
      symlink,
      truncate,
      unlink,
      utimes,
      watch,
      writeFile
    };
  }
});
var Dir;
var Dirent;
var Stats;
var ReadStream2;
var WriteStream2;
var FileReadStream;
var FileWriteStream;
var init_classes = __esm({
  "../../../../AppData/Roaming/npm/node_modules/wrangler/node_modules/unenv/dist/runtime/node/internal/fs/classes.mjs"() {
    init_functionsRoutes_0_04524570753253654();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_utils();
    Dir = /* @__PURE__ */ notImplementedClass("fs.Dir");
    Dirent = /* @__PURE__ */ notImplementedClass("fs.Dirent");
    Stats = /* @__PURE__ */ notImplementedClass("fs.Stats");
    ReadStream2 = /* @__PURE__ */ notImplementedClass("fs.ReadStream");
    WriteStream2 = /* @__PURE__ */ notImplementedClass("fs.WriteStream");
    FileReadStream = ReadStream2;
    FileWriteStream = WriteStream2;
  }
});
function callbackify(fn) {
  const fnc = /* @__PURE__ */ __name2(function(...args) {
    const cb = args.pop();
    fn().catch((error3) => cb(error3)).then((val) => cb(void 0, val));
  }, "fnc");
  fnc.__promisify__ = fn;
  fnc.native = fnc;
  return fnc;
}
__name(callbackify, "callbackify");
var access2;
var appendFile2;
var chown2;
var chmod2;
var copyFile2;
var cp2;
var lchown2;
var lchmod2;
var link2;
var lstat2;
var lutimes2;
var mkdir2;
var mkdtemp2;
var realpath2;
var open2;
var opendir2;
var readdir2;
var readFile2;
var readlink2;
var rename2;
var rm2;
var rmdir2;
var stat2;
var symlink2;
var truncate2;
var unlink2;
var utimes2;
var writeFile2;
var statfs2;
var close;
var createReadStream;
var createWriteStream;
var exists;
var fchown;
var fchmod;
var fdatasync;
var fstat;
var fsync;
var ftruncate;
var futimes;
var lstatSync;
var read;
var readv;
var realpathSync;
var statSync;
var unwatchFile;
var watch2;
var watchFile;
var write;
var writev;
var _toUnixTimestamp;
var openAsBlob;
var glob2;
var appendFileSync;
var accessSync;
var chownSync;
var chmodSync;
var closeSync;
var copyFileSync;
var cpSync;
var existsSync;
var fchownSync;
var fchmodSync;
var fdatasyncSync;
var fstatSync;
var fsyncSync;
var ftruncateSync;
var futimesSync;
var lchownSync;
var lchmodSync;
var linkSync;
var lutimesSync;
var mkdirSync;
var mkdtempSync;
var openSync;
var opendirSync;
var readdirSync;
var readSync;
var readvSync;
var readFileSync;
var readlinkSync;
var renameSync;
var rmSync;
var rmdirSync;
var symlinkSync;
var truncateSync;
var unlinkSync;
var utimesSync;
var writeFileSync;
var writeSync;
var writevSync;
var statfsSync;
var globSync;
var init_fs = __esm({
  "../../../../AppData/Roaming/npm/node_modules/wrangler/node_modules/unenv/dist/runtime/node/internal/fs/fs.mjs"() {
    init_functionsRoutes_0_04524570753253654();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_utils();
    init_promises();
    __name2(callbackify, "callbackify");
    access2 = callbackify(access);
    appendFile2 = callbackify(appendFile);
    chown2 = callbackify(chown);
    chmod2 = callbackify(chmod);
    copyFile2 = callbackify(copyFile);
    cp2 = callbackify(cp);
    lchown2 = callbackify(lchown);
    lchmod2 = callbackify(lchmod);
    link2 = callbackify(link);
    lstat2 = callbackify(lstat);
    lutimes2 = callbackify(lutimes);
    mkdir2 = callbackify(mkdir);
    mkdtemp2 = callbackify(mkdtemp);
    realpath2 = callbackify(realpath);
    open2 = callbackify(open);
    opendir2 = callbackify(opendir);
    readdir2 = callbackify(readdir);
    readFile2 = callbackify(readFile);
    readlink2 = callbackify(readlink);
    rename2 = callbackify(rename);
    rm2 = callbackify(rm);
    rmdir2 = callbackify(rmdir);
    stat2 = callbackify(stat);
    symlink2 = callbackify(symlink);
    truncate2 = callbackify(truncate);
    unlink2 = callbackify(unlink);
    utimes2 = callbackify(utimes);
    writeFile2 = callbackify(writeFile);
    statfs2 = callbackify(statfs);
    close = /* @__PURE__ */ notImplementedAsync("fs.close");
    createReadStream = /* @__PURE__ */ notImplementedAsync("fs.createReadStream");
    createWriteStream = /* @__PURE__ */ notImplementedAsync("fs.createWriteStream");
    exists = /* @__PURE__ */ notImplementedAsync("fs.exists");
    fchown = /* @__PURE__ */ notImplementedAsync("fs.fchown");
    fchmod = /* @__PURE__ */ notImplementedAsync("fs.fchmod");
    fdatasync = /* @__PURE__ */ notImplementedAsync("fs.fdatasync");
    fstat = /* @__PURE__ */ notImplementedAsync("fs.fstat");
    fsync = /* @__PURE__ */ notImplementedAsync("fs.fsync");
    ftruncate = /* @__PURE__ */ notImplementedAsync("fs.ftruncate");
    futimes = /* @__PURE__ */ notImplementedAsync("fs.futimes");
    lstatSync = /* @__PURE__ */ notImplementedAsync("fs.lstatSync");
    read = /* @__PURE__ */ notImplementedAsync("fs.read");
    readv = /* @__PURE__ */ notImplementedAsync("fs.readv");
    realpathSync = /* @__PURE__ */ notImplementedAsync("fs.realpathSync");
    statSync = /* @__PURE__ */ notImplementedAsync("fs.statSync");
    unwatchFile = /* @__PURE__ */ notImplementedAsync("fs.unwatchFile");
    watch2 = /* @__PURE__ */ notImplementedAsync("fs.watch");
    watchFile = /* @__PURE__ */ notImplementedAsync("fs.watchFile");
    write = /* @__PURE__ */ notImplementedAsync("fs.write");
    writev = /* @__PURE__ */ notImplementedAsync("fs.writev");
    _toUnixTimestamp = /* @__PURE__ */ notImplementedAsync("fs._toUnixTimestamp");
    openAsBlob = /* @__PURE__ */ notImplementedAsync("fs.openAsBlob");
    glob2 = /* @__PURE__ */ notImplementedAsync("fs.glob");
    appendFileSync = /* @__PURE__ */ notImplemented("fs.appendFileSync");
    accessSync = /* @__PURE__ */ notImplemented("fs.accessSync");
    chownSync = /* @__PURE__ */ notImplemented("fs.chownSync");
    chmodSync = /* @__PURE__ */ notImplemented("fs.chmodSync");
    closeSync = /* @__PURE__ */ notImplemented("fs.closeSync");
    copyFileSync = /* @__PURE__ */ notImplemented("fs.copyFileSync");
    cpSync = /* @__PURE__ */ notImplemented("fs.cpSync");
    existsSync = /* @__PURE__ */ __name2(() => false, "existsSync");
    fchownSync = /* @__PURE__ */ notImplemented("fs.fchownSync");
    fchmodSync = /* @__PURE__ */ notImplemented("fs.fchmodSync");
    fdatasyncSync = /* @__PURE__ */ notImplemented("fs.fdatasyncSync");
    fstatSync = /* @__PURE__ */ notImplemented("fs.fstatSync");
    fsyncSync = /* @__PURE__ */ notImplemented("fs.fsyncSync");
    ftruncateSync = /* @__PURE__ */ notImplemented("fs.ftruncateSync");
    futimesSync = /* @__PURE__ */ notImplemented("fs.futimesSync");
    lchownSync = /* @__PURE__ */ notImplemented("fs.lchownSync");
    lchmodSync = /* @__PURE__ */ notImplemented("fs.lchmodSync");
    linkSync = /* @__PURE__ */ notImplemented("fs.linkSync");
    lutimesSync = /* @__PURE__ */ notImplemented("fs.lutimesSync");
    mkdirSync = /* @__PURE__ */ notImplemented("fs.mkdirSync");
    mkdtempSync = /* @__PURE__ */ notImplemented("fs.mkdtempSync");
    openSync = /* @__PURE__ */ notImplemented("fs.openSync");
    opendirSync = /* @__PURE__ */ notImplemented("fs.opendirSync");
    readdirSync = /* @__PURE__ */ notImplemented("fs.readdirSync");
    readSync = /* @__PURE__ */ notImplemented("fs.readSync");
    readvSync = /* @__PURE__ */ notImplemented("fs.readvSync");
    readFileSync = /* @__PURE__ */ notImplemented("fs.readFileSync");
    readlinkSync = /* @__PURE__ */ notImplemented("fs.readlinkSync");
    renameSync = /* @__PURE__ */ notImplemented("fs.renameSync");
    rmSync = /* @__PURE__ */ notImplemented("fs.rmSync");
    rmdirSync = /* @__PURE__ */ notImplemented("fs.rmdirSync");
    symlinkSync = /* @__PURE__ */ notImplemented("fs.symlinkSync");
    truncateSync = /* @__PURE__ */ notImplemented("fs.truncateSync");
    unlinkSync = /* @__PURE__ */ notImplemented("fs.unlinkSync");
    utimesSync = /* @__PURE__ */ notImplemented("fs.utimesSync");
    writeFileSync = /* @__PURE__ */ notImplemented("fs.writeFileSync");
    writeSync = /* @__PURE__ */ notImplemented("fs.writeSync");
    writevSync = /* @__PURE__ */ notImplemented("fs.writevSync");
    statfsSync = /* @__PURE__ */ notImplemented("fs.statfsSync");
    globSync = /* @__PURE__ */ notImplemented("fs.globSync");
  }
});
var fs_default;
var init_fs2 = __esm({
  "../../../../AppData/Roaming/npm/node_modules/wrangler/node_modules/unenv/dist/runtime/node/fs.mjs"() {
    init_functionsRoutes_0_04524570753253654();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_promises2();
    init_classes();
    init_fs();
    init_constants();
    init_constants();
    init_fs();
    init_classes();
    fs_default = {
      F_OK,
      R_OK,
      W_OK,
      X_OK,
      constants: constants_exports,
      promises: promises_default,
      Dir,
      Dirent,
      FileReadStream,
      FileWriteStream,
      ReadStream: ReadStream2,
      Stats,
      WriteStream: WriteStream2,
      _toUnixTimestamp,
      access: access2,
      accessSync,
      appendFile: appendFile2,
      appendFileSync,
      chmod: chmod2,
      chmodSync,
      chown: chown2,
      chownSync,
      close,
      closeSync,
      copyFile: copyFile2,
      copyFileSync,
      cp: cp2,
      cpSync,
      createReadStream,
      createWriteStream,
      exists,
      existsSync,
      fchmod,
      fchmodSync,
      fchown,
      fchownSync,
      fdatasync,
      fdatasyncSync,
      fstat,
      fstatSync,
      fsync,
      fsyncSync,
      ftruncate,
      ftruncateSync,
      futimes,
      futimesSync,
      glob: glob2,
      lchmod: lchmod2,
      globSync,
      lchmodSync,
      lchown: lchown2,
      lchownSync,
      link: link2,
      linkSync,
      lstat: lstat2,
      lstatSync,
      lutimes: lutimes2,
      lutimesSync,
      mkdir: mkdir2,
      mkdirSync,
      mkdtemp: mkdtemp2,
      mkdtempSync,
      open: open2,
      openAsBlob,
      openSync,
      opendir: opendir2,
      opendirSync,
      read,
      readFile: readFile2,
      readFileSync,
      readSync,
      readdir: readdir2,
      readdirSync,
      readlink: readlink2,
      readlinkSync,
      readv,
      readvSync,
      realpath: realpath2,
      realpathSync,
      rename: rename2,
      renameSync,
      rm: rm2,
      rmSync,
      rmdir: rmdir2,
      rmdirSync,
      stat: stat2,
      statSync,
      statfs: statfs2,
      statfsSync,
      symlink: symlink2,
      symlinkSync,
      truncate: truncate2,
      truncateSync,
      unlink: unlink2,
      unlinkSync,
      unwatchFile,
      utimes: utimes2,
      utimesSync,
      watch: watch2,
      watchFile,
      write,
      writeFile: writeFile2,
      writeFileSync,
      writeSync,
      writev,
      writevSync
    };
  }
});
var require_fs = __commonJS({
  "node-built-in-modules:fs"(exports, module) {
    init_functionsRoutes_0_04524570753253654();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_fs2();
    module.exports = fs_default;
  }
});
var require_path = __commonJS({
  "node-built-in-modules:path"(exports, module) {
    init_functionsRoutes_0_04524570753253654();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    module.exports = libDefault;
  }
});
var UV_UDP_REUSEADDR;
var dlopen2;
var errno;
var signals;
var priority;
var init_constants2 = __esm({
  "../../../../AppData/Roaming/npm/node_modules/wrangler/node_modules/unenv/dist/runtime/node/internal/os/constants.mjs"() {
    init_functionsRoutes_0_04524570753253654();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    UV_UDP_REUSEADDR = 4;
    dlopen2 = {
      RTLD_LAZY: 1,
      RTLD_NOW: 2,
      RTLD_GLOBAL: 256,
      RTLD_LOCAL: 0,
      RTLD_DEEPBIND: 8
    };
    errno = {
      E2BIG: 7,
      EACCES: 13,
      EADDRINUSE: 98,
      EADDRNOTAVAIL: 99,
      EAFNOSUPPORT: 97,
      EAGAIN: 11,
      EALREADY: 114,
      EBADF: 9,
      EBADMSG: 74,
      EBUSY: 16,
      ECANCELED: 125,
      ECHILD: 10,
      ECONNABORTED: 103,
      ECONNREFUSED: 111,
      ECONNRESET: 104,
      EDEADLK: 35,
      EDESTADDRREQ: 89,
      EDOM: 33,
      EDQUOT: 122,
      EEXIST: 17,
      EFAULT: 14,
      EFBIG: 27,
      EHOSTUNREACH: 113,
      EIDRM: 43,
      EILSEQ: 84,
      EINPROGRESS: 115,
      EINTR: 4,
      EINVAL: 22,
      EIO: 5,
      EISCONN: 106,
      EISDIR: 21,
      ELOOP: 40,
      EMFILE: 24,
      EMLINK: 31,
      EMSGSIZE: 90,
      EMULTIHOP: 72,
      ENAMETOOLONG: 36,
      ENETDOWN: 100,
      ENETRESET: 102,
      ENETUNREACH: 101,
      ENFILE: 23,
      ENOBUFS: 105,
      ENODATA: 61,
      ENODEV: 19,
      ENOENT: 2,
      ENOEXEC: 8,
      ENOLCK: 37,
      ENOLINK: 67,
      ENOMEM: 12,
      ENOMSG: 42,
      ENOPROTOOPT: 92,
      ENOSPC: 28,
      ENOSR: 63,
      ENOSTR: 60,
      ENOSYS: 38,
      ENOTCONN: 107,
      ENOTDIR: 20,
      ENOTEMPTY: 39,
      ENOTSOCK: 88,
      ENOTSUP: 95,
      ENOTTY: 25,
      ENXIO: 6,
      EOPNOTSUPP: 95,
      EOVERFLOW: 75,
      EPERM: 1,
      EPIPE: 32,
      EPROTO: 71,
      EPROTONOSUPPORT: 93,
      EPROTOTYPE: 91,
      ERANGE: 34,
      EROFS: 30,
      ESPIPE: 29,
      ESRCH: 3,
      ESTALE: 116,
      ETIME: 62,
      ETIMEDOUT: 110,
      ETXTBSY: 26,
      EWOULDBLOCK: 11,
      EXDEV: 18
    };
    signals = {
      SIGHUP: 1,
      SIGINT: 2,
      SIGQUIT: 3,
      SIGILL: 4,
      SIGTRAP: 5,
      SIGABRT: 6,
      SIGIOT: 6,
      SIGBUS: 7,
      SIGFPE: 8,
      SIGKILL: 9,
      SIGUSR1: 10,
      SIGSEGV: 11,
      SIGUSR2: 12,
      SIGPIPE: 13,
      SIGALRM: 14,
      SIGTERM: 15,
      SIGCHLD: 17,
      SIGSTKFLT: 16,
      SIGCONT: 18,
      SIGSTOP: 19,
      SIGTSTP: 20,
      SIGTTIN: 21,
      SIGTTOU: 22,
      SIGURG: 23,
      SIGXCPU: 24,
      SIGXFSZ: 25,
      SIGVTALRM: 26,
      SIGPROF: 27,
      SIGWINCH: 28,
      SIGIO: 29,
      SIGPOLL: 29,
      SIGPWR: 30,
      SIGSYS: 31
    };
    priority = {
      PRIORITY_LOW: 19,
      PRIORITY_BELOW_NORMAL: 10,
      PRIORITY_NORMAL: 0,
      PRIORITY_ABOVE_NORMAL: -7,
      PRIORITY_HIGH: -14,
      PRIORITY_HIGHEST: -20
    };
  }
});
var constants;
var NUM_CPUS;
var availableParallelism;
var arch2;
var machine;
var endianness;
var cpus;
var getPriority;
var setPriority;
var homedir;
var tmpdir;
var devNull;
var freemem;
var totalmem;
var loadavg;
var uptime2;
var hostname;
var networkInterfaces;
var platform2;
var type;
var release2;
var version2;
var userInfo;
var EOL;
var os_default;
var init_os = __esm({
  "../../../../AppData/Roaming/npm/node_modules/wrangler/node_modules/unenv/dist/runtime/node/os.mjs"() {
    init_functionsRoutes_0_04524570753253654();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_utils();
    init_constants2();
    constants = {
      UV_UDP_REUSEADDR,
      dlopen: dlopen2,
      errno,
      signals,
      priority
    };
    NUM_CPUS = 8;
    availableParallelism = /* @__PURE__ */ __name2(() => NUM_CPUS, "availableParallelism");
    arch2 = /* @__PURE__ */ __name2(() => "", "arch");
    machine = /* @__PURE__ */ __name2(() => "", "machine");
    endianness = /* @__PURE__ */ __name2(() => "LE", "endianness");
    cpus = /* @__PURE__ */ __name2(() => {
      const info3 = {
        model: "",
        speed: 0,
        times: {
          user: 0,
          nice: 0,
          sys: 0,
          idle: 0,
          irq: 0
        }
      };
      return Array.from({ length: NUM_CPUS }, () => info3);
    }, "cpus");
    getPriority = /* @__PURE__ */ __name2(() => 0, "getPriority");
    setPriority = /* @__PURE__ */ notImplemented("os.setPriority");
    homedir = /* @__PURE__ */ __name2(() => "/", "homedir");
    tmpdir = /* @__PURE__ */ __name2(() => "/tmp", "tmpdir");
    devNull = "/dev/null";
    freemem = /* @__PURE__ */ __name2(() => 0, "freemem");
    totalmem = /* @__PURE__ */ __name2(() => 0, "totalmem");
    loadavg = /* @__PURE__ */ __name2(() => [
      0,
      0,
      0
    ], "loadavg");
    uptime2 = /* @__PURE__ */ __name2(() => 0, "uptime");
    hostname = /* @__PURE__ */ __name2(() => "", "hostname");
    networkInterfaces = /* @__PURE__ */ __name2(() => {
      return { lo0: [
        {
          address: "127.0.0.1",
          netmask: "255.0.0.0",
          family: "IPv4",
          mac: "00:00:00:00:00:00",
          internal: true,
          cidr: "127.0.0.1/8"
        },
        {
          address: "::1",
          netmask: "ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffff",
          family: "IPv6",
          mac: "00:00:00:00:00:00",
          internal: true,
          cidr: "::1/128",
          scopeid: 0
        },
        {
          address: "fe80::1",
          netmask: "ffff:ffff:ffff:ffff::",
          family: "IPv6",
          mac: "00:00:00:00:00:00",
          internal: true,
          cidr: "fe80::1/64",
          scopeid: 1
        }
      ] };
    }, "networkInterfaces");
    platform2 = /* @__PURE__ */ __name2(() => "linux", "platform");
    type = /* @__PURE__ */ __name2(() => "Linux", "type");
    release2 = /* @__PURE__ */ __name2(() => "", "release");
    version2 = /* @__PURE__ */ __name2(() => "", "version");
    userInfo = /* @__PURE__ */ __name2((opts) => {
      const encode = /* @__PURE__ */ __name2((str) => {
        if (opts?.encoding) {
          const buff = Buffer.from(str);
          return opts.encoding === "buffer" ? buff : buff.toString(opts.encoding);
        }
        return str;
      }, "encode");
      return {
        gid: 1e3,
        uid: 1e3,
        homedir: encode("/"),
        shell: encode("/bin/sh"),
        username: encode("root")
      };
    }, "userInfo");
    EOL = "\n";
    os_default = {
      arch: arch2,
      availableParallelism,
      constants,
      cpus,
      EOL,
      endianness,
      devNull,
      freemem,
      getPriority,
      homedir,
      hostname,
      loadavg,
      machine,
      networkInterfaces,
      platform: platform2,
      release: release2,
      setPriority,
      tmpdir,
      totalmem,
      type,
      uptime: uptime2,
      userInfo,
      version: version2
    };
  }
});
var require_os = __commonJS({
  "node-built-in-modules:os"(exports, module) {
    init_functionsRoutes_0_04524570753253654();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_os();
    module.exports = os_default;
  }
});
var require_crypto = __commonJS({
  "node-built-in-modules:crypto"(exports, module) {
    init_functionsRoutes_0_04524570753253654();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    module.exports = libDefault2;
  }
});
var require_package = __commonJS({
  "../node_modules/dotenv/package.json"(exports, module) {
    module.exports = {
      name: "dotenv",
      version: "16.6.1",
      description: "Loads environment variables from .env file",
      main: "lib/main.js",
      types: "lib/main.d.ts",
      exports: {
        ".": {
          types: "./lib/main.d.ts",
          require: "./lib/main.js",
          default: "./lib/main.js"
        },
        "./config": "./config.js",
        "./config.js": "./config.js",
        "./lib/env-options": "./lib/env-options.js",
        "./lib/env-options.js": "./lib/env-options.js",
        "./lib/cli-options": "./lib/cli-options.js",
        "./lib/cli-options.js": "./lib/cli-options.js",
        "./package.json": "./package.json"
      },
      scripts: {
        "dts-check": "tsc --project tests/types/tsconfig.json",
        lint: "standard",
        pretest: "npm run lint && npm run dts-check",
        test: "tap run --allow-empty-coverage --disable-coverage --timeout=60000",
        "test:coverage": "tap run --show-full-coverage --timeout=60000 --coverage-report=text --coverage-report=lcov",
        prerelease: "npm test",
        release: "standard-version"
      },
      repository: {
        type: "git",
        url: "git://github.com/motdotla/dotenv.git"
      },
      homepage: "https://github.com/motdotla/dotenv#readme",
      funding: "https://dotenvx.com",
      keywords: [
        "dotenv",
        "env",
        ".env",
        "environment",
        "variables",
        "config",
        "settings"
      ],
      readmeFilename: "README.md",
      license: "BSD-2-Clause",
      devDependencies: {
        "@types/node": "^18.11.3",
        decache: "^4.6.2",
        sinon: "^14.0.1",
        standard: "^17.0.0",
        "standard-version": "^9.5.0",
        tap: "^19.2.0",
        typescript: "^4.8.4"
      },
      engines: {
        node: ">=12"
      },
      browser: {
        fs: false
      }
    };
  }
});
var require_main = __commonJS({
  "../node_modules/dotenv/lib/main.js"(exports, module) {
    init_functionsRoutes_0_04524570753253654();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    var fs = require_fs();
    var path = require_path();
    var os = require_os();
    var crypto3 = require_crypto();
    var packageJson = require_package();
    var version7 = packageJson.version;
    var LINE = /(?:^|^)\s*(?:export\s+)?([\w.-]+)(?:\s*=\s*?|:\s+?)(\s*'(?:\\'|[^'])*'|\s*"(?:\\"|[^"])*"|\s*`(?:\\`|[^`])*`|[^#\r\n]+)?\s*(?:#.*)?(?:$|$)/mg;
    function parse2(src) {
      const obj = {};
      let lines = src.toString();
      lines = lines.replace(/\r\n?/mg, "\n");
      let match2;
      while ((match2 = LINE.exec(lines)) != null) {
        const key = match2[1];
        let value = match2[2] || "";
        value = value.trim();
        const maybeQuote = value[0];
        value = value.replace(/^(['"`])([\s\S]*)\1$/mg, "$2");
        if (maybeQuote === '"') {
          value = value.replace(/\\n/g, "\n");
          value = value.replace(/\\r/g, "\r");
        }
        obj[key] = value;
      }
      return obj;
    }
    __name(parse2, "parse2");
    __name2(parse2, "parse");
    function _parseVault(options) {
      options = options || {};
      const vaultPath = _vaultPath(options);
      options.path = vaultPath;
      const result = DotenvModule.configDotenv(options);
      if (!result.parsed) {
        const err = new Error(`MISSING_DATA: Cannot parse ${vaultPath} for an unknown reason`);
        err.code = "MISSING_DATA";
        throw err;
      }
      const keys = _dotenvKey(options).split(",");
      const length = keys.length;
      let decrypted;
      for (let i = 0; i < length; i++) {
        try {
          const key = keys[i].trim();
          const attrs = _instructions(result, key);
          decrypted = DotenvModule.decrypt(attrs.ciphertext, attrs.key);
          break;
        } catch (error3) {
          if (i + 1 >= length) {
            throw error3;
          }
        }
      }
      return DotenvModule.parse(decrypted);
    }
    __name(_parseVault, "_parseVault");
    __name2(_parseVault, "_parseVault");
    function _warn(message) {
      console.log(`[dotenv@${version7}][WARN] ${message}`);
    }
    __name(_warn, "_warn");
    __name2(_warn, "_warn");
    function _debug(message) {
      console.log(`[dotenv@${version7}][DEBUG] ${message}`);
    }
    __name(_debug, "_debug");
    __name2(_debug, "_debug");
    function _log(message) {
      console.log(`[dotenv@${version7}] ${message}`);
    }
    __name(_log, "_log");
    __name2(_log, "_log");
    function _dotenvKey(options) {
      if (options && options.DOTENV_KEY && options.DOTENV_KEY.length > 0) {
        return options.DOTENV_KEY;
      }
      if (process.env.DOTENV_KEY && process.env.DOTENV_KEY.length > 0) {
        return process.env.DOTENV_KEY;
      }
      return "";
    }
    __name(_dotenvKey, "_dotenvKey");
    __name2(_dotenvKey, "_dotenvKey");
    function _instructions(result, dotenvKey) {
      let uri;
      try {
        uri = new URL(dotenvKey);
      } catch (error3) {
        if (error3.code === "ERR_INVALID_URL") {
          const err = new Error("INVALID_DOTENV_KEY: Wrong format. Must be in valid uri format like dotenv://:key_1234@dotenvx.com/vault/.env.vault?environment=development");
          err.code = "INVALID_DOTENV_KEY";
          throw err;
        }
        throw error3;
      }
      const key = uri.password;
      if (!key) {
        const err = new Error("INVALID_DOTENV_KEY: Missing key part");
        err.code = "INVALID_DOTENV_KEY";
        throw err;
      }
      const environment = uri.searchParams.get("environment");
      if (!environment) {
        const err = new Error("INVALID_DOTENV_KEY: Missing environment part");
        err.code = "INVALID_DOTENV_KEY";
        throw err;
      }
      const environmentKey = `DOTENV_VAULT_${environment.toUpperCase()}`;
      const ciphertext = result.parsed[environmentKey];
      if (!ciphertext) {
        const err = new Error(`NOT_FOUND_DOTENV_ENVIRONMENT: Cannot locate environment ${environmentKey} in your .env.vault file.`);
        err.code = "NOT_FOUND_DOTENV_ENVIRONMENT";
        throw err;
      }
      return { ciphertext, key };
    }
    __name(_instructions, "_instructions");
    __name2(_instructions, "_instructions");
    function _vaultPath(options) {
      let possibleVaultPath = null;
      if (options && options.path && options.path.length > 0) {
        if (Array.isArray(options.path)) {
          for (const filepath of options.path) {
            if (fs.existsSync(filepath)) {
              possibleVaultPath = filepath.endsWith(".vault") ? filepath : `${filepath}.vault`;
            }
          }
        } else {
          possibleVaultPath = options.path.endsWith(".vault") ? options.path : `${options.path}.vault`;
        }
      } else {
        possibleVaultPath = path.resolve(process.cwd(), ".env.vault");
      }
      if (fs.existsSync(possibleVaultPath)) {
        return possibleVaultPath;
      }
      return null;
    }
    __name(_vaultPath, "_vaultPath");
    __name2(_vaultPath, "_vaultPath");
    function _resolveHome(envPath) {
      return envPath[0] === "~" ? path.join(os.homedir(), envPath.slice(1)) : envPath;
    }
    __name(_resolveHome, "_resolveHome");
    __name2(_resolveHome, "_resolveHome");
    function _configVault(options) {
      const debug3 = Boolean(options && options.debug);
      const quiet = options && "quiet" in options ? options.quiet : true;
      if (debug3 || !quiet) {
        _log("Loading env from encrypted .env.vault");
      }
      const parsed = DotenvModule._parseVault(options);
      let processEnv = process.env;
      if (options && options.processEnv != null) {
        processEnv = options.processEnv;
      }
      DotenvModule.populate(processEnv, parsed, options);
      return { parsed };
    }
    __name(_configVault, "_configVault");
    __name2(_configVault, "_configVault");
    function configDotenv(options) {
      const dotenvPath = path.resolve(process.cwd(), ".env");
      let encoding = "utf8";
      const debug3 = Boolean(options && options.debug);
      const quiet = options && "quiet" in options ? options.quiet : true;
      if (options && options.encoding) {
        encoding = options.encoding;
      } else {
        if (debug3) {
          _debug("No encoding is specified. UTF-8 is used by default");
        }
      }
      let optionPaths = [dotenvPath];
      if (options && options.path) {
        if (!Array.isArray(options.path)) {
          optionPaths = [_resolveHome(options.path)];
        } else {
          optionPaths = [];
          for (const filepath of options.path) {
            optionPaths.push(_resolveHome(filepath));
          }
        }
      }
      let lastError;
      const parsedAll = {};
      for (const path2 of optionPaths) {
        try {
          const parsed = DotenvModule.parse(fs.readFileSync(path2, { encoding }));
          DotenvModule.populate(parsedAll, parsed, options);
        } catch (e) {
          if (debug3) {
            _debug(`Failed to load ${path2} ${e.message}`);
          }
          lastError = e;
        }
      }
      let processEnv = process.env;
      if (options && options.processEnv != null) {
        processEnv = options.processEnv;
      }
      DotenvModule.populate(processEnv, parsedAll, options);
      if (debug3 || !quiet) {
        const keysCount = Object.keys(parsedAll).length;
        const shortPaths = [];
        for (const filePath of optionPaths) {
          try {
            const relative = path.relative(process.cwd(), filePath);
            shortPaths.push(relative);
          } catch (e) {
            if (debug3) {
              _debug(`Failed to load ${filePath} ${e.message}`);
            }
            lastError = e;
          }
        }
        _log(`injecting env (${keysCount}) from ${shortPaths.join(",")}`);
      }
      if (lastError) {
        return { parsed: parsedAll, error: lastError };
      } else {
        return { parsed: parsedAll };
      }
    }
    __name(configDotenv, "configDotenv");
    __name2(configDotenv, "configDotenv");
    function config2(options) {
      if (_dotenvKey(options).length === 0) {
        return DotenvModule.configDotenv(options);
      }
      const vaultPath = _vaultPath(options);
      if (!vaultPath) {
        _warn(`You set DOTENV_KEY but you are missing a .env.vault file at ${vaultPath}. Did you forget to build it?`);
        return DotenvModule.configDotenv(options);
      }
      return DotenvModule._configVault(options);
    }
    __name(config2, "config2");
    __name2(config2, "config");
    function decrypt(encrypted, keyStr) {
      const key = Buffer.from(keyStr.slice(-64), "hex");
      let ciphertext = Buffer.from(encrypted, "base64");
      const nonce = ciphertext.subarray(0, 12);
      const authTag = ciphertext.subarray(-16);
      ciphertext = ciphertext.subarray(12, -16);
      try {
        const aesgcm = crypto3.createDecipheriv("aes-256-gcm", key, nonce);
        aesgcm.setAuthTag(authTag);
        return `${aesgcm.update(ciphertext)}${aesgcm.final()}`;
      } catch (error3) {
        const isRange = error3 instanceof RangeError;
        const invalidKeyLength = error3.message === "Invalid key length";
        const decryptionFailed = error3.message === "Unsupported state or unable to authenticate data";
        if (isRange || invalidKeyLength) {
          const err = new Error("INVALID_DOTENV_KEY: It must be 64 characters long (or more)");
          err.code = "INVALID_DOTENV_KEY";
          throw err;
        } else if (decryptionFailed) {
          const err = new Error("DECRYPTION_FAILED: Please check your DOTENV_KEY");
          err.code = "DECRYPTION_FAILED";
          throw err;
        } else {
          throw error3;
        }
      }
    }
    __name(decrypt, "decrypt");
    __name2(decrypt, "decrypt");
    function populate(processEnv, parsed, options = {}) {
      const debug3 = Boolean(options && options.debug);
      const override = Boolean(options && options.override);
      if (typeof parsed !== "object") {
        const err = new Error("OBJECT_REQUIRED: Please check the processEnv argument being passed to populate");
        err.code = "OBJECT_REQUIRED";
        throw err;
      }
      for (const key of Object.keys(parsed)) {
        if (Object.prototype.hasOwnProperty.call(processEnv, key)) {
          if (override === true) {
            processEnv[key] = parsed[key];
          }
          if (debug3) {
            if (override === true) {
              _debug(`"${key}" is already defined and WAS overwritten`);
            } else {
              _debug(`"${key}" is already defined and was NOT overwritten`);
            }
          }
        } else {
          processEnv[key] = parsed[key];
        }
      }
    }
    __name(populate, "populate");
    __name2(populate, "populate");
    var DotenvModule = {
      configDotenv,
      _configVault,
      _parseVault,
      config: config2,
      decrypt,
      parse: parse2,
      populate
    };
    module.exports.configDotenv = DotenvModule.configDotenv;
    module.exports._configVault = DotenvModule._configVault;
    module.exports._parseVault = DotenvModule._parseVault;
    module.exports.config = DotenvModule.config;
    module.exports.decrypt = DotenvModule.decrypt;
    module.exports.parse = DotenvModule.parse;
    module.exports.populate = DotenvModule.populate;
    module.exports = DotenvModule;
  }
});
function acceptedDroppedPayload(extra = {}) {
  return {
    ok: true,
    inserted: 0,
    storage: "dropped",
    ...extra
  };
}
__name(acceptedDroppedPayload, "acceptedDroppedPayload");
function readQuery(req) {
  if (req.query && typeof req.query === "object") return req.query;
  try {
    const url = new URL(req.url || "", "http://localhost");
    return Object.fromEntries(url.searchParams.entries());
  } catch (_error) {
    return {};
  }
}
__name(readQuery, "readQuery");
function readPathParts(query) {
  const rawPath = query?.path;
  if (Array.isArray(rawPath)) return rawPath.filter(Boolean);
  return String(rawPath || "").split("/").filter(Boolean);
}
__name(readPathParts, "readPathParts");
async function readJsonBody(req) {
  if (req.body && typeof req.body === "object") return req.body;
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }
  if (!chunks.length) return null;
  const text = Buffer.concat(chunks).toString("utf8");
  try {
    return JSON.parse(text);
  } catch (_error) {
    return null;
  }
}
__name(readJsonBody, "readJsonBody");
async function handler(req, res) {
  const query = readQuery(req);
  const pathParts = readPathParts(query);
  const section = String(pathParts[0] || "").trim().toLowerCase();
  const method = String(req.method || "GET").toUpperCase();
  if (!section) {
    return res.json({ ok: true, service: "analytics", storage: "dropped" });
  }
  if (section === "health") {
    return res.json({ ok: true, service: "analytics", storage: "dropped" });
  }
  if (section === "track" && method === "POST") {
    return res.status(202).json(acceptedDroppedPayload());
  }
  if (section === "error" && method === "POST") {
    return res.status(202).json(acceptedDroppedPayload());
  }
  if (section === "batch" && method === "POST") {
    const body = await readJsonBody(req);
    const events = Array.isArray(body?.events) ? body.events : [];
    return res.status(202).json(acceptedDroppedPayload({
      dropped_count: events.length
    }));
  }
  return res.status(404).json({ message: "Not found" });
}
__name(handler, "handler");
var import_dotenv;
var init_analytics_handler = __esm({
  "../api/analytics-handler.js"() {
    init_functionsRoutes_0_04524570753253654();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    import_dotenv = __toESM(require_main(), 1);
    import_dotenv.default.config();
    import_dotenv.default.config({ path: "backend/.env" });
    __name2(acceptedDroppedPayload, "acceptedDroppedPayload");
    __name2(readQuery, "readQuery");
    __name2(readPathParts, "readPathParts");
    __name2(readJsonBody, "readJsonBody");
    __name2(handler, "handler");
  }
});
function __rest(s, e) {
  var t = {};
  for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
    t[p] = s[p];
  if (s != null && typeof Object.getOwnPropertySymbols === "function")
    for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
      if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
        t[p[i]] = s[p[i]];
    }
  return t;
}
__name(__rest, "__rest");
function __awaiter(thisArg, _arguments, P, generator) {
  function adopt(value) {
    return value instanceof P ? value : new P(function(resolve) {
      resolve(value);
    });
  }
  __name(adopt, "adopt");
  __name2(adopt, "adopt");
  return new (P || (P = Promise))(function(resolve, reject) {
    function fulfilled(value) {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    }
    __name(fulfilled, "fulfilled");
    __name2(fulfilled, "fulfilled");
    function rejected(value) {
      try {
        step(generator["throw"](value));
      } catch (e) {
        reject(e);
      }
    }
    __name(rejected, "rejected");
    __name2(rejected, "rejected");
    function step(result) {
      result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
    }
    __name(step, "step");
    __name2(step, "step");
    step((generator = generator.apply(thisArg, _arguments || [])).next());
  });
}
__name(__awaiter, "__awaiter");
var init_tslib_es6 = __esm({
  "../node_modules/tslib/tslib.es6.mjs"() {
    init_functionsRoutes_0_04524570753253654();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    __name2(__rest, "__rest");
    __name2(__awaiter, "__awaiter");
  }
});
var resolveFetch;
var init_helper = __esm({
  "../node_modules/@supabase/functions-js/dist/module/helper.js"() {
    init_functionsRoutes_0_04524570753253654();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    resolveFetch = /* @__PURE__ */ __name2((customFetch) => {
      if (customFetch) {
        return (...args) => customFetch(...args);
      }
      return (...args) => fetch(...args);
    }, "resolveFetch");
  }
});
var FunctionsError;
var FunctionsFetchError;
var FunctionsRelayError;
var FunctionsHttpError;
var FunctionRegion;
var init_types = __esm({
  "../node_modules/@supabase/functions-js/dist/module/types.js"() {
    init_functionsRoutes_0_04524570753253654();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    FunctionsError = class extends Error {
      static {
        __name(this, "FunctionsError");
      }
      static {
        __name2(this, "FunctionsError");
      }
      constructor(message, name = "FunctionsError", context2) {
        super(message);
        this.name = name;
        this.context = context2;
      }
    };
    FunctionsFetchError = class extends FunctionsError {
      static {
        __name(this, "FunctionsFetchError");
      }
      static {
        __name2(this, "FunctionsFetchError");
      }
      constructor(context2) {
        super("Failed to send a request to the Edge Function", "FunctionsFetchError", context2);
      }
    };
    FunctionsRelayError = class extends FunctionsError {
      static {
        __name(this, "FunctionsRelayError");
      }
      static {
        __name2(this, "FunctionsRelayError");
      }
      constructor(context2) {
        super("Relay Error invoking the Edge Function", "FunctionsRelayError", context2);
      }
    };
    FunctionsHttpError = class extends FunctionsError {
      static {
        __name(this, "FunctionsHttpError");
      }
      static {
        __name2(this, "FunctionsHttpError");
      }
      constructor(context2) {
        super("Edge Function returned a non-2xx status code", "FunctionsHttpError", context2);
      }
    };
    (function(FunctionRegion2) {
      FunctionRegion2["Any"] = "any";
      FunctionRegion2["ApNortheast1"] = "ap-northeast-1";
      FunctionRegion2["ApNortheast2"] = "ap-northeast-2";
      FunctionRegion2["ApSouth1"] = "ap-south-1";
      FunctionRegion2["ApSoutheast1"] = "ap-southeast-1";
      FunctionRegion2["ApSoutheast2"] = "ap-southeast-2";
      FunctionRegion2["CaCentral1"] = "ca-central-1";
      FunctionRegion2["EuCentral1"] = "eu-central-1";
      FunctionRegion2["EuWest1"] = "eu-west-1";
      FunctionRegion2["EuWest2"] = "eu-west-2";
      FunctionRegion2["EuWest3"] = "eu-west-3";
      FunctionRegion2["SaEast1"] = "sa-east-1";
      FunctionRegion2["UsEast1"] = "us-east-1";
      FunctionRegion2["UsWest1"] = "us-west-1";
      FunctionRegion2["UsWest2"] = "us-west-2";
    })(FunctionRegion || (FunctionRegion = {}));
  }
});
var FunctionsClient;
var init_FunctionsClient = __esm({
  "../node_modules/@supabase/functions-js/dist/module/FunctionsClient.js"() {
    init_functionsRoutes_0_04524570753253654();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_tslib_es6();
    init_helper();
    init_types();
    FunctionsClient = class {
      static {
        __name(this, "FunctionsClient");
      }
      static {
        __name2(this, "FunctionsClient");
      }
      /**
       * Creates a new Functions client bound to an Edge Functions URL.
       *
       * @example
       * ```ts
       * import { FunctionsClient, FunctionRegion } from '@supabase/functions-js'
       *
       * const functions = new FunctionsClient('https://xyzcompany.supabase.co/functions/v1', {
       *   headers: { apikey: 'public-anon-key' },
       *   region: FunctionRegion.UsEast1,
       * })
       * ```
       */
      constructor(url, { headers = {}, customFetch, region = FunctionRegion.Any } = {}) {
        this.url = url;
        this.headers = headers;
        this.region = region;
        this.fetch = resolveFetch(customFetch);
      }
      /**
       * Updates the authorization header
       * @param token - the new jwt token sent in the authorisation header
       * @example
       * ```ts
       * functions.setAuth(session.access_token)
       * ```
       */
      setAuth(token) {
        this.headers.Authorization = `Bearer ${token}`;
      }
      /**
       * Invokes a function
       * @param functionName - The name of the Function to invoke.
       * @param options - Options for invoking the Function.
       * @example
       * ```ts
       * const { data, error } = await functions.invoke('hello-world', {
       *   body: { name: 'Ada' },
       * })
       * ```
       */
      invoke(functionName_1) {
        return __awaiter(this, arguments, void 0, function* (functionName, options = {}) {
          var _a2;
          let timeoutId;
          let timeoutController;
          try {
            const { headers, method, body: functionArgs, signal, timeout } = options;
            let _headers = {};
            let { region } = options;
            if (!region) {
              region = this.region;
            }
            const url = new URL(`${this.url}/${functionName}`);
            if (region && region !== "any") {
              _headers["x-region"] = region;
              url.searchParams.set("forceFunctionRegion", region);
            }
            let body;
            if (functionArgs && (headers && !Object.prototype.hasOwnProperty.call(headers, "Content-Type") || !headers)) {
              if (typeof Blob !== "undefined" && functionArgs instanceof Blob || functionArgs instanceof ArrayBuffer) {
                _headers["Content-Type"] = "application/octet-stream";
                body = functionArgs;
              } else if (typeof functionArgs === "string") {
                _headers["Content-Type"] = "text/plain";
                body = functionArgs;
              } else if (typeof FormData !== "undefined" && functionArgs instanceof FormData) {
                body = functionArgs;
              } else {
                _headers["Content-Type"] = "application/json";
                body = JSON.stringify(functionArgs);
              }
            } else {
              body = functionArgs;
            }
            let effectiveSignal = signal;
            if (timeout) {
              timeoutController = new AbortController();
              timeoutId = setTimeout(() => timeoutController.abort(), timeout);
              if (signal) {
                effectiveSignal = timeoutController.signal;
                signal.addEventListener("abort", () => timeoutController.abort());
              } else {
                effectiveSignal = timeoutController.signal;
              }
            }
            const response = yield this.fetch(url.toString(), {
              method: method || "POST",
              // headers priority is (high to low):
              // 1. invoke-level headers
              // 2. client-level headers
              // 3. default Content-Type header
              headers: Object.assign(Object.assign(Object.assign({}, _headers), this.headers), headers),
              body,
              signal: effectiveSignal
            }).catch((fetchError) => {
              throw new FunctionsFetchError(fetchError);
            });
            const isRelayError = response.headers.get("x-relay-error");
            if (isRelayError && isRelayError === "true") {
              throw new FunctionsRelayError(response);
            }
            if (!response.ok) {
              throw new FunctionsHttpError(response);
            }
            let responseType = ((_a2 = response.headers.get("Content-Type")) !== null && _a2 !== void 0 ? _a2 : "text/plain").split(";")[0].trim();
            let data;
            if (responseType === "application/json") {
              data = yield response.json();
            } else if (responseType === "application/octet-stream" || responseType === "application/pdf") {
              data = yield response.blob();
            } else if (responseType === "text/event-stream") {
              data = response;
            } else if (responseType === "multipart/form-data") {
              data = yield response.formData();
            } else {
              data = yield response.text();
            }
            return { data, error: null, response };
          } catch (error3) {
            return {
              data: null,
              error: error3,
              response: error3 instanceof FunctionsHttpError || error3 instanceof FunctionsRelayError ? error3.context : void 0
            };
          } finally {
            if (timeoutId) {
              clearTimeout(timeoutId);
            }
          }
        });
      }
    };
  }
});
var init_module = __esm({
  "../node_modules/@supabase/functions-js/dist/module/index.js"() {
    init_functionsRoutes_0_04524570753253654();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_FunctionsClient();
  }
});
var require_tslib = __commonJS({
  "../node_modules/tslib/tslib.js"(exports, module) {
    init_functionsRoutes_0_04524570753253654();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    var __extends;
    var __assign;
    var __rest2;
    var __decorate;
    var __param;
    var __esDecorate;
    var __runInitializers;
    var __propKey;
    var __setFunctionName;
    var __metadata;
    var __awaiter2;
    var __generator;
    var __exportStar;
    var __values;
    var __read;
    var __spread;
    var __spreadArrays;
    var __spreadArray;
    var __await;
    var __asyncGenerator;
    var __asyncDelegator;
    var __asyncValues;
    var __makeTemplateObject;
    var __importStar;
    var __importDefault;
    var __classPrivateFieldGet;
    var __classPrivateFieldSet;
    var __classPrivateFieldIn;
    var __createBinding;
    var __addDisposableResource;
    var __disposeResources;
    var __rewriteRelativeImportExtension;
    (function(factory) {
      var root = typeof global === "object" ? global : typeof self === "object" ? self : typeof this === "object" ? this : {};
      if (typeof define === "function" && define.amd) {
        define("tslib", ["exports"], function(exports2) {
          factory(createExporter(root, createExporter(exports2)));
        });
      } else if (typeof module === "object" && typeof module.exports === "object") {
        factory(createExporter(root, createExporter(module.exports)));
      } else {
        factory(createExporter(root));
      }
      function createExporter(exports2, previous) {
        if (exports2 !== root) {
          if (typeof Object.create === "function") {
            Object.defineProperty(exports2, "__esModule", { value: true });
          } else {
            exports2.__esModule = true;
          }
        }
        return function(id, v) {
          return exports2[id] = previous ? previous(id, v) : v;
        };
      }
      __name(createExporter, "createExporter");
      __name2(createExporter, "createExporter");
    })(function(exporter) {
      var extendStatics = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(d, b) {
        d.__proto__ = b;
      } || function(d, b) {
        for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p];
      };
      __extends = /* @__PURE__ */ __name2(function(d, b) {
        if (typeof b !== "function" && b !== null)
          throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() {
          this.constructor = d;
        }
        __name(__, "__");
        __name2(__, "__");
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
      }, "__extends");
      __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
          s = arguments[i];
          for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
        }
        return t;
      };
      __rest2 = /* @__PURE__ */ __name2(function(s, e) {
        var t = {};
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
          t[p] = s[p];
        if (s != null && typeof Object.getOwnPropertySymbols === "function")
          for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
              t[p[i]] = s[p[i]];
          }
        return t;
      }, "__rest");
      __decorate = /* @__PURE__ */ __name2(function(decorators, target, key, desc) {
        var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
        if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
        else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
        return c > 3 && r && Object.defineProperty(target, key, r), r;
      }, "__decorate");
      __param = /* @__PURE__ */ __name2(function(paramIndex, decorator) {
        return function(target, key) {
          decorator(target, key, paramIndex);
        };
      }, "__param");
      __esDecorate = /* @__PURE__ */ __name2(function(ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
        function accept(f) {
          if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected");
          return f;
        }
        __name(accept, "accept");
        __name2(accept, "accept");
        var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
        var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
        var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
        var _, done = false;
        for (var i = decorators.length - 1; i >= 0; i--) {
          var context2 = {};
          for (var p in contextIn) context2[p] = p === "access" ? {} : contextIn[p];
          for (var p in contextIn.access) context2.access[p] = contextIn.access[p];
          context2.addInitializer = function(f) {
            if (done) throw new TypeError("Cannot add initializers after decoration has completed");
            extraInitializers.push(accept(f || null));
          };
          var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context2);
          if (kind === "accessor") {
            if (result === void 0) continue;
            if (result === null || typeof result !== "object") throw new TypeError("Object expected");
            if (_ = accept(result.get)) descriptor.get = _;
            if (_ = accept(result.set)) descriptor.set = _;
            if (_ = accept(result.init)) initializers.unshift(_);
          } else if (_ = accept(result)) {
            if (kind === "field") initializers.unshift(_);
            else descriptor[key] = _;
          }
        }
        if (target) Object.defineProperty(target, contextIn.name, descriptor);
        done = true;
      }, "__esDecorate");
      __runInitializers = /* @__PURE__ */ __name2(function(thisArg, initializers, value) {
        var useValue = arguments.length > 2;
        for (var i = 0; i < initializers.length; i++) {
          value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
        }
        return useValue ? value : void 0;
      }, "__runInitializers");
      __propKey = /* @__PURE__ */ __name2(function(x) {
        return typeof x === "symbol" ? x : "".concat(x);
      }, "__propKey");
      __setFunctionName = /* @__PURE__ */ __name2(function(f, name, prefix) {
        if (typeof name === "symbol") name = name.description ? "[".concat(name.description, "]") : "";
        return Object.defineProperty(f, "name", { configurable: true, value: prefix ? "".concat(prefix, " ", name) : name });
      }, "__setFunctionName");
      __metadata = /* @__PURE__ */ __name2(function(metadataKey, metadataValue) {
        if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(metadataKey, metadataValue);
      }, "__metadata");
      __awaiter2 = /* @__PURE__ */ __name2(function(thisArg, _arguments, P, generator) {
        function adopt(value) {
          return value instanceof P ? value : new P(function(resolve) {
            resolve(value);
          });
        }
        __name(adopt, "adopt");
        __name2(adopt, "adopt");
        return new (P || (P = Promise))(function(resolve, reject) {
          function fulfilled(value) {
            try {
              step(generator.next(value));
            } catch (e) {
              reject(e);
            }
          }
          __name(fulfilled, "fulfilled");
          __name2(fulfilled, "fulfilled");
          function rejected(value) {
            try {
              step(generator["throw"](value));
            } catch (e) {
              reject(e);
            }
          }
          __name(rejected, "rejected");
          __name2(rejected, "rejected");
          function step(result) {
            result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
          }
          __name(step, "step");
          __name2(step, "step");
          step((generator = generator.apply(thisArg, _arguments || [])).next());
        });
      }, "__awaiter");
      __generator = /* @__PURE__ */ __name2(function(thisArg, body) {
        var _ = { label: 0, sent: /* @__PURE__ */ __name2(function() {
          if (t[0] & 1) throw t[1];
          return t[1];
        }, "sent"), trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
        return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() {
          return this;
        }), g;
        function verb(n) {
          return function(v) {
            return step([n, v]);
          };
        }
        __name(verb, "verb");
        __name2(verb, "verb");
        function step(op) {
          if (f) throw new TypeError("Generator is already executing.");
          while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
              case 0:
              case 1:
                t = op;
                break;
              case 4:
                _.label++;
                return { value: op[1], done: false };
              case 5:
                _.label++;
                y = op[1];
                op = [0];
                continue;
              case 7:
                op = _.ops.pop();
                _.trys.pop();
                continue;
              default:
                if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) {
                  _ = 0;
                  continue;
                }
                if (op[0] === 3 && (!t || op[1] > t[0] && op[1] < t[3])) {
                  _.label = op[1];
                  break;
                }
                if (op[0] === 6 && _.label < t[1]) {
                  _.label = t[1];
                  t = op;
                  break;
                }
                if (t && _.label < t[2]) {
                  _.label = t[2];
                  _.ops.push(op);
                  break;
                }
                if (t[2]) _.ops.pop();
                _.trys.pop();
                continue;
            }
            op = body.call(thisArg, _);
          } catch (e) {
            op = [6, e];
            y = 0;
          } finally {
            f = t = 0;
          }
          if (op[0] & 5) throw op[1];
          return { value: op[0] ? op[1] : void 0, done: true };
        }
        __name(step, "step");
        __name2(step, "step");
      }, "__generator");
      __exportStar = /* @__PURE__ */ __name2(function(m, o) {
        for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(o, p)) __createBinding(o, m, p);
      }, "__exportStar");
      __createBinding = Object.create ? (function(o, m, k, k2) {
        if (k2 === void 0) k2 = k;
        var desc = Object.getOwnPropertyDescriptor(m, k);
        if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
          desc = { enumerable: true, get: /* @__PURE__ */ __name2(function() {
            return m[k];
          }, "get") };
        }
        Object.defineProperty(o, k2, desc);
      }) : (function(o, m, k, k2) {
        if (k2 === void 0) k2 = k;
        o[k2] = m[k];
      });
      __values = /* @__PURE__ */ __name2(function(o) {
        var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
        if (m) return m.call(o);
        if (o && typeof o.length === "number") return {
          next: /* @__PURE__ */ __name2(function() {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
          }, "next")
        };
        throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
      }, "__values");
      __read = /* @__PURE__ */ __name2(function(o, n) {
        var m = typeof Symbol === "function" && o[Symbol.iterator];
        if (!m) return o;
        var i = m.call(o), r, ar = [], e;
        try {
          while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
        } catch (error3) {
          e = { error: error3 };
        } finally {
          try {
            if (r && !r.done && (m = i["return"])) m.call(i);
          } finally {
            if (e) throw e.error;
          }
        }
        return ar;
      }, "__read");
      __spread = /* @__PURE__ */ __name2(function() {
        for (var ar = [], i = 0; i < arguments.length; i++)
          ar = ar.concat(__read(arguments[i]));
        return ar;
      }, "__spread");
      __spreadArrays = /* @__PURE__ */ __name2(function() {
        for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
        for (var r = Array(s), k = 0, i = 0; i < il; i++)
          for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
        return r;
      }, "__spreadArrays");
      __spreadArray = /* @__PURE__ */ __name2(function(to, from, pack) {
        if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
          if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
          }
        }
        return to.concat(ar || Array.prototype.slice.call(from));
      }, "__spreadArray");
      __await = /* @__PURE__ */ __name2(function(v) {
        return this instanceof __await ? (this.v = v, this) : new __await(v);
      }, "__await");
      __asyncGenerator = /* @__PURE__ */ __name2(function(thisArg, _arguments, generator) {
        if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
        var g = generator.apply(thisArg, _arguments || []), i, q = [];
        return i = Object.create((typeof AsyncIterator === "function" ? AsyncIterator : Object).prototype), verb("next"), verb("throw"), verb("return", awaitReturn), i[Symbol.asyncIterator] = function() {
          return this;
        }, i;
        function awaitReturn(f) {
          return function(v) {
            return Promise.resolve(v).then(f, reject);
          };
        }
        __name(awaitReturn, "awaitReturn");
        __name2(awaitReturn, "awaitReturn");
        function verb(n, f) {
          if (g[n]) {
            i[n] = function(v) {
              return new Promise(function(a, b) {
                q.push([n, v, a, b]) > 1 || resume(n, v);
              });
            };
            if (f) i[n] = f(i[n]);
          }
        }
        __name(verb, "verb");
        __name2(verb, "verb");
        function resume(n, v) {
          try {
            step(g[n](v));
          } catch (e) {
            settle(q[0][3], e);
          }
        }
        __name(resume, "resume");
        __name2(resume, "resume");
        function step(r) {
          r.value instanceof __await ? Promise.resolve(r.value.v).then(fulfill, reject) : settle(q[0][2], r);
        }
        __name(step, "step");
        __name2(step, "step");
        function fulfill(value) {
          resume("next", value);
        }
        __name(fulfill, "fulfill");
        __name2(fulfill, "fulfill");
        function reject(value) {
          resume("throw", value);
        }
        __name(reject, "reject");
        __name2(reject, "reject");
        function settle(f, v) {
          if (f(v), q.shift(), q.length) resume(q[0][0], q[0][1]);
        }
        __name(settle, "settle");
        __name2(settle, "settle");
      }, "__asyncGenerator");
      __asyncDelegator = /* @__PURE__ */ __name2(function(o) {
        var i, p;
        return i = {}, verb("next"), verb("throw", function(e) {
          throw e;
        }), verb("return"), i[Symbol.iterator] = function() {
          return this;
        }, i;
        function verb(n, f) {
          i[n] = o[n] ? function(v) {
            return (p = !p) ? { value: __await(o[n](v)), done: false } : f ? f(v) : v;
          } : f;
        }
        __name(verb, "verb");
        __name2(verb, "verb");
      }, "__asyncDelegator");
      __asyncValues = /* @__PURE__ */ __name2(function(o) {
        if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
        var m = o[Symbol.asyncIterator], i;
        return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function() {
          return this;
        }, i);
        function verb(n) {
          i[n] = o[n] && function(v) {
            return new Promise(function(resolve, reject) {
              v = o[n](v), settle(resolve, reject, v.done, v.value);
            });
          };
        }
        __name(verb, "verb");
        __name2(verb, "verb");
        function settle(resolve, reject, d, v) {
          Promise.resolve(v).then(function(v2) {
            resolve({ value: v2, done: d });
          }, reject);
        }
        __name(settle, "settle");
        __name2(settle, "settle");
      }, "__asyncValues");
      __makeTemplateObject = /* @__PURE__ */ __name2(function(cooked, raw) {
        if (Object.defineProperty) {
          Object.defineProperty(cooked, "raw", { value: raw });
        } else {
          cooked.raw = raw;
        }
        return cooked;
      }, "__makeTemplateObject");
      var __setModuleDefault = Object.create ? (function(o, v) {
        Object.defineProperty(o, "default", { enumerable: true, value: v });
      }) : function(o, v) {
        o["default"] = v;
      };
      var ownKeys = /* @__PURE__ */ __name2(function(o) {
        ownKeys = Object.getOwnPropertyNames || function(o2) {
          var ar = [];
          for (var k in o2) if (Object.prototype.hasOwnProperty.call(o2, k)) ar[ar.length] = k;
          return ar;
        };
        return ownKeys(o);
      }, "ownKeys");
      __importStar = /* @__PURE__ */ __name2(function(mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) {
          for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        }
        __setModuleDefault(result, mod);
        return result;
      }, "__importStar");
      __importDefault = /* @__PURE__ */ __name2(function(mod) {
        return mod && mod.__esModule ? mod : { "default": mod };
      }, "__importDefault");
      __classPrivateFieldGet = /* @__PURE__ */ __name2(function(receiver, state, kind, f) {
        if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
        if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
        return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
      }, "__classPrivateFieldGet");
      __classPrivateFieldSet = /* @__PURE__ */ __name2(function(receiver, state, value, kind, f) {
        if (kind === "m") throw new TypeError("Private method is not writable");
        if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
        if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
        return kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value), value;
      }, "__classPrivateFieldSet");
      __classPrivateFieldIn = /* @__PURE__ */ __name2(function(state, receiver) {
        if (receiver === null || typeof receiver !== "object" && typeof receiver !== "function") throw new TypeError("Cannot use 'in' operator on non-object");
        return typeof state === "function" ? receiver === state : state.has(receiver);
      }, "__classPrivateFieldIn");
      __addDisposableResource = /* @__PURE__ */ __name2(function(env2, value, async) {
        if (value !== null && value !== void 0) {
          if (typeof value !== "object" && typeof value !== "function") throw new TypeError("Object expected.");
          var dispose, inner;
          if (async) {
            if (!Symbol.asyncDispose) throw new TypeError("Symbol.asyncDispose is not defined.");
            dispose = value[Symbol.asyncDispose];
          }
          if (dispose === void 0) {
            if (!Symbol.dispose) throw new TypeError("Symbol.dispose is not defined.");
            dispose = value[Symbol.dispose];
            if (async) inner = dispose;
          }
          if (typeof dispose !== "function") throw new TypeError("Object not disposable.");
          if (inner) dispose = /* @__PURE__ */ __name2(function() {
            try {
              inner.call(this);
            } catch (e) {
              return Promise.reject(e);
            }
          }, "dispose");
          env2.stack.push({ value, dispose, async });
        } else if (async) {
          env2.stack.push({ async: true });
        }
        return value;
      }, "__addDisposableResource");
      var _SuppressedError = typeof SuppressedError === "function" ? SuppressedError : function(error3, suppressed, message) {
        var e = new Error(message);
        return e.name = "SuppressedError", e.error = error3, e.suppressed = suppressed, e;
      };
      __disposeResources = /* @__PURE__ */ __name2(function(env2) {
        function fail(e) {
          env2.error = env2.hasError ? new _SuppressedError(e, env2.error, "An error was suppressed during disposal.") : e;
          env2.hasError = true;
        }
        __name(fail, "fail");
        __name2(fail, "fail");
        var r, s = 0;
        function next() {
          while (r = env2.stack.pop()) {
            try {
              if (!r.async && s === 1) return s = 0, env2.stack.push(r), Promise.resolve().then(next);
              if (r.dispose) {
                var result = r.dispose.call(r.value);
                if (r.async) return s |= 2, Promise.resolve(result).then(next, function(e) {
                  fail(e);
                  return next();
                });
              } else s |= 1;
            } catch (e) {
              fail(e);
            }
          }
          if (s === 1) return env2.hasError ? Promise.reject(env2.error) : Promise.resolve();
          if (env2.hasError) throw env2.error;
        }
        __name(next, "next");
        __name2(next, "next");
        return next();
      }, "__disposeResources");
      __rewriteRelativeImportExtension = /* @__PURE__ */ __name2(function(path, preserveJsx) {
        if (typeof path === "string" && /^\.\.?\//.test(path)) {
          return path.replace(/\.(tsx)$|((?:\.d)?)((?:\.[^./]+?)?)\.([cm]?)ts$/i, function(m, tsx, d, ext, cm) {
            return tsx ? preserveJsx ? ".jsx" : ".js" : d && (!ext || !cm) ? m : d + ext + "." + cm.toLowerCase() + "js";
          });
        }
        return path;
      }, "__rewriteRelativeImportExtension");
      exporter("__extends", __extends);
      exporter("__assign", __assign);
      exporter("__rest", __rest2);
      exporter("__decorate", __decorate);
      exporter("__param", __param);
      exporter("__esDecorate", __esDecorate);
      exporter("__runInitializers", __runInitializers);
      exporter("__propKey", __propKey);
      exporter("__setFunctionName", __setFunctionName);
      exporter("__metadata", __metadata);
      exporter("__awaiter", __awaiter2);
      exporter("__generator", __generator);
      exporter("__exportStar", __exportStar);
      exporter("__createBinding", __createBinding);
      exporter("__values", __values);
      exporter("__read", __read);
      exporter("__spread", __spread);
      exporter("__spreadArrays", __spreadArrays);
      exporter("__spreadArray", __spreadArray);
      exporter("__await", __await);
      exporter("__asyncGenerator", __asyncGenerator);
      exporter("__asyncDelegator", __asyncDelegator);
      exporter("__asyncValues", __asyncValues);
      exporter("__makeTemplateObject", __makeTemplateObject);
      exporter("__importStar", __importStar);
      exporter("__importDefault", __importDefault);
      exporter("__classPrivateFieldGet", __classPrivateFieldGet);
      exporter("__classPrivateFieldSet", __classPrivateFieldSet);
      exporter("__classPrivateFieldIn", __classPrivateFieldIn);
      exporter("__addDisposableResource", __addDisposableResource);
      exporter("__disposeResources", __disposeResources);
      exporter("__rewriteRelativeImportExtension", __rewriteRelativeImportExtension);
    });
  }
});
var require_PostgrestError = __commonJS({
  "../node_modules/@supabase/postgrest-js/dist/cjs/PostgrestError.js"(exports) {
    "use strict";
    init_functionsRoutes_0_04524570753253654();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    Object.defineProperty(exports, "__esModule", { value: true });
    var PostgrestError2 = class extends Error {
      static {
        __name(this, "PostgrestError2");
      }
      static {
        __name2(this, "PostgrestError");
      }
      /**
       * @example
       * ```ts
       * import PostgrestError from '@supabase/postgrest-js'
       *
       * throw new PostgrestError({
       *   message: 'Row level security prevented the request',
       *   details: 'RLS denied the insert',
       *   hint: 'Check your policies',
       *   code: 'PGRST301',
       * })
       * ```
       */
      constructor(context2) {
        super(context2.message);
        this.name = "PostgrestError";
        this.details = context2.details;
        this.hint = context2.hint;
        this.code = context2.code;
      }
    };
    exports.default = PostgrestError2;
  }
});
var require_PostgrestBuilder = __commonJS({
  "../node_modules/@supabase/postgrest-js/dist/cjs/PostgrestBuilder.js"(exports) {
    "use strict";
    init_functionsRoutes_0_04524570753253654();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    Object.defineProperty(exports, "__esModule", { value: true });
    var tslib_1 = require_tslib();
    var PostgrestError_1 = tslib_1.__importDefault(require_PostgrestError());
    var PostgrestBuilder2 = class {
      static {
        __name(this, "PostgrestBuilder2");
      }
      static {
        __name2(this, "PostgrestBuilder");
      }
      /**
       * Creates a builder configured for a specific PostgREST request.
       *
       * @example
       * ```ts
       * import PostgrestQueryBuilder from '@supabase/postgrest-js'
       *
       * const builder = new PostgrestQueryBuilder(
       *   new URL('https://xyzcompany.supabase.co/rest/v1/users'),
       *   { headers: new Headers({ apikey: 'public-anon-key' }) }
       * )
       * ```
       */
      constructor(builder) {
        var _a2, _b;
        this.shouldThrowOnError = false;
        this.method = builder.method;
        this.url = builder.url;
        this.headers = new Headers(builder.headers);
        this.schema = builder.schema;
        this.body = builder.body;
        this.shouldThrowOnError = (_a2 = builder.shouldThrowOnError) !== null && _a2 !== void 0 ? _a2 : false;
        this.signal = builder.signal;
        this.isMaybeSingle = (_b = builder.isMaybeSingle) !== null && _b !== void 0 ? _b : false;
        if (builder.fetch) {
          this.fetch = builder.fetch;
        } else {
          this.fetch = fetch;
        }
      }
      /**
       * If there's an error with the query, throwOnError will reject the promise by
       * throwing the error instead of returning it as part of a successful response.
       *
       * {@link https://github.com/supabase/supabase-js/issues/92}
       */
      throwOnError() {
        this.shouldThrowOnError = true;
        return this;
      }
      /**
       * Set an HTTP header for the request.
       */
      setHeader(name, value) {
        this.headers = new Headers(this.headers);
        this.headers.set(name, value);
        return this;
      }
      then(onfulfilled, onrejected) {
        if (this.schema === void 0) {
        } else if (["GET", "HEAD"].includes(this.method)) {
          this.headers.set("Accept-Profile", this.schema);
        } else {
          this.headers.set("Content-Profile", this.schema);
        }
        if (this.method !== "GET" && this.method !== "HEAD") {
          this.headers.set("Content-Type", "application/json");
        }
        const _fetch = this.fetch;
        let res = _fetch(this.url.toString(), {
          method: this.method,
          headers: this.headers,
          body: JSON.stringify(this.body),
          signal: this.signal
        }).then(async (res2) => {
          var _a2, _b, _c, _d;
          let error3 = null;
          let data = null;
          let count3 = null;
          let status = res2.status;
          let statusText = res2.statusText;
          if (res2.ok) {
            if (this.method !== "HEAD") {
              const body = await res2.text();
              if (body === "") {
              } else if (this.headers.get("Accept") === "text/csv") {
                data = body;
              } else if (this.headers.get("Accept") && ((_a2 = this.headers.get("Accept")) === null || _a2 === void 0 ? void 0 : _a2.includes("application/vnd.pgrst.plan+text"))) {
                data = body;
              } else {
                data = JSON.parse(body);
              }
            }
            const countHeader = (_b = this.headers.get("Prefer")) === null || _b === void 0 ? void 0 : _b.match(/count=(exact|planned|estimated)/);
            const contentRange = (_c = res2.headers.get("content-range")) === null || _c === void 0 ? void 0 : _c.split("/");
            if (countHeader && contentRange && contentRange.length > 1) {
              count3 = parseInt(contentRange[1]);
            }
            if (this.isMaybeSingle && this.method === "GET" && Array.isArray(data)) {
              if (data.length > 1) {
                error3 = {
                  // https://github.com/PostgREST/postgrest/blob/a867d79c42419af16c18c3fb019eba8df992626f/src/PostgREST/Error.hs#L553
                  code: "PGRST116",
                  details: `Results contain ${data.length} rows, application/vnd.pgrst.object+json requires 1 row`,
                  hint: null,
                  message: "JSON object requested, multiple (or no) rows returned"
                };
                data = null;
                count3 = null;
                status = 406;
                statusText = "Not Acceptable";
              } else if (data.length === 1) {
                data = data[0];
              } else {
                data = null;
              }
            }
          } else {
            const body = await res2.text();
            try {
              error3 = JSON.parse(body);
              if (Array.isArray(error3) && res2.status === 404) {
                data = [];
                error3 = null;
                status = 200;
                statusText = "OK";
              }
            } catch (_e) {
              if (res2.status === 404 && body === "") {
                status = 204;
                statusText = "No Content";
              } else {
                error3 = {
                  message: body
                };
              }
            }
            if (error3 && this.isMaybeSingle && ((_d = error3 === null || error3 === void 0 ? void 0 : error3.details) === null || _d === void 0 ? void 0 : _d.includes("0 rows"))) {
              error3 = null;
              status = 200;
              statusText = "OK";
            }
            if (error3 && this.shouldThrowOnError) {
              throw new PostgrestError_1.default(error3);
            }
          }
          const postgrestResponse = {
            error: error3,
            data,
            count: count3,
            status,
            statusText
          };
          return postgrestResponse;
        });
        if (!this.shouldThrowOnError) {
          res = res.catch((fetchError) => {
            var _a2, _b, _c, _d, _e, _f;
            let errorDetails = "";
            const cause = fetchError === null || fetchError === void 0 ? void 0 : fetchError.cause;
            if (cause) {
              const causeMessage = (_a2 = cause === null || cause === void 0 ? void 0 : cause.message) !== null && _a2 !== void 0 ? _a2 : "";
              const causeCode = (_b = cause === null || cause === void 0 ? void 0 : cause.code) !== null && _b !== void 0 ? _b : "";
              errorDetails = `${(_c = fetchError === null || fetchError === void 0 ? void 0 : fetchError.name) !== null && _c !== void 0 ? _c : "FetchError"}: ${fetchError === null || fetchError === void 0 ? void 0 : fetchError.message}`;
              errorDetails += `

Caused by: ${(_d = cause === null || cause === void 0 ? void 0 : cause.name) !== null && _d !== void 0 ? _d : "Error"}: ${causeMessage}`;
              if (causeCode) {
                errorDetails += ` (${causeCode})`;
              }
              if (cause === null || cause === void 0 ? void 0 : cause.stack) {
                errorDetails += `
${cause.stack}`;
              }
            } else {
              errorDetails = (_e = fetchError === null || fetchError === void 0 ? void 0 : fetchError.stack) !== null && _e !== void 0 ? _e : "";
            }
            return {
              error: {
                message: `${(_f = fetchError === null || fetchError === void 0 ? void 0 : fetchError.name) !== null && _f !== void 0 ? _f : "FetchError"}: ${fetchError === null || fetchError === void 0 ? void 0 : fetchError.message}`,
                details: errorDetails,
                hint: "",
                code: ""
              },
              data: null,
              count: null,
              status: 0,
              statusText: ""
            };
          });
        }
        return res.then(onfulfilled, onrejected);
      }
      /**
       * Override the type of the returned `data`.
       *
       * @typeParam NewResult - The new result type to override with
       * @deprecated Use overrideTypes<yourType, { merge: false }>() method at the end of your call chain instead
       */
      returns() {
        return this;
      }
      /**
       * Override the type of the returned `data` field in the response.
       *
       * @typeParam NewResult - The new type to cast the response data to
       * @typeParam Options - Optional type configuration (defaults to { merge: true })
       * @typeParam Options.merge - When true, merges the new type with existing return type. When false, replaces the existing types entirely (defaults to true)
       * @example
       * ```typescript
       * // Merge with existing types (default behavior)
       * const query = supabase
       *   .from('users')
       *   .select()
       *   .overrideTypes<{ custom_field: string }>()
       *
       * // Replace existing types completely
       * const replaceQuery = supabase
       *   .from('users')
       *   .select()
       *   .overrideTypes<{ id: number; name: string }, { merge: false }>()
       * ```
       * @returns A PostgrestBuilder instance with the new type
       */
      overrideTypes() {
        return this;
      }
    };
    exports.default = PostgrestBuilder2;
  }
});
var require_PostgrestTransformBuilder = __commonJS({
  "../node_modules/@supabase/postgrest-js/dist/cjs/PostgrestTransformBuilder.js"(exports) {
    "use strict";
    init_functionsRoutes_0_04524570753253654();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    Object.defineProperty(exports, "__esModule", { value: true });
    var tslib_1 = require_tslib();
    var PostgrestBuilder_1 = tslib_1.__importDefault(require_PostgrestBuilder());
    var PostgrestTransformBuilder2 = class extends PostgrestBuilder_1.default {
      static {
        __name(this, "PostgrestTransformBuilder2");
      }
      static {
        __name2(this, "PostgrestTransformBuilder");
      }
      /**
       * Perform a SELECT on the query result.
       *
       * By default, `.insert()`, `.update()`, `.upsert()`, and `.delete()` do not
       * return modified rows. By calling this method, modified rows are returned in
       * `data`.
       *
       * @param columns - The columns to retrieve, separated by commas
       */
      select(columns) {
        let quoted = false;
        const cleanedColumns = (columns !== null && columns !== void 0 ? columns : "*").split("").map((c) => {
          if (/\s/.test(c) && !quoted) {
            return "";
          }
          if (c === '"') {
            quoted = !quoted;
          }
          return c;
        }).join("");
        this.url.searchParams.set("select", cleanedColumns);
        this.headers.append("Prefer", "return=representation");
        return this;
      }
      /**
       * Order the query result by `column`.
       *
       * You can call this method multiple times to order by multiple columns.
       *
       * You can order referenced tables, but it only affects the ordering of the
       * parent table if you use `!inner` in the query.
       *
       * @param column - The column to order by
       * @param options - Named parameters
       * @param options.ascending - If `true`, the result will be in ascending order
       * @param options.nullsFirst - If `true`, `null`s appear first. If `false`,
       * `null`s appear last.
       * @param options.referencedTable - Set this to order a referenced table by
       * its columns
       * @param options.foreignTable - Deprecated, use `options.referencedTable`
       * instead
       */
      order(column, { ascending = true, nullsFirst, foreignTable, referencedTable = foreignTable } = {}) {
        const key = referencedTable ? `${referencedTable}.order` : "order";
        const existingOrder = this.url.searchParams.get(key);
        this.url.searchParams.set(key, `${existingOrder ? `${existingOrder},` : ""}${column}.${ascending ? "asc" : "desc"}${nullsFirst === void 0 ? "" : nullsFirst ? ".nullsfirst" : ".nullslast"}`);
        return this;
      }
      /**
       * Limit the query result by `count`.
       *
       * @param count - The maximum number of rows to return
       * @param options - Named parameters
       * @param options.referencedTable - Set this to limit rows of referenced
       * tables instead of the parent table
       * @param options.foreignTable - Deprecated, use `options.referencedTable`
       * instead
       */
      limit(count3, { foreignTable, referencedTable = foreignTable } = {}) {
        const key = typeof referencedTable === "undefined" ? "limit" : `${referencedTable}.limit`;
        this.url.searchParams.set(key, `${count3}`);
        return this;
      }
      /**
       * Limit the query result by starting at an offset `from` and ending at the offset `to`.
       * Only records within this range are returned.
       * This respects the query order and if there is no order clause the range could behave unexpectedly.
       * The `from` and `to` values are 0-based and inclusive: `range(1, 3)` will include the second, third
       * and fourth rows of the query.
       *
       * @param from - The starting index from which to limit the result
       * @param to - The last index to which to limit the result
       * @param options - Named parameters
       * @param options.referencedTable - Set this to limit rows of referenced
       * tables instead of the parent table
       * @param options.foreignTable - Deprecated, use `options.referencedTable`
       * instead
       */
      range(from, to, { foreignTable, referencedTable = foreignTable } = {}) {
        const keyOffset = typeof referencedTable === "undefined" ? "offset" : `${referencedTable}.offset`;
        const keyLimit = typeof referencedTable === "undefined" ? "limit" : `${referencedTable}.limit`;
        this.url.searchParams.set(keyOffset, `${from}`);
        this.url.searchParams.set(keyLimit, `${to - from + 1}`);
        return this;
      }
      /**
       * Set the AbortSignal for the fetch request.
       *
       * @param signal - The AbortSignal to use for the fetch request
       */
      abortSignal(signal) {
        this.signal = signal;
        return this;
      }
      /**
       * Return `data` as a single object instead of an array of objects.
       *
       * Query result must be one row (e.g. using `.limit(1)`), otherwise this
       * returns an error.
       */
      single() {
        this.headers.set("Accept", "application/vnd.pgrst.object+json");
        return this;
      }
      /**
       * Return `data` as a single object instead of an array of objects.
       *
       * Query result must be zero or one row (e.g. using `.limit(1)`), otherwise
       * this returns an error.
       */
      maybeSingle() {
        if (this.method === "GET") {
          this.headers.set("Accept", "application/json");
        } else {
          this.headers.set("Accept", "application/vnd.pgrst.object+json");
        }
        this.isMaybeSingle = true;
        return this;
      }
      /**
       * Return `data` as a string in CSV format.
       */
      csv() {
        this.headers.set("Accept", "text/csv");
        return this;
      }
      /**
       * Return `data` as an object in [GeoJSON](https://geojson.org) format.
       */
      geojson() {
        this.headers.set("Accept", "application/geo+json");
        return this;
      }
      /**
       * Return `data` as the EXPLAIN plan for the query.
       *
       * You need to enable the
       * [db_plan_enabled](https://supabase.com/docs/guides/database/debugging-performance#enabling-explain)
       * setting before using this method.
       *
       * @param options - Named parameters
       *
       * @param options.analyze - If `true`, the query will be executed and the
       * actual run time will be returned
       *
       * @param options.verbose - If `true`, the query identifier will be returned
       * and `data` will include the output columns of the query
       *
       * @param options.settings - If `true`, include information on configuration
       * parameters that affect query planning
       *
       * @param options.buffers - If `true`, include information on buffer usage
       *
       * @param options.wal - If `true`, include information on WAL record generation
       *
       * @param options.format - The format of the output, can be `"text"` (default)
       * or `"json"`
       */
      explain({ analyze = false, verbose = false, settings = false, buffers = false, wal = false, format = "text" } = {}) {
        var _a2;
        const options = [
          analyze ? "analyze" : null,
          verbose ? "verbose" : null,
          settings ? "settings" : null,
          buffers ? "buffers" : null,
          wal ? "wal" : null
        ].filter(Boolean).join("|");
        const forMediatype = (_a2 = this.headers.get("Accept")) !== null && _a2 !== void 0 ? _a2 : "application/json";
        this.headers.set("Accept", `application/vnd.pgrst.plan+${format}; for="${forMediatype}"; options=${options};`);
        if (format === "json") {
          return this;
        } else {
          return this;
        }
      }
      /**
       * Rollback the query.
       *
       * `data` will still be returned, but the query is not committed.
       */
      rollback() {
        this.headers.append("Prefer", "tx=rollback");
        return this;
      }
      /**
       * Override the type of the returned `data`.
       *
       * @typeParam NewResult - The new result type to override with
       * @deprecated Use overrideTypes<yourType, { merge: false }>() method at the end of your call chain instead
       */
      returns() {
        return this;
      }
      /**
       * Set the maximum number of rows that can be affected by the query.
       * Only available in PostgREST v13+ and only works with PATCH and DELETE methods.
       *
       * @param value - The maximum number of rows that can be affected
       */
      maxAffected(value) {
        this.headers.append("Prefer", "handling=strict");
        this.headers.append("Prefer", `max-affected=${value}`);
        return this;
      }
    };
    exports.default = PostgrestTransformBuilder2;
  }
});
var require_PostgrestFilterBuilder = __commonJS({
  "../node_modules/@supabase/postgrest-js/dist/cjs/PostgrestFilterBuilder.js"(exports) {
    "use strict";
    init_functionsRoutes_0_04524570753253654();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    Object.defineProperty(exports, "__esModule", { value: true });
    var tslib_1 = require_tslib();
    var PostgrestTransformBuilder_1 = tslib_1.__importDefault(require_PostgrestTransformBuilder());
    var PostgrestReservedCharsRegexp = new RegExp("[,()]");
    var PostgrestFilterBuilder2 = class extends PostgrestTransformBuilder_1.default {
      static {
        __name(this, "PostgrestFilterBuilder2");
      }
      static {
        __name2(this, "PostgrestFilterBuilder");
      }
      /**
       * Match only rows where `column` is equal to `value`.
       *
       * To check if the value of `column` is NULL, you should use `.is()` instead.
       *
       * @param column - The column to filter on
       * @param value - The value to filter with
       */
      eq(column, value) {
        this.url.searchParams.append(column, `eq.${value}`);
        return this;
      }
      /**
       * Match only rows where `column` is not equal to `value`.
       *
       * @param column - The column to filter on
       * @param value - The value to filter with
       */
      neq(column, value) {
        this.url.searchParams.append(column, `neq.${value}`);
        return this;
      }
      /**
       * Match only rows where `column` is greater than `value`.
       *
       * @param column - The column to filter on
       * @param value - The value to filter with
       */
      gt(column, value) {
        this.url.searchParams.append(column, `gt.${value}`);
        return this;
      }
      /**
       * Match only rows where `column` is greater than or equal to `value`.
       *
       * @param column - The column to filter on
       * @param value - The value to filter with
       */
      gte(column, value) {
        this.url.searchParams.append(column, `gte.${value}`);
        return this;
      }
      /**
       * Match only rows where `column` is less than `value`.
       *
       * @param column - The column to filter on
       * @param value - The value to filter with
       */
      lt(column, value) {
        this.url.searchParams.append(column, `lt.${value}`);
        return this;
      }
      /**
       * Match only rows where `column` is less than or equal to `value`.
       *
       * @param column - The column to filter on
       * @param value - The value to filter with
       */
      lte(column, value) {
        this.url.searchParams.append(column, `lte.${value}`);
        return this;
      }
      /**
       * Match only rows where `column` matches `pattern` case-sensitively.
       *
       * @param column - The column to filter on
       * @param pattern - The pattern to match with
       */
      like(column, pattern) {
        this.url.searchParams.append(column, `like.${pattern}`);
        return this;
      }
      /**
       * Match only rows where `column` matches all of `patterns` case-sensitively.
       *
       * @param column - The column to filter on
       * @param patterns - The patterns to match with
       */
      likeAllOf(column, patterns) {
        this.url.searchParams.append(column, `like(all).{${patterns.join(",")}}`);
        return this;
      }
      /**
       * Match only rows where `column` matches any of `patterns` case-sensitively.
       *
       * @param column - The column to filter on
       * @param patterns - The patterns to match with
       */
      likeAnyOf(column, patterns) {
        this.url.searchParams.append(column, `like(any).{${patterns.join(",")}}`);
        return this;
      }
      /**
       * Match only rows where `column` matches `pattern` case-insensitively.
       *
       * @param column - The column to filter on
       * @param pattern - The pattern to match with
       */
      ilike(column, pattern) {
        this.url.searchParams.append(column, `ilike.${pattern}`);
        return this;
      }
      /**
       * Match only rows where `column` matches all of `patterns` case-insensitively.
       *
       * @param column - The column to filter on
       * @param patterns - The patterns to match with
       */
      ilikeAllOf(column, patterns) {
        this.url.searchParams.append(column, `ilike(all).{${patterns.join(",")}}`);
        return this;
      }
      /**
       * Match only rows where `column` matches any of `patterns` case-insensitively.
       *
       * @param column - The column to filter on
       * @param patterns - The patterns to match with
       */
      ilikeAnyOf(column, patterns) {
        this.url.searchParams.append(column, `ilike(any).{${patterns.join(",")}}`);
        return this;
      }
      /**
       * Match only rows where `column` matches the PostgreSQL regex `pattern`
       * case-sensitively (using the `~` operator).
       *
       * @param column - The column to filter on
       * @param pattern - The PostgreSQL regular expression pattern to match with
       */
      regexMatch(column, pattern) {
        this.url.searchParams.append(column, `match.${pattern}`);
        return this;
      }
      /**
       * Match only rows where `column` matches the PostgreSQL regex `pattern`
       * case-insensitively (using the `~*` operator).
       *
       * @param column - The column to filter on
       * @param pattern - The PostgreSQL regular expression pattern to match with
       */
      regexIMatch(column, pattern) {
        this.url.searchParams.append(column, `imatch.${pattern}`);
        return this;
      }
      /**
       * Match only rows where `column` IS `value`.
       *
       * For non-boolean columns, this is only relevant for checking if the value of
       * `column` is NULL by setting `value` to `null`.
       *
       * For boolean columns, you can also set `value` to `true` or `false` and it
       * will behave the same way as `.eq()`.
       *
       * @param column - The column to filter on
       * @param value - The value to filter with
       */
      is(column, value) {
        this.url.searchParams.append(column, `is.${value}`);
        return this;
      }
      /**
       * Match only rows where `column` IS DISTINCT FROM `value`.
       *
       * Unlike `.neq()`, this treats `NULL` as a comparable value. Two `NULL` values
       * are considered equal (not distinct), and comparing `NULL` with any non-NULL
       * value returns true (distinct).
       *
       * @param column - The column to filter on
       * @param value - The value to filter with
       */
      isDistinct(column, value) {
        this.url.searchParams.append(column, `isdistinct.${value}`);
        return this;
      }
      /**
       * Match only rows where `column` is included in the `values` array.
       *
       * @param column - The column to filter on
       * @param values - The values array to filter with
       */
      in(column, values) {
        const cleanedValues = Array.from(new Set(values)).map((s) => {
          if (typeof s === "string" && PostgrestReservedCharsRegexp.test(s))
            return `"${s}"`;
          else
            return `${s}`;
        }).join(",");
        this.url.searchParams.append(column, `in.(${cleanedValues})`);
        return this;
      }
      /**
       * Only relevant for jsonb, array, and range columns. Match only rows where
       * `column` contains every element appearing in `value`.
       *
       * @param column - The jsonb, array, or range column to filter on
       * @param value - The jsonb, array, or range value to filter with
       */
      contains(column, value) {
        if (typeof value === "string") {
          this.url.searchParams.append(column, `cs.${value}`);
        } else if (Array.isArray(value)) {
          this.url.searchParams.append(column, `cs.{${value.join(",")}}`);
        } else {
          this.url.searchParams.append(column, `cs.${JSON.stringify(value)}`);
        }
        return this;
      }
      /**
       * Only relevant for jsonb, array, and range columns. Match only rows where
       * every element appearing in `column` is contained by `value`.
       *
       * @param column - The jsonb, array, or range column to filter on
       * @param value - The jsonb, array, or range value to filter with
       */
      containedBy(column, value) {
        if (typeof value === "string") {
          this.url.searchParams.append(column, `cd.${value}`);
        } else if (Array.isArray(value)) {
          this.url.searchParams.append(column, `cd.{${value.join(",")}}`);
        } else {
          this.url.searchParams.append(column, `cd.${JSON.stringify(value)}`);
        }
        return this;
      }
      /**
       * Only relevant for range columns. Match only rows where every element in
       * `column` is greater than any element in `range`.
       *
       * @param column - The range column to filter on
       * @param range - The range to filter with
       */
      rangeGt(column, range) {
        this.url.searchParams.append(column, `sr.${range}`);
        return this;
      }
      /**
       * Only relevant for range columns. Match only rows where every element in
       * `column` is either contained in `range` or greater than any element in
       * `range`.
       *
       * @param column - The range column to filter on
       * @param range - The range to filter with
       */
      rangeGte(column, range) {
        this.url.searchParams.append(column, `nxl.${range}`);
        return this;
      }
      /**
       * Only relevant for range columns. Match only rows where every element in
       * `column` is less than any element in `range`.
       *
       * @param column - The range column to filter on
       * @param range - The range to filter with
       */
      rangeLt(column, range) {
        this.url.searchParams.append(column, `sl.${range}`);
        return this;
      }
      /**
       * Only relevant for range columns. Match only rows where every element in
       * `column` is either contained in `range` or less than any element in
       * `range`.
       *
       * @param column - The range column to filter on
       * @param range - The range to filter with
       */
      rangeLte(column, range) {
        this.url.searchParams.append(column, `nxr.${range}`);
        return this;
      }
      /**
       * Only relevant for range columns. Match only rows where `column` is
       * mutually exclusive to `range` and there can be no element between the two
       * ranges.
       *
       * @param column - The range column to filter on
       * @param range - The range to filter with
       */
      rangeAdjacent(column, range) {
        this.url.searchParams.append(column, `adj.${range}`);
        return this;
      }
      /**
       * Only relevant for array and range columns. Match only rows where
       * `column` and `value` have an element in common.
       *
       * @param column - The array or range column to filter on
       * @param value - The array or range value to filter with
       */
      overlaps(column, value) {
        if (typeof value === "string") {
          this.url.searchParams.append(column, `ov.${value}`);
        } else {
          this.url.searchParams.append(column, `ov.{${value.join(",")}}`);
        }
        return this;
      }
      /**
       * Only relevant for text and tsvector columns. Match only rows where
       * `column` matches the query string in `query`.
       *
       * @param column - The text or tsvector column to filter on
       * @param query - The query text to match with
       * @param options - Named parameters
       * @param options.config - The text search configuration to use
       * @param options.type - Change how the `query` text is interpreted
       */
      textSearch(column, query, { config: config2, type: type2 } = {}) {
        let typePart = "";
        if (type2 === "plain") {
          typePart = "pl";
        } else if (type2 === "phrase") {
          typePart = "ph";
        } else if (type2 === "websearch") {
          typePart = "w";
        }
        const configPart = config2 === void 0 ? "" : `(${config2})`;
        this.url.searchParams.append(column, `${typePart}fts${configPart}.${query}`);
        return this;
      }
      /**
       * Match only rows where each column in `query` keys is equal to its
       * associated value. Shorthand for multiple `.eq()`s.
       *
       * @param query - The object to filter with, with column names as keys mapped
       * to their filter values
       */
      match(query) {
        Object.entries(query).forEach(([column, value]) => {
          this.url.searchParams.append(column, `eq.${value}`);
        });
        return this;
      }
      /**
       * Match only rows which doesn't satisfy the filter.
       *
       * Unlike most filters, `opearator` and `value` are used as-is and need to
       * follow [PostgREST
       * syntax](https://postgrest.org/en/stable/api.html#operators). You also need
       * to make sure they are properly sanitized.
       *
       * @param column - The column to filter on
       * @param operator - The operator to be negated to filter with, following
       * PostgREST syntax
       * @param value - The value to filter with, following PostgREST syntax
       */
      not(column, operator, value) {
        this.url.searchParams.append(column, `not.${operator}.${value}`);
        return this;
      }
      /**
       * Match only rows which satisfy at least one of the filters.
       *
       * Unlike most filters, `filters` is used as-is and needs to follow [PostgREST
       * syntax](https://postgrest.org/en/stable/api.html#operators). You also need
       * to make sure it's properly sanitized.
       *
       * It's currently not possible to do an `.or()` filter across multiple tables.
       *
       * @param filters - The filters to use, following PostgREST syntax
       * @param options - Named parameters
       * @param options.referencedTable - Set this to filter on referenced tables
       * instead of the parent table
       * @param options.foreignTable - Deprecated, use `referencedTable` instead
       */
      or(filters, { foreignTable, referencedTable = foreignTable } = {}) {
        const key = referencedTable ? `${referencedTable}.or` : "or";
        this.url.searchParams.append(key, `(${filters})`);
        return this;
      }
      /**
       * Match only rows which satisfy the filter. This is an escape hatch - you
       * should use the specific filter methods wherever possible.
       *
       * Unlike most filters, `opearator` and `value` are used as-is and need to
       * follow [PostgREST
       * syntax](https://postgrest.org/en/stable/api.html#operators). You also need
       * to make sure they are properly sanitized.
       *
       * @param column - The column to filter on
       * @param operator - The operator to filter with, following PostgREST syntax
       * @param value - The value to filter with, following PostgREST syntax
       */
      filter(column, operator, value) {
        this.url.searchParams.append(column, `${operator}.${value}`);
        return this;
      }
    };
    exports.default = PostgrestFilterBuilder2;
  }
});
var require_PostgrestQueryBuilder = __commonJS({
  "../node_modules/@supabase/postgrest-js/dist/cjs/PostgrestQueryBuilder.js"(exports) {
    "use strict";
    init_functionsRoutes_0_04524570753253654();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    Object.defineProperty(exports, "__esModule", { value: true });
    var tslib_1 = require_tslib();
    var PostgrestFilterBuilder_1 = tslib_1.__importDefault(require_PostgrestFilterBuilder());
    var PostgrestQueryBuilder2 = class {
      static {
        __name(this, "PostgrestQueryBuilder2");
      }
      static {
        __name2(this, "PostgrestQueryBuilder");
      }
      /**
       * Creates a query builder scoped to a Postgres table or view.
       *
       * @example
       * ```ts
       * import PostgrestQueryBuilder from '@supabase/postgrest-js'
       *
       * const query = new PostgrestQueryBuilder(
       *   new URL('https://xyzcompany.supabase.co/rest/v1/users'),
       *   { headers: { apikey: 'public-anon-key' } }
       * )
       * ```
       */
      constructor(url, { headers = {}, schema, fetch: fetch2 }) {
        this.url = url;
        this.headers = new Headers(headers);
        this.schema = schema;
        this.fetch = fetch2;
      }
      /**
       * Perform a SELECT query on the table or view.
       *
       * @param columns - The columns to retrieve, separated by commas. Columns can be renamed when returned with `customName:columnName`
       *
       * @param options - Named parameters
       *
       * @param options.head - When set to `true`, `data` will not be returned.
       * Useful if you only need the count.
       *
       * @param options.count - Count algorithm to use to count rows in the table or view.
       *
       * `"exact"`: Exact but slow count algorithm. Performs a `COUNT(*)` under the
       * hood.
       *
       * `"planned"`: Approximated but fast count algorithm. Uses the Postgres
       * statistics under the hood.
       *
       * `"estimated"`: Uses exact count for low numbers and planned count for high
       * numbers.
       */
      select(columns, options) {
        const { head: head2 = false, count: count3 } = options !== null && options !== void 0 ? options : {};
        const method = head2 ? "HEAD" : "GET";
        let quoted = false;
        const cleanedColumns = (columns !== null && columns !== void 0 ? columns : "*").split("").map((c) => {
          if (/\s/.test(c) && !quoted) {
            return "";
          }
          if (c === '"') {
            quoted = !quoted;
          }
          return c;
        }).join("");
        this.url.searchParams.set("select", cleanedColumns);
        if (count3) {
          this.headers.append("Prefer", `count=${count3}`);
        }
        return new PostgrestFilterBuilder_1.default({
          method,
          url: this.url,
          headers: this.headers,
          schema: this.schema,
          fetch: this.fetch
        });
      }
      /**
       * Perform an INSERT into the table or view.
       *
       * By default, inserted rows are not returned. To return it, chain the call
       * with `.select()`.
       *
       * @param values - The values to insert. Pass an object to insert a single row
       * or an array to insert multiple rows.
       *
       * @param options - Named parameters
       *
       * @param options.count - Count algorithm to use to count inserted rows.
       *
       * `"exact"`: Exact but slow count algorithm. Performs a `COUNT(*)` under the
       * hood.
       *
       * `"planned"`: Approximated but fast count algorithm. Uses the Postgres
       * statistics under the hood.
       *
       * `"estimated"`: Uses exact count for low numbers and planned count for high
       * numbers.
       *
       * @param options.defaultToNull - Make missing fields default to `null`.
       * Otherwise, use the default value for the column. Only applies for bulk
       * inserts.
       */
      insert(values, { count: count3, defaultToNull = true } = {}) {
        var _a2;
        const method = "POST";
        if (count3) {
          this.headers.append("Prefer", `count=${count3}`);
        }
        if (!defaultToNull) {
          this.headers.append("Prefer", `missing=default`);
        }
        if (Array.isArray(values)) {
          const columns = values.reduce((acc, x) => acc.concat(Object.keys(x)), []);
          if (columns.length > 0) {
            const uniqueColumns = [...new Set(columns)].map((column) => `"${column}"`);
            this.url.searchParams.set("columns", uniqueColumns.join(","));
          }
        }
        return new PostgrestFilterBuilder_1.default({
          method,
          url: this.url,
          headers: this.headers,
          schema: this.schema,
          body: values,
          fetch: (_a2 = this.fetch) !== null && _a2 !== void 0 ? _a2 : fetch
        });
      }
      /**
      * Perform an UPSERT on the table or view. Depending on the column(s) passed
      * to `onConflict`, `.upsert()` allows you to perform the equivalent of
      * `.insert()` if a row with the corresponding `onConflict` columns doesn't
      * exist, or if it does exist, perform an alternative action depending on
      * `ignoreDuplicates`.
      *
      * By default, upserted rows are not returned. To return it, chain the call
      * with `.select()`.
      *
      * @param values - The values to upsert with. Pass an object to upsert a
      * single row or an array to upsert multiple rows.
      *
      * @param options - Named parameters
      *
      * @param options.onConflict - Comma-separated UNIQUE column(s) to specify how
      * duplicate rows are determined. Two rows are duplicates if all the
      * `onConflict` columns are equal.
      *
      * @param options.ignoreDuplicates - If `true`, duplicate rows are ignored. If
      * `false`, duplicate rows are merged with existing rows.
      *
      * @param options.count - Count algorithm to use to count upserted rows.
      *
      * `"exact"`: Exact but slow count algorithm. Performs a `COUNT(*)` under the
      * hood.
      *
      * `"planned"`: Approximated but fast count algorithm. Uses the Postgres
      * statistics under the hood.
      *
      * `"estimated"`: Uses exact count for low numbers and planned count for high
      * numbers.
      *
      * @param options.defaultToNull - Make missing fields default to `null`.
      * Otherwise, use the default value for the column. This only applies when
      * inserting new rows, not when merging with existing rows under
      * `ignoreDuplicates: false`. This also only applies when doing bulk upserts.
      *
      * @example Upsert a single row using a unique key
      * ```ts
      * // Upserting a single row, overwriting based on the 'username' unique column
      * const { data, error } = await supabase
      *   .from('users')
      *   .upsert({ username: 'supabot' }, { onConflict: 'username' })
      *
      * // Example response:
      * // {
      * //   data: [
      * //     { id: 4, message: 'bar', username: 'supabot' }
      * //   ],
      * //   error: null
      * // }
      * ```
      *
      * @example Upsert with conflict resolution and exact row counting
      * ```ts
      * // Upserting and returning exact count
      * const { data, error, count } = await supabase
      *   .from('users')
      *   .upsert(
      *     {
      *       id: 3,
      *       message: 'foo',
      *       username: 'supabot'
      *     },
      *     {
      *       onConflict: 'username',
      *       count: 'exact'
      *     }
      *   )
      *
      * // Example response:
      * // {
      * //   data: [
      * //     {
      * //       id: 42,
      * //       handle: "saoirse",
      * //       display_name: "Saoirse"
      * //     }
      * //   ],
      * //   count: 1,
      * //   error: null
      * // }
      * ```
      */
      upsert(values, { onConflict, ignoreDuplicates = false, count: count3, defaultToNull = true } = {}) {
        var _a2;
        const method = "POST";
        this.headers.append("Prefer", `resolution=${ignoreDuplicates ? "ignore" : "merge"}-duplicates`);
        if (onConflict !== void 0)
          this.url.searchParams.set("on_conflict", onConflict);
        if (count3) {
          this.headers.append("Prefer", `count=${count3}`);
        }
        if (!defaultToNull) {
          this.headers.append("Prefer", "missing=default");
        }
        if (Array.isArray(values)) {
          const columns = values.reduce((acc, x) => acc.concat(Object.keys(x)), []);
          if (columns.length > 0) {
            const uniqueColumns = [...new Set(columns)].map((column) => `"${column}"`);
            this.url.searchParams.set("columns", uniqueColumns.join(","));
          }
        }
        return new PostgrestFilterBuilder_1.default({
          method,
          url: this.url,
          headers: this.headers,
          schema: this.schema,
          body: values,
          fetch: (_a2 = this.fetch) !== null && _a2 !== void 0 ? _a2 : fetch
        });
      }
      /**
       * Perform an UPDATE on the table or view.
       *
       * By default, updated rows are not returned. To return it, chain the call
       * with `.select()` after filters.
       *
       * @param values - The values to update with
       *
       * @param options - Named parameters
       *
       * @param options.count - Count algorithm to use to count updated rows.
       *
       * `"exact"`: Exact but slow count algorithm. Performs a `COUNT(*)` under the
       * hood.
       *
       * `"planned"`: Approximated but fast count algorithm. Uses the Postgres
       * statistics under the hood.
       *
       * `"estimated"`: Uses exact count for low numbers and planned count for high
       * numbers.
       */
      update(values, { count: count3 } = {}) {
        var _a2;
        const method = "PATCH";
        if (count3) {
          this.headers.append("Prefer", `count=${count3}`);
        }
        return new PostgrestFilterBuilder_1.default({
          method,
          url: this.url,
          headers: this.headers,
          schema: this.schema,
          body: values,
          fetch: (_a2 = this.fetch) !== null && _a2 !== void 0 ? _a2 : fetch
        });
      }
      /**
       * Perform a DELETE on the table or view.
       *
       * By default, deleted rows are not returned. To return it, chain the call
       * with `.select()` after filters.
       *
       * @param options - Named parameters
       *
       * @param options.count - Count algorithm to use to count deleted rows.
       *
       * `"exact"`: Exact but slow count algorithm. Performs a `COUNT(*)` under the
       * hood.
       *
       * `"planned"`: Approximated but fast count algorithm. Uses the Postgres
       * statistics under the hood.
       *
       * `"estimated"`: Uses exact count for low numbers and planned count for high
       * numbers.
       */
      delete({ count: count3 } = {}) {
        var _a2;
        const method = "DELETE";
        if (count3) {
          this.headers.append("Prefer", `count=${count3}`);
        }
        return new PostgrestFilterBuilder_1.default({
          method,
          url: this.url,
          headers: this.headers,
          schema: this.schema,
          fetch: (_a2 = this.fetch) !== null && _a2 !== void 0 ? _a2 : fetch
        });
      }
    };
    exports.default = PostgrestQueryBuilder2;
  }
});
var require_PostgrestClient = __commonJS({
  "../node_modules/@supabase/postgrest-js/dist/cjs/PostgrestClient.js"(exports) {
    "use strict";
    init_functionsRoutes_0_04524570753253654();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    Object.defineProperty(exports, "__esModule", { value: true });
    var tslib_1 = require_tslib();
    var PostgrestQueryBuilder_1 = tslib_1.__importDefault(require_PostgrestQueryBuilder());
    var PostgrestFilterBuilder_1 = tslib_1.__importDefault(require_PostgrestFilterBuilder());
    var PostgrestClient2 = class _PostgrestClient {
      static {
        __name(this, "_PostgrestClient");
      }
      static {
        __name2(this, "PostgrestClient");
      }
      // TODO: Add back shouldThrowOnError once we figure out the typings
      /**
       * Creates a PostgREST client.
       *
       * @param url - URL of the PostgREST endpoint
       * @param options - Named parameters
       * @param options.headers - Custom headers
       * @param options.schema - Postgres schema to switch to
       * @param options.fetch - Custom fetch
       * @example
       * ```ts
       * import PostgrestClient from '@supabase/postgrest-js'
       *
       * const postgrest = new PostgrestClient('https://xyzcompany.supabase.co/rest/v1', {
       *   headers: { apikey: 'public-anon-key' },
       *   schema: 'public',
       * })
       * ```
       */
      constructor(url, { headers = {}, schema, fetch: fetch2 } = {}) {
        this.url = url;
        this.headers = new Headers(headers);
        this.schemaName = schema;
        this.fetch = fetch2;
      }
      /**
       * Perform a query on a table or a view.
       *
       * @param relation - The table or view name to query
       */
      from(relation) {
        if (!relation || typeof relation !== "string" || relation.trim() === "") {
          throw new Error("Invalid relation name: relation must be a non-empty string.");
        }
        const url = new URL(`${this.url}/${relation}`);
        return new PostgrestQueryBuilder_1.default(url, {
          headers: new Headers(this.headers),
          schema: this.schemaName,
          fetch: this.fetch
        });
      }
      /**
       * Select a schema to query or perform an function (rpc) call.
       *
       * The schema needs to be on the list of exposed schemas inside Supabase.
       *
       * @param schema - The schema to query
       */
      schema(schema) {
        return new _PostgrestClient(this.url, {
          headers: this.headers,
          schema,
          fetch: this.fetch
        });
      }
      /**
       * Perform a function call.
       *
       * @param fn - The function name to call
       * @param args - The arguments to pass to the function call
       * @param options - Named parameters
       * @param options.head - When set to `true`, `data` will not be returned.
       * Useful if you only need the count.
       * @param options.get - When set to `true`, the function will be called with
       * read-only access mode.
       * @param options.count - Count algorithm to use to count rows returned by the
       * function. Only applicable for [set-returning
       * functions](https://www.postgresql.org/docs/current/functions-srf.html).
       *
       * `"exact"`: Exact but slow count algorithm. Performs a `COUNT(*)` under the
       * hood.
       *
       * `"planned"`: Approximated but fast count algorithm. Uses the Postgres
       * statistics under the hood.
       *
       * `"estimated"`: Uses exact count for low numbers and planned count for high
       * numbers.
       */
      rpc(fn, args = {}, { head: head2 = false, get: get2 = false, count: count3 } = {}) {
        var _a2;
        let method;
        const url = new URL(`${this.url}/rpc/${fn}`);
        let body;
        if (head2 || get2) {
          method = head2 ? "HEAD" : "GET";
          Object.entries(args).filter(([_, value]) => value !== void 0).map(([name, value]) => [name, Array.isArray(value) ? `{${value.join(",")}}` : `${value}`]).forEach(([name, value]) => {
            url.searchParams.append(name, value);
          });
        } else {
          method = "POST";
          body = args;
        }
        const headers = new Headers(this.headers);
        if (count3) {
          headers.set("Prefer", `count=${count3}`);
        }
        return new PostgrestFilterBuilder_1.default({
          method,
          url,
          headers,
          schema: this.schemaName,
          body,
          fetch: (_a2 = this.fetch) !== null && _a2 !== void 0 ? _a2 : fetch
        });
      }
    };
    exports.default = PostgrestClient2;
  }
});
var require_cjs = __commonJS({
  "../node_modules/@supabase/postgrest-js/dist/cjs/index.js"(exports) {
    "use strict";
    init_functionsRoutes_0_04524570753253654();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.PostgrestError = exports.PostgrestBuilder = exports.PostgrestTransformBuilder = exports.PostgrestFilterBuilder = exports.PostgrestQueryBuilder = exports.PostgrestClient = void 0;
    var tslib_1 = require_tslib();
    var PostgrestClient_1 = tslib_1.__importDefault(require_PostgrestClient());
    exports.PostgrestClient = PostgrestClient_1.default;
    var PostgrestQueryBuilder_1 = tslib_1.__importDefault(require_PostgrestQueryBuilder());
    exports.PostgrestQueryBuilder = PostgrestQueryBuilder_1.default;
    var PostgrestFilterBuilder_1 = tslib_1.__importDefault(require_PostgrestFilterBuilder());
    exports.PostgrestFilterBuilder = PostgrestFilterBuilder_1.default;
    var PostgrestTransformBuilder_1 = tslib_1.__importDefault(require_PostgrestTransformBuilder());
    exports.PostgrestTransformBuilder = PostgrestTransformBuilder_1.default;
    var PostgrestBuilder_1 = tslib_1.__importDefault(require_PostgrestBuilder());
    exports.PostgrestBuilder = PostgrestBuilder_1.default;
    var PostgrestError_1 = tslib_1.__importDefault(require_PostgrestError());
    exports.PostgrestError = PostgrestError_1.default;
    exports.default = {
      PostgrestClient: PostgrestClient_1.default,
      PostgrestQueryBuilder: PostgrestQueryBuilder_1.default,
      PostgrestFilterBuilder: PostgrestFilterBuilder_1.default,
      PostgrestTransformBuilder: PostgrestTransformBuilder_1.default,
      PostgrestBuilder: PostgrestBuilder_1.default,
      PostgrestError: PostgrestError_1.default
    };
  }
});
var index;
var PostgrestClient;
var PostgrestQueryBuilder;
var PostgrestFilterBuilder;
var PostgrestTransformBuilder;
var PostgrestBuilder;
var PostgrestError;
var init_wrapper = __esm({
  "../node_modules/@supabase/postgrest-js/dist/esm/wrapper.mjs"() {
    init_functionsRoutes_0_04524570753253654();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    index = __toESM(require_cjs(), 1);
    ({
      PostgrestClient,
      PostgrestQueryBuilder,
      PostgrestFilterBuilder,
      PostgrestTransformBuilder,
      PostgrestBuilder,
      PostgrestError
    } = index.default || index);
  }
});
var WebSocketFactory;
var websocket_factory_default;
var init_websocket_factory = __esm({
  "../node_modules/@supabase/realtime-js/dist/module/lib/websocket-factory.js"() {
    init_functionsRoutes_0_04524570753253654();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    WebSocketFactory = class {
      static {
        __name(this, "WebSocketFactory");
      }
      static {
        __name2(this, "WebSocketFactory");
      }
      /**
       * Static-only utility – prevent instantiation.
       */
      constructor() {
      }
      static detectEnvironment() {
        var _a2;
        if (typeof WebSocket !== "undefined") {
          return { type: "native", constructor: WebSocket };
        }
        if (typeof globalThis !== "undefined" && typeof globalThis.WebSocket !== "undefined") {
          return { type: "native", constructor: globalThis.WebSocket };
        }
        if (typeof global !== "undefined" && typeof global.WebSocket !== "undefined") {
          return { type: "native", constructor: global.WebSocket };
        }
        if (typeof globalThis !== "undefined" && typeof globalThis.WebSocketPair !== "undefined" && typeof globalThis.WebSocket === "undefined") {
          return {
            type: "cloudflare",
            error: "Cloudflare Workers detected. WebSocket clients are not supported in Cloudflare Workers.",
            workaround: "Use Cloudflare Workers WebSocket API for server-side WebSocket handling, or deploy to a different runtime."
          };
        }
        if (typeof globalThis !== "undefined" && globalThis.EdgeRuntime || typeof navigator !== "undefined" && ((_a2 = "Cloudflare-Workers") === null || _a2 === void 0 ? void 0 : _a2.includes("Vercel-Edge"))) {
          return {
            type: "unsupported",
            error: "Edge runtime detected (Vercel Edge/Netlify Edge). WebSockets are not supported in edge functions.",
            workaround: "Use serverless functions or a different deployment target for WebSocket functionality."
          };
        }
        if (typeof process !== "undefined") {
          const processVersions = process["versions"];
          if (processVersions && processVersions["node"]) {
            const versionString = processVersions["node"];
            const nodeVersion = parseInt(versionString.replace(/^v/, "").split(".")[0]);
            if (nodeVersion >= 22) {
              if (typeof globalThis.WebSocket !== "undefined") {
                return { type: "native", constructor: globalThis.WebSocket };
              }
              return {
                type: "unsupported",
                error: `Node.js ${nodeVersion} detected but native WebSocket not found.`,
                workaround: "Provide a WebSocket implementation via the transport option."
              };
            }
            return {
              type: "unsupported",
              error: `Node.js ${nodeVersion} detected without native WebSocket support.`,
              workaround: 'For Node.js < 22, install "ws" package and provide it via the transport option:\nimport ws from "ws"\nnew RealtimeClient(url, { transport: ws })'
            };
          }
        }
        return {
          type: "unsupported",
          error: "Unknown JavaScript runtime without WebSocket support.",
          workaround: "Ensure you're running in a supported environment (browser, Node.js, Deno) or provide a custom WebSocket implementation."
        };
      }
      /**
       * Returns the best available WebSocket constructor for the current runtime.
       *
       * @example
       * ```ts
       * const WS = WebSocketFactory.getWebSocketConstructor()
       * const socket = new WS('wss://realtime.supabase.co/socket')
       * ```
       */
      static getWebSocketConstructor() {
        const env2 = this.detectEnvironment();
        if (env2.constructor) {
          return env2.constructor;
        }
        let errorMessage = env2.error || "WebSocket not supported in this environment.";
        if (env2.workaround) {
          errorMessage += `

Suggested solution: ${env2.workaround}`;
        }
        throw new Error(errorMessage);
      }
      /**
       * Creates a WebSocket using the detected constructor.
       *
       * @example
       * ```ts
       * const socket = WebSocketFactory.createWebSocket('wss://realtime.supabase.co/socket')
       * ```
       */
      static createWebSocket(url, protocols) {
        const WS = this.getWebSocketConstructor();
        return new WS(url, protocols);
      }
      /**
       * Detects whether the runtime can establish WebSocket connections.
       *
       * @example
       * ```ts
       * if (!WebSocketFactory.isWebSocketSupported()) {
       *   console.warn('Falling back to long polling')
       * }
       * ```
       */
      static isWebSocketSupported() {
        try {
          const env2 = this.detectEnvironment();
          return env2.type === "native" || env2.type === "ws";
        } catch (_a2) {
          return false;
        }
      }
    };
    websocket_factory_default = WebSocketFactory;
  }
});
var version3;
var init_version = __esm({
  "../node_modules/@supabase/realtime-js/dist/module/lib/version.js"() {
    init_functionsRoutes_0_04524570753253654();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    version3 = "2.86.0";
  }
});
var DEFAULT_VERSION;
var VSN_1_0_0;
var VSN_2_0_0;
var DEFAULT_VSN;
var DEFAULT_TIMEOUT;
var WS_CLOSE_NORMAL;
var MAX_PUSH_BUFFER_SIZE;
var SOCKET_STATES;
var CHANNEL_STATES;
var CHANNEL_EVENTS;
var TRANSPORTS;
var CONNECTION_STATE;
var init_constants3 = __esm({
  "../node_modules/@supabase/realtime-js/dist/module/lib/constants.js"() {
    init_functionsRoutes_0_04524570753253654();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_version();
    DEFAULT_VERSION = `realtime-js/${version3}`;
    VSN_1_0_0 = "1.0.0";
    VSN_2_0_0 = "2.0.0";
    DEFAULT_VSN = VSN_1_0_0;
    DEFAULT_TIMEOUT = 1e4;
    WS_CLOSE_NORMAL = 1e3;
    MAX_PUSH_BUFFER_SIZE = 100;
    (function(SOCKET_STATES2) {
      SOCKET_STATES2[SOCKET_STATES2["connecting"] = 0] = "connecting";
      SOCKET_STATES2[SOCKET_STATES2["open"] = 1] = "open";
      SOCKET_STATES2[SOCKET_STATES2["closing"] = 2] = "closing";
      SOCKET_STATES2[SOCKET_STATES2["closed"] = 3] = "closed";
    })(SOCKET_STATES || (SOCKET_STATES = {}));
    (function(CHANNEL_STATES2) {
      CHANNEL_STATES2["closed"] = "closed";
      CHANNEL_STATES2["errored"] = "errored";
      CHANNEL_STATES2["joined"] = "joined";
      CHANNEL_STATES2["joining"] = "joining";
      CHANNEL_STATES2["leaving"] = "leaving";
    })(CHANNEL_STATES || (CHANNEL_STATES = {}));
    (function(CHANNEL_EVENTS2) {
      CHANNEL_EVENTS2["close"] = "phx_close";
      CHANNEL_EVENTS2["error"] = "phx_error";
      CHANNEL_EVENTS2["join"] = "phx_join";
      CHANNEL_EVENTS2["reply"] = "phx_reply";
      CHANNEL_EVENTS2["leave"] = "phx_leave";
      CHANNEL_EVENTS2["access_token"] = "access_token";
    })(CHANNEL_EVENTS || (CHANNEL_EVENTS = {}));
    (function(TRANSPORTS2) {
      TRANSPORTS2["websocket"] = "websocket";
    })(TRANSPORTS || (TRANSPORTS = {}));
    (function(CONNECTION_STATE2) {
      CONNECTION_STATE2["Connecting"] = "connecting";
      CONNECTION_STATE2["Open"] = "open";
      CONNECTION_STATE2["Closing"] = "closing";
      CONNECTION_STATE2["Closed"] = "closed";
    })(CONNECTION_STATE || (CONNECTION_STATE = {}));
  }
});
var Serializer;
var init_serializer = __esm({
  "../node_modules/@supabase/realtime-js/dist/module/lib/serializer.js"() {
    init_functionsRoutes_0_04524570753253654();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    Serializer = class {
      static {
        __name(this, "Serializer");
      }
      static {
        __name2(this, "Serializer");
      }
      constructor(allowedMetadataKeys) {
        this.HEADER_LENGTH = 1;
        this.USER_BROADCAST_PUSH_META_LENGTH = 6;
        this.KINDS = { userBroadcastPush: 3, userBroadcast: 4 };
        this.BINARY_ENCODING = 0;
        this.JSON_ENCODING = 1;
        this.BROADCAST_EVENT = "broadcast";
        this.allowedMetadataKeys = [];
        this.allowedMetadataKeys = allowedMetadataKeys !== null && allowedMetadataKeys !== void 0 ? allowedMetadataKeys : [];
      }
      encode(msg, callback) {
        if (msg.event === this.BROADCAST_EVENT && !(msg.payload instanceof ArrayBuffer) && typeof msg.payload.event === "string") {
          return callback(this._binaryEncodeUserBroadcastPush(msg));
        }
        let payload = [msg.join_ref, msg.ref, msg.topic, msg.event, msg.payload];
        return callback(JSON.stringify(payload));
      }
      _binaryEncodeUserBroadcastPush(message) {
        var _a2;
        if (this._isArrayBuffer((_a2 = message.payload) === null || _a2 === void 0 ? void 0 : _a2.payload)) {
          return this._encodeBinaryUserBroadcastPush(message);
        } else {
          return this._encodeJsonUserBroadcastPush(message);
        }
      }
      _encodeBinaryUserBroadcastPush(message) {
        var _a2, _b;
        const userPayload = (_b = (_a2 = message.payload) === null || _a2 === void 0 ? void 0 : _a2.payload) !== null && _b !== void 0 ? _b : new ArrayBuffer(0);
        return this._encodeUserBroadcastPush(message, this.BINARY_ENCODING, userPayload);
      }
      _encodeJsonUserBroadcastPush(message) {
        var _a2, _b;
        const userPayload = (_b = (_a2 = message.payload) === null || _a2 === void 0 ? void 0 : _a2.payload) !== null && _b !== void 0 ? _b : {};
        const encoder = new TextEncoder();
        const encodedUserPayload = encoder.encode(JSON.stringify(userPayload)).buffer;
        return this._encodeUserBroadcastPush(message, this.JSON_ENCODING, encodedUserPayload);
      }
      _encodeUserBroadcastPush(message, encodingType, encodedPayload) {
        var _a2, _b;
        const topic = message.topic;
        const ref2 = (_a2 = message.ref) !== null && _a2 !== void 0 ? _a2 : "";
        const joinRef = (_b = message.join_ref) !== null && _b !== void 0 ? _b : "";
        const userEvent = message.payload.event;
        const rest = this.allowedMetadataKeys ? this._pick(message.payload, this.allowedMetadataKeys) : {};
        const metadata = Object.keys(rest).length === 0 ? "" : JSON.stringify(rest);
        if (joinRef.length > 255) {
          throw new Error(`joinRef length ${joinRef.length} exceeds maximum of 255`);
        }
        if (ref2.length > 255) {
          throw new Error(`ref length ${ref2.length} exceeds maximum of 255`);
        }
        if (topic.length > 255) {
          throw new Error(`topic length ${topic.length} exceeds maximum of 255`);
        }
        if (userEvent.length > 255) {
          throw new Error(`userEvent length ${userEvent.length} exceeds maximum of 255`);
        }
        if (metadata.length > 255) {
          throw new Error(`metadata length ${metadata.length} exceeds maximum of 255`);
        }
        const metaLength = this.USER_BROADCAST_PUSH_META_LENGTH + joinRef.length + ref2.length + topic.length + userEvent.length + metadata.length;
        const header = new ArrayBuffer(this.HEADER_LENGTH + metaLength);
        let view = new DataView(header);
        let offset = 0;
        view.setUint8(offset++, this.KINDS.userBroadcastPush);
        view.setUint8(offset++, joinRef.length);
        view.setUint8(offset++, ref2.length);
        view.setUint8(offset++, topic.length);
        view.setUint8(offset++, userEvent.length);
        view.setUint8(offset++, metadata.length);
        view.setUint8(offset++, encodingType);
        Array.from(joinRef, (char) => view.setUint8(offset++, char.charCodeAt(0)));
        Array.from(ref2, (char) => view.setUint8(offset++, char.charCodeAt(0)));
        Array.from(topic, (char) => view.setUint8(offset++, char.charCodeAt(0)));
        Array.from(userEvent, (char) => view.setUint8(offset++, char.charCodeAt(0)));
        Array.from(metadata, (char) => view.setUint8(offset++, char.charCodeAt(0)));
        var combined = new Uint8Array(header.byteLength + encodedPayload.byteLength);
        combined.set(new Uint8Array(header), 0);
        combined.set(new Uint8Array(encodedPayload), header.byteLength);
        return combined.buffer;
      }
      decode(rawPayload, callback) {
        if (this._isArrayBuffer(rawPayload)) {
          let result = this._binaryDecode(rawPayload);
          return callback(result);
        }
        if (typeof rawPayload === "string") {
          const jsonPayload = JSON.parse(rawPayload);
          const [join_ref, ref2, topic, event, payload] = jsonPayload;
          return callback({ join_ref, ref: ref2, topic, event, payload });
        }
        return callback({});
      }
      _binaryDecode(buffer) {
        const view = new DataView(buffer);
        const kind = view.getUint8(0);
        const decoder = new TextDecoder();
        switch (kind) {
          case this.KINDS.userBroadcast:
            return this._decodeUserBroadcast(buffer, view, decoder);
        }
      }
      _decodeUserBroadcast(buffer, view, decoder) {
        const topicSize = view.getUint8(1);
        const userEventSize = view.getUint8(2);
        const metadataSize = view.getUint8(3);
        const payloadEncoding = view.getUint8(4);
        let offset = this.HEADER_LENGTH + 4;
        const topic = decoder.decode(buffer.slice(offset, offset + topicSize));
        offset = offset + topicSize;
        const userEvent = decoder.decode(buffer.slice(offset, offset + userEventSize));
        offset = offset + userEventSize;
        const metadata = decoder.decode(buffer.slice(offset, offset + metadataSize));
        offset = offset + metadataSize;
        const payload = buffer.slice(offset, buffer.byteLength);
        const parsedPayload = payloadEncoding === this.JSON_ENCODING ? JSON.parse(decoder.decode(payload)) : payload;
        const data = {
          type: this.BROADCAST_EVENT,
          event: userEvent,
          payload: parsedPayload
        };
        if (metadataSize > 0) {
          data["meta"] = JSON.parse(metadata);
        }
        return { join_ref: null, ref: null, topic, event: this.BROADCAST_EVENT, payload: data };
      }
      _isArrayBuffer(buffer) {
        var _a2;
        return buffer instanceof ArrayBuffer || ((_a2 = buffer === null || buffer === void 0 ? void 0 : buffer.constructor) === null || _a2 === void 0 ? void 0 : _a2.name) === "ArrayBuffer";
      }
      _pick(obj, keys) {
        if (!obj || typeof obj !== "object") {
          return {};
        }
        return Object.fromEntries(Object.entries(obj).filter(([key]) => keys.includes(key)));
      }
    };
  }
});
var Timer;
var init_timer = __esm({
  "../node_modules/@supabase/realtime-js/dist/module/lib/timer.js"() {
    init_functionsRoutes_0_04524570753253654();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    Timer = class {
      static {
        __name(this, "Timer");
      }
      static {
        __name2(this, "Timer");
      }
      constructor(callback, timerCalc) {
        this.callback = callback;
        this.timerCalc = timerCalc;
        this.timer = void 0;
        this.tries = 0;
        this.callback = callback;
        this.timerCalc = timerCalc;
      }
      reset() {
        this.tries = 0;
        clearTimeout(this.timer);
        this.timer = void 0;
      }
      // Cancels any previous scheduleTimeout and schedules callback
      scheduleTimeout() {
        clearTimeout(this.timer);
        this.timer = setTimeout(() => {
          this.tries = this.tries + 1;
          this.callback();
        }, this.timerCalc(this.tries + 1));
      }
    };
  }
});
var PostgresTypes;
var convertChangeData;
var convertColumn;
var convertCell;
var noop;
var toBoolean;
var toNumber;
var toJson;
var toArray;
var toTimestampString;
var httpEndpointURL;
var init_transformers = __esm({
  "../node_modules/@supabase/realtime-js/dist/module/lib/transformers.js"() {
    init_functionsRoutes_0_04524570753253654();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    (function(PostgresTypes2) {
      PostgresTypes2["abstime"] = "abstime";
      PostgresTypes2["bool"] = "bool";
      PostgresTypes2["date"] = "date";
      PostgresTypes2["daterange"] = "daterange";
      PostgresTypes2["float4"] = "float4";
      PostgresTypes2["float8"] = "float8";
      PostgresTypes2["int2"] = "int2";
      PostgresTypes2["int4"] = "int4";
      PostgresTypes2["int4range"] = "int4range";
      PostgresTypes2["int8"] = "int8";
      PostgresTypes2["int8range"] = "int8range";
      PostgresTypes2["json"] = "json";
      PostgresTypes2["jsonb"] = "jsonb";
      PostgresTypes2["money"] = "money";
      PostgresTypes2["numeric"] = "numeric";
      PostgresTypes2["oid"] = "oid";
      PostgresTypes2["reltime"] = "reltime";
      PostgresTypes2["text"] = "text";
      PostgresTypes2["time"] = "time";
      PostgresTypes2["timestamp"] = "timestamp";
      PostgresTypes2["timestamptz"] = "timestamptz";
      PostgresTypes2["timetz"] = "timetz";
      PostgresTypes2["tsrange"] = "tsrange";
      PostgresTypes2["tstzrange"] = "tstzrange";
    })(PostgresTypes || (PostgresTypes = {}));
    convertChangeData = /* @__PURE__ */ __name2((columns, record, options = {}) => {
      var _a2;
      const skipTypes = (_a2 = options.skipTypes) !== null && _a2 !== void 0 ? _a2 : [];
      if (!record) {
        return {};
      }
      return Object.keys(record).reduce((acc, rec_key) => {
        acc[rec_key] = convertColumn(rec_key, columns, record, skipTypes);
        return acc;
      }, {});
    }, "convertChangeData");
    convertColumn = /* @__PURE__ */ __name2((columnName, columns, record, skipTypes) => {
      const column = columns.find((x) => x.name === columnName);
      const colType = column === null || column === void 0 ? void 0 : column.type;
      const value = record[columnName];
      if (colType && !skipTypes.includes(colType)) {
        return convertCell(colType, value);
      }
      return noop(value);
    }, "convertColumn");
    convertCell = /* @__PURE__ */ __name2((type2, value) => {
      if (type2.charAt(0) === "_") {
        const dataType = type2.slice(1, type2.length);
        return toArray(value, dataType);
      }
      switch (type2) {
        case PostgresTypes.bool:
          return toBoolean(value);
        case PostgresTypes.float4:
        case PostgresTypes.float8:
        case PostgresTypes.int2:
        case PostgresTypes.int4:
        case PostgresTypes.int8:
        case PostgresTypes.numeric:
        case PostgresTypes.oid:
          return toNumber(value);
        case PostgresTypes.json:
        case PostgresTypes.jsonb:
          return toJson(value);
        case PostgresTypes.timestamp:
          return toTimestampString(value);
        // Format to be consistent with PostgREST
        case PostgresTypes.abstime:
        // To allow users to cast it based on Timezone
        case PostgresTypes.date:
        // To allow users to cast it based on Timezone
        case PostgresTypes.daterange:
        case PostgresTypes.int4range:
        case PostgresTypes.int8range:
        case PostgresTypes.money:
        case PostgresTypes.reltime:
        // To allow users to cast it based on Timezone
        case PostgresTypes.text:
        case PostgresTypes.time:
        // To allow users to cast it based on Timezone
        case PostgresTypes.timestamptz:
        // To allow users to cast it based on Timezone
        case PostgresTypes.timetz:
        // To allow users to cast it based on Timezone
        case PostgresTypes.tsrange:
        case PostgresTypes.tstzrange:
          return noop(value);
        default:
          return noop(value);
      }
    }, "convertCell");
    noop = /* @__PURE__ */ __name2((value) => {
      return value;
    }, "noop");
    toBoolean = /* @__PURE__ */ __name2((value) => {
      switch (value) {
        case "t":
          return true;
        case "f":
          return false;
        default:
          return value;
      }
    }, "toBoolean");
    toNumber = /* @__PURE__ */ __name2((value) => {
      if (typeof value === "string") {
        const parsedValue = parseFloat(value);
        if (!Number.isNaN(parsedValue)) {
          return parsedValue;
        }
      }
      return value;
    }, "toNumber");
    toJson = /* @__PURE__ */ __name2((value) => {
      if (typeof value === "string") {
        try {
          return JSON.parse(value);
        } catch (error3) {
          console.log(`JSON parse error: ${error3}`);
          return value;
        }
      }
      return value;
    }, "toJson");
    toArray = /* @__PURE__ */ __name2((value, type2) => {
      if (typeof value !== "string") {
        return value;
      }
      const lastIdx = value.length - 1;
      const closeBrace = value[lastIdx];
      const openBrace = value[0];
      if (openBrace === "{" && closeBrace === "}") {
        let arr;
        const valTrim = value.slice(1, lastIdx);
        try {
          arr = JSON.parse("[" + valTrim + "]");
        } catch (_) {
          arr = valTrim ? valTrim.split(",") : [];
        }
        return arr.map((val) => convertCell(type2, val));
      }
      return value;
    }, "toArray");
    toTimestampString = /* @__PURE__ */ __name2((value) => {
      if (typeof value === "string") {
        return value.replace(" ", "T");
      }
      return value;
    }, "toTimestampString");
    httpEndpointURL = /* @__PURE__ */ __name2((socketUrl) => {
      const wsUrl = new URL(socketUrl);
      wsUrl.protocol = wsUrl.protocol.replace(/^ws/i, "http");
      wsUrl.pathname = wsUrl.pathname.replace(/\/+$/, "").replace(/\/socket\/websocket$/i, "").replace(/\/socket$/i, "").replace(/\/websocket$/i, "");
      if (wsUrl.pathname === "" || wsUrl.pathname === "/") {
        wsUrl.pathname = "/api/broadcast";
      } else {
        wsUrl.pathname = wsUrl.pathname + "/api/broadcast";
      }
      return wsUrl.href;
    }, "httpEndpointURL");
  }
});
var Push;
var init_push = __esm({
  "../node_modules/@supabase/realtime-js/dist/module/lib/push.js"() {
    init_functionsRoutes_0_04524570753253654();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_constants3();
    Push = class {
      static {
        __name(this, "Push");
      }
      static {
        __name2(this, "Push");
      }
      /**
       * Initializes the Push
       *
       * @param channel The Channel
       * @param event The event, for example `"phx_join"`
       * @param payload The payload, for example `{user_id: 123}`
       * @param timeout The push timeout in milliseconds
       */
      constructor(channel2, event, payload = {}, timeout = DEFAULT_TIMEOUT) {
        this.channel = channel2;
        this.event = event;
        this.payload = payload;
        this.timeout = timeout;
        this.sent = false;
        this.timeoutTimer = void 0;
        this.ref = "";
        this.receivedResp = null;
        this.recHooks = [];
        this.refEvent = null;
      }
      resend(timeout) {
        this.timeout = timeout;
        this._cancelRefEvent();
        this.ref = "";
        this.refEvent = null;
        this.receivedResp = null;
        this.sent = false;
        this.send();
      }
      send() {
        if (this._hasReceived("timeout")) {
          return;
        }
        this.startTimeout();
        this.sent = true;
        this.channel.socket.push({
          topic: this.channel.topic,
          event: this.event,
          payload: this.payload,
          ref: this.ref,
          join_ref: this.channel._joinRef()
        });
      }
      updatePayload(payload) {
        this.payload = Object.assign(Object.assign({}, this.payload), payload);
      }
      receive(status, callback) {
        var _a2;
        if (this._hasReceived(status)) {
          callback((_a2 = this.receivedResp) === null || _a2 === void 0 ? void 0 : _a2.response);
        }
        this.recHooks.push({ status, callback });
        return this;
      }
      startTimeout() {
        if (this.timeoutTimer) {
          return;
        }
        this.ref = this.channel.socket._makeRef();
        this.refEvent = this.channel._replyEventName(this.ref);
        const callback = /* @__PURE__ */ __name2((payload) => {
          this._cancelRefEvent();
          this._cancelTimeout();
          this.receivedResp = payload;
          this._matchReceive(payload);
        }, "callback");
        this.channel._on(this.refEvent, {}, callback);
        this.timeoutTimer = setTimeout(() => {
          this.trigger("timeout", {});
        }, this.timeout);
      }
      trigger(status, response) {
        if (this.refEvent)
          this.channel._trigger(this.refEvent, { status, response });
      }
      destroy() {
        this._cancelRefEvent();
        this._cancelTimeout();
      }
      _cancelRefEvent() {
        if (!this.refEvent) {
          return;
        }
        this.channel._off(this.refEvent, {});
      }
      _cancelTimeout() {
        clearTimeout(this.timeoutTimer);
        this.timeoutTimer = void 0;
      }
      _matchReceive({ status, response }) {
        this.recHooks.filter((h) => h.status === status).forEach((h) => h.callback(response));
      }
      _hasReceived(status) {
        return this.receivedResp && this.receivedResp.status === status;
      }
    };
  }
});
var REALTIME_PRESENCE_LISTEN_EVENTS;
var RealtimePresence;
var init_RealtimePresence = __esm({
  "../node_modules/@supabase/realtime-js/dist/module/RealtimePresence.js"() {
    init_functionsRoutes_0_04524570753253654();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    (function(REALTIME_PRESENCE_LISTEN_EVENTS2) {
      REALTIME_PRESENCE_LISTEN_EVENTS2["SYNC"] = "sync";
      REALTIME_PRESENCE_LISTEN_EVENTS2["JOIN"] = "join";
      REALTIME_PRESENCE_LISTEN_EVENTS2["LEAVE"] = "leave";
    })(REALTIME_PRESENCE_LISTEN_EVENTS || (REALTIME_PRESENCE_LISTEN_EVENTS = {}));
    RealtimePresence = class _RealtimePresence {
      static {
        __name(this, "_RealtimePresence");
      }
      static {
        __name2(this, "RealtimePresence");
      }
      /**
       * Creates a Presence helper that keeps the local presence state in sync with the server.
       *
       * @param channel - The realtime channel to bind to.
       * @param opts - Optional custom event names, e.g. `{ events: { state: 'state', diff: 'diff' } }`.
       *
       * @example
       * ```ts
       * const presence = new RealtimePresence(channel)
       *
       * channel.on('presence', ({ event, key }) => {
       *   console.log(`Presence ${event} on ${key}`)
       * })
       * ```
       */
      constructor(channel2, opts) {
        this.channel = channel2;
        this.state = {};
        this.pendingDiffs = [];
        this.joinRef = null;
        this.enabled = false;
        this.caller = {
          onJoin: /* @__PURE__ */ __name2(() => {
          }, "onJoin"),
          onLeave: /* @__PURE__ */ __name2(() => {
          }, "onLeave"),
          onSync: /* @__PURE__ */ __name2(() => {
          }, "onSync")
        };
        const events = (opts === null || opts === void 0 ? void 0 : opts.events) || {
          state: "presence_state",
          diff: "presence_diff"
        };
        this.channel._on(events.state, {}, (newState) => {
          const { onJoin, onLeave, onSync } = this.caller;
          this.joinRef = this.channel._joinRef();
          this.state = _RealtimePresence.syncState(this.state, newState, onJoin, onLeave);
          this.pendingDiffs.forEach((diff) => {
            this.state = _RealtimePresence.syncDiff(this.state, diff, onJoin, onLeave);
          });
          this.pendingDiffs = [];
          onSync();
        });
        this.channel._on(events.diff, {}, (diff) => {
          const { onJoin, onLeave, onSync } = this.caller;
          if (this.inPendingSyncState()) {
            this.pendingDiffs.push(diff);
          } else {
            this.state = _RealtimePresence.syncDiff(this.state, diff, onJoin, onLeave);
            onSync();
          }
        });
        this.onJoin((key, currentPresences, newPresences) => {
          this.channel._trigger("presence", {
            event: "join",
            key,
            currentPresences,
            newPresences
          });
        });
        this.onLeave((key, currentPresences, leftPresences) => {
          this.channel._trigger("presence", {
            event: "leave",
            key,
            currentPresences,
            leftPresences
          });
        });
        this.onSync(() => {
          this.channel._trigger("presence", { event: "sync" });
        });
      }
      /**
       * Used to sync the list of presences on the server with the
       * client's state.
       *
       * An optional `onJoin` and `onLeave` callback can be provided to
       * react to changes in the client's local presences across
       * disconnects and reconnects with the server.
       *
       * @internal
       */
      static syncState(currentState, newState, onJoin, onLeave) {
        const state = this.cloneDeep(currentState);
        const transformedState = this.transformState(newState);
        const joins = {};
        const leaves = {};
        this.map(state, (key, presences) => {
          if (!transformedState[key]) {
            leaves[key] = presences;
          }
        });
        this.map(transformedState, (key, newPresences) => {
          const currentPresences = state[key];
          if (currentPresences) {
            const newPresenceRefs = newPresences.map((m) => m.presence_ref);
            const curPresenceRefs = currentPresences.map((m) => m.presence_ref);
            const joinedPresences = newPresences.filter((m) => curPresenceRefs.indexOf(m.presence_ref) < 0);
            const leftPresences = currentPresences.filter((m) => newPresenceRefs.indexOf(m.presence_ref) < 0);
            if (joinedPresences.length > 0) {
              joins[key] = joinedPresences;
            }
            if (leftPresences.length > 0) {
              leaves[key] = leftPresences;
            }
          } else {
            joins[key] = newPresences;
          }
        });
        return this.syncDiff(state, { joins, leaves }, onJoin, onLeave);
      }
      /**
       * Used to sync a diff of presence join and leave events from the
       * server, as they happen.
       *
       * Like `syncState`, `syncDiff` accepts optional `onJoin` and
       * `onLeave` callbacks to react to a user joining or leaving from a
       * device.
       *
       * @internal
       */
      static syncDiff(state, diff, onJoin, onLeave) {
        const { joins, leaves } = {
          joins: this.transformState(diff.joins),
          leaves: this.transformState(diff.leaves)
        };
        if (!onJoin) {
          onJoin = /* @__PURE__ */ __name2(() => {
          }, "onJoin");
        }
        if (!onLeave) {
          onLeave = /* @__PURE__ */ __name2(() => {
          }, "onLeave");
        }
        this.map(joins, (key, newPresences) => {
          var _a2;
          const currentPresences = (_a2 = state[key]) !== null && _a2 !== void 0 ? _a2 : [];
          state[key] = this.cloneDeep(newPresences);
          if (currentPresences.length > 0) {
            const joinedPresenceRefs = state[key].map((m) => m.presence_ref);
            const curPresences = currentPresences.filter((m) => joinedPresenceRefs.indexOf(m.presence_ref) < 0);
            state[key].unshift(...curPresences);
          }
          onJoin(key, currentPresences, newPresences);
        });
        this.map(leaves, (key, leftPresences) => {
          let currentPresences = state[key];
          if (!currentPresences)
            return;
          const presenceRefsToRemove = leftPresences.map((m) => m.presence_ref);
          currentPresences = currentPresences.filter((m) => presenceRefsToRemove.indexOf(m.presence_ref) < 0);
          state[key] = currentPresences;
          onLeave(key, currentPresences, leftPresences);
          if (currentPresences.length === 0)
            delete state[key];
        });
        return state;
      }
      /** @internal */
      static map(obj, func) {
        return Object.getOwnPropertyNames(obj).map((key) => func(key, obj[key]));
      }
      /**
       * Remove 'metas' key
       * Change 'phx_ref' to 'presence_ref'
       * Remove 'phx_ref' and 'phx_ref_prev'
       *
       * @example
       * // returns {
       *  abc123: [
       *    { presence_ref: '2', user_id: 1 },
       *    { presence_ref: '3', user_id: 2 }
       *  ]
       * }
       * RealtimePresence.transformState({
       *  abc123: {
       *    metas: [
       *      { phx_ref: '2', phx_ref_prev: '1' user_id: 1 },
       *      { phx_ref: '3', user_id: 2 }
       *    ]
       *  }
       * })
       *
       * @internal
       */
      static transformState(state) {
        state = this.cloneDeep(state);
        return Object.getOwnPropertyNames(state).reduce((newState, key) => {
          const presences = state[key];
          if ("metas" in presences) {
            newState[key] = presences.metas.map((presence) => {
              presence["presence_ref"] = presence["phx_ref"];
              delete presence["phx_ref"];
              delete presence["phx_ref_prev"];
              return presence;
            });
          } else {
            newState[key] = presences;
          }
          return newState;
        }, {});
      }
      /** @internal */
      static cloneDeep(obj) {
        return JSON.parse(JSON.stringify(obj));
      }
      /** @internal */
      onJoin(callback) {
        this.caller.onJoin = callback;
      }
      /** @internal */
      onLeave(callback) {
        this.caller.onLeave = callback;
      }
      /** @internal */
      onSync(callback) {
        this.caller.onSync = callback;
      }
      /** @internal */
      inPendingSyncState() {
        return !this.joinRef || this.joinRef !== this.channel._joinRef();
      }
    };
  }
});
var REALTIME_POSTGRES_CHANGES_LISTEN_EVENT;
var REALTIME_LISTEN_TYPES;
var REALTIME_SUBSCRIBE_STATES;
var RealtimeChannel;
var init_RealtimeChannel = __esm({
  "../node_modules/@supabase/realtime-js/dist/module/RealtimeChannel.js"() {
    init_functionsRoutes_0_04524570753253654();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_constants3();
    init_push();
    init_timer();
    init_RealtimePresence();
    init_transformers();
    init_transformers();
    (function(REALTIME_POSTGRES_CHANGES_LISTEN_EVENT2) {
      REALTIME_POSTGRES_CHANGES_LISTEN_EVENT2["ALL"] = "*";
      REALTIME_POSTGRES_CHANGES_LISTEN_EVENT2["INSERT"] = "INSERT";
      REALTIME_POSTGRES_CHANGES_LISTEN_EVENT2["UPDATE"] = "UPDATE";
      REALTIME_POSTGRES_CHANGES_LISTEN_EVENT2["DELETE"] = "DELETE";
    })(REALTIME_POSTGRES_CHANGES_LISTEN_EVENT || (REALTIME_POSTGRES_CHANGES_LISTEN_EVENT = {}));
    (function(REALTIME_LISTEN_TYPES2) {
      REALTIME_LISTEN_TYPES2["BROADCAST"] = "broadcast";
      REALTIME_LISTEN_TYPES2["PRESENCE"] = "presence";
      REALTIME_LISTEN_TYPES2["POSTGRES_CHANGES"] = "postgres_changes";
      REALTIME_LISTEN_TYPES2["SYSTEM"] = "system";
    })(REALTIME_LISTEN_TYPES || (REALTIME_LISTEN_TYPES = {}));
    (function(REALTIME_SUBSCRIBE_STATES2) {
      REALTIME_SUBSCRIBE_STATES2["SUBSCRIBED"] = "SUBSCRIBED";
      REALTIME_SUBSCRIBE_STATES2["TIMED_OUT"] = "TIMED_OUT";
      REALTIME_SUBSCRIBE_STATES2["CLOSED"] = "CLOSED";
      REALTIME_SUBSCRIBE_STATES2["CHANNEL_ERROR"] = "CHANNEL_ERROR";
    })(REALTIME_SUBSCRIBE_STATES || (REALTIME_SUBSCRIBE_STATES = {}));
    RealtimeChannel = class _RealtimeChannel {
      static {
        __name(this, "_RealtimeChannel");
      }
      static {
        __name2(this, "RealtimeChannel");
      }
      /**
       * Creates a channel that can broadcast messages, sync presence, and listen to Postgres changes.
       *
       * The topic determines which realtime stream you are subscribing to. Config options let you
       * enable acknowledgement for broadcasts, presence tracking, or private channels.
       *
       * @example
       * ```ts
       * import RealtimeClient from '@supabase/realtime-js'
       *
       * const client = new RealtimeClient('https://xyzcompany.supabase.co/realtime/v1', {
       *   params: { apikey: 'public-anon-key' },
       * })
       * const channel = new RealtimeChannel('realtime:public:messages', { config: {} }, client)
       * ```
       */
      constructor(topic, params = { config: {} }, socket) {
        var _a2, _b;
        this.topic = topic;
        this.params = params;
        this.socket = socket;
        this.bindings = {};
        this.state = CHANNEL_STATES.closed;
        this.joinedOnce = false;
        this.pushBuffer = [];
        this.subTopic = topic.replace(/^realtime:/i, "");
        this.params.config = Object.assign({
          broadcast: { ack: false, self: false },
          presence: { key: "", enabled: false },
          private: false
        }, params.config);
        this.timeout = this.socket.timeout;
        this.joinPush = new Push(this, CHANNEL_EVENTS.join, this.params, this.timeout);
        this.rejoinTimer = new Timer(() => this._rejoinUntilConnected(), this.socket.reconnectAfterMs);
        this.joinPush.receive("ok", () => {
          this.state = CHANNEL_STATES.joined;
          this.rejoinTimer.reset();
          this.pushBuffer.forEach((pushEvent) => pushEvent.send());
          this.pushBuffer = [];
        });
        this._onClose(() => {
          this.rejoinTimer.reset();
          this.socket.log("channel", `close ${this.topic} ${this._joinRef()}`);
          this.state = CHANNEL_STATES.closed;
          this.socket._remove(this);
        });
        this._onError((reason) => {
          if (this._isLeaving() || this._isClosed()) {
            return;
          }
          this.socket.log("channel", `error ${this.topic}`, reason);
          this.state = CHANNEL_STATES.errored;
          this.rejoinTimer.scheduleTimeout();
        });
        this.joinPush.receive("timeout", () => {
          if (!this._isJoining()) {
            return;
          }
          this.socket.log("channel", `timeout ${this.topic}`, this.joinPush.timeout);
          this.state = CHANNEL_STATES.errored;
          this.rejoinTimer.scheduleTimeout();
        });
        this.joinPush.receive("error", (reason) => {
          if (this._isLeaving() || this._isClosed()) {
            return;
          }
          this.socket.log("channel", `error ${this.topic}`, reason);
          this.state = CHANNEL_STATES.errored;
          this.rejoinTimer.scheduleTimeout();
        });
        this._on(CHANNEL_EVENTS.reply, {}, (payload, ref2) => {
          this._trigger(this._replyEventName(ref2), payload);
        });
        this.presence = new RealtimePresence(this);
        this.broadcastEndpointURL = httpEndpointURL(this.socket.endPoint);
        this.private = this.params.config.private || false;
        if (!this.private && ((_b = (_a2 = this.params.config) === null || _a2 === void 0 ? void 0 : _a2.broadcast) === null || _b === void 0 ? void 0 : _b.replay)) {
          throw `tried to use replay on public channel '${this.topic}'. It must be a private channel.`;
        }
      }
      /** Subscribe registers your client with the server */
      subscribe(callback, timeout = this.timeout) {
        var _a2, _b, _c;
        if (!this.socket.isConnected()) {
          this.socket.connect();
        }
        if (this.state == CHANNEL_STATES.closed) {
          const { config: { broadcast, presence, private: isPrivate } } = this.params;
          const postgres_changes = (_b = (_a2 = this.bindings.postgres_changes) === null || _a2 === void 0 ? void 0 : _a2.map((r) => r.filter)) !== null && _b !== void 0 ? _b : [];
          const presence_enabled = !!this.bindings[REALTIME_LISTEN_TYPES.PRESENCE] && this.bindings[REALTIME_LISTEN_TYPES.PRESENCE].length > 0 || ((_c = this.params.config.presence) === null || _c === void 0 ? void 0 : _c.enabled) === true;
          const accessTokenPayload = {};
          const config2 = {
            broadcast,
            presence: Object.assign(Object.assign({}, presence), { enabled: presence_enabled }),
            postgres_changes,
            private: isPrivate
          };
          if (this.socket.accessTokenValue) {
            accessTokenPayload.access_token = this.socket.accessTokenValue;
          }
          this._onError((e) => callback === null || callback === void 0 ? void 0 : callback(REALTIME_SUBSCRIBE_STATES.CHANNEL_ERROR, e));
          this._onClose(() => callback === null || callback === void 0 ? void 0 : callback(REALTIME_SUBSCRIBE_STATES.CLOSED));
          this.updateJoinPayload(Object.assign({ config: config2 }, accessTokenPayload));
          this.joinedOnce = true;
          this._rejoin(timeout);
          this.joinPush.receive("ok", async ({ postgres_changes: postgres_changes2 }) => {
            var _a3;
            this.socket.setAuth();
            if (postgres_changes2 === void 0) {
              callback === null || callback === void 0 ? void 0 : callback(REALTIME_SUBSCRIBE_STATES.SUBSCRIBED);
              return;
            } else {
              const clientPostgresBindings = this.bindings.postgres_changes;
              const bindingsLen = (_a3 = clientPostgresBindings === null || clientPostgresBindings === void 0 ? void 0 : clientPostgresBindings.length) !== null && _a3 !== void 0 ? _a3 : 0;
              const newPostgresBindings = [];
              for (let i = 0; i < bindingsLen; i++) {
                const clientPostgresBinding = clientPostgresBindings[i];
                const { filter: { event, schema, table: table3, filter } } = clientPostgresBinding;
                const serverPostgresFilter = postgres_changes2 && postgres_changes2[i];
                if (serverPostgresFilter && serverPostgresFilter.event === event && serverPostgresFilter.schema === schema && serverPostgresFilter.table === table3 && serverPostgresFilter.filter === filter) {
                  newPostgresBindings.push(Object.assign(Object.assign({}, clientPostgresBinding), { id: serverPostgresFilter.id }));
                } else {
                  this.unsubscribe();
                  this.state = CHANNEL_STATES.errored;
                  callback === null || callback === void 0 ? void 0 : callback(REALTIME_SUBSCRIBE_STATES.CHANNEL_ERROR, new Error("mismatch between server and client bindings for postgres changes"));
                  return;
                }
              }
              this.bindings.postgres_changes = newPostgresBindings;
              callback && callback(REALTIME_SUBSCRIBE_STATES.SUBSCRIBED);
              return;
            }
          }).receive("error", (error3) => {
            this.state = CHANNEL_STATES.errored;
            callback === null || callback === void 0 ? void 0 : callback(REALTIME_SUBSCRIBE_STATES.CHANNEL_ERROR, new Error(JSON.stringify(Object.values(error3).join(", ") || "error")));
            return;
          }).receive("timeout", () => {
            callback === null || callback === void 0 ? void 0 : callback(REALTIME_SUBSCRIBE_STATES.TIMED_OUT);
            return;
          });
        }
        return this;
      }
      /**
       * Returns the current presence state for this channel.
       *
       * The shape is a map keyed by presence key (for example a user id) where each entry contains the
       * tracked metadata for that user.
       */
      presenceState() {
        return this.presence.state;
      }
      /**
       * Sends the supplied payload to the presence tracker so other subscribers can see that this
       * client is online. Use `untrack` to stop broadcasting presence for the same key.
       */
      async track(payload, opts = {}) {
        return await this.send({
          type: "presence",
          event: "track",
          payload
        }, opts.timeout || this.timeout);
      }
      /**
       * Removes the current presence state for this client.
       */
      async untrack(opts = {}) {
        return await this.send({
          type: "presence",
          event: "untrack"
        }, opts);
      }
      on(type2, filter, callback) {
        if (this.state === CHANNEL_STATES.joined && type2 === REALTIME_LISTEN_TYPES.PRESENCE) {
          this.socket.log("channel", `resubscribe to ${this.topic} due to change in presence callbacks on joined channel`);
          this.unsubscribe().then(() => this.subscribe());
        }
        return this._on(type2, filter, callback);
      }
      /**
       * Sends a broadcast message explicitly via REST API.
       *
       * This method always uses the REST API endpoint regardless of WebSocket connection state.
       * Useful when you want to guarantee REST delivery or when gradually migrating from implicit REST fallback.
       *
       * @param event The name of the broadcast event
       * @param payload Payload to be sent (required)
       * @param opts Options including timeout
       * @returns Promise resolving to object with success status, and error details if failed
       */
      async httpSend(event, payload, opts = {}) {
        var _a2;
        const authorization = this.socket.accessTokenValue ? `Bearer ${this.socket.accessTokenValue}` : "";
        if (payload === void 0 || payload === null) {
          return Promise.reject("Payload is required for httpSend()");
        }
        const options = {
          method: "POST",
          headers: {
            Authorization: authorization,
            apikey: this.socket.apiKey ? this.socket.apiKey : "",
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            messages: [
              {
                topic: this.subTopic,
                event,
                payload,
                private: this.private
              }
            ]
          })
        };
        const response = await this._fetchWithTimeout(this.broadcastEndpointURL, options, (_a2 = opts.timeout) !== null && _a2 !== void 0 ? _a2 : this.timeout);
        if (response.status === 202) {
          return { success: true };
        }
        let errorMessage = response.statusText;
        try {
          const errorBody = await response.json();
          errorMessage = errorBody.error || errorBody.message || errorMessage;
        } catch (_b) {
        }
        return Promise.reject(new Error(errorMessage));
      }
      /**
       * Sends a message into the channel.
       *
       * @param args Arguments to send to channel
       * @param args.type The type of event to send
       * @param args.event The name of the event being sent
       * @param args.payload Payload to be sent
       * @param opts Options to be used during the send process
       */
      async send(args, opts = {}) {
        var _a2, _b;
        if (!this._canPush() && args.type === "broadcast") {
          console.warn("Realtime send() is automatically falling back to REST API. This behavior will be deprecated in the future. Please use httpSend() explicitly for REST delivery.");
          const { event, payload: endpoint_payload } = args;
          const authorization = this.socket.accessTokenValue ? `Bearer ${this.socket.accessTokenValue}` : "";
          const options = {
            method: "POST",
            headers: {
              Authorization: authorization,
              apikey: this.socket.apiKey ? this.socket.apiKey : "",
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              messages: [
                {
                  topic: this.subTopic,
                  event,
                  payload: endpoint_payload,
                  private: this.private
                }
              ]
            })
          };
          try {
            const response = await this._fetchWithTimeout(this.broadcastEndpointURL, options, (_a2 = opts.timeout) !== null && _a2 !== void 0 ? _a2 : this.timeout);
            await ((_b = response.body) === null || _b === void 0 ? void 0 : _b.cancel());
            return response.ok ? "ok" : "error";
          } catch (error3) {
            if (error3.name === "AbortError") {
              return "timed out";
            } else {
              return "error";
            }
          }
        } else {
          return new Promise((resolve) => {
            var _a3, _b2, _c;
            const push = this._push(args.type, args, opts.timeout || this.timeout);
            if (args.type === "broadcast" && !((_c = (_b2 = (_a3 = this.params) === null || _a3 === void 0 ? void 0 : _a3.config) === null || _b2 === void 0 ? void 0 : _b2.broadcast) === null || _c === void 0 ? void 0 : _c.ack)) {
              resolve("ok");
            }
            push.receive("ok", () => resolve("ok"));
            push.receive("error", () => resolve("error"));
            push.receive("timeout", () => resolve("timed out"));
          });
        }
      }
      /**
       * Updates the payload that will be sent the next time the channel joins (reconnects).
       * Useful for rotating access tokens or updating config without re-creating the channel.
       */
      updateJoinPayload(payload) {
        this.joinPush.updatePayload(payload);
      }
      /**
       * Leaves the channel.
       *
       * Unsubscribes from server events, and instructs channel to terminate on server.
       * Triggers onClose() hooks.
       *
       * To receive leave acknowledgements, use the a `receive` hook to bind to the server ack, ie:
       * channel.unsubscribe().receive("ok", () => alert("left!") )
       */
      unsubscribe(timeout = this.timeout) {
        this.state = CHANNEL_STATES.leaving;
        const onClose = /* @__PURE__ */ __name2(() => {
          this.socket.log("channel", `leave ${this.topic}`);
          this._trigger(CHANNEL_EVENTS.close, "leave", this._joinRef());
        }, "onClose");
        this.joinPush.destroy();
        let leavePush = null;
        return new Promise((resolve) => {
          leavePush = new Push(this, CHANNEL_EVENTS.leave, {}, timeout);
          leavePush.receive("ok", () => {
            onClose();
            resolve("ok");
          }).receive("timeout", () => {
            onClose();
            resolve("timed out");
          }).receive("error", () => {
            resolve("error");
          });
          leavePush.send();
          if (!this._canPush()) {
            leavePush.trigger("ok", {});
          }
        }).finally(() => {
          leavePush === null || leavePush === void 0 ? void 0 : leavePush.destroy();
        });
      }
      /**
       * Teardown the channel.
       *
       * Destroys and stops related timers.
       */
      teardown() {
        this.pushBuffer.forEach((push) => push.destroy());
        this.pushBuffer = [];
        this.rejoinTimer.reset();
        this.joinPush.destroy();
        this.state = CHANNEL_STATES.closed;
        this.bindings = {};
      }
      /** @internal */
      async _fetchWithTimeout(url, options, timeout) {
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), timeout);
        const response = await this.socket.fetch(url, Object.assign(Object.assign({}, options), { signal: controller.signal }));
        clearTimeout(id);
        return response;
      }
      /** @internal */
      _push(event, payload, timeout = this.timeout) {
        if (!this.joinedOnce) {
          throw `tried to push '${event}' to '${this.topic}' before joining. Use channel.subscribe() before pushing events`;
        }
        let pushEvent = new Push(this, event, payload, timeout);
        if (this._canPush()) {
          pushEvent.send();
        } else {
          this._addToPushBuffer(pushEvent);
        }
        return pushEvent;
      }
      /** @internal */
      _addToPushBuffer(pushEvent) {
        pushEvent.startTimeout();
        this.pushBuffer.push(pushEvent);
        if (this.pushBuffer.length > MAX_PUSH_BUFFER_SIZE) {
          const removedPush = this.pushBuffer.shift();
          if (removedPush) {
            removedPush.destroy();
            this.socket.log("channel", `discarded push due to buffer overflow: ${removedPush.event}`, removedPush.payload);
          }
        }
      }
      /**
       * Overridable message hook
       *
       * Receives all events for specialized message handling before dispatching to the channel callbacks.
       * Must return the payload, modified or unmodified.
       *
       * @internal
       */
      _onMessage(_event, payload, _ref) {
        return payload;
      }
      /** @internal */
      _isMember(topic) {
        return this.topic === topic;
      }
      /** @internal */
      _joinRef() {
        return this.joinPush.ref;
      }
      /** @internal */
      _trigger(type2, payload, ref2) {
        var _a2, _b;
        const typeLower = type2.toLocaleLowerCase();
        const { close: close2, error: error3, leave, join } = CHANNEL_EVENTS;
        const events = [close2, error3, leave, join];
        if (ref2 && events.indexOf(typeLower) >= 0 && ref2 !== this._joinRef()) {
          return;
        }
        let handledPayload = this._onMessage(typeLower, payload, ref2);
        if (payload && !handledPayload) {
          throw "channel onMessage callbacks must return the payload, modified or unmodified";
        }
        if (["insert", "update", "delete"].includes(typeLower)) {
          (_a2 = this.bindings.postgres_changes) === null || _a2 === void 0 ? void 0 : _a2.filter((bind) => {
            var _a3, _b2, _c;
            return ((_a3 = bind.filter) === null || _a3 === void 0 ? void 0 : _a3.event) === "*" || ((_c = (_b2 = bind.filter) === null || _b2 === void 0 ? void 0 : _b2.event) === null || _c === void 0 ? void 0 : _c.toLocaleLowerCase()) === typeLower;
          }).map((bind) => bind.callback(handledPayload, ref2));
        } else {
          (_b = this.bindings[typeLower]) === null || _b === void 0 ? void 0 : _b.filter((bind) => {
            var _a3, _b2, _c, _d, _e, _f;
            if (["broadcast", "presence", "postgres_changes"].includes(typeLower)) {
              if ("id" in bind) {
                const bindId = bind.id;
                const bindEvent = (_a3 = bind.filter) === null || _a3 === void 0 ? void 0 : _a3.event;
                return bindId && ((_b2 = payload.ids) === null || _b2 === void 0 ? void 0 : _b2.includes(bindId)) && (bindEvent === "*" || (bindEvent === null || bindEvent === void 0 ? void 0 : bindEvent.toLocaleLowerCase()) === ((_c = payload.data) === null || _c === void 0 ? void 0 : _c.type.toLocaleLowerCase()));
              } else {
                const bindEvent = (_e = (_d = bind === null || bind === void 0 ? void 0 : bind.filter) === null || _d === void 0 ? void 0 : _d.event) === null || _e === void 0 ? void 0 : _e.toLocaleLowerCase();
                return bindEvent === "*" || bindEvent === ((_f = payload === null || payload === void 0 ? void 0 : payload.event) === null || _f === void 0 ? void 0 : _f.toLocaleLowerCase());
              }
            } else {
              return bind.type.toLocaleLowerCase() === typeLower;
            }
          }).map((bind) => {
            if (typeof handledPayload === "object" && "ids" in handledPayload) {
              const postgresChanges = handledPayload.data;
              const { schema, table: table3, commit_timestamp, type: type3, errors } = postgresChanges;
              const enrichedPayload = {
                schema,
                table: table3,
                commit_timestamp,
                eventType: type3,
                new: {},
                old: {},
                errors
              };
              handledPayload = Object.assign(Object.assign({}, enrichedPayload), this._getPayloadRecords(postgresChanges));
            }
            bind.callback(handledPayload, ref2);
          });
        }
      }
      /** @internal */
      _isClosed() {
        return this.state === CHANNEL_STATES.closed;
      }
      /** @internal */
      _isJoined() {
        return this.state === CHANNEL_STATES.joined;
      }
      /** @internal */
      _isJoining() {
        return this.state === CHANNEL_STATES.joining;
      }
      /** @internal */
      _isLeaving() {
        return this.state === CHANNEL_STATES.leaving;
      }
      /** @internal */
      _replyEventName(ref2) {
        return `chan_reply_${ref2}`;
      }
      /** @internal */
      _on(type2, filter, callback) {
        const typeLower = type2.toLocaleLowerCase();
        const binding2 = {
          type: typeLower,
          filter,
          callback
        };
        if (this.bindings[typeLower]) {
          this.bindings[typeLower].push(binding2);
        } else {
          this.bindings[typeLower] = [binding2];
        }
        return this;
      }
      /** @internal */
      _off(type2, filter) {
        const typeLower = type2.toLocaleLowerCase();
        if (this.bindings[typeLower]) {
          this.bindings[typeLower] = this.bindings[typeLower].filter((bind) => {
            var _a2;
            return !(((_a2 = bind.type) === null || _a2 === void 0 ? void 0 : _a2.toLocaleLowerCase()) === typeLower && _RealtimeChannel.isEqual(bind.filter, filter));
          });
        }
        return this;
      }
      /** @internal */
      static isEqual(obj1, obj2) {
        if (Object.keys(obj1).length !== Object.keys(obj2).length) {
          return false;
        }
        for (const k in obj1) {
          if (obj1[k] !== obj2[k]) {
            return false;
          }
        }
        return true;
      }
      /** @internal */
      _rejoinUntilConnected() {
        this.rejoinTimer.scheduleTimeout();
        if (this.socket.isConnected()) {
          this._rejoin();
        }
      }
      /**
       * Registers a callback that will be executed when the channel closes.
       *
       * @internal
       */
      _onClose(callback) {
        this._on(CHANNEL_EVENTS.close, {}, callback);
      }
      /**
       * Registers a callback that will be executed when the channel encounteres an error.
       *
       * @internal
       */
      _onError(callback) {
        this._on(CHANNEL_EVENTS.error, {}, (reason) => callback(reason));
      }
      /**
       * Returns `true` if the socket is connected and the channel has been joined.
       *
       * @internal
       */
      _canPush() {
        return this.socket.isConnected() && this._isJoined();
      }
      /** @internal */
      _rejoin(timeout = this.timeout) {
        if (this._isLeaving()) {
          return;
        }
        this.socket._leaveOpenTopic(this.topic);
        this.state = CHANNEL_STATES.joining;
        this.joinPush.resend(timeout);
      }
      /** @internal */
      _getPayloadRecords(payload) {
        const records = {
          new: {},
          old: {}
        };
        if (payload.type === "INSERT" || payload.type === "UPDATE") {
          records.new = convertChangeData(payload.columns, payload.record);
        }
        if (payload.type === "UPDATE" || payload.type === "DELETE") {
          records.old = convertChangeData(payload.columns, payload.old_record);
        }
        return records;
      }
    };
  }
});
var noop2;
var CONNECTION_TIMEOUTS;
var RECONNECT_INTERVALS;
var DEFAULT_RECONNECT_FALLBACK;
var WORKER_SCRIPT;
var RealtimeClient;
var init_RealtimeClient = __esm({
  "../node_modules/@supabase/realtime-js/dist/module/RealtimeClient.js"() {
    init_functionsRoutes_0_04524570753253654();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_websocket_factory();
    init_constants3();
    init_serializer();
    init_timer();
    init_transformers();
    init_RealtimeChannel();
    noop2 = /* @__PURE__ */ __name2(() => {
    }, "noop");
    CONNECTION_TIMEOUTS = {
      HEARTBEAT_INTERVAL: 25e3,
      RECONNECT_DELAY: 10,
      HEARTBEAT_TIMEOUT_FALLBACK: 100
    };
    RECONNECT_INTERVALS = [1e3, 2e3, 5e3, 1e4];
    DEFAULT_RECONNECT_FALLBACK = 1e4;
    WORKER_SCRIPT = `
  addEventListener("message", (e) => {
    if (e.data.event === "start") {
      setInterval(() => postMessage({ event: "keepAlive" }), e.data.interval);
    }
  });`;
    RealtimeClient = class {
      static {
        __name(this, "RealtimeClient");
      }
      static {
        __name2(this, "RealtimeClient");
      }
      /**
       * Initializes the Socket.
       *
       * @param endPoint The string WebSocket endpoint, ie, "ws://example.com/socket", "wss://example.com", "/socket" (inherited host & protocol)
       * @param httpEndpoint The string HTTP endpoint, ie, "https://example.com", "/" (inherited host & protocol)
       * @param options.transport The Websocket Transport, for example WebSocket. This can be a custom implementation
       * @param options.timeout The default timeout in milliseconds to trigger push timeouts.
       * @param options.params The optional params to pass when connecting.
       * @param options.headers Deprecated: headers cannot be set on websocket connections and this option will be removed in the future.
       * @param options.heartbeatIntervalMs The millisec interval to send a heartbeat message.
       * @param options.heartbeatCallback The optional function to handle heartbeat status.
       * @param options.logger The optional function for specialized logging, ie: logger: (kind, msg, data) => { console.log(`${kind}: ${msg}`, data) }
       * @param options.logLevel Sets the log level for Realtime
       * @param options.encode The function to encode outgoing messages. Defaults to JSON: (payload, callback) => callback(JSON.stringify(payload))
       * @param options.decode The function to decode incoming messages. Defaults to Serializer's decode.
       * @param options.reconnectAfterMs he optional function that returns the millsec reconnect interval. Defaults to stepped backoff off.
       * @param options.worker Use Web Worker to set a side flow. Defaults to false.
       * @param options.workerUrl The URL of the worker script. Defaults to https://realtime.supabase.com/worker.js that includes a heartbeat event call to keep the connection alive.
       * @example
       * ```ts
       * import RealtimeClient from '@supabase/realtime-js'
       *
       * const client = new RealtimeClient('https://xyzcompany.supabase.co/realtime/v1', {
       *   params: { apikey: 'public-anon-key' },
       * })
       * client.connect()
       * ```
       */
      constructor(endPoint, options) {
        var _a2;
        this.accessTokenValue = null;
        this.apiKey = null;
        this.channels = new Array();
        this.endPoint = "";
        this.httpEndpoint = "";
        this.headers = {};
        this.params = {};
        this.timeout = DEFAULT_TIMEOUT;
        this.transport = null;
        this.heartbeatIntervalMs = CONNECTION_TIMEOUTS.HEARTBEAT_INTERVAL;
        this.heartbeatTimer = void 0;
        this.pendingHeartbeatRef = null;
        this.heartbeatCallback = noop2;
        this.ref = 0;
        this.reconnectTimer = null;
        this.vsn = DEFAULT_VSN;
        this.logger = noop2;
        this.conn = null;
        this.sendBuffer = [];
        this.serializer = new Serializer();
        this.stateChangeCallbacks = {
          open: [],
          close: [],
          error: [],
          message: []
        };
        this.accessToken = null;
        this._connectionState = "disconnected";
        this._wasManualDisconnect = false;
        this._authPromise = null;
        this._resolveFetch = (customFetch) => {
          if (customFetch) {
            return (...args) => customFetch(...args);
          }
          return (...args) => fetch(...args);
        };
        if (!((_a2 = options === null || options === void 0 ? void 0 : options.params) === null || _a2 === void 0 ? void 0 : _a2.apikey)) {
          throw new Error("API key is required to connect to Realtime");
        }
        this.apiKey = options.params.apikey;
        this.endPoint = `${endPoint}/${TRANSPORTS.websocket}`;
        this.httpEndpoint = httpEndpointURL(endPoint);
        this._initializeOptions(options);
        this._setupReconnectionTimer();
        this.fetch = this._resolveFetch(options === null || options === void 0 ? void 0 : options.fetch);
      }
      /**
       * Connects the socket, unless already connected.
       */
      connect() {
        if (this.isConnecting() || this.isDisconnecting() || this.conn !== null && this.isConnected()) {
          return;
        }
        this._setConnectionState("connecting");
        if (this.accessToken && !this._authPromise) {
          this._setAuthSafely("connect");
        }
        if (this.transport) {
          this.conn = new this.transport(this.endpointURL());
        } else {
          try {
            this.conn = websocket_factory_default.createWebSocket(this.endpointURL());
          } catch (error3) {
            this._setConnectionState("disconnected");
            const errorMessage = error3.message;
            if (errorMessage.includes("Node.js")) {
              throw new Error(`${errorMessage}

To use Realtime in Node.js, you need to provide a WebSocket implementation:

Option 1: Use Node.js 22+ which has native WebSocket support
Option 2: Install and provide the "ws" package:

  npm install ws

  import ws from "ws"
  const client = new RealtimeClient(url, {
    ...options,
    transport: ws
  })`);
            }
            throw new Error(`WebSocket not available: ${errorMessage}`);
          }
        }
        this._setupConnectionHandlers();
      }
      /**
       * Returns the URL of the websocket.
       * @returns string The URL of the websocket.
       */
      endpointURL() {
        return this._appendParams(this.endPoint, Object.assign({}, this.params, { vsn: this.vsn }));
      }
      /**
       * Disconnects the socket.
       *
       * @param code A numeric status code to send on disconnect.
       * @param reason A custom reason for the disconnect.
       */
      disconnect(code, reason) {
        if (this.isDisconnecting()) {
          return;
        }
        this._setConnectionState("disconnecting", true);
        if (this.conn) {
          const fallbackTimer = setTimeout(() => {
            this._setConnectionState("disconnected");
          }, 100);
          this.conn.onclose = () => {
            clearTimeout(fallbackTimer);
            this._setConnectionState("disconnected");
          };
          if (typeof this.conn.close === "function") {
            if (code) {
              this.conn.close(code, reason !== null && reason !== void 0 ? reason : "");
            } else {
              this.conn.close();
            }
          }
          this._teardownConnection();
        } else {
          this._setConnectionState("disconnected");
        }
      }
      /**
       * Returns all created channels
       */
      getChannels() {
        return this.channels;
      }
      /**
       * Unsubscribes and removes a single channel
       * @param channel A RealtimeChannel instance
       */
      async removeChannel(channel2) {
        const status = await channel2.unsubscribe();
        if (this.channels.length === 0) {
          this.disconnect();
        }
        return status;
      }
      /**
       * Unsubscribes and removes all channels
       */
      async removeAllChannels() {
        const values_1 = await Promise.all(this.channels.map((channel2) => channel2.unsubscribe()));
        this.channels = [];
        this.disconnect();
        return values_1;
      }
      /**
       * Logs the message.
       *
       * For customized logging, `this.logger` can be overridden.
       */
      log(kind, msg, data) {
        this.logger(kind, msg, data);
      }
      /**
       * Returns the current state of the socket.
       */
      connectionState() {
        switch (this.conn && this.conn.readyState) {
          case SOCKET_STATES.connecting:
            return CONNECTION_STATE.Connecting;
          case SOCKET_STATES.open:
            return CONNECTION_STATE.Open;
          case SOCKET_STATES.closing:
            return CONNECTION_STATE.Closing;
          default:
            return CONNECTION_STATE.Closed;
        }
      }
      /**
       * Returns `true` is the connection is open.
       */
      isConnected() {
        return this.connectionState() === CONNECTION_STATE.Open;
      }
      /**
       * Returns `true` if the connection is currently connecting.
       */
      isConnecting() {
        return this._connectionState === "connecting";
      }
      /**
       * Returns `true` if the connection is currently disconnecting.
       */
      isDisconnecting() {
        return this._connectionState === "disconnecting";
      }
      /**
       * Creates (or reuses) a {@link RealtimeChannel} for the provided topic.
       *
       * Topics are automatically prefixed with `realtime:` to match the Realtime service.
       * If a channel with the same topic already exists it will be returned instead of creating
       * a duplicate connection.
       */
      channel(topic, params = { config: {} }) {
        const realtimeTopic = `realtime:${topic}`;
        const exists2 = this.getChannels().find((c) => c.topic === realtimeTopic);
        if (!exists2) {
          const chan = new RealtimeChannel(`realtime:${topic}`, params, this);
          this.channels.push(chan);
          return chan;
        } else {
          return exists2;
        }
      }
      /**
       * Push out a message if the socket is connected.
       *
       * If the socket is not connected, the message gets enqueued within a local buffer, and sent out when a connection is next established.
       */
      push(data) {
        const { topic, event, payload, ref: ref2 } = data;
        const callback = /* @__PURE__ */ __name2(() => {
          this.encode(data, (result) => {
            var _a2;
            (_a2 = this.conn) === null || _a2 === void 0 ? void 0 : _a2.send(result);
          });
        }, "callback");
        this.log("push", `${topic} ${event} (${ref2})`, payload);
        if (this.isConnected()) {
          callback();
        } else {
          this.sendBuffer.push(callback);
        }
      }
      /**
       * Sets the JWT access token used for channel subscription authorization and Realtime RLS.
       *
       * If param is null it will use the `accessToken` callback function or the token set on the client.
       *
       * On callback used, it will set the value of the token internal to the client.
       *
       * @param token A JWT string to override the token set on the client.
       */
      async setAuth(token = null) {
        this._authPromise = this._performAuth(token);
        try {
          await this._authPromise;
        } finally {
          this._authPromise = null;
        }
      }
      /**
       * Sends a heartbeat message if the socket is connected.
       */
      async sendHeartbeat() {
        var _a2;
        if (!this.isConnected()) {
          try {
            this.heartbeatCallback("disconnected");
          } catch (e) {
            this.log("error", "error in heartbeat callback", e);
          }
          return;
        }
        if (this.pendingHeartbeatRef) {
          this.pendingHeartbeatRef = null;
          this.log("transport", "heartbeat timeout. Attempting to re-establish connection");
          try {
            this.heartbeatCallback("timeout");
          } catch (e) {
            this.log("error", "error in heartbeat callback", e);
          }
          this._wasManualDisconnect = false;
          (_a2 = this.conn) === null || _a2 === void 0 ? void 0 : _a2.close(WS_CLOSE_NORMAL, "heartbeat timeout");
          setTimeout(() => {
            var _a3;
            if (!this.isConnected()) {
              (_a3 = this.reconnectTimer) === null || _a3 === void 0 ? void 0 : _a3.scheduleTimeout();
            }
          }, CONNECTION_TIMEOUTS.HEARTBEAT_TIMEOUT_FALLBACK);
          return;
        }
        this.pendingHeartbeatRef = this._makeRef();
        this.push({
          topic: "phoenix",
          event: "heartbeat",
          payload: {},
          ref: this.pendingHeartbeatRef
        });
        try {
          this.heartbeatCallback("sent");
        } catch (e) {
          this.log("error", "error in heartbeat callback", e);
        }
        this._setAuthSafely("heartbeat");
      }
      /**
       * Sets a callback that receives lifecycle events for internal heartbeat messages.
       * Useful for instrumenting connection health (e.g. sent/ok/timeout/disconnected).
       */
      onHeartbeat(callback) {
        this.heartbeatCallback = callback;
      }
      /**
       * Flushes send buffer
       */
      flushSendBuffer() {
        if (this.isConnected() && this.sendBuffer.length > 0) {
          this.sendBuffer.forEach((callback) => callback());
          this.sendBuffer = [];
        }
      }
      /**
       * Return the next message ref, accounting for overflows
       *
       * @internal
       */
      _makeRef() {
        let newRef = this.ref + 1;
        if (newRef === this.ref) {
          this.ref = 0;
        } else {
          this.ref = newRef;
        }
        return this.ref.toString();
      }
      /**
       * Unsubscribe from channels with the specified topic.
       *
       * @internal
       */
      _leaveOpenTopic(topic) {
        let dupChannel = this.channels.find((c) => c.topic === topic && (c._isJoined() || c._isJoining()));
        if (dupChannel) {
          this.log("transport", `leaving duplicate topic "${topic}"`);
          dupChannel.unsubscribe();
        }
      }
      /**
       * Removes a subscription from the socket.
       *
       * @param channel An open subscription.
       *
       * @internal
       */
      _remove(channel2) {
        this.channels = this.channels.filter((c) => c.topic !== channel2.topic);
      }
      /** @internal */
      _onConnMessage(rawMessage) {
        this.decode(rawMessage.data, (msg) => {
          if (msg.topic === "phoenix" && msg.event === "phx_reply") {
            try {
              this.heartbeatCallback(msg.payload.status === "ok" ? "ok" : "error");
            } catch (e) {
              this.log("error", "error in heartbeat callback", e);
            }
          }
          if (msg.ref && msg.ref === this.pendingHeartbeatRef) {
            this.pendingHeartbeatRef = null;
          }
          const { topic, event, payload, ref: ref2 } = msg;
          const refString = ref2 ? `(${ref2})` : "";
          const status = payload.status || "";
          this.log("receive", `${status} ${topic} ${event} ${refString}`.trim(), payload);
          this.channels.filter((channel2) => channel2._isMember(topic)).forEach((channel2) => channel2._trigger(event, payload, ref2));
          this._triggerStateCallbacks("message", msg);
        });
      }
      /**
       * Clear specific timer
       * @internal
       */
      _clearTimer(timer) {
        var _a2;
        if (timer === "heartbeat" && this.heartbeatTimer) {
          clearInterval(this.heartbeatTimer);
          this.heartbeatTimer = void 0;
        } else if (timer === "reconnect") {
          (_a2 = this.reconnectTimer) === null || _a2 === void 0 ? void 0 : _a2.reset();
        }
      }
      /**
       * Clear all timers
       * @internal
       */
      _clearAllTimers() {
        this._clearTimer("heartbeat");
        this._clearTimer("reconnect");
      }
      /**
       * Setup connection handlers for WebSocket events
       * @internal
       */
      _setupConnectionHandlers() {
        if (!this.conn)
          return;
        if ("binaryType" in this.conn) {
          ;
          this.conn.binaryType = "arraybuffer";
        }
        this.conn.onopen = () => this._onConnOpen();
        this.conn.onerror = (error3) => this._onConnError(error3);
        this.conn.onmessage = (event) => this._onConnMessage(event);
        this.conn.onclose = (event) => this._onConnClose(event);
      }
      /**
       * Teardown connection and cleanup resources
       * @internal
       */
      _teardownConnection() {
        if (this.conn) {
          if (this.conn.readyState === SOCKET_STATES.open || this.conn.readyState === SOCKET_STATES.connecting) {
            try {
              this.conn.close();
            } catch (e) {
              this.log("error", "Error closing connection", e);
            }
          }
          this.conn.onopen = null;
          this.conn.onerror = null;
          this.conn.onmessage = null;
          this.conn.onclose = null;
          this.conn = null;
        }
        this._clearAllTimers();
        this.channels.forEach((channel2) => channel2.teardown());
      }
      /** @internal */
      _onConnOpen() {
        this._setConnectionState("connected");
        this.log("transport", `connected to ${this.endpointURL()}`);
        const authPromise = this._authPromise || (this.accessToken && !this.accessTokenValue ? this.setAuth() : Promise.resolve());
        authPromise.then(() => {
          this.flushSendBuffer();
        }).catch((e) => {
          this.log("error", "error waiting for auth on connect", e);
          this.flushSendBuffer();
        });
        this._clearTimer("reconnect");
        if (!this.worker) {
          this._startHeartbeat();
        } else {
          if (!this.workerRef) {
            this._startWorkerHeartbeat();
          }
        }
        this._triggerStateCallbacks("open");
      }
      /** @internal */
      _startHeartbeat() {
        this.heartbeatTimer && clearInterval(this.heartbeatTimer);
        this.heartbeatTimer = setInterval(() => this.sendHeartbeat(), this.heartbeatIntervalMs);
      }
      /** @internal */
      _startWorkerHeartbeat() {
        if (this.workerUrl) {
          this.log("worker", `starting worker for from ${this.workerUrl}`);
        } else {
          this.log("worker", `starting default worker`);
        }
        const objectUrl = this._workerObjectUrl(this.workerUrl);
        this.workerRef = new Worker(objectUrl);
        this.workerRef.onerror = (error3) => {
          this.log("worker", "worker error", error3.message);
          this.workerRef.terminate();
        };
        this.workerRef.onmessage = (event) => {
          if (event.data.event === "keepAlive") {
            this.sendHeartbeat();
          }
        };
        this.workerRef.postMessage({
          event: "start",
          interval: this.heartbeatIntervalMs
        });
      }
      /** @internal */
      _onConnClose(event) {
        var _a2;
        this._setConnectionState("disconnected");
        this.log("transport", "close", event);
        this._triggerChanError();
        this._clearTimer("heartbeat");
        if (!this._wasManualDisconnect) {
          (_a2 = this.reconnectTimer) === null || _a2 === void 0 ? void 0 : _a2.scheduleTimeout();
        }
        this._triggerStateCallbacks("close", event);
      }
      /** @internal */
      _onConnError(error3) {
        this._setConnectionState("disconnected");
        this.log("transport", `${error3}`);
        this._triggerChanError();
        this._triggerStateCallbacks("error", error3);
      }
      /** @internal */
      _triggerChanError() {
        this.channels.forEach((channel2) => channel2._trigger(CHANNEL_EVENTS.error));
      }
      /** @internal */
      _appendParams(url, params) {
        if (Object.keys(params).length === 0) {
          return url;
        }
        const prefix = url.match(/\?/) ? "&" : "?";
        const query = new URLSearchParams(params);
        return `${url}${prefix}${query}`;
      }
      _workerObjectUrl(url) {
        let result_url;
        if (url) {
          result_url = url;
        } else {
          const blob = new Blob([WORKER_SCRIPT], { type: "application/javascript" });
          result_url = URL.createObjectURL(blob);
        }
        return result_url;
      }
      /**
       * Set connection state with proper state management
       * @internal
       */
      _setConnectionState(state, manual = false) {
        this._connectionState = state;
        if (state === "connecting") {
          this._wasManualDisconnect = false;
        } else if (state === "disconnecting") {
          this._wasManualDisconnect = manual;
        }
      }
      /**
       * Perform the actual auth operation
       * @internal
       */
      async _performAuth(token = null) {
        let tokenToSend;
        if (token) {
          tokenToSend = token;
        } else if (this.accessToken) {
          tokenToSend = await this.accessToken();
        } else {
          tokenToSend = this.accessTokenValue;
        }
        if (this.accessTokenValue != tokenToSend) {
          this.accessTokenValue = tokenToSend;
          this.channels.forEach((channel2) => {
            const payload = {
              access_token: tokenToSend,
              version: DEFAULT_VERSION
            };
            tokenToSend && channel2.updateJoinPayload(payload);
            if (channel2.joinedOnce && channel2._isJoined()) {
              channel2._push(CHANNEL_EVENTS.access_token, {
                access_token: tokenToSend
              });
            }
          });
        }
      }
      /**
       * Wait for any in-flight auth operations to complete
       * @internal
       */
      async _waitForAuthIfNeeded() {
        if (this._authPromise) {
          await this._authPromise;
        }
      }
      /**
       * Safely call setAuth with standardized error handling
       * @internal
       */
      _setAuthSafely(context2 = "general") {
        this.setAuth().catch((e) => {
          this.log("error", `error setting auth in ${context2}`, e);
        });
      }
      /**
       * Trigger state change callbacks with proper error handling
       * @internal
       */
      _triggerStateCallbacks(event, data) {
        try {
          this.stateChangeCallbacks[event].forEach((callback) => {
            try {
              callback(data);
            } catch (e) {
              this.log("error", `error in ${event} callback`, e);
            }
          });
        } catch (e) {
          this.log("error", `error triggering ${event} callbacks`, e);
        }
      }
      /**
       * Setup reconnection timer with proper configuration
       * @internal
       */
      _setupReconnectionTimer() {
        this.reconnectTimer = new Timer(async () => {
          setTimeout(async () => {
            await this._waitForAuthIfNeeded();
            if (!this.isConnected()) {
              this.connect();
            }
          }, CONNECTION_TIMEOUTS.RECONNECT_DELAY);
        }, this.reconnectAfterMs);
      }
      /**
       * Initialize client options with defaults
       * @internal
       */
      _initializeOptions(options) {
        var _a2, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m;
        this.transport = (_a2 = options === null || options === void 0 ? void 0 : options.transport) !== null && _a2 !== void 0 ? _a2 : null;
        this.timeout = (_b = options === null || options === void 0 ? void 0 : options.timeout) !== null && _b !== void 0 ? _b : DEFAULT_TIMEOUT;
        this.heartbeatIntervalMs = (_c = options === null || options === void 0 ? void 0 : options.heartbeatIntervalMs) !== null && _c !== void 0 ? _c : CONNECTION_TIMEOUTS.HEARTBEAT_INTERVAL;
        this.worker = (_d = options === null || options === void 0 ? void 0 : options.worker) !== null && _d !== void 0 ? _d : false;
        this.accessToken = (_e = options === null || options === void 0 ? void 0 : options.accessToken) !== null && _e !== void 0 ? _e : null;
        this.heartbeatCallback = (_f = options === null || options === void 0 ? void 0 : options.heartbeatCallback) !== null && _f !== void 0 ? _f : noop2;
        this.vsn = (_g = options === null || options === void 0 ? void 0 : options.vsn) !== null && _g !== void 0 ? _g : DEFAULT_VSN;
        if (options === null || options === void 0 ? void 0 : options.params)
          this.params = options.params;
        if (options === null || options === void 0 ? void 0 : options.logger)
          this.logger = options.logger;
        if ((options === null || options === void 0 ? void 0 : options.logLevel) || (options === null || options === void 0 ? void 0 : options.log_level)) {
          this.logLevel = options.logLevel || options.log_level;
          this.params = Object.assign(Object.assign({}, this.params), { log_level: this.logLevel });
        }
        this.reconnectAfterMs = (_h = options === null || options === void 0 ? void 0 : options.reconnectAfterMs) !== null && _h !== void 0 ? _h : ((tries) => {
          return RECONNECT_INTERVALS[tries - 1] || DEFAULT_RECONNECT_FALLBACK;
        });
        switch (this.vsn) {
          case VSN_1_0_0:
            this.encode = (_j = options === null || options === void 0 ? void 0 : options.encode) !== null && _j !== void 0 ? _j : ((payload, callback) => {
              return callback(JSON.stringify(payload));
            });
            this.decode = (_k = options === null || options === void 0 ? void 0 : options.decode) !== null && _k !== void 0 ? _k : ((payload, callback) => {
              return callback(JSON.parse(payload));
            });
            break;
          case VSN_2_0_0:
            this.encode = (_l = options === null || options === void 0 ? void 0 : options.encode) !== null && _l !== void 0 ? _l : this.serializer.encode.bind(this.serializer);
            this.decode = (_m = options === null || options === void 0 ? void 0 : options.decode) !== null && _m !== void 0 ? _m : this.serializer.decode.bind(this.serializer);
            break;
          default:
            throw new Error(`Unsupported serializer version: ${this.vsn}`);
        }
        if (this.worker) {
          if (typeof window !== "undefined" && !window.Worker) {
            throw new Error("Web Worker is not supported");
          }
          this.workerUrl = options === null || options === void 0 ? void 0 : options.workerUrl;
        }
      }
    };
  }
});
var init_module2 = __esm({
  "../node_modules/@supabase/realtime-js/dist/module/index.js"() {
    init_functionsRoutes_0_04524570753253654();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_RealtimeClient();
    init_RealtimeChannel();
    init_RealtimePresence();
    init_websocket_factory();
  }
});
function isStorageError(error3) {
  return typeof error3 === "object" && error3 !== null && "__isStorageError" in error3;
}
__name(isStorageError, "isStorageError");
var StorageError;
var StorageApiError;
var StorageUnknownError;
var init_errors = __esm({
  "../node_modules/@supabase/storage-js/dist/module/lib/errors.js"() {
    init_functionsRoutes_0_04524570753253654();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    StorageError = class extends Error {
      static {
        __name(this, "StorageError");
      }
      static {
        __name2(this, "StorageError");
      }
      constructor(message) {
        super(message);
        this.__isStorageError = true;
        this.name = "StorageError";
      }
    };
    __name2(isStorageError, "isStorageError");
    StorageApiError = class extends StorageError {
      static {
        __name(this, "StorageApiError");
      }
      static {
        __name2(this, "StorageApiError");
      }
      constructor(message, status, statusCode) {
        super(message);
        this.name = "StorageApiError";
        this.status = status;
        this.statusCode = statusCode;
      }
      toJSON() {
        return {
          name: this.name,
          message: this.message,
          status: this.status,
          statusCode: this.statusCode
        };
      }
    };
    StorageUnknownError = class extends StorageError {
      static {
        __name(this, "StorageUnknownError");
      }
      static {
        __name2(this, "StorageUnknownError");
      }
      constructor(message, originalError) {
        super(message);
        this.name = "StorageUnknownError";
        this.originalError = originalError;
      }
    };
  }
});
var resolveFetch2;
var resolveResponse;
var recursiveToCamel;
var isPlainObject;
var isValidBucketName;
var init_helpers = __esm({
  "../node_modules/@supabase/storage-js/dist/module/lib/helpers.js"() {
    init_functionsRoutes_0_04524570753253654();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    resolveFetch2 = /* @__PURE__ */ __name2((customFetch) => {
      if (customFetch) {
        return (...args) => customFetch(...args);
      }
      return (...args) => fetch(...args);
    }, "resolveFetch");
    resolveResponse = /* @__PURE__ */ __name2(() => {
      return Response;
    }, "resolveResponse");
    recursiveToCamel = /* @__PURE__ */ __name2((item) => {
      if (Array.isArray(item)) {
        return item.map((el) => recursiveToCamel(el));
      } else if (typeof item === "function" || item !== Object(item)) {
        return item;
      }
      const result = {};
      Object.entries(item).forEach(([key, value]) => {
        const newKey = key.replace(/([-_][a-z])/gi, (c) => c.toUpperCase().replace(/[-_]/g, ""));
        result[newKey] = recursiveToCamel(value);
      });
      return result;
    }, "recursiveToCamel");
    isPlainObject = /* @__PURE__ */ __name2((value) => {
      if (typeof value !== "object" || value === null) {
        return false;
      }
      const prototype = Object.getPrototypeOf(value);
      return (prototype === null || prototype === Object.prototype || Object.getPrototypeOf(prototype) === null) && !(Symbol.toStringTag in value) && !(Symbol.iterator in value);
    }, "isPlainObject");
    isValidBucketName = /* @__PURE__ */ __name2((bucketName) => {
      if (!bucketName || typeof bucketName !== "string") {
        return false;
      }
      if (bucketName.length === 0 || bucketName.length > 100) {
        return false;
      }
      if (bucketName.trim() !== bucketName) {
        return false;
      }
      if (bucketName.includes("/") || bucketName.includes("\\")) {
        return false;
      }
      const bucketNameRegex = /^[\w!.\*'() &$@=;:+,?-]+$/;
      return bucketNameRegex.test(bucketName);
    }, "isValidBucketName");
  }
});
function _handleRequest(fetcher, method, url, options, parameters, body) {
  return __awaiter(this, void 0, void 0, function* () {
    return new Promise((resolve, reject) => {
      fetcher(url, _getRequestParams(method, options, parameters, body)).then((result) => {
        if (!result.ok)
          throw result;
        if (options === null || options === void 0 ? void 0 : options.noResolveJson)
          return result;
        return result.json();
      }).then((data) => resolve(data)).catch((error3) => handleError(error3, reject, options));
    });
  });
}
__name(_handleRequest, "_handleRequest");
function get(fetcher, url, options, parameters) {
  return __awaiter(this, void 0, void 0, function* () {
    return _handleRequest(fetcher, "GET", url, options, parameters);
  });
}
__name(get, "get");
function post(fetcher, url, body, options, parameters) {
  return __awaiter(this, void 0, void 0, function* () {
    return _handleRequest(fetcher, "POST", url, options, parameters, body);
  });
}
__name(post, "post");
function put(fetcher, url, body, options, parameters) {
  return __awaiter(this, void 0, void 0, function* () {
    return _handleRequest(fetcher, "PUT", url, options, parameters, body);
  });
}
__name(put, "put");
function head(fetcher, url, options, parameters) {
  return __awaiter(this, void 0, void 0, function* () {
    return _handleRequest(fetcher, "HEAD", url, Object.assign(Object.assign({}, options), { noResolveJson: true }), parameters);
  });
}
__name(head, "head");
function remove(fetcher, url, body, options, parameters) {
  return __awaiter(this, void 0, void 0, function* () {
    return _handleRequest(fetcher, "DELETE", url, options, parameters, body);
  });
}
__name(remove, "remove");
var _getErrorMessage;
var handleError;
var _getRequestParams;
var init_fetch = __esm({
  "../node_modules/@supabase/storage-js/dist/module/lib/fetch.js"() {
    init_functionsRoutes_0_04524570753253654();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_tslib_es6();
    init_errors();
    init_helpers();
    _getErrorMessage = /* @__PURE__ */ __name2((err) => {
      var _a2;
      return err.msg || err.message || err.error_description || (typeof err.error === "string" ? err.error : (_a2 = err.error) === null || _a2 === void 0 ? void 0 : _a2.message) || JSON.stringify(err);
    }, "_getErrorMessage");
    handleError = /* @__PURE__ */ __name2((error3, reject, options) => __awaiter(void 0, void 0, void 0, function* () {
      const Res = yield resolveResponse();
      if (error3 instanceof Res && !(options === null || options === void 0 ? void 0 : options.noResolveJson)) {
        error3.json().then((err) => {
          const status = error3.status || 500;
          const statusCode = (err === null || err === void 0 ? void 0 : err.statusCode) || status + "";
          reject(new StorageApiError(_getErrorMessage(err), status, statusCode));
        }).catch((err) => {
          reject(new StorageUnknownError(_getErrorMessage(err), err));
        });
      } else {
        reject(new StorageUnknownError(_getErrorMessage(error3), error3));
      }
    }), "handleError");
    _getRequestParams = /* @__PURE__ */ __name2((method, options, parameters, body) => {
      const params = { method, headers: (options === null || options === void 0 ? void 0 : options.headers) || {} };
      if (method === "GET" || !body) {
        return params;
      }
      if (isPlainObject(body)) {
        params.headers = Object.assign({ "Content-Type": "application/json" }, options === null || options === void 0 ? void 0 : options.headers);
        params.body = JSON.stringify(body);
      } else {
        params.body = body;
      }
      if (options === null || options === void 0 ? void 0 : options.duplex) {
        params.duplex = options.duplex;
      }
      return Object.assign(Object.assign({}, params), parameters);
    }, "_getRequestParams");
    __name2(_handleRequest, "_handleRequest");
    __name2(get, "get");
    __name2(post, "post");
    __name2(put, "put");
    __name2(head, "head");
    __name2(remove, "remove");
  }
});
var StreamDownloadBuilder;
var init_StreamDownloadBuilder = __esm({
  "../node_modules/@supabase/storage-js/dist/module/packages/StreamDownloadBuilder.js"() {
    init_functionsRoutes_0_04524570753253654();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_tslib_es6();
    init_errors();
    StreamDownloadBuilder = class {
      static {
        __name(this, "StreamDownloadBuilder");
      }
      static {
        __name2(this, "StreamDownloadBuilder");
      }
      constructor(downloadFn, shouldThrowOnError) {
        this.downloadFn = downloadFn;
        this.shouldThrowOnError = shouldThrowOnError;
      }
      then(onfulfilled, onrejected) {
        return this.execute().then(onfulfilled, onrejected);
      }
      execute() {
        return __awaiter(this, void 0, void 0, function* () {
          try {
            const result = yield this.downloadFn();
            return {
              data: result.body,
              error: null
            };
          } catch (error3) {
            if (this.shouldThrowOnError) {
              throw error3;
            }
            if (isStorageError(error3)) {
              return { data: null, error: error3 };
            }
            throw error3;
          }
        });
      }
    };
  }
});
var _a;
var BlobDownloadBuilder;
var BlobDownloadBuilder_default;
var init_BlobDownloadBuilder = __esm({
  "../node_modules/@supabase/storage-js/dist/module/packages/BlobDownloadBuilder.js"() {
    init_functionsRoutes_0_04524570753253654();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_tslib_es6();
    init_errors();
    init_StreamDownloadBuilder();
    BlobDownloadBuilder = class {
      static {
        __name(this, "BlobDownloadBuilder");
      }
      static {
        __name2(this, "BlobDownloadBuilder");
      }
      constructor(downloadFn, shouldThrowOnError) {
        this.downloadFn = downloadFn;
        this.shouldThrowOnError = shouldThrowOnError;
        this[_a] = "BlobDownloadBuilder";
        this.promise = null;
      }
      asStream() {
        return new StreamDownloadBuilder(this.downloadFn, this.shouldThrowOnError);
      }
      then(onfulfilled, onrejected) {
        return this.getPromise().then(onfulfilled, onrejected);
      }
      catch(onrejected) {
        return this.getPromise().catch(onrejected);
      }
      finally(onfinally) {
        return this.getPromise().finally(onfinally);
      }
      getPromise() {
        if (!this.promise) {
          this.promise = this.execute();
        }
        return this.promise;
      }
      execute() {
        return __awaiter(this, void 0, void 0, function* () {
          try {
            const result = yield this.downloadFn();
            return {
              data: yield result.blob(),
              error: null
            };
          } catch (error3) {
            if (this.shouldThrowOnError) {
              throw error3;
            }
            if (isStorageError(error3)) {
              return { data: null, error: error3 };
            }
            throw error3;
          }
        });
      }
    };
    _a = Symbol.toStringTag;
    BlobDownloadBuilder_default = BlobDownloadBuilder;
  }
});
var DEFAULT_SEARCH_OPTIONS;
var DEFAULT_FILE_OPTIONS;
var StorageFileApi;
var init_StorageFileApi = __esm({
  "../node_modules/@supabase/storage-js/dist/module/packages/StorageFileApi.js"() {
    init_functionsRoutes_0_04524570753253654();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_tslib_es6();
    init_errors();
    init_fetch();
    init_helpers();
    init_BlobDownloadBuilder();
    DEFAULT_SEARCH_OPTIONS = {
      limit: 100,
      offset: 0,
      sortBy: {
        column: "name",
        order: "asc"
      }
    };
    DEFAULT_FILE_OPTIONS = {
      cacheControl: "3600",
      contentType: "text/plain;charset=UTF-8",
      upsert: false
    };
    StorageFileApi = class {
      static {
        __name(this, "StorageFileApi");
      }
      static {
        __name2(this, "StorageFileApi");
      }
      constructor(url, headers = {}, bucketId, fetch2) {
        this.shouldThrowOnError = false;
        this.url = url;
        this.headers = headers;
        this.bucketId = bucketId;
        this.fetch = resolveFetch2(fetch2);
      }
      /**
       * Enable throwing errors instead of returning them.
       *
       * @category File Buckets
       */
      throwOnError() {
        this.shouldThrowOnError = true;
        return this;
      }
      /**
       * Uploads a file to an existing bucket or replaces an existing file at the specified path with a new one.
       *
       * @param method HTTP method.
       * @param path The relative file path. Should be of the format `folder/subfolder/filename.png`. The bucket must already exist before attempting to upload.
       * @param fileBody The body of the file to be stored in the bucket.
       */
      uploadOrUpdate(method, path, fileBody, fileOptions) {
        return __awaiter(this, void 0, void 0, function* () {
          try {
            let body;
            const options = Object.assign(Object.assign({}, DEFAULT_FILE_OPTIONS), fileOptions);
            let headers = Object.assign(Object.assign({}, this.headers), method === "POST" && { "x-upsert": String(options.upsert) });
            const metadata = options.metadata;
            if (typeof Blob !== "undefined" && fileBody instanceof Blob) {
              body = new FormData();
              body.append("cacheControl", options.cacheControl);
              if (metadata) {
                body.append("metadata", this.encodeMetadata(metadata));
              }
              body.append("", fileBody);
            } else if (typeof FormData !== "undefined" && fileBody instanceof FormData) {
              body = fileBody;
              if (!body.has("cacheControl")) {
                body.append("cacheControl", options.cacheControl);
              }
              if (metadata && !body.has("metadata")) {
                body.append("metadata", this.encodeMetadata(metadata));
              }
            } else {
              body = fileBody;
              headers["cache-control"] = `max-age=${options.cacheControl}`;
              headers["content-type"] = options.contentType;
              if (metadata) {
                headers["x-metadata"] = this.toBase64(this.encodeMetadata(metadata));
              }
              const isStream = typeof ReadableStream !== "undefined" && body instanceof ReadableStream || body && typeof body === "object" && "pipe" in body && typeof body.pipe === "function";
              if (isStream && !options.duplex) {
                options.duplex = "half";
              }
            }
            if (fileOptions === null || fileOptions === void 0 ? void 0 : fileOptions.headers) {
              headers = Object.assign(Object.assign({}, headers), fileOptions.headers);
            }
            const cleanPath = this._removeEmptyFolders(path);
            const _path = this._getFinalPath(cleanPath);
            const data = yield (method == "PUT" ? put : post)(this.fetch, `${this.url}/object/${_path}`, body, Object.assign({ headers }, (options === null || options === void 0 ? void 0 : options.duplex) ? { duplex: options.duplex } : {}));
            return {
              data: { path: cleanPath, id: data.Id, fullPath: data.Key },
              error: null
            };
          } catch (error3) {
            if (this.shouldThrowOnError) {
              throw error3;
            }
            if (isStorageError(error3)) {
              return { data: null, error: error3 };
            }
            throw error3;
          }
        });
      }
      /**
       * Uploads a file to an existing bucket.
       *
       * @category File Buckets
       * @param path The file path, including the file name. Should be of the format `folder/subfolder/filename.png`. The bucket must already exist before attempting to upload.
       * @param fileBody The body of the file to be stored in the bucket.
       * @param fileOptions Optional file upload options including cacheControl, contentType, upsert, and metadata.
       * @returns Promise with response containing file path, id, and fullPath or error
       *
       * @example Upload file
       * ```js
       * const avatarFile = event.target.files[0]
       * const { data, error } = await supabase
       *   .storage
       *   .from('avatars')
       *   .upload('public/avatar1.png', avatarFile, {
       *     cacheControl: '3600',
       *     upsert: false
       *   })
       * ```
       *
       * Response:
       * ```json
       * {
       *   "data": {
       *     "path": "public/avatar1.png",
       *     "fullPath": "avatars/public/avatar1.png"
       *   },
       *   "error": null
       * }
       * ```
       *
       * @example Upload file using `ArrayBuffer` from base64 file data
       * ```js
       * import { decode } from 'base64-arraybuffer'
       *
       * const { data, error } = await supabase
       *   .storage
       *   .from('avatars')
       *   .upload('public/avatar1.png', decode('base64FileData'), {
       *     contentType: 'image/png'
       *   })
       * ```
       */
      upload(path, fileBody, fileOptions) {
        return __awaiter(this, void 0, void 0, function* () {
          return this.uploadOrUpdate("POST", path, fileBody, fileOptions);
        });
      }
      /**
       * Upload a file with a token generated from `createSignedUploadUrl`.
       *
       * @category File Buckets
       * @param path The file path, including the file name. Should be of the format `folder/subfolder/filename.png`. The bucket must already exist before attempting to upload.
       * @param token The token generated from `createSignedUploadUrl`
       * @param fileBody The body of the file to be stored in the bucket.
       * @param fileOptions Optional file upload options including cacheControl and contentType.
       * @returns Promise with response containing file path and fullPath or error
       *
       * @example Upload to a signed URL
       * ```js
       * const { data, error } = await supabase
       *   .storage
       *   .from('avatars')
       *   .uploadToSignedUrl('folder/cat.jpg', 'token-from-createSignedUploadUrl', file)
       * ```
       *
       * Response:
       * ```json
       * {
       *   "data": {
       *     "path": "folder/cat.jpg",
       *     "fullPath": "avatars/folder/cat.jpg"
       *   },
       *   "error": null
       * }
       * ```
       */
      uploadToSignedUrl(path, token, fileBody, fileOptions) {
        return __awaiter(this, void 0, void 0, function* () {
          const cleanPath = this._removeEmptyFolders(path);
          const _path = this._getFinalPath(cleanPath);
          const url = new URL(this.url + `/object/upload/sign/${_path}`);
          url.searchParams.set("token", token);
          try {
            let body;
            const options = Object.assign({ upsert: DEFAULT_FILE_OPTIONS.upsert }, fileOptions);
            const headers = Object.assign(Object.assign({}, this.headers), { "x-upsert": String(options.upsert) });
            if (typeof Blob !== "undefined" && fileBody instanceof Blob) {
              body = new FormData();
              body.append("cacheControl", options.cacheControl);
              body.append("", fileBody);
            } else if (typeof FormData !== "undefined" && fileBody instanceof FormData) {
              body = fileBody;
              body.append("cacheControl", options.cacheControl);
            } else {
              body = fileBody;
              headers["cache-control"] = `max-age=${options.cacheControl}`;
              headers["content-type"] = options.contentType;
            }
            const data = yield put(this.fetch, url.toString(), body, { headers });
            return {
              data: { path: cleanPath, fullPath: data.Key },
              error: null
            };
          } catch (error3) {
            if (this.shouldThrowOnError) {
              throw error3;
            }
            if (isStorageError(error3)) {
              return { data: null, error: error3 };
            }
            throw error3;
          }
        });
      }
      /**
       * Creates a signed upload URL.
       * Signed upload URLs can be used to upload files to the bucket without further authentication.
       * They are valid for 2 hours.
       *
       * @category File Buckets
       * @param path The file path, including the current file name. For example `folder/image.png`.
       * @param options.upsert If set to true, allows the file to be overwritten if it already exists.
       * @returns Promise with response containing signed upload URL, token, and path or error
       *
       * @example Create Signed Upload URL
       * ```js
       * const { data, error } = await supabase
       *   .storage
       *   .from('avatars')
       *   .createSignedUploadUrl('folder/cat.jpg')
       * ```
       *
       * Response:
       * ```json
       * {
       *   "data": {
       *     "signedUrl": "https://example.supabase.co/storage/v1/object/upload/sign/avatars/folder/cat.jpg?token=<TOKEN>",
       *     "path": "folder/cat.jpg",
       *     "token": "<TOKEN>"
       *   },
       *   "error": null
       * }
       * ```
       */
      createSignedUploadUrl(path, options) {
        return __awaiter(this, void 0, void 0, function* () {
          try {
            let _path = this._getFinalPath(path);
            const headers = Object.assign({}, this.headers);
            if (options === null || options === void 0 ? void 0 : options.upsert) {
              headers["x-upsert"] = "true";
            }
            const data = yield post(this.fetch, `${this.url}/object/upload/sign/${_path}`, {}, { headers });
            const url = new URL(this.url + data.url);
            const token = url.searchParams.get("token");
            if (!token) {
              throw new StorageError("No token returned by API");
            }
            return { data: { signedUrl: url.toString(), path, token }, error: null };
          } catch (error3) {
            if (this.shouldThrowOnError) {
              throw error3;
            }
            if (isStorageError(error3)) {
              return { data: null, error: error3 };
            }
            throw error3;
          }
        });
      }
      /**
       * Replaces an existing file at the specified path with a new one.
       *
       * @category File Buckets
       * @param path The relative file path. Should be of the format `folder/subfolder/filename.png`. The bucket must already exist before attempting to update.
       * @param fileBody The body of the file to be stored in the bucket.
       * @param fileOptions Optional file upload options including cacheControl, contentType, upsert, and metadata.
       * @returns Promise with response containing file path, id, and fullPath or error
       *
       * @example Update file
       * ```js
       * const avatarFile = event.target.files[0]
       * const { data, error } = await supabase
       *   .storage
       *   .from('avatars')
       *   .update('public/avatar1.png', avatarFile, {
       *     cacheControl: '3600',
       *     upsert: true
       *   })
       * ```
       *
       * Response:
       * ```json
       * {
       *   "data": {
       *     "path": "public/avatar1.png",
       *     "fullPath": "avatars/public/avatar1.png"
       *   },
       *   "error": null
       * }
       * ```
       *
       * @example Update file using `ArrayBuffer` from base64 file data
       * ```js
       * import {decode} from 'base64-arraybuffer'
       *
       * const { data, error } = await supabase
       *   .storage
       *   .from('avatars')
       *   .update('public/avatar1.png', decode('base64FileData'), {
       *     contentType: 'image/png'
       *   })
       * ```
       */
      update(path, fileBody, fileOptions) {
        return __awaiter(this, void 0, void 0, function* () {
          return this.uploadOrUpdate("PUT", path, fileBody, fileOptions);
        });
      }
      /**
       * Moves an existing file to a new path in the same bucket.
       *
       * @category File Buckets
       * @param fromPath The original file path, including the current file name. For example `folder/image.png`.
       * @param toPath The new file path, including the new file name. For example `folder/image-new.png`.
       * @param options The destination options.
       * @returns Promise with response containing success message or error
       *
       * @example Move file
       * ```js
       * const { data, error } = await supabase
       *   .storage
       *   .from('avatars')
       *   .move('public/avatar1.png', 'private/avatar2.png')
       * ```
       *
       * Response:
       * ```json
       * {
       *   "data": {
       *     "message": "Successfully moved"
       *   },
       *   "error": null
       * }
       * ```
       */
      move(fromPath, toPath, options) {
        return __awaiter(this, void 0, void 0, function* () {
          try {
            const data = yield post(this.fetch, `${this.url}/object/move`, {
              bucketId: this.bucketId,
              sourceKey: fromPath,
              destinationKey: toPath,
              destinationBucket: options === null || options === void 0 ? void 0 : options.destinationBucket
            }, { headers: this.headers });
            return { data, error: null };
          } catch (error3) {
            if (this.shouldThrowOnError) {
              throw error3;
            }
            if (isStorageError(error3)) {
              return { data: null, error: error3 };
            }
            throw error3;
          }
        });
      }
      /**
       * Copies an existing file to a new path in the same bucket.
       *
       * @category File Buckets
       * @param fromPath The original file path, including the current file name. For example `folder/image.png`.
       * @param toPath The new file path, including the new file name. For example `folder/image-copy.png`.
       * @param options The destination options.
       * @returns Promise with response containing copied file path or error
       *
       * @example Copy file
       * ```js
       * const { data, error } = await supabase
       *   .storage
       *   .from('avatars')
       *   .copy('public/avatar1.png', 'private/avatar2.png')
       * ```
       *
       * Response:
       * ```json
       * {
       *   "data": {
       *     "path": "avatars/private/avatar2.png"
       *   },
       *   "error": null
       * }
       * ```
       */
      copy(fromPath, toPath, options) {
        return __awaiter(this, void 0, void 0, function* () {
          try {
            const data = yield post(this.fetch, `${this.url}/object/copy`, {
              bucketId: this.bucketId,
              sourceKey: fromPath,
              destinationKey: toPath,
              destinationBucket: options === null || options === void 0 ? void 0 : options.destinationBucket
            }, { headers: this.headers });
            return { data: { path: data.Key }, error: null };
          } catch (error3) {
            if (this.shouldThrowOnError) {
              throw error3;
            }
            if (isStorageError(error3)) {
              return { data: null, error: error3 };
            }
            throw error3;
          }
        });
      }
      /**
       * Creates a signed URL. Use a signed URL to share a file for a fixed amount of time.
       *
       * @category File Buckets
       * @param path The file path, including the current file name. For example `folder/image.png`.
       * @param expiresIn The number of seconds until the signed URL expires. For example, `60` for a URL which is valid for one minute.
       * @param options.download triggers the file as a download if set to true. Set this parameter as the name of the file if you want to trigger the download with a different filename.
       * @param options.transform Transform the asset before serving it to the client.
       * @returns Promise with response containing signed URL or error
       *
       * @example Create Signed URL
       * ```js
       * const { data, error } = await supabase
       *   .storage
       *   .from('avatars')
       *   .createSignedUrl('folder/avatar1.png', 60)
       * ```
       *
       * Response:
       * ```json
       * {
       *   "data": {
       *     "signedUrl": "https://example.supabase.co/storage/v1/object/sign/avatars/folder/avatar1.png?token=<TOKEN>"
       *   },
       *   "error": null
       * }
       * ```
       *
       * @example Create a signed URL for an asset with transformations
       * ```js
       * const { data } = await supabase
       *   .storage
       *   .from('avatars')
       *   .createSignedUrl('folder/avatar1.png', 60, {
       *     transform: {
       *       width: 100,
       *       height: 100,
       *     }
       *   })
       * ```
       *
       * @example Create a signed URL which triggers the download of the asset
       * ```js
       * const { data } = await supabase
       *   .storage
       *   .from('avatars')
       *   .createSignedUrl('folder/avatar1.png', 60, {
       *     download: true,
       *   })
       * ```
       */
      createSignedUrl(path, expiresIn, options) {
        return __awaiter(this, void 0, void 0, function* () {
          try {
            let _path = this._getFinalPath(path);
            let data = yield post(this.fetch, `${this.url}/object/sign/${_path}`, Object.assign({ expiresIn }, (options === null || options === void 0 ? void 0 : options.transform) ? { transform: options.transform } : {}), { headers: this.headers });
            const downloadQueryParam = (options === null || options === void 0 ? void 0 : options.download) ? `&download=${options.download === true ? "" : options.download}` : "";
            const signedUrl = encodeURI(`${this.url}${data.signedURL}${downloadQueryParam}`);
            data = { signedUrl };
            return { data, error: null };
          } catch (error3) {
            if (this.shouldThrowOnError) {
              throw error3;
            }
            if (isStorageError(error3)) {
              return { data: null, error: error3 };
            }
            throw error3;
          }
        });
      }
      /**
       * Creates multiple signed URLs. Use a signed URL to share a file for a fixed amount of time.
       *
       * @category File Buckets
       * @param paths The file paths to be downloaded, including the current file names. For example `['folder/image.png', 'folder2/image2.png']`.
       * @param expiresIn The number of seconds until the signed URLs expire. For example, `60` for URLs which are valid for one minute.
       * @param options.download triggers the file as a download if set to true. Set this parameter as the name of the file if you want to trigger the download with a different filename.
       * @returns Promise with response containing array of objects with signedUrl, path, and error or error
       *
       * @example Create Signed URLs
       * ```js
       * const { data, error } = await supabase
       *   .storage
       *   .from('avatars')
       *   .createSignedUrls(['folder/avatar1.png', 'folder/avatar2.png'], 60)
       * ```
       *
       * Response:
       * ```json
       * {
       *   "data": [
       *     {
       *       "error": null,
       *       "path": "folder/avatar1.png",
       *       "signedURL": "/object/sign/avatars/folder/avatar1.png?token=<TOKEN>",
       *       "signedUrl": "https://example.supabase.co/storage/v1/object/sign/avatars/folder/avatar1.png?token=<TOKEN>"
       *     },
       *     {
       *       "error": null,
       *       "path": "folder/avatar2.png",
       *       "signedURL": "/object/sign/avatars/folder/avatar2.png?token=<TOKEN>",
       *       "signedUrl": "https://example.supabase.co/storage/v1/object/sign/avatars/folder/avatar2.png?token=<TOKEN>"
       *     }
       *   ],
       *   "error": null
       * }
       * ```
       */
      createSignedUrls(paths, expiresIn, options) {
        return __awaiter(this, void 0, void 0, function* () {
          try {
            const data = yield post(this.fetch, `${this.url}/object/sign/${this.bucketId}`, { expiresIn, paths }, { headers: this.headers });
            const downloadQueryParam = (options === null || options === void 0 ? void 0 : options.download) ? `&download=${options.download === true ? "" : options.download}` : "";
            return {
              data: data.map((datum) => Object.assign(Object.assign({}, datum), { signedUrl: datum.signedURL ? encodeURI(`${this.url}${datum.signedURL}${downloadQueryParam}`) : null })),
              error: null
            };
          } catch (error3) {
            if (this.shouldThrowOnError) {
              throw error3;
            }
            if (isStorageError(error3)) {
              return { data: null, error: error3 };
            }
            throw error3;
          }
        });
      }
      /**
       * Downloads a file from a private bucket. For public buckets, make a request to the URL returned from `getPublicUrl` instead.
       *
       * @category File Buckets
       * @param path The full path and file name of the file to be downloaded. For example `folder/image.png`.
       * @param options.transform Transform the asset before serving it to the client.
       * @returns BlobDownloadBuilder instance for downloading the file
       *
       * @example Download file
       * ```js
       * const { data, error } = await supabase
       *   .storage
       *   .from('avatars')
       *   .download('folder/avatar1.png')
       * ```
       *
       * Response:
       * ```json
       * {
       *   "data": <BLOB>,
       *   "error": null
       * }
       * ```
       *
       * @example Download file with transformations
       * ```js
       * const { data, error } = await supabase
       *   .storage
       *   .from('avatars')
       *   .download('folder/avatar1.png', {
       *     transform: {
       *       width: 100,
       *       height: 100,
       *       quality: 80
       *     }
       *   })
       * ```
       */
      download(path, options) {
        const wantsTransformation = typeof (options === null || options === void 0 ? void 0 : options.transform) !== "undefined";
        const renderPath = wantsTransformation ? "render/image/authenticated" : "object";
        const transformationQuery = this.transformOptsToQueryString((options === null || options === void 0 ? void 0 : options.transform) || {});
        const queryString = transformationQuery ? `?${transformationQuery}` : "";
        const _path = this._getFinalPath(path);
        const downloadFn = /* @__PURE__ */ __name2(() => get(this.fetch, `${this.url}/${renderPath}/${_path}${queryString}`, {
          headers: this.headers,
          noResolveJson: true
        }), "downloadFn");
        return new BlobDownloadBuilder_default(downloadFn, this.shouldThrowOnError);
      }
      /**
       * Retrieves the details of an existing file.
       *
       * @category File Buckets
       * @param path The file path, including the file name. For example `folder/image.png`.
       * @returns Promise with response containing file metadata or error
       *
       * @example Get file info
       * ```js
       * const { data, error } = await supabase
       *   .storage
       *   .from('avatars')
       *   .info('folder/avatar1.png')
       * ```
       */
      info(path) {
        return __awaiter(this, void 0, void 0, function* () {
          const _path = this._getFinalPath(path);
          try {
            const data = yield get(this.fetch, `${this.url}/object/info/${_path}`, {
              headers: this.headers
            });
            return { data: recursiveToCamel(data), error: null };
          } catch (error3) {
            if (this.shouldThrowOnError) {
              throw error3;
            }
            if (isStorageError(error3)) {
              return { data: null, error: error3 };
            }
            throw error3;
          }
        });
      }
      /**
       * Checks the existence of a file.
       *
       * @category File Buckets
       * @param path The file path, including the file name. For example `folder/image.png`.
       * @returns Promise with response containing boolean indicating file existence or error
       *
       * @example Check file existence
       * ```js
       * const { data, error } = await supabase
       *   .storage
       *   .from('avatars')
       *   .exists('folder/avatar1.png')
       * ```
       */
      exists(path) {
        return __awaiter(this, void 0, void 0, function* () {
          const _path = this._getFinalPath(path);
          try {
            yield head(this.fetch, `${this.url}/object/${_path}`, {
              headers: this.headers
            });
            return { data: true, error: null };
          } catch (error3) {
            if (this.shouldThrowOnError) {
              throw error3;
            }
            if (isStorageError(error3) && error3 instanceof StorageUnknownError) {
              const originalError = error3.originalError;
              if ([400, 404].includes(originalError === null || originalError === void 0 ? void 0 : originalError.status)) {
                return { data: false, error: error3 };
              }
            }
            throw error3;
          }
        });
      }
      /**
       * A simple convenience function to get the URL for an asset in a public bucket. If you do not want to use this function, you can construct the public URL by concatenating the bucket URL with the path to the asset.
       * This function does not verify if the bucket is public. If a public URL is created for a bucket which is not public, you will not be able to download the asset.
       *
       * @category File Buckets
       * @param path The path and name of the file to generate the public URL for. For example `folder/image.png`.
       * @param options.download Triggers the file as a download if set to true. Set this parameter as the name of the file if you want to trigger the download with a different filename.
       * @param options.transform Transform the asset before serving it to the client.
       * @returns Object with public URL
       *
       * @example Returns the URL for an asset in a public bucket
       * ```js
       * const { data } = supabase
       *   .storage
       *   .from('public-bucket')
       *   .getPublicUrl('folder/avatar1.png')
       * ```
       *
       * Response:
       * ```json
       * {
       *   "data": {
       *     "publicUrl": "https://example.supabase.co/storage/v1/object/public/public-bucket/folder/avatar1.png"
       *   }
       * }
       * ```
       *
       * @example Returns the URL for an asset in a public bucket with transformations
       * ```js
       * const { data } = supabase
       *   .storage
       *   .from('public-bucket')
       *   .getPublicUrl('folder/avatar1.png', {
       *     transform: {
       *       width: 100,
       *       height: 100,
       *     }
       *   })
       * ```
       *
       * @example Returns the URL which triggers the download of an asset in a public bucket
       * ```js
       * const { data } = supabase
       *   .storage
       *   .from('public-bucket')
       *   .getPublicUrl('folder/avatar1.png', {
       *     download: true,
       *   })
       * ```
       */
      getPublicUrl(path, options) {
        const _path = this._getFinalPath(path);
        const _queryString = [];
        const downloadQueryParam = (options === null || options === void 0 ? void 0 : options.download) ? `download=${options.download === true ? "" : options.download}` : "";
        if (downloadQueryParam !== "") {
          _queryString.push(downloadQueryParam);
        }
        const wantsTransformation = typeof (options === null || options === void 0 ? void 0 : options.transform) !== "undefined";
        const renderPath = wantsTransformation ? "render/image" : "object";
        const transformationQuery = this.transformOptsToQueryString((options === null || options === void 0 ? void 0 : options.transform) || {});
        if (transformationQuery !== "") {
          _queryString.push(transformationQuery);
        }
        let queryString = _queryString.join("&");
        if (queryString !== "") {
          queryString = `?${queryString}`;
        }
        return {
          data: { publicUrl: encodeURI(`${this.url}/${renderPath}/public/${_path}${queryString}`) }
        };
      }
      /**
       * Deletes files within the same bucket
       *
       * @category File Buckets
       * @param paths An array of files to delete, including the path and file name. For example [`'folder/image.png'`].
       * @returns Promise with response containing array of deleted file objects or error
       *
       * @example Delete file
       * ```js
       * const { data, error } = await supabase
       *   .storage
       *   .from('avatars')
       *   .remove(['folder/avatar1.png'])
       * ```
       *
       * Response:
       * ```json
       * {
       *   "data": [],
       *   "error": null
       * }
       * ```
       */
      remove(paths) {
        return __awaiter(this, void 0, void 0, function* () {
          try {
            const data = yield remove(this.fetch, `${this.url}/object/${this.bucketId}`, { prefixes: paths }, { headers: this.headers });
            return { data, error: null };
          } catch (error3) {
            if (this.shouldThrowOnError) {
              throw error3;
            }
            if (isStorageError(error3)) {
              return { data: null, error: error3 };
            }
            throw error3;
          }
        });
      }
      /**
       * Get file metadata
       * @param id the file id to retrieve metadata
       */
      // async getMetadata(
      //   id: string
      // ): Promise<
      //   | {
      //       data: Metadata
      //       error: null
      //     }
      //   | {
      //       data: null
      //       error: StorageError
      //     }
      // > {
      //   try {
      //     const data = await get(this.fetch, `${this.url}/metadata/${id}`, { headers: this.headers })
      //     return { data, error: null }
      //   } catch (error) {
      //     if (isStorageError(error)) {
      //       return { data: null, error }
      //     }
      //     throw error
      //   }
      // }
      /**
       * Update file metadata
       * @param id the file id to update metadata
       * @param meta the new file metadata
       */
      // async updateMetadata(
      //   id: string,
      //   meta: Metadata
      // ): Promise<
      //   | {
      //       data: Metadata
      //       error: null
      //     }
      //   | {
      //       data: null
      //       error: StorageError
      //     }
      // > {
      //   try {
      //     const data = await post(
      //       this.fetch,
      //       `${this.url}/metadata/${id}`,
      //       { ...meta },
      //       { headers: this.headers }
      //     )
      //     return { data, error: null }
      //   } catch (error) {
      //     if (isStorageError(error)) {
      //       return { data: null, error }
      //     }
      //     throw error
      //   }
      // }
      /**
       * Lists all the files and folders within a path of the bucket.
       *
       * @category File Buckets
       * @param path The folder path.
       * @param options Search options including limit (defaults to 100), offset, sortBy, and search
       * @param parameters Optional fetch parameters including signal for cancellation
       * @returns Promise with response containing array of files or error
       *
       * @example List files in a bucket
       * ```js
       * const { data, error } = await supabase
       *   .storage
       *   .from('avatars')
       *   .list('folder', {
       *     limit: 100,
       *     offset: 0,
       *     sortBy: { column: 'name', order: 'asc' },
       *   })
       * ```
       *
       * Response:
       * ```json
       * {
       *   "data": [
       *     {
       *       "name": "avatar1.png",
       *       "id": "e668cf7f-821b-4a2f-9dce-7dfa5dd1cfd2",
       *       "updated_at": "2024-05-22T23:06:05.580Z",
       *       "created_at": "2024-05-22T23:04:34.443Z",
       *       "last_accessed_at": "2024-05-22T23:04:34.443Z",
       *       "metadata": {
       *         "eTag": "\"c5e8c553235d9af30ef4f6e280790b92\"",
       *         "size": 32175,
       *         "mimetype": "image/png",
       *         "cacheControl": "max-age=3600",
       *         "lastModified": "2024-05-22T23:06:05.574Z",
       *         "contentLength": 32175,
       *         "httpStatusCode": 200
       *       }
       *     }
       *   ],
       *   "error": null
       * }
       * ```
       *
       * @example Search files in a bucket
       * ```js
       * const { data, error } = await supabase
       *   .storage
       *   .from('avatars')
       *   .list('folder', {
       *     limit: 100,
       *     offset: 0,
       *     sortBy: { column: 'name', order: 'asc' },
       *     search: 'jon'
       *   })
       * ```
       */
      list(path, options, parameters) {
        return __awaiter(this, void 0, void 0, function* () {
          try {
            const body = Object.assign(Object.assign(Object.assign({}, DEFAULT_SEARCH_OPTIONS), options), { prefix: path || "" });
            const data = yield post(this.fetch, `${this.url}/object/list/${this.bucketId}`, body, { headers: this.headers }, parameters);
            return { data, error: null };
          } catch (error3) {
            if (this.shouldThrowOnError) {
              throw error3;
            }
            if (isStorageError(error3)) {
              return { data: null, error: error3 };
            }
            throw error3;
          }
        });
      }
      /**
       * @experimental this method signature might change in the future
       *
       * @category File Buckets
       * @param options search options
       * @param parameters
       */
      listV2(options, parameters) {
        return __awaiter(this, void 0, void 0, function* () {
          try {
            const body = Object.assign({}, options);
            const data = yield post(this.fetch, `${this.url}/object/list-v2/${this.bucketId}`, body, { headers: this.headers }, parameters);
            return { data, error: null };
          } catch (error3) {
            if (this.shouldThrowOnError) {
              throw error3;
            }
            if (isStorageError(error3)) {
              return { data: null, error: error3 };
            }
            throw error3;
          }
        });
      }
      encodeMetadata(metadata) {
        return JSON.stringify(metadata);
      }
      toBase64(data) {
        if (typeof Buffer !== "undefined") {
          return Buffer.from(data).toString("base64");
        }
        return btoa(data);
      }
      _getFinalPath(path) {
        return `${this.bucketId}/${path.replace(/^\/+/, "")}`;
      }
      _removeEmptyFolders(path) {
        return path.replace(/^\/|\/$/g, "").replace(/\/+/g, "/");
      }
      transformOptsToQueryString(transform) {
        const params = [];
        if (transform.width) {
          params.push(`width=${transform.width}`);
        }
        if (transform.height) {
          params.push(`height=${transform.height}`);
        }
        if (transform.resize) {
          params.push(`resize=${transform.resize}`);
        }
        if (transform.format) {
          params.push(`format=${transform.format}`);
        }
        if (transform.quality) {
          params.push(`quality=${transform.quality}`);
        }
        return params.join("&");
      }
    };
  }
});
var version4;
var init_version2 = __esm({
  "../node_modules/@supabase/storage-js/dist/module/lib/version.js"() {
    init_functionsRoutes_0_04524570753253654();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    version4 = "2.86.0";
  }
});
var DEFAULT_HEADERS;
var init_constants4 = __esm({
  "../node_modules/@supabase/storage-js/dist/module/lib/constants.js"() {
    init_functionsRoutes_0_04524570753253654();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_version2();
    DEFAULT_HEADERS = {
      "X-Client-Info": `storage-js/${version4}`
    };
  }
});
var StorageBucketApi;
var init_StorageBucketApi = __esm({
  "../node_modules/@supabase/storage-js/dist/module/packages/StorageBucketApi.js"() {
    init_functionsRoutes_0_04524570753253654();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_tslib_es6();
    init_constants4();
    init_errors();
    init_fetch();
    init_helpers();
    StorageBucketApi = class {
      static {
        __name(this, "StorageBucketApi");
      }
      static {
        __name2(this, "StorageBucketApi");
      }
      constructor(url, headers = {}, fetch2, opts) {
        this.shouldThrowOnError = false;
        const baseUrl = new URL(url);
        if (opts === null || opts === void 0 ? void 0 : opts.useNewHostname) {
          const isSupabaseHost = /supabase\.(co|in|red)$/.test(baseUrl.hostname);
          if (isSupabaseHost && !baseUrl.hostname.includes("storage.supabase.")) {
            baseUrl.hostname = baseUrl.hostname.replace("supabase.", "storage.supabase.");
          }
        }
        this.url = baseUrl.href.replace(/\/$/, "");
        this.headers = Object.assign(Object.assign({}, DEFAULT_HEADERS), headers);
        this.fetch = resolveFetch2(fetch2);
      }
      /**
       * Enable throwing errors instead of returning them.
       *
       * @category File Buckets
       */
      throwOnError() {
        this.shouldThrowOnError = true;
        return this;
      }
      /**
       * Retrieves the details of all Storage buckets within an existing project.
       *
       * @category File Buckets
       * @param options Query parameters for listing buckets
       * @param options.limit Maximum number of buckets to return
       * @param options.offset Number of buckets to skip
       * @param options.sortColumn Column to sort by ('id', 'name', 'created_at', 'updated_at')
       * @param options.sortOrder Sort order ('asc' or 'desc')
       * @param options.search Search term to filter bucket names
       * @returns Promise with response containing array of buckets or error
       *
       * @example List buckets
       * ```js
       * const { data, error } = await supabase
       *   .storage
       *   .listBuckets()
       * ```
       *
       * @example List buckets with options
       * ```js
       * const { data, error } = await supabase
       *   .storage
       *   .listBuckets({
       *     limit: 10,
       *     offset: 0,
       *     sortColumn: 'created_at',
       *     sortOrder: 'desc',
       *     search: 'prod'
       *   })
       * ```
       */
      listBuckets(options) {
        return __awaiter(this, void 0, void 0, function* () {
          try {
            const queryString = this.listBucketOptionsToQueryString(options);
            const data = yield get(this.fetch, `${this.url}/bucket${queryString}`, {
              headers: this.headers
            });
            return { data, error: null };
          } catch (error3) {
            if (this.shouldThrowOnError) {
              throw error3;
            }
            if (isStorageError(error3)) {
              return { data: null, error: error3 };
            }
            throw error3;
          }
        });
      }
      /**
       * Retrieves the details of an existing Storage bucket.
       *
       * @category File Buckets
       * @param id The unique identifier of the bucket you would like to retrieve.
       * @returns Promise with response containing bucket details or error
       *
       * @example Get bucket
       * ```js
       * const { data, error } = await supabase
       *   .storage
       *   .getBucket('avatars')
       * ```
       *
       * Response:
       * ```json
       * {
       *   "data": {
       *     "id": "avatars",
       *     "name": "avatars",
       *     "owner": "",
       *     "public": false,
       *     "file_size_limit": 1024,
       *     "allowed_mime_types": [
       *       "image/png"
       *     ],
       *     "created_at": "2024-05-22T22:26:05.100Z",
       *     "updated_at": "2024-05-22T22:26:05.100Z"
       *   },
       *   "error": null
       * }
       * ```
       */
      getBucket(id) {
        return __awaiter(this, void 0, void 0, function* () {
          try {
            const data = yield get(this.fetch, `${this.url}/bucket/${id}`, { headers: this.headers });
            return { data, error: null };
          } catch (error3) {
            if (this.shouldThrowOnError) {
              throw error3;
            }
            if (isStorageError(error3)) {
              return { data: null, error: error3 };
            }
            throw error3;
          }
        });
      }
      /**
       * Creates a new Storage bucket
       *
       * @category File Buckets
       * @param id A unique identifier for the bucket you are creating.
       * @param options.public The visibility of the bucket. Public buckets don't require an authorization token to download objects, but still require a valid token for all other operations. By default, buckets are private.
       * @param options.fileSizeLimit specifies the max file size in bytes that can be uploaded to this bucket.
       * The global file size limit takes precedence over this value.
       * The default value is null, which doesn't set a per bucket file size limit.
       * @param options.allowedMimeTypes specifies the allowed mime types that this bucket can accept during upload.
       * The default value is null, which allows files with all mime types to be uploaded.
       * Each mime type specified can be a wildcard, e.g. image/*, or a specific mime type, e.g. image/png.
       * @param options.type (private-beta) specifies the bucket type. see `BucketType` for more details.
       *   - default bucket type is `STANDARD`
       * @returns Promise with response containing newly created bucket name or error
       *
       * @example Create bucket
       * ```js
       * const { data, error } = await supabase
       *   .storage
       *   .createBucket('avatars', {
       *     public: false,
       *     allowedMimeTypes: ['image/png'],
       *     fileSizeLimit: 1024
       *   })
       * ```
       *
       * Response:
       * ```json
       * {
       *   "data": {
       *     "name": "avatars"
       *   },
       *   "error": null
       * }
       * ```
       */
      createBucket(id_1) {
        return __awaiter(this, arguments, void 0, function* (id, options = {
          public: false
        }) {
          try {
            const data = yield post(this.fetch, `${this.url}/bucket`, {
              id,
              name: id,
              type: options.type,
              public: options.public,
              file_size_limit: options.fileSizeLimit,
              allowed_mime_types: options.allowedMimeTypes
            }, { headers: this.headers });
            return { data, error: null };
          } catch (error3) {
            if (this.shouldThrowOnError) {
              throw error3;
            }
            if (isStorageError(error3)) {
              return { data: null, error: error3 };
            }
            throw error3;
          }
        });
      }
      /**
       * Updates a Storage bucket
       *
       * @category File Buckets
       * @param id A unique identifier for the bucket you are updating.
       * @param options.public The visibility of the bucket. Public buckets don't require an authorization token to download objects, but still require a valid token for all other operations.
       * @param options.fileSizeLimit specifies the max file size in bytes that can be uploaded to this bucket.
       * The global file size limit takes precedence over this value.
       * The default value is null, which doesn't set a per bucket file size limit.
       * @param options.allowedMimeTypes specifies the allowed mime types that this bucket can accept during upload.
       * The default value is null, which allows files with all mime types to be uploaded.
       * Each mime type specified can be a wildcard, e.g. image/*, or a specific mime type, e.g. image/png.
       * @returns Promise with response containing success message or error
       *
       * @example Update bucket
       * ```js
       * const { data, error } = await supabase
       *   .storage
       *   .updateBucket('avatars', {
       *     public: false,
       *     allowedMimeTypes: ['image/png'],
       *     fileSizeLimit: 1024
       *   })
       * ```
       *
       * Response:
       * ```json
       * {
       *   "data": {
       *     "message": "Successfully updated"
       *   },
       *   "error": null
       * }
       * ```
       */
      updateBucket(id, options) {
        return __awaiter(this, void 0, void 0, function* () {
          try {
            const data = yield put(this.fetch, `${this.url}/bucket/${id}`, {
              id,
              name: id,
              public: options.public,
              file_size_limit: options.fileSizeLimit,
              allowed_mime_types: options.allowedMimeTypes
            }, { headers: this.headers });
            return { data, error: null };
          } catch (error3) {
            if (this.shouldThrowOnError) {
              throw error3;
            }
            if (isStorageError(error3)) {
              return { data: null, error: error3 };
            }
            throw error3;
          }
        });
      }
      /**
       * Removes all objects inside a single bucket.
       *
       * @category File Buckets
       * @param id The unique identifier of the bucket you would like to empty.
       * @returns Promise with success message or error
       *
       * @example Empty bucket
       * ```js
       * const { data, error } = await supabase
       *   .storage
       *   .emptyBucket('avatars')
       * ```
       *
       * Response:
       * ```json
       * {
       *   "data": {
       *     "message": "Successfully emptied"
       *   },
       *   "error": null
       * }
       * ```
       */
      emptyBucket(id) {
        return __awaiter(this, void 0, void 0, function* () {
          try {
            const data = yield post(this.fetch, `${this.url}/bucket/${id}/empty`, {}, { headers: this.headers });
            return { data, error: null };
          } catch (error3) {
            if (this.shouldThrowOnError) {
              throw error3;
            }
            if (isStorageError(error3)) {
              return { data: null, error: error3 };
            }
            throw error3;
          }
        });
      }
      /**
       * Deletes an existing bucket. A bucket can't be deleted with existing objects inside it.
       * You must first `empty()` the bucket.
       *
       * @category File Buckets
       * @param id The unique identifier of the bucket you would like to delete.
       * @returns Promise with success message or error
       *
       * @example Delete bucket
       * ```js
       * const { data, error } = await supabase
       *   .storage
       *   .deleteBucket('avatars')
       * ```
       *
       * Response:
       * ```json
       * {
       *   "data": {
       *     "message": "Successfully deleted"
       *   },
       *   "error": null
       * }
       * ```
       */
      deleteBucket(id) {
        return __awaiter(this, void 0, void 0, function* () {
          try {
            const data = yield remove(this.fetch, `${this.url}/bucket/${id}`, {}, { headers: this.headers });
            return { data, error: null };
          } catch (error3) {
            if (this.shouldThrowOnError) {
              throw error3;
            }
            if (isStorageError(error3)) {
              return { data: null, error: error3 };
            }
            throw error3;
          }
        });
      }
      listBucketOptionsToQueryString(options) {
        const params = {};
        if (options) {
          if ("limit" in options) {
            params.limit = String(options.limit);
          }
          if ("offset" in options) {
            params.offset = String(options.offset);
          }
          if (options.search) {
            params.search = options.search;
          }
          if (options.sortColumn) {
            params.sortColumn = options.sortColumn;
          }
          if (options.sortOrder) {
            params.sortOrder = options.sortOrder;
          }
        }
        return Object.keys(params).length > 0 ? "?" + new URLSearchParams(params).toString() : "";
      }
    };
  }
});
function buildUrl(baseUrl, path, query) {
  const url = new URL(path, baseUrl);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== void 0) {
        url.searchParams.set(key, value);
      }
    }
  }
  return url.toString();
}
__name(buildUrl, "buildUrl");
async function buildAuthHeaders(auth) {
  if (!auth || auth.type === "none") {
    return {};
  }
  if (auth.type === "bearer") {
    return { Authorization: `Bearer ${auth.token}` };
  }
  if (auth.type === "header") {
    return { [auth.name]: auth.value };
  }
  if (auth.type === "custom") {
    return await auth.getHeaders();
  }
  return {};
}
__name(buildAuthHeaders, "buildAuthHeaders");
function createFetchClient(options) {
  const fetchFn = options.fetchImpl ?? globalThis.fetch;
  return {
    async request({
      method,
      path,
      query,
      body,
      headers
    }) {
      const url = buildUrl(options.baseUrl, path, query);
      const authHeaders = await buildAuthHeaders(options.auth);
      const res = await fetchFn(url, {
        method,
        headers: {
          ...body ? { "Content-Type": "application/json" } : {},
          ...authHeaders,
          ...headers
        },
        body: body ? JSON.stringify(body) : void 0
      });
      const text = await res.text();
      const isJson = (res.headers.get("content-type") || "").includes("application/json");
      const data = isJson && text ? JSON.parse(text) : text;
      if (!res.ok) {
        const errBody = isJson ? data : void 0;
        const errorDetail = errBody?.error;
        throw new IcebergError(
          errorDetail?.message ?? `Request failed with status ${res.status}`,
          {
            status: res.status,
            icebergType: errorDetail?.type,
            icebergCode: errorDetail?.code,
            details: errBody
          }
        );
      }
      return { status: res.status, headers: res.headers, data };
    }
  };
}
__name(createFetchClient, "createFetchClient");
function namespaceToPath(namespace) {
  return namespace.join("");
}
__name(namespaceToPath, "namespaceToPath");
function namespaceToPath2(namespace) {
  return namespace.join("");
}
__name(namespaceToPath2, "namespaceToPath2");
var IcebergError;
var NamespaceOperations;
var TableOperations;
var IcebergRestCatalog;
var init_dist = __esm({
  "../node_modules/iceberg-js/dist/index.mjs"() {
    init_functionsRoutes_0_04524570753253654();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    IcebergError = class extends Error {
      static {
        __name(this, "IcebergError");
      }
      static {
        __name2(this, "IcebergError");
      }
      constructor(message, opts) {
        super(message);
        this.name = "IcebergError";
        this.status = opts.status;
        this.icebergType = opts.icebergType;
        this.icebergCode = opts.icebergCode;
        this.details = opts.details;
        this.isCommitStateUnknown = opts.icebergType === "CommitStateUnknownException" || [500, 502, 504].includes(opts.status) && opts.icebergType?.includes("CommitState") === true;
      }
      /**
       * Returns true if the error is a 404 Not Found error.
       */
      isNotFound() {
        return this.status === 404;
      }
      /**
       * Returns true if the error is a 409 Conflict error.
       */
      isConflict() {
        return this.status === 409;
      }
      /**
       * Returns true if the error is a 419 Authentication Timeout error.
       */
      isAuthenticationTimeout() {
        return this.status === 419;
      }
    };
    __name2(buildUrl, "buildUrl");
    __name2(buildAuthHeaders, "buildAuthHeaders");
    __name2(createFetchClient, "createFetchClient");
    __name2(namespaceToPath, "namespaceToPath");
    NamespaceOperations = class {
      static {
        __name(this, "NamespaceOperations");
      }
      static {
        __name2(this, "NamespaceOperations");
      }
      constructor(client, prefix = "") {
        this.client = client;
        this.prefix = prefix;
      }
      async listNamespaces(parent) {
        const query = parent ? { parent: namespaceToPath(parent.namespace) } : void 0;
        const response = await this.client.request({
          method: "GET",
          path: `${this.prefix}/namespaces`,
          query
        });
        return response.data.namespaces.map((ns) => ({ namespace: ns }));
      }
      async createNamespace(id, metadata) {
        const request = {
          namespace: id.namespace,
          properties: metadata?.properties
        };
        const response = await this.client.request({
          method: "POST",
          path: `${this.prefix}/namespaces`,
          body: request
        });
        return response.data;
      }
      async dropNamespace(id) {
        await this.client.request({
          method: "DELETE",
          path: `${this.prefix}/namespaces/${namespaceToPath(id.namespace)}`
        });
      }
      async loadNamespaceMetadata(id) {
        const response = await this.client.request({
          method: "GET",
          path: `${this.prefix}/namespaces/${namespaceToPath(id.namespace)}`
        });
        return {
          properties: response.data.properties
        };
      }
      async namespaceExists(id) {
        try {
          await this.client.request({
            method: "HEAD",
            path: `${this.prefix}/namespaces/${namespaceToPath(id.namespace)}`
          });
          return true;
        } catch (error3) {
          if (error3 instanceof IcebergError && error3.status === 404) {
            return false;
          }
          throw error3;
        }
      }
      async createNamespaceIfNotExists(id, metadata) {
        try {
          return await this.createNamespace(id, metadata);
        } catch (error3) {
          if (error3 instanceof IcebergError && error3.status === 409) {
            return;
          }
          throw error3;
        }
      }
    };
    __name2(namespaceToPath2, "namespaceToPath2");
    TableOperations = class {
      static {
        __name(this, "TableOperations");
      }
      static {
        __name2(this, "TableOperations");
      }
      constructor(client, prefix = "", accessDelegation) {
        this.client = client;
        this.prefix = prefix;
        this.accessDelegation = accessDelegation;
      }
      async listTables(namespace) {
        const response = await this.client.request({
          method: "GET",
          path: `${this.prefix}/namespaces/${namespaceToPath2(namespace.namespace)}/tables`
        });
        return response.data.identifiers;
      }
      async createTable(namespace, request) {
        const headers = {};
        if (this.accessDelegation) {
          headers["X-Iceberg-Access-Delegation"] = this.accessDelegation;
        }
        const response = await this.client.request({
          method: "POST",
          path: `${this.prefix}/namespaces/${namespaceToPath2(namespace.namespace)}/tables`,
          body: request,
          headers
        });
        return response.data.metadata;
      }
      async updateTable(id, request) {
        const response = await this.client.request({
          method: "POST",
          path: `${this.prefix}/namespaces/${namespaceToPath2(id.namespace)}/tables/${id.name}`,
          body: request
        });
        return {
          "metadata-location": response.data["metadata-location"],
          metadata: response.data.metadata
        };
      }
      async dropTable(id, options) {
        await this.client.request({
          method: "DELETE",
          path: `${this.prefix}/namespaces/${namespaceToPath2(id.namespace)}/tables/${id.name}`,
          query: { purgeRequested: String(options?.purge ?? false) }
        });
      }
      async loadTable(id) {
        const headers = {};
        if (this.accessDelegation) {
          headers["X-Iceberg-Access-Delegation"] = this.accessDelegation;
        }
        const response = await this.client.request({
          method: "GET",
          path: `${this.prefix}/namespaces/${namespaceToPath2(id.namespace)}/tables/${id.name}`,
          headers
        });
        return response.data.metadata;
      }
      async tableExists(id) {
        const headers = {};
        if (this.accessDelegation) {
          headers["X-Iceberg-Access-Delegation"] = this.accessDelegation;
        }
        try {
          await this.client.request({
            method: "HEAD",
            path: `${this.prefix}/namespaces/${namespaceToPath2(id.namespace)}/tables/${id.name}`,
            headers
          });
          return true;
        } catch (error3) {
          if (error3 instanceof IcebergError && error3.status === 404) {
            return false;
          }
          throw error3;
        }
      }
      async createTableIfNotExists(namespace, request) {
        try {
          return await this.createTable(namespace, request);
        } catch (error3) {
          if (error3 instanceof IcebergError && error3.status === 409) {
            return await this.loadTable({ namespace: namespace.namespace, name: request.name });
          }
          throw error3;
        }
      }
    };
    IcebergRestCatalog = class {
      static {
        __name(this, "IcebergRestCatalog");
      }
      static {
        __name2(this, "IcebergRestCatalog");
      }
      /**
       * Creates a new Iceberg REST Catalog client.
       *
       * @param options - Configuration options for the catalog client
       */
      constructor(options) {
        let prefix = "v1";
        if (options.catalogName) {
          prefix += `/${options.catalogName}`;
        }
        const baseUrl = options.baseUrl.endsWith("/") ? options.baseUrl : `${options.baseUrl}/`;
        this.client = createFetchClient({
          baseUrl,
          auth: options.auth,
          fetchImpl: options.fetch
        });
        this.accessDelegation = options.accessDelegation?.join(",");
        this.namespaceOps = new NamespaceOperations(this.client, prefix);
        this.tableOps = new TableOperations(this.client, prefix, this.accessDelegation);
      }
      /**
       * Lists all namespaces in the catalog.
       *
       * @param parent - Optional parent namespace to list children under
       * @returns Array of namespace identifiers
       *
       * @example
       * ```typescript
       * // List all top-level namespaces
       * const namespaces = await catalog.listNamespaces();
       *
       * // List namespaces under a parent
       * const children = await catalog.listNamespaces({ namespace: ['analytics'] });
       * ```
       */
      async listNamespaces(parent) {
        return this.namespaceOps.listNamespaces(parent);
      }
      /**
       * Creates a new namespace in the catalog.
       *
       * @param id - Namespace identifier to create
       * @param metadata - Optional metadata properties for the namespace
       * @returns Response containing the created namespace and its properties
       *
       * @example
       * ```typescript
       * const response = await catalog.createNamespace(
       *   { namespace: ['analytics'] },
       *   { properties: { owner: 'data-team' } }
       * );
       * console.log(response.namespace); // ['analytics']
       * console.log(response.properties); // { owner: 'data-team', ... }
       * ```
       */
      async createNamespace(id, metadata) {
        return this.namespaceOps.createNamespace(id, metadata);
      }
      /**
       * Drops a namespace from the catalog.
       *
       * The namespace must be empty (contain no tables) before it can be dropped.
       *
       * @param id - Namespace identifier to drop
       *
       * @example
       * ```typescript
       * await catalog.dropNamespace({ namespace: ['analytics'] });
       * ```
       */
      async dropNamespace(id) {
        await this.namespaceOps.dropNamespace(id);
      }
      /**
       * Loads metadata for a namespace.
       *
       * @param id - Namespace identifier to load
       * @returns Namespace metadata including properties
       *
       * @example
       * ```typescript
       * const metadata = await catalog.loadNamespaceMetadata({ namespace: ['analytics'] });
       * console.log(metadata.properties);
       * ```
       */
      async loadNamespaceMetadata(id) {
        return this.namespaceOps.loadNamespaceMetadata(id);
      }
      /**
       * Lists all tables in a namespace.
       *
       * @param namespace - Namespace identifier to list tables from
       * @returns Array of table identifiers
       *
       * @example
       * ```typescript
       * const tables = await catalog.listTables({ namespace: ['analytics'] });
       * console.log(tables); // [{ namespace: ['analytics'], name: 'events' }, ...]
       * ```
       */
      async listTables(namespace) {
        return this.tableOps.listTables(namespace);
      }
      /**
       * Creates a new table in the catalog.
       *
       * @param namespace - Namespace to create the table in
       * @param request - Table creation request including name, schema, partition spec, etc.
       * @returns Table metadata for the created table
       *
       * @example
       * ```typescript
       * const metadata = await catalog.createTable(
       *   { namespace: ['analytics'] },
       *   {
       *     name: 'events',
       *     schema: {
       *       type: 'struct',
       *       fields: [
       *         { id: 1, name: 'id', type: 'long', required: true },
       *         { id: 2, name: 'timestamp', type: 'timestamp', required: true }
       *       ],
       *       'schema-id': 0
       *     },
       *     'partition-spec': {
       *       'spec-id': 0,
       *       fields: [
       *         { source_id: 2, field_id: 1000, name: 'ts_day', transform: 'day' }
       *       ]
       *     }
       *   }
       * );
       * ```
       */
      async createTable(namespace, request) {
        return this.tableOps.createTable(namespace, request);
      }
      /**
       * Updates an existing table's metadata.
       *
       * Can update the schema, partition spec, or properties of a table.
       *
       * @param id - Table identifier to update
       * @param request - Update request with fields to modify
       * @returns Response containing the metadata location and updated table metadata
       *
       * @example
       * ```typescript
       * const response = await catalog.updateTable(
       *   { namespace: ['analytics'], name: 'events' },
       *   {
       *     properties: { 'read.split.target-size': '134217728' }
       *   }
       * );
       * console.log(response['metadata-location']); // s3://...
       * console.log(response.metadata); // TableMetadata object
       * ```
       */
      async updateTable(id, request) {
        return this.tableOps.updateTable(id, request);
      }
      /**
       * Drops a table from the catalog.
       *
       * @param id - Table identifier to drop
       *
       * @example
       * ```typescript
       * await catalog.dropTable({ namespace: ['analytics'], name: 'events' });
       * ```
       */
      async dropTable(id, options) {
        await this.tableOps.dropTable(id, options);
      }
      /**
       * Loads metadata for a table.
       *
       * @param id - Table identifier to load
       * @returns Table metadata including schema, partition spec, location, etc.
       *
       * @example
       * ```typescript
       * const metadata = await catalog.loadTable({ namespace: ['analytics'], name: 'events' });
       * console.log(metadata.schema);
       * console.log(metadata.location);
       * ```
       */
      async loadTable(id) {
        return this.tableOps.loadTable(id);
      }
      /**
       * Checks if a namespace exists in the catalog.
       *
       * @param id - Namespace identifier to check
       * @returns True if the namespace exists, false otherwise
       *
       * @example
       * ```typescript
       * const exists = await catalog.namespaceExists({ namespace: ['analytics'] });
       * console.log(exists); // true or false
       * ```
       */
      async namespaceExists(id) {
        return this.namespaceOps.namespaceExists(id);
      }
      /**
       * Checks if a table exists in the catalog.
       *
       * @param id - Table identifier to check
       * @returns True if the table exists, false otherwise
       *
       * @example
       * ```typescript
       * const exists = await catalog.tableExists({ namespace: ['analytics'], name: 'events' });
       * console.log(exists); // true or false
       * ```
       */
      async tableExists(id) {
        return this.tableOps.tableExists(id);
      }
      /**
       * Creates a namespace if it does not exist.
       *
       * If the namespace already exists, returns void. If created, returns the response.
       *
       * @param id - Namespace identifier to create
       * @param metadata - Optional metadata properties for the namespace
       * @returns Response containing the created namespace and its properties, or void if it already exists
       *
       * @example
       * ```typescript
       * const response = await catalog.createNamespaceIfNotExists(
       *   { namespace: ['analytics'] },
       *   { properties: { owner: 'data-team' } }
       * );
       * if (response) {
       *   console.log('Created:', response.namespace);
       * } else {
       *   console.log('Already exists');
       * }
       * ```
       */
      async createNamespaceIfNotExists(id, metadata) {
        return this.namespaceOps.createNamespaceIfNotExists(id, metadata);
      }
      /**
       * Creates a table if it does not exist.
       *
       * If the table already exists, returns its metadata instead.
       *
       * @param namespace - Namespace to create the table in
       * @param request - Table creation request including name, schema, partition spec, etc.
       * @returns Table metadata for the created or existing table
       *
       * @example
       * ```typescript
       * const metadata = await catalog.createTableIfNotExists(
       *   { namespace: ['analytics'] },
       *   {
       *     name: 'events',
       *     schema: {
       *       type: 'struct',
       *       fields: [
       *         { id: 1, name: 'id', type: 'long', required: true },
       *         { id: 2, name: 'timestamp', type: 'timestamp', required: true }
       *       ],
       *       'schema-id': 0
       *     }
       *   }
       * );
       * ```
       */
      async createTableIfNotExists(namespace, request) {
        return this.tableOps.createTableIfNotExists(namespace, request);
      }
    };
  }
});
var StorageAnalyticsClient;
var init_StorageAnalyticsClient = __esm({
  "../node_modules/@supabase/storage-js/dist/module/packages/StorageAnalyticsClient.js"() {
    init_functionsRoutes_0_04524570753253654();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_tslib_es6();
    init_dist();
    init_constants4();
    init_errors();
    init_fetch();
    init_helpers();
    StorageAnalyticsClient = class {
      static {
        __name(this, "StorageAnalyticsClient");
      }
      static {
        __name2(this, "StorageAnalyticsClient");
      }
      /**
       * @alpha
       *
       * Creates a new StorageAnalyticsClient instance
       *
       * **Public alpha:** This API is part of a public alpha release and may not be available to your account type.
       *
       * @category Analytics Buckets
       * @param url - The base URL for the storage API
       * @param headers - HTTP headers to include in requests
       * @param fetch - Optional custom fetch implementation
       *
       * @example
       * ```typescript
       * const client = new StorageAnalyticsClient(url, headers)
       * ```
       */
      constructor(url, headers = {}, fetch2) {
        this.shouldThrowOnError = false;
        this.url = url.replace(/\/$/, "");
        this.headers = Object.assign(Object.assign({}, DEFAULT_HEADERS), headers);
        this.fetch = resolveFetch2(fetch2);
      }
      /**
       * @alpha
       *
       * Enable throwing errors instead of returning them in the response
       * When enabled, failed operations will throw instead of returning { data: null, error }
       *
       * **Public alpha:** This API is part of a public alpha release and may not be available to your account type.
       *
       * @category Analytics Buckets
       * @returns This instance for method chaining
       */
      throwOnError() {
        this.shouldThrowOnError = true;
        return this;
      }
      /**
       * @alpha
       *
       * Creates a new analytics bucket using Iceberg tables
       * Analytics buckets are optimized for analytical queries and data processing
       *
       * **Public alpha:** This API is part of a public alpha release and may not be available to your account type.
       *
       * @category Analytics Buckets
       * @param name A unique name for the bucket you are creating
       * @returns Promise with response containing newly created analytics bucket or error
       *
       * @example Create analytics bucket
       * ```js
       * const { data, error } = await supabase
       *   .storage
       *   .analytics
       *   .createBucket('analytics-data')
       * ```
       *
       * Response:
       * ```json
       * {
       *   "data": {
       *     "name": "analytics-data",
       *     "type": "ANALYTICS",
       *     "format": "iceberg",
       *     "created_at": "2024-05-22T22:26:05.100Z",
       *     "updated_at": "2024-05-22T22:26:05.100Z"
       *   },
       *   "error": null
       * }
       * ```
       */
      createBucket(name) {
        return __awaiter(this, void 0, void 0, function* () {
          try {
            const data = yield post(this.fetch, `${this.url}/bucket`, { name }, { headers: this.headers });
            return { data, error: null };
          } catch (error3) {
            if (this.shouldThrowOnError) {
              throw error3;
            }
            if (isStorageError(error3)) {
              return { data: null, error: error3 };
            }
            throw error3;
          }
        });
      }
      /**
       * @alpha
       *
       * Retrieves the details of all Analytics Storage buckets within an existing project
       * Only returns buckets of type 'ANALYTICS'
       *
       * **Public alpha:** This API is part of a public alpha release and may not be available to your account type.
       *
       * @category Analytics Buckets
       * @param options Query parameters for listing buckets
       * @param options.limit Maximum number of buckets to return
       * @param options.offset Number of buckets to skip
       * @param options.sortColumn Column to sort by ('name', 'created_at', 'updated_at')
       * @param options.sortOrder Sort order ('asc' or 'desc')
       * @param options.search Search term to filter bucket names
       * @returns Promise with response containing array of analytics buckets or error
       *
       * @example List analytics buckets
       * ```js
       * const { data, error } = await supabase
       *   .storage
       *   .analytics
       *   .listBuckets({
       *     limit: 10,
       *     offset: 0,
       *     sortColumn: 'created_at',
       *     sortOrder: 'desc'
       *   })
       * ```
       *
       * Response:
       * ```json
       * {
       *   "data": [
       *     {
       *       "name": "analytics-data",
       *       "type": "ANALYTICS",
       *       "format": "iceberg",
       *       "created_at": "2024-05-22T22:26:05.100Z",
       *       "updated_at": "2024-05-22T22:26:05.100Z"
       *     }
       *   ],
       *   "error": null
       * }
       * ```
       */
      listBuckets(options) {
        return __awaiter(this, void 0, void 0, function* () {
          try {
            const queryParams = new URLSearchParams();
            if ((options === null || options === void 0 ? void 0 : options.limit) !== void 0)
              queryParams.set("limit", options.limit.toString());
            if ((options === null || options === void 0 ? void 0 : options.offset) !== void 0)
              queryParams.set("offset", options.offset.toString());
            if (options === null || options === void 0 ? void 0 : options.sortColumn)
              queryParams.set("sortColumn", options.sortColumn);
            if (options === null || options === void 0 ? void 0 : options.sortOrder)
              queryParams.set("sortOrder", options.sortOrder);
            if (options === null || options === void 0 ? void 0 : options.search)
              queryParams.set("search", options.search);
            const queryString = queryParams.toString();
            const url = queryString ? `${this.url}/bucket?${queryString}` : `${this.url}/bucket`;
            const data = yield get(this.fetch, url, { headers: this.headers });
            return { data, error: null };
          } catch (error3) {
            if (this.shouldThrowOnError) {
              throw error3;
            }
            if (isStorageError(error3)) {
              return { data: null, error: error3 };
            }
            throw error3;
          }
        });
      }
      /**
       * @alpha
       *
       * Deletes an existing analytics bucket
       * A bucket can't be deleted with existing objects inside it
       * You must first empty the bucket before deletion
       *
       * **Public alpha:** This API is part of a public alpha release and may not be available to your account type.
       *
       * @category Analytics Buckets
       * @param bucketName The unique identifier of the bucket you would like to delete
       * @returns Promise with response containing success message or error
       *
       * @example Delete analytics bucket
       * ```js
       * const { data, error } = await supabase
       *   .storage
       *   .analytics
       *   .deleteBucket('analytics-data')
       * ```
       *
       * Response:
       * ```json
       * {
       *   "data": {
       *     "message": "Successfully deleted"
       *   },
       *   "error": null
       * }
       * ```
       */
      deleteBucket(bucketName) {
        return __awaiter(this, void 0, void 0, function* () {
          try {
            const data = yield remove(this.fetch, `${this.url}/bucket/${bucketName}`, {}, { headers: this.headers });
            return { data, error: null };
          } catch (error3) {
            if (this.shouldThrowOnError) {
              throw error3;
            }
            if (isStorageError(error3)) {
              return { data: null, error: error3 };
            }
            throw error3;
          }
        });
      }
      /**
       * @alpha
       *
       * Get an Iceberg REST Catalog client configured for a specific analytics bucket
       * Use this to perform advanced table and namespace operations within the bucket
       * The returned client provides full access to the Apache Iceberg REST Catalog API
       *
       * **Public alpha:** This API is part of a public alpha release and may not be available to your account type.
       *
       * @category Analytics Buckets
       * @param bucketName - The name of the analytics bucket (warehouse) to connect to
       * @returns Configured IcebergRestCatalog instance for advanced Iceberg operations
       *
       * @example Get catalog and create table
       * ```js
       * // First, create an analytics bucket
       * const { data: bucket, error: bucketError } = await supabase
       *   .storage
       *   .analytics
       *   .createBucket('analytics-data')
       *
       * // Get the Iceberg catalog for that bucket
       * const catalog = supabase.storage.analytics.from('analytics-data')
       *
       * // Create a namespace
       * await catalog.createNamespace({ namespace: ['default'] })
       *
       * // Create a table with schema
       * await catalog.createTable(
       *   { namespace: ['default'] },
       *   {
       *     name: 'events',
       *     schema: {
       *       type: 'struct',
       *       fields: [
       *         { id: 1, name: 'id', type: 'long', required: true },
       *         { id: 2, name: 'timestamp', type: 'timestamp', required: true },
       *         { id: 3, name: 'user_id', type: 'string', required: false }
       *       ],
       *       'schema-id': 0,
       *       'identifier-field-ids': [1]
       *     },
       *     'partition-spec': {
       *       'spec-id': 0,
       *       fields: []
       *     },
       *     'write-order': {
       *       'order-id': 0,
       *       fields: []
       *     },
       *     properties: {
       *       'write.format.default': 'parquet'
       *     }
       *   }
       * )
       * ```
       *
       * @example List tables in namespace
       * ```js
       * const catalog = supabase.storage.analytics.from('analytics-data')
       *
       * // List all tables in the default namespace
       * const tables = await catalog.listTables({ namespace: ['default'] })
       * console.log(tables) // [{ namespace: ['default'], name: 'events' }]
       * ```
       *
       * @example Working with namespaces
       * ```js
       * const catalog = supabase.storage.analytics.from('analytics-data')
       *
       * // List all namespaces
       * const namespaces = await catalog.listNamespaces()
       *
       * // Create namespace with properties
       * await catalog.createNamespace(
       *   { namespace: ['production'] },
       *   { properties: { owner: 'data-team', env: 'prod' } }
       * )
       * ```
       *
       * @example Cleanup operations
       * ```js
       * const catalog = supabase.storage.analytics.from('analytics-data')
       *
       * // Drop table with purge option (removes all data)
       * await catalog.dropTable(
       *   { namespace: ['default'], name: 'events' },
       *   { purge: true }
       * )
       *
       * // Drop namespace (must be empty)
       * await catalog.dropNamespace({ namespace: ['default'] })
       * ```
       *
       * @example Error handling with catalog operations
       * ```js
       * import { IcebergError } from 'iceberg-js'
       *
       * const catalog = supabase.storage.analytics.from('analytics-data')
       *
       * try {
       *   await catalog.dropTable({ namespace: ['default'], name: 'events' }, { purge: true })
       * } catch (error) {
       *   // Handle 404 errors (resource not found)
       *   const is404 =
       *     (error instanceof IcebergError && error.status === 404) ||
       *     error?.status === 404 ||
       *     error?.details?.error?.code === 404
       *
       *   if (is404) {
       *     console.log('Table does not exist')
       *   } else {
       *     throw error // Re-throw other errors
       *   }
       * }
       * ```
       *
       * @remarks
       * This method provides a bridge between Supabase's bucket management and the standard
       * Apache Iceberg REST Catalog API. The bucket name maps to the Iceberg warehouse parameter.
       * All authentication and configuration is handled automatically using your Supabase credentials.
       *
       * **Error Handling**: Operations may throw `IcebergError` from the iceberg-js library.
       * Always handle 404 errors gracefully when checking for resource existence.
       *
       * **Cleanup Operations**: When using `dropTable`, the `purge: true` option permanently
       * deletes all table data. Without it, the table is marked as deleted but data remains.
       *
       * **Library Dependency**: The returned catalog is an instance of `IcebergRestCatalog`
       * from iceberg-js. For complete API documentation and advanced usage, refer to the
       * [iceberg-js documentation](https://supabase.github.io/iceberg-js/).
       *
       * For advanced Iceberg operations beyond bucket management, you can also install and use
       * the `iceberg-js` package directly with manual configuration.
       */
      from(bucketName) {
        if (!isValidBucketName(bucketName)) {
          throw new StorageError("Invalid bucket name: File, folder, and bucket names must follow AWS object key naming guidelines and should avoid the use of any other characters.");
        }
        return new IcebergRestCatalog({
          baseUrl: this.url,
          catalogName: bucketName,
          // Maps to the warehouse parameter in Supabase's implementation
          auth: {
            type: "custom",
            getHeaders: /* @__PURE__ */ __name2(() => __awaiter(this, void 0, void 0, function* () {
              return this.headers;
            }), "getHeaders")
          },
          fetch: this.fetch
        });
      }
    };
  }
});
var DEFAULT_HEADERS2;
var init_constants5 = __esm({
  "../node_modules/@supabase/storage-js/dist/module/lib/vectors/constants.js"() {
    init_functionsRoutes_0_04524570753253654();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_version2();
    DEFAULT_HEADERS2 = {
      "X-Client-Info": `storage-js/${version4}`,
      "Content-Type": "application/json"
    };
  }
});
function isStorageVectorsError(error3) {
  return typeof error3 === "object" && error3 !== null && "__isStorageVectorsError" in error3;
}
__name(isStorageVectorsError, "isStorageVectorsError");
var StorageVectorsError;
var StorageVectorsApiError;
var StorageVectorsUnknownError;
var StorageVectorsErrorCode;
var init_errors2 = __esm({
  "../node_modules/@supabase/storage-js/dist/module/lib/vectors/errors.js"() {
    init_functionsRoutes_0_04524570753253654();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    StorageVectorsError = class extends Error {
      static {
        __name(this, "StorageVectorsError");
      }
      static {
        __name2(this, "StorageVectorsError");
      }
      constructor(message) {
        super(message);
        this.__isStorageVectorsError = true;
        this.name = "StorageVectorsError";
      }
    };
    __name2(isStorageVectorsError, "isStorageVectorsError");
    StorageVectorsApiError = class extends StorageVectorsError {
      static {
        __name(this, "StorageVectorsApiError");
      }
      static {
        __name2(this, "StorageVectorsApiError");
      }
      constructor(message, status, statusCode) {
        super(message);
        this.name = "StorageVectorsApiError";
        this.status = status;
        this.statusCode = statusCode;
      }
      toJSON() {
        return {
          name: this.name,
          message: this.message,
          status: this.status,
          statusCode: this.statusCode
        };
      }
    };
    StorageVectorsUnknownError = class extends StorageVectorsError {
      static {
        __name(this, "StorageVectorsUnknownError");
      }
      static {
        __name2(this, "StorageVectorsUnknownError");
      }
      constructor(message, originalError) {
        super(message);
        this.name = "StorageVectorsUnknownError";
        this.originalError = originalError;
      }
    };
    (function(StorageVectorsErrorCode2) {
      StorageVectorsErrorCode2["InternalError"] = "InternalError";
      StorageVectorsErrorCode2["S3VectorConflictException"] = "S3VectorConflictException";
      StorageVectorsErrorCode2["S3VectorNotFoundException"] = "S3VectorNotFoundException";
      StorageVectorsErrorCode2["S3VectorBucketNotEmpty"] = "S3VectorBucketNotEmpty";
      StorageVectorsErrorCode2["S3VectorMaxBucketsExceeded"] = "S3VectorMaxBucketsExceeded";
      StorageVectorsErrorCode2["S3VectorMaxIndexesExceeded"] = "S3VectorMaxIndexesExceeded";
    })(StorageVectorsErrorCode || (StorageVectorsErrorCode = {}));
  }
});
var resolveFetch3;
var isPlainObject2;
var init_helpers2 = __esm({
  "../node_modules/@supabase/storage-js/dist/module/lib/vectors/helpers.js"() {
    init_functionsRoutes_0_04524570753253654();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    resolveFetch3 = /* @__PURE__ */ __name2((customFetch) => {
      if (customFetch) {
        return (...args) => customFetch(...args);
      }
      return (...args) => fetch(...args);
    }, "resolveFetch");
    isPlainObject2 = /* @__PURE__ */ __name2((value) => {
      if (typeof value !== "object" || value === null) {
        return false;
      }
      const prototype = Object.getPrototypeOf(value);
      return (prototype === null || prototype === Object.prototype || Object.getPrototypeOf(prototype) === null) && !(Symbol.toStringTag in value) && !(Symbol.iterator in value);
    }, "isPlainObject");
  }
});
function _handleRequest2(fetcher, method, url, options, parameters, body) {
  return __awaiter(this, void 0, void 0, function* () {
    return new Promise((resolve, reject) => {
      fetcher(url, _getRequestParams2(method, options, parameters, body)).then((result) => {
        if (!result.ok)
          throw result;
        if (options === null || options === void 0 ? void 0 : options.noResolveJson)
          return result;
        const contentType = result.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          return {};
        }
        return result.json();
      }).then((data) => resolve(data)).catch((error3) => handleError2(error3, reject, options));
    });
  });
}
__name(_handleRequest2, "_handleRequest2");
function post2(fetcher, url, body, options, parameters) {
  return __awaiter(this, void 0, void 0, function* () {
    return _handleRequest2(fetcher, "POST", url, options, parameters, body);
  });
}
__name(post2, "post2");
var _getErrorMessage2;
var handleError2;
var _getRequestParams2;
var init_fetch2 = __esm({
  "../node_modules/@supabase/storage-js/dist/module/lib/vectors/fetch.js"() {
    init_functionsRoutes_0_04524570753253654();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_tslib_es6();
    init_errors2();
    init_helpers2();
    _getErrorMessage2 = /* @__PURE__ */ __name2((err) => err.msg || err.message || err.error_description || err.error || JSON.stringify(err), "_getErrorMessage");
    handleError2 = /* @__PURE__ */ __name2((error3, reject, options) => __awaiter(void 0, void 0, void 0, function* () {
      const isResponseLike = error3 && typeof error3 === "object" && "status" in error3 && "ok" in error3 && typeof error3.status === "number";
      if (isResponseLike && !(options === null || options === void 0 ? void 0 : options.noResolveJson)) {
        const status = error3.status || 500;
        const responseError = error3;
        if (typeof responseError.json === "function") {
          responseError.json().then((err) => {
            const statusCode = (err === null || err === void 0 ? void 0 : err.statusCode) || (err === null || err === void 0 ? void 0 : err.code) || status + "";
            reject(new StorageVectorsApiError(_getErrorMessage2(err), status, statusCode));
          }).catch(() => {
            const statusCode = status + "";
            const message = responseError.statusText || `HTTP ${status} error`;
            reject(new StorageVectorsApiError(message, status, statusCode));
          });
        } else {
          const statusCode = status + "";
          const message = responseError.statusText || `HTTP ${status} error`;
          reject(new StorageVectorsApiError(message, status, statusCode));
        }
      } else {
        reject(new StorageVectorsUnknownError(_getErrorMessage2(error3), error3));
      }
    }), "handleError");
    _getRequestParams2 = /* @__PURE__ */ __name2((method, options, parameters, body) => {
      const params = { method, headers: (options === null || options === void 0 ? void 0 : options.headers) || {} };
      if (method === "GET" || !body) {
        return params;
      }
      if (isPlainObject2(body)) {
        params.headers = Object.assign({ "Content-Type": "application/json" }, options === null || options === void 0 ? void 0 : options.headers);
        params.body = JSON.stringify(body);
      } else {
        params.body = body;
      }
      return Object.assign(Object.assign({}, params), parameters);
    }, "_getRequestParams");
    __name2(_handleRequest2, "_handleRequest");
    __name2(post2, "post");
  }
});
var VectorIndexApi;
var init_VectorIndexApi = __esm({
  "../node_modules/@supabase/storage-js/dist/module/lib/vectors/VectorIndexApi.js"() {
    init_functionsRoutes_0_04524570753253654();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_tslib_es6();
    init_constants5();
    init_errors2();
    init_fetch2();
    init_helpers2();
    VectorIndexApi = class {
      static {
        __name(this, "VectorIndexApi");
      }
      static {
        __name2(this, "VectorIndexApi");
      }
      /** Creates a new VectorIndexApi instance */
      constructor(url, headers = {}, fetch2) {
        this.shouldThrowOnError = false;
        this.url = url.replace(/\/$/, "");
        this.headers = Object.assign(Object.assign({}, DEFAULT_HEADERS2), headers);
        this.fetch = resolveFetch3(fetch2);
      }
      /** Enable throwing errors instead of returning them in the response */
      throwOnError() {
        this.shouldThrowOnError = true;
        return this;
      }
      /** Creates a new vector index within a bucket */
      createIndex(options) {
        return __awaiter(this, void 0, void 0, function* () {
          try {
            const data = yield post2(this.fetch, `${this.url}/CreateIndex`, options, {
              headers: this.headers
            });
            return { data: data || {}, error: null };
          } catch (error3) {
            if (this.shouldThrowOnError) {
              throw error3;
            }
            if (isStorageVectorsError(error3)) {
              return { data: null, error: error3 };
            }
            throw error3;
          }
        });
      }
      /** Retrieves metadata for a specific vector index */
      getIndex(vectorBucketName, indexName) {
        return __awaiter(this, void 0, void 0, function* () {
          try {
            const data = yield post2(this.fetch, `${this.url}/GetIndex`, { vectorBucketName, indexName }, { headers: this.headers });
            return { data, error: null };
          } catch (error3) {
            if (this.shouldThrowOnError) {
              throw error3;
            }
            if (isStorageVectorsError(error3)) {
              return { data: null, error: error3 };
            }
            throw error3;
          }
        });
      }
      /** Lists vector indexes within a bucket with optional filtering and pagination */
      listIndexes(options) {
        return __awaiter(this, void 0, void 0, function* () {
          try {
            const data = yield post2(this.fetch, `${this.url}/ListIndexes`, options, {
              headers: this.headers
            });
            return { data, error: null };
          } catch (error3) {
            if (this.shouldThrowOnError) {
              throw error3;
            }
            if (isStorageVectorsError(error3)) {
              return { data: null, error: error3 };
            }
            throw error3;
          }
        });
      }
      /** Deletes a vector index and all its data */
      deleteIndex(vectorBucketName, indexName) {
        return __awaiter(this, void 0, void 0, function* () {
          try {
            const data = yield post2(this.fetch, `${this.url}/DeleteIndex`, { vectorBucketName, indexName }, { headers: this.headers });
            return { data: data || {}, error: null };
          } catch (error3) {
            if (this.shouldThrowOnError) {
              throw error3;
            }
            if (isStorageVectorsError(error3)) {
              return { data: null, error: error3 };
            }
            throw error3;
          }
        });
      }
    };
  }
});
var VectorDataApi;
var init_VectorDataApi = __esm({
  "../node_modules/@supabase/storage-js/dist/module/lib/vectors/VectorDataApi.js"() {
    init_functionsRoutes_0_04524570753253654();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_tslib_es6();
    init_constants5();
    init_errors2();
    init_fetch2();
    init_helpers2();
    VectorDataApi = class {
      static {
        __name(this, "VectorDataApi");
      }
      static {
        __name2(this, "VectorDataApi");
      }
      /** Creates a new VectorDataApi instance */
      constructor(url, headers = {}, fetch2) {
        this.shouldThrowOnError = false;
        this.url = url.replace(/\/$/, "");
        this.headers = Object.assign(Object.assign({}, DEFAULT_HEADERS2), headers);
        this.fetch = resolveFetch3(fetch2);
      }
      /** Enable throwing errors instead of returning them in the response */
      throwOnError() {
        this.shouldThrowOnError = true;
        return this;
      }
      /** Inserts or updates vectors in batch (1-500 per request) */
      putVectors(options) {
        return __awaiter(this, void 0, void 0, function* () {
          try {
            if (options.vectors.length < 1 || options.vectors.length > 500) {
              throw new Error("Vector batch size must be between 1 and 500 items");
            }
            const data = yield post2(this.fetch, `${this.url}/PutVectors`, options, {
              headers: this.headers
            });
            return { data: data || {}, error: null };
          } catch (error3) {
            if (this.shouldThrowOnError) {
              throw error3;
            }
            if (isStorageVectorsError(error3)) {
              return { data: null, error: error3 };
            }
            throw error3;
          }
        });
      }
      /** Retrieves vectors by their keys in batch */
      getVectors(options) {
        return __awaiter(this, void 0, void 0, function* () {
          try {
            const data = yield post2(this.fetch, `${this.url}/GetVectors`, options, {
              headers: this.headers
            });
            return { data, error: null };
          } catch (error3) {
            if (this.shouldThrowOnError) {
              throw error3;
            }
            if (isStorageVectorsError(error3)) {
              return { data: null, error: error3 };
            }
            throw error3;
          }
        });
      }
      /** Lists vectors in an index with pagination */
      listVectors(options) {
        return __awaiter(this, void 0, void 0, function* () {
          try {
            if (options.segmentCount !== void 0) {
              if (options.segmentCount < 1 || options.segmentCount > 16) {
                throw new Error("segmentCount must be between 1 and 16");
              }
              if (options.segmentIndex !== void 0) {
                if (options.segmentIndex < 0 || options.segmentIndex >= options.segmentCount) {
                  throw new Error(`segmentIndex must be between 0 and ${options.segmentCount - 1}`);
                }
              }
            }
            const data = yield post2(this.fetch, `${this.url}/ListVectors`, options, {
              headers: this.headers
            });
            return { data, error: null };
          } catch (error3) {
            if (this.shouldThrowOnError) {
              throw error3;
            }
            if (isStorageVectorsError(error3)) {
              return { data: null, error: error3 };
            }
            throw error3;
          }
        });
      }
      /** Queries for similar vectors using approximate nearest neighbor search */
      queryVectors(options) {
        return __awaiter(this, void 0, void 0, function* () {
          try {
            const data = yield post2(this.fetch, `${this.url}/QueryVectors`, options, {
              headers: this.headers
            });
            return { data, error: null };
          } catch (error3) {
            if (this.shouldThrowOnError) {
              throw error3;
            }
            if (isStorageVectorsError(error3)) {
              return { data: null, error: error3 };
            }
            throw error3;
          }
        });
      }
      /** Deletes vectors by their keys in batch (1-500 per request) */
      deleteVectors(options) {
        return __awaiter(this, void 0, void 0, function* () {
          try {
            if (options.keys.length < 1 || options.keys.length > 500) {
              throw new Error("Keys batch size must be between 1 and 500 items");
            }
            const data = yield post2(this.fetch, `${this.url}/DeleteVectors`, options, {
              headers: this.headers
            });
            return { data: data || {}, error: null };
          } catch (error3) {
            if (this.shouldThrowOnError) {
              throw error3;
            }
            if (isStorageVectorsError(error3)) {
              return { data: null, error: error3 };
            }
            throw error3;
          }
        });
      }
    };
  }
});
var VectorBucketApi;
var init_VectorBucketApi = __esm({
  "../node_modules/@supabase/storage-js/dist/module/lib/vectors/VectorBucketApi.js"() {
    init_functionsRoutes_0_04524570753253654();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_tslib_es6();
    init_constants5();
    init_errors2();
    init_fetch2();
    init_helpers2();
    VectorBucketApi = class {
      static {
        __name(this, "VectorBucketApi");
      }
      static {
        __name2(this, "VectorBucketApi");
      }
      /** Creates a new VectorBucketApi instance */
      constructor(url, headers = {}, fetch2) {
        this.shouldThrowOnError = false;
        this.url = url.replace(/\/$/, "");
        this.headers = Object.assign(Object.assign({}, DEFAULT_HEADERS2), headers);
        this.fetch = resolveFetch3(fetch2);
      }
      /** Enable throwing errors instead of returning them in the response */
      throwOnError() {
        this.shouldThrowOnError = true;
        return this;
      }
      /** Creates a new vector bucket */
      createBucket(vectorBucketName) {
        return __awaiter(this, void 0, void 0, function* () {
          try {
            const data = yield post2(this.fetch, `${this.url}/CreateVectorBucket`, { vectorBucketName }, { headers: this.headers });
            return { data: data || {}, error: null };
          } catch (error3) {
            if (this.shouldThrowOnError) {
              throw error3;
            }
            if (isStorageVectorsError(error3)) {
              return { data: null, error: error3 };
            }
            throw error3;
          }
        });
      }
      /** Retrieves metadata for a specific vector bucket */
      getBucket(vectorBucketName) {
        return __awaiter(this, void 0, void 0, function* () {
          try {
            const data = yield post2(this.fetch, `${this.url}/GetVectorBucket`, { vectorBucketName }, { headers: this.headers });
            return { data, error: null };
          } catch (error3) {
            if (this.shouldThrowOnError) {
              throw error3;
            }
            if (isStorageVectorsError(error3)) {
              return { data: null, error: error3 };
            }
            throw error3;
          }
        });
      }
      /** Lists vector buckets with optional filtering and pagination */
      listBuckets() {
        return __awaiter(this, arguments, void 0, function* (options = {}) {
          try {
            const data = yield post2(this.fetch, `${this.url}/ListVectorBuckets`, options, {
              headers: this.headers
            });
            return { data, error: null };
          } catch (error3) {
            if (this.shouldThrowOnError) {
              throw error3;
            }
            if (isStorageVectorsError(error3)) {
              return { data: null, error: error3 };
            }
            throw error3;
          }
        });
      }
      /** Deletes a vector bucket (must be empty first) */
      deleteBucket(vectorBucketName) {
        return __awaiter(this, void 0, void 0, function* () {
          try {
            const data = yield post2(this.fetch, `${this.url}/DeleteVectorBucket`, { vectorBucketName }, { headers: this.headers });
            return { data: data || {}, error: null };
          } catch (error3) {
            if (this.shouldThrowOnError) {
              throw error3;
            }
            if (isStorageVectorsError(error3)) {
              return { data: null, error: error3 };
            }
            throw error3;
          }
        });
      }
    };
  }
});
var StorageVectorsClient;
var VectorBucketScope;
var VectorIndexScope;
var init_StorageVectorsClient = __esm({
  "../node_modules/@supabase/storage-js/dist/module/lib/vectors/StorageVectorsClient.js"() {
    init_functionsRoutes_0_04524570753253654();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_tslib_es6();
    init_VectorIndexApi();
    init_VectorDataApi();
    init_VectorBucketApi();
    StorageVectorsClient = class extends VectorBucketApi {
      static {
        __name(this, "StorageVectorsClient");
      }
      static {
        __name2(this, "StorageVectorsClient");
      }
      /**
       * @alpha
       *
       * Creates a StorageVectorsClient that can manage buckets, indexes, and vectors.
       *
       * **Public alpha:** This API is part of a public alpha release and may not be available to your account type.
       *
       * @category Vector Buckets
       * @param url - Base URL of the Storage Vectors REST API.
       * @param options.headers - Optional headers (for example `Authorization`) applied to every request.
       * @param options.fetch - Optional custom `fetch` implementation for non-browser runtimes.
       *
       * @example
       * ```typescript
       * const client = new StorageVectorsClient(url, options)
       * ```
       */
      constructor(url, options = {}) {
        super(url, options.headers || {}, options.fetch);
      }
      /**
       *
       * @alpha
       *
       * Access operations for a specific vector bucket
       * Returns a scoped client for index and vector operations within the bucket
       *
       * **Public alpha:** This API is part of a public alpha release and may not be available to your account type.
       *
       * @category Vector Buckets
       * @param vectorBucketName - Name of the vector bucket
       * @returns Bucket-scoped client with index and vector operations
       *
       * @example
       * ```typescript
       * const bucket = supabase.storage.vectors.from('embeddings-prod')
       * ```
       */
      from(vectorBucketName) {
        return new VectorBucketScope(this.url, this.headers, vectorBucketName, this.fetch);
      }
      /**
       *
       * @alpha
       *
       * Creates a new vector bucket
       * Vector buckets are containers for vector indexes and their data
       *
       * **Public alpha:** This API is part of a public alpha release and may not be available to your account type.
       *
       * @category Vector Buckets
       * @param vectorBucketName - Unique name for the vector bucket
       * @returns Promise with empty response on success or error
       *
       * @example
       * ```typescript
       * const { data, error } = await supabase
       *   .storage
       *   .vectors
       *   .createBucket('embeddings-prod')
       * ```
       */
      createBucket(vectorBucketName) {
        const _super = Object.create(null, {
          createBucket: { get: /* @__PURE__ */ __name2(() => super.createBucket, "get") }
        });
        return __awaiter(this, void 0, void 0, function* () {
          return _super.createBucket.call(this, vectorBucketName);
        });
      }
      /**
       *
       * @alpha
       *
       * Retrieves metadata for a specific vector bucket
       *
       * **Public alpha:** This API is part of a public alpha release and may not be available to your account type.
       *
       * @category Vector Buckets
       * @param vectorBucketName - Name of the vector bucket
       * @returns Promise with bucket metadata or error
       *
       * @example
       * ```typescript
       * const { data, error } = await supabase
       *   .storage
       *   .vectors
       *   .getBucket('embeddings-prod')
       *
       * console.log('Bucket created:', data?.vectorBucket.creationTime)
       * ```
       */
      getBucket(vectorBucketName) {
        const _super = Object.create(null, {
          getBucket: { get: /* @__PURE__ */ __name2(() => super.getBucket, "get") }
        });
        return __awaiter(this, void 0, void 0, function* () {
          return _super.getBucket.call(this, vectorBucketName);
        });
      }
      /**
       *
       * @alpha
       *
       * Lists all vector buckets with optional filtering and pagination
       *
       * **Public alpha:** This API is part of a public alpha release and may not be available to your account type.
       *
       * @category Vector Buckets
       * @param options - Optional filters (prefix, maxResults, nextToken)
       * @returns Promise with list of buckets or error
       *
       * @example
       * ```typescript
       * const { data, error } = await supabase
       *   .storage
       *   .vectors
       *   .listBuckets({ prefix: 'embeddings-' })
       *
       * data?.vectorBuckets.forEach(bucket => {
       *   console.log(bucket.vectorBucketName)
       * })
       * ```
       */
      listBuckets() {
        const _super = Object.create(null, {
          listBuckets: { get: /* @__PURE__ */ __name2(() => super.listBuckets, "get") }
        });
        return __awaiter(this, arguments, void 0, function* (options = {}) {
          return _super.listBuckets.call(this, options);
        });
      }
      /**
       *
       * @alpha
       *
       * Deletes a vector bucket (bucket must be empty)
       * All indexes must be deleted before deleting the bucket
       *
       * **Public alpha:** This API is part of a public alpha release and may not be available to your account type.
       *
       * @category Vector Buckets
       * @param vectorBucketName - Name of the vector bucket to delete
       * @returns Promise with empty response on success or error
       *
       * @example
       * ```typescript
       * const { data, error } = await supabase
       *   .storage
       *   .vectors
       *   .deleteBucket('embeddings-old')
       * ```
       */
      deleteBucket(vectorBucketName) {
        const _super = Object.create(null, {
          deleteBucket: { get: /* @__PURE__ */ __name2(() => super.deleteBucket, "get") }
        });
        return __awaiter(this, void 0, void 0, function* () {
          return _super.deleteBucket.call(this, vectorBucketName);
        });
      }
    };
    VectorBucketScope = class extends VectorIndexApi {
      static {
        __name(this, "VectorBucketScope");
      }
      static {
        __name2(this, "VectorBucketScope");
      }
      /**
       * @alpha
       *
       * Creates a helper that automatically scopes all index operations to the provided bucket.
       *
       * **Public alpha:** This API is part of a public alpha release and may not be available to your account type.
       *
       * @category Vector Buckets
       * @example
       * ```typescript
       * const bucket = supabase.storage.vectors.from('embeddings-prod')
       * ```
       */
      constructor(url, headers, vectorBucketName, fetch2) {
        super(url, headers, fetch2);
        this.vectorBucketName = vectorBucketName;
      }
      /**
       *
       * @alpha
       *
       * Creates a new vector index in this bucket
       * Convenience method that automatically includes the bucket name
       *
       * **Public alpha:** This API is part of a public alpha release and may not be available to your account type.
       *
       * @category Vector Buckets
       * @param options - Index configuration (vectorBucketName is automatically set)
       * @returns Promise with empty response on success or error
       *
       * @example
       * ```typescript
       * const bucket = supabase.storage.vectors.from('embeddings-prod')
       * await bucket.createIndex({
       *   indexName: 'documents-openai',
       *   dataType: 'float32',
       *   dimension: 1536,
       *   distanceMetric: 'cosine',
       *   metadataConfiguration: {
       *     nonFilterableMetadataKeys: ['raw_text']
       *   }
       * })
       * ```
       */
      createIndex(options) {
        const _super = Object.create(null, {
          createIndex: { get: /* @__PURE__ */ __name2(() => super.createIndex, "get") }
        });
        return __awaiter(this, void 0, void 0, function* () {
          return _super.createIndex.call(this, Object.assign(Object.assign({}, options), { vectorBucketName: this.vectorBucketName }));
        });
      }
      /**
       *
       * @alpha
       *
       * Lists indexes in this bucket
       * Convenience method that automatically includes the bucket name
       *
       * **Public alpha:** This API is part of a public alpha release and may not be available to your account type.
       *
       * @category Vector Buckets
       * @param options - Listing options (vectorBucketName is automatically set)
       * @returns Promise with response containing indexes array and pagination token or error
       *
       * @example
       * ```typescript
       * const bucket = supabase.storage.vectors.from('embeddings-prod')
       * const { data } = await bucket.listIndexes({ prefix: 'documents-' })
       * ```
       */
      listIndexes() {
        const _super = Object.create(null, {
          listIndexes: { get: /* @__PURE__ */ __name2(() => super.listIndexes, "get") }
        });
        return __awaiter(this, arguments, void 0, function* (options = {}) {
          return _super.listIndexes.call(this, Object.assign(Object.assign({}, options), { vectorBucketName: this.vectorBucketName }));
        });
      }
      /**
       *
       * @alpha
       *
       * Retrieves metadata for a specific index in this bucket
       * Convenience method that automatically includes the bucket name
       *
       * **Public alpha:** This API is part of a public alpha release and may not be available to your account type.
       *
       * @category Vector Buckets
       * @param indexName - Name of the index to retrieve
       * @returns Promise with index metadata or error
       *
       * @example
       * ```typescript
       * const bucket = supabase.storage.vectors.from('embeddings-prod')
       * const { data } = await bucket.getIndex('documents-openai')
       * console.log('Dimension:', data?.index.dimension)
       * ```
       */
      getIndex(indexName) {
        const _super = Object.create(null, {
          getIndex: { get: /* @__PURE__ */ __name2(() => super.getIndex, "get") }
        });
        return __awaiter(this, void 0, void 0, function* () {
          return _super.getIndex.call(this, this.vectorBucketName, indexName);
        });
      }
      /**
       *
       * @alpha
       *
       * Deletes an index from this bucket
       * Convenience method that automatically includes the bucket name
       *
       * **Public alpha:** This API is part of a public alpha release and may not be available to your account type.
       *
       * @category Vector Buckets
       * @param indexName - Name of the index to delete
       * @returns Promise with empty response on success or error
       *
       * @example
       * ```typescript
       * const bucket = supabase.storage.vectors.from('embeddings-prod')
       * await bucket.deleteIndex('old-index')
       * ```
       */
      deleteIndex(indexName) {
        const _super = Object.create(null, {
          deleteIndex: { get: /* @__PURE__ */ __name2(() => super.deleteIndex, "get") }
        });
        return __awaiter(this, void 0, void 0, function* () {
          return _super.deleteIndex.call(this, this.vectorBucketName, indexName);
        });
      }
      /**
       *
       * @alpha
       *
       * Access operations for a specific index within this bucket
       * Returns a scoped client for vector data operations
       *
       * **Public alpha:** This API is part of a public alpha release and may not be available to your account type.
       *
       * @category Vector Buckets
       * @param indexName - Name of the index
       * @returns Index-scoped client with vector data operations
       *
       * @example
       * ```typescript
       * const index = supabase.storage.vectors.from('embeddings-prod').index('documents-openai')
       *
       * // Insert vectors
       * await index.putVectors({
       *   vectors: [
       *     { key: 'doc-1', data: { float32: [...] }, metadata: { title: 'Intro' } }
       *   ]
       * })
       *
       * // Query similar vectors
       * const { data } = await index.queryVectors({
       *   queryVector: { float32: [...] },
       *   topK: 5
       * })
       * ```
       */
      index(indexName) {
        return new VectorIndexScope(this.url, this.headers, this.vectorBucketName, indexName, this.fetch);
      }
    };
    VectorIndexScope = class extends VectorDataApi {
      static {
        __name(this, "VectorIndexScope");
      }
      static {
        __name2(this, "VectorIndexScope");
      }
      /**
       *
       * @alpha
       *
       * Creates a helper that automatically scopes all vector operations to the provided bucket/index names.
       *
       * **Public alpha:** This API is part of a public alpha release and may not be available to your account type.
       *
       * @category Vector Buckets
       * @example
       * ```typescript
       * const index = supabase.storage.vectors.from('embeddings-prod').index('documents-openai')
       * ```
       */
      constructor(url, headers, vectorBucketName, indexName, fetch2) {
        super(url, headers, fetch2);
        this.vectorBucketName = vectorBucketName;
        this.indexName = indexName;
      }
      /**
       *
       * @alpha
       *
       * Inserts or updates vectors in this index
       * Convenience method that automatically includes bucket and index names
       *
       * **Public alpha:** This API is part of a public alpha release and may not be available to your account type.
       *
       * @category Vector Buckets
       * @param options - Vector insertion options (bucket and index names automatically set)
       * @returns Promise with empty response on success or error
       *
       * @example
       * ```typescript
       * const index = supabase.storage.vectors.from('embeddings-prod').index('documents-openai')
       * await index.putVectors({
       *   vectors: [
       *     {
       *       key: 'doc-1',
       *       data: { float32: [0.1, 0.2, ...] },
       *       metadata: { title: 'Introduction', page: 1 }
       *     }
       *   ]
       * })
       * ```
       */
      putVectors(options) {
        const _super = Object.create(null, {
          putVectors: { get: /* @__PURE__ */ __name2(() => super.putVectors, "get") }
        });
        return __awaiter(this, void 0, void 0, function* () {
          return _super.putVectors.call(this, Object.assign(Object.assign({}, options), { vectorBucketName: this.vectorBucketName, indexName: this.indexName }));
        });
      }
      /**
       *
       * @alpha
       *
       * Retrieves vectors by keys from this index
       * Convenience method that automatically includes bucket and index names
       *
       * **Public alpha:** This API is part of a public alpha release and may not be available to your account type.
       *
       * @category Vector Buckets
       * @param options - Vector retrieval options (bucket and index names automatically set)
       * @returns Promise with response containing vectors array or error
       *
       * @example
       * ```typescript
       * const index = supabase.storage.vectors.from('embeddings-prod').index('documents-openai')
       * const { data } = await index.getVectors({
       *   keys: ['doc-1', 'doc-2'],
       *   returnMetadata: true
       * })
       * ```
       */
      getVectors(options) {
        const _super = Object.create(null, {
          getVectors: { get: /* @__PURE__ */ __name2(() => super.getVectors, "get") }
        });
        return __awaiter(this, void 0, void 0, function* () {
          return _super.getVectors.call(this, Object.assign(Object.assign({}, options), { vectorBucketName: this.vectorBucketName, indexName: this.indexName }));
        });
      }
      /**
       *
       * @alpha
       *
       * Lists vectors in this index with pagination
       * Convenience method that automatically includes bucket and index names
       *
       * **Public alpha:** This API is part of a public alpha release and may not be available to your account type.
       *
       * @category Vector Buckets
       * @param options - Listing options (bucket and index names automatically set)
       * @returns Promise with response containing vectors array and pagination token or error
       *
       * @example
       * ```typescript
       * const index = supabase.storage.vectors.from('embeddings-prod').index('documents-openai')
       * const { data } = await index.listVectors({
       *   maxResults: 500,
       *   returnMetadata: true
       * })
       * ```
       */
      listVectors() {
        const _super = Object.create(null, {
          listVectors: { get: /* @__PURE__ */ __name2(() => super.listVectors, "get") }
        });
        return __awaiter(this, arguments, void 0, function* (options = {}) {
          return _super.listVectors.call(this, Object.assign(Object.assign({}, options), { vectorBucketName: this.vectorBucketName, indexName: this.indexName }));
        });
      }
      /**
       *
       * @alpha
       *
       * Queries for similar vectors in this index
       * Convenience method that automatically includes bucket and index names
       *
       * **Public alpha:** This API is part of a public alpha release and may not be available to your account type.
       *
       * @category Vector Buckets
       * @param options - Query options (bucket and index names automatically set)
       * @returns Promise with response containing matches array of similar vectors ordered by distance or error
       *
       * @example
       * ```typescript
       * const index = supabase.storage.vectors.from('embeddings-prod').index('documents-openai')
       * const { data } = await index.queryVectors({
       *   queryVector: { float32: [0.1, 0.2, ...] },
       *   topK: 5,
       *   filter: { category: 'technical' },
       *   returnDistance: true,
       *   returnMetadata: true
       * })
       * ```
       */
      queryVectors(options) {
        const _super = Object.create(null, {
          queryVectors: { get: /* @__PURE__ */ __name2(() => super.queryVectors, "get") }
        });
        return __awaiter(this, void 0, void 0, function* () {
          return _super.queryVectors.call(this, Object.assign(Object.assign({}, options), { vectorBucketName: this.vectorBucketName, indexName: this.indexName }));
        });
      }
      /**
       *
       * @alpha
       *
       * Deletes vectors by keys from this index
       * Convenience method that automatically includes bucket and index names
       *
       * **Public alpha:** This API is part of a public alpha release and may not be available to your account type.
       *
       * @category Vector Buckets
       * @param options - Deletion options (bucket and index names automatically set)
       * @returns Promise with empty response on success or error
       *
       * @example
       * ```typescript
       * const index = supabase.storage.vectors.from('embeddings-prod').index('documents-openai')
       * await index.deleteVectors({
       *   keys: ['doc-1', 'doc-2', 'doc-3']
       * })
       * ```
       */
      deleteVectors(options) {
        const _super = Object.create(null, {
          deleteVectors: { get: /* @__PURE__ */ __name2(() => super.deleteVectors, "get") }
        });
        return __awaiter(this, void 0, void 0, function* () {
          return _super.deleteVectors.call(this, Object.assign(Object.assign({}, options), { vectorBucketName: this.vectorBucketName, indexName: this.indexName }));
        });
      }
    };
  }
});
var init_vectors = __esm({
  "../node_modules/@supabase/storage-js/dist/module/lib/vectors/index.js"() {
    init_functionsRoutes_0_04524570753253654();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_StorageVectorsClient();
  }
});
var StorageClient;
var init_StorageClient = __esm({
  "../node_modules/@supabase/storage-js/dist/module/StorageClient.js"() {
    init_functionsRoutes_0_04524570753253654();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_StorageFileApi();
    init_StorageBucketApi();
    init_StorageAnalyticsClient();
    init_vectors();
    StorageClient = class extends StorageBucketApi {
      static {
        __name(this, "StorageClient");
      }
      static {
        __name2(this, "StorageClient");
      }
      /**
       * Creates a client for Storage buckets, files, analytics, and vectors.
       *
       * @category File Buckets
       * @example
       * ```ts
       * import { StorageClient } from '@supabase/storage-js'
       *
       * const storage = new StorageClient('https://xyzcompany.supabase.co/storage/v1', {
       *   apikey: 'public-anon-key',
       * })
       * const avatars = storage.from('avatars')
       * ```
       */
      constructor(url, headers = {}, fetch2, opts) {
        super(url, headers, fetch2, opts);
      }
      /**
       * Perform file operation in a bucket.
       *
       * @category File Buckets
       * @param id The bucket id to operate on.
       *
       * @example
       * ```typescript
       * const avatars = supabase.storage.from('avatars')
       * ```
       */
      from(id) {
        return new StorageFileApi(this.url, this.headers, id, this.fetch);
      }
      /**
       *
       * @alpha
       *
       * Access vector storage operations.
       *
       * **Public alpha:** This API is part of a public alpha release and may not be available to your account type.
       *
       * @category Vector Buckets
       * @returns A StorageVectorsClient instance configured with the current storage settings.
       */
      get vectors() {
        return new StorageVectorsClient(this.url + "/vector", {
          headers: this.headers,
          fetch: this.fetch
        });
      }
      /**
       *
       * @alpha
       *
       * Access analytics storage operations using Iceberg tables.
       *
       * **Public alpha:** This API is part of a public alpha release and may not be available to your account type.
       *
       * @category Analytics Buckets
       * @returns A StorageAnalyticsClient instance configured with the current storage settings.
       */
      get analytics() {
        return new StorageAnalyticsClient(this.url + "/iceberg", this.headers, this.fetch);
      }
    };
  }
});
var init_types2 = __esm({
  "../node_modules/@supabase/storage-js/dist/module/lib/types.js"() {
    init_functionsRoutes_0_04524570753253654();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
  }
});
var init_module3 = __esm({
  "../node_modules/@supabase/storage-js/dist/module/index.js"() {
    init_functionsRoutes_0_04524570753253654();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_StorageClient();
    init_types2();
    init_errors();
    init_vectors();
  }
});
var version5;
var init_version3 = __esm({
  "../node_modules/@supabase/supabase-js/dist/module/lib/version.js"() {
    init_functionsRoutes_0_04524570753253654();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    version5 = "2.86.0";
  }
});
var JS_ENV;
var DEFAULT_HEADERS3;
var DEFAULT_GLOBAL_OPTIONS;
var DEFAULT_DB_OPTIONS;
var DEFAULT_AUTH_OPTIONS;
var DEFAULT_REALTIME_OPTIONS;
var init_constants6 = __esm({
  "../node_modules/@supabase/supabase-js/dist/module/lib/constants.js"() {
    init_functionsRoutes_0_04524570753253654();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_version3();
    JS_ENV = "";
    if (typeof Deno !== "undefined") {
      JS_ENV = "deno";
    } else if (typeof document !== "undefined") {
      JS_ENV = "web";
    } else if (typeof navigator !== "undefined" && navigator.product === "ReactNative") {
      JS_ENV = "react-native";
    } else {
      JS_ENV = "node";
    }
    DEFAULT_HEADERS3 = { "X-Client-Info": `supabase-js-${JS_ENV}/${version5}` };
    DEFAULT_GLOBAL_OPTIONS = {
      headers: DEFAULT_HEADERS3
    };
    DEFAULT_DB_OPTIONS = {
      schema: "public"
    };
    DEFAULT_AUTH_OPTIONS = {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      flowType: "implicit"
    };
    DEFAULT_REALTIME_OPTIONS = {};
  }
});
var resolveFetch4;
var resolveHeadersConstructor;
var fetchWithAuth;
var init_fetch3 = __esm({
  "../node_modules/@supabase/supabase-js/dist/module/lib/fetch.js"() {
    init_functionsRoutes_0_04524570753253654();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    resolveFetch4 = /* @__PURE__ */ __name2((customFetch) => {
      if (customFetch) {
        return (...args) => customFetch(...args);
      }
      return (...args) => fetch(...args);
    }, "resolveFetch");
    resolveHeadersConstructor = /* @__PURE__ */ __name2(() => {
      return Headers;
    }, "resolveHeadersConstructor");
    fetchWithAuth = /* @__PURE__ */ __name2((supabaseKey, getAccessToken, customFetch) => {
      const fetch2 = resolveFetch4(customFetch);
      const HeadersConstructor = resolveHeadersConstructor();
      return async (input, init) => {
        var _a2;
        const accessToken = (_a2 = await getAccessToken()) !== null && _a2 !== void 0 ? _a2 : supabaseKey;
        let headers = new HeadersConstructor(init === null || init === void 0 ? void 0 : init.headers);
        if (!headers.has("apikey")) {
          headers.set("apikey", supabaseKey);
        }
        if (!headers.has("Authorization")) {
          headers.set("Authorization", `Bearer ${accessToken}`);
        }
        return fetch2(input, Object.assign(Object.assign({}, init), { headers }));
      };
    }, "fetchWithAuth");
  }
});
function ensureTrailingSlash(url) {
  return url.endsWith("/") ? url : url + "/";
}
__name(ensureTrailingSlash, "ensureTrailingSlash");
function applySettingDefaults(options, defaults) {
  var _a2, _b;
  const { db: dbOptions, auth: authOptions, realtime: realtimeOptions, global: globalOptions } = options;
  const { db: DEFAULT_DB_OPTIONS2, auth: DEFAULT_AUTH_OPTIONS2, realtime: DEFAULT_REALTIME_OPTIONS2, global: DEFAULT_GLOBAL_OPTIONS2 } = defaults;
  const result = {
    db: Object.assign(Object.assign({}, DEFAULT_DB_OPTIONS2), dbOptions),
    auth: Object.assign(Object.assign({}, DEFAULT_AUTH_OPTIONS2), authOptions),
    realtime: Object.assign(Object.assign({}, DEFAULT_REALTIME_OPTIONS2), realtimeOptions),
    storage: {},
    global: Object.assign(Object.assign(Object.assign({}, DEFAULT_GLOBAL_OPTIONS2), globalOptions), { headers: Object.assign(Object.assign({}, (_a2 = DEFAULT_GLOBAL_OPTIONS2 === null || DEFAULT_GLOBAL_OPTIONS2 === void 0 ? void 0 : DEFAULT_GLOBAL_OPTIONS2.headers) !== null && _a2 !== void 0 ? _a2 : {}), (_b = globalOptions === null || globalOptions === void 0 ? void 0 : globalOptions.headers) !== null && _b !== void 0 ? _b : {}) }),
    accessToken: /* @__PURE__ */ __name2(async () => "", "accessToken")
  };
  if (options.accessToken) {
    result.accessToken = options.accessToken;
  } else {
    delete result.accessToken;
  }
  return result;
}
__name(applySettingDefaults, "applySettingDefaults");
function validateSupabaseUrl(supabaseUrl) {
  const trimmedUrl = supabaseUrl === null || supabaseUrl === void 0 ? void 0 : supabaseUrl.trim();
  if (!trimmedUrl) {
    throw new Error("supabaseUrl is required.");
  }
  if (!trimmedUrl.match(/^https?:\/\//i)) {
    throw new Error("Invalid supabaseUrl: Must be a valid HTTP or HTTPS URL.");
  }
  try {
    return new URL(ensureTrailingSlash(trimmedUrl));
  } catch (_a2) {
    throw Error("Invalid supabaseUrl: Provided URL is malformed.");
  }
}
__name(validateSupabaseUrl, "validateSupabaseUrl");
var init_helpers3 = __esm({
  "../node_modules/@supabase/supabase-js/dist/module/lib/helpers.js"() {
    init_functionsRoutes_0_04524570753253654();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    __name2(ensureTrailingSlash, "ensureTrailingSlash");
    __name2(applySettingDefaults, "applySettingDefaults");
    __name2(validateSupabaseUrl, "validateSupabaseUrl");
  }
});
var version6;
var init_version4 = __esm({
  "../node_modules/@supabase/auth-js/dist/module/lib/version.js"() {
    init_functionsRoutes_0_04524570753253654();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    version6 = "2.86.0";
  }
});
var AUTO_REFRESH_TICK_DURATION_MS;
var AUTO_REFRESH_TICK_THRESHOLD;
var EXPIRY_MARGIN_MS;
var GOTRUE_URL;
var STORAGE_KEY;
var DEFAULT_HEADERS4;
var API_VERSION_HEADER_NAME;
var API_VERSIONS;
var BASE64URL_REGEX;
var JWKS_TTL;
var init_constants7 = __esm({
  "../node_modules/@supabase/auth-js/dist/module/lib/constants.js"() {
    init_functionsRoutes_0_04524570753253654();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_version4();
    AUTO_REFRESH_TICK_DURATION_MS = 30 * 1e3;
    AUTO_REFRESH_TICK_THRESHOLD = 3;
    EXPIRY_MARGIN_MS = AUTO_REFRESH_TICK_THRESHOLD * AUTO_REFRESH_TICK_DURATION_MS;
    GOTRUE_URL = "http://localhost:9999";
    STORAGE_KEY = "supabase.auth.token";
    DEFAULT_HEADERS4 = { "X-Client-Info": `gotrue-js/${version6}` };
    API_VERSION_HEADER_NAME = "X-Supabase-Api-Version";
    API_VERSIONS = {
      "2024-01-01": {
        timestamp: Date.parse("2024-01-01T00:00:00.0Z"),
        name: "2024-01-01"
      }
    };
    BASE64URL_REGEX = /^([a-z0-9_-]{4})*($|[a-z0-9_-]{3}$|[a-z0-9_-]{2}$)$/i;
    JWKS_TTL = 10 * 60 * 1e3;
  }
});
function isAuthError(error3) {
  return typeof error3 === "object" && error3 !== null && "__isAuthError" in error3;
}
__name(isAuthError, "isAuthError");
function isAuthApiError(error3) {
  return isAuthError(error3) && error3.name === "AuthApiError";
}
__name(isAuthApiError, "isAuthApiError");
function isAuthSessionMissingError(error3) {
  return isAuthError(error3) && error3.name === "AuthSessionMissingError";
}
__name(isAuthSessionMissingError, "isAuthSessionMissingError");
function isAuthImplicitGrantRedirectError(error3) {
  return isAuthError(error3) && error3.name === "AuthImplicitGrantRedirectError";
}
__name(isAuthImplicitGrantRedirectError, "isAuthImplicitGrantRedirectError");
function isAuthRetryableFetchError(error3) {
  return isAuthError(error3) && error3.name === "AuthRetryableFetchError";
}
__name(isAuthRetryableFetchError, "isAuthRetryableFetchError");
var AuthError;
var AuthApiError;
var AuthUnknownError;
var CustomAuthError;
var AuthSessionMissingError;
var AuthInvalidTokenResponseError;
var AuthInvalidCredentialsError;
var AuthImplicitGrantRedirectError;
var AuthPKCEGrantCodeExchangeError;
var AuthRetryableFetchError;
var AuthWeakPasswordError;
var AuthInvalidJwtError;
var init_errors3 = __esm({
  "../node_modules/@supabase/auth-js/dist/module/lib/errors.js"() {
    init_functionsRoutes_0_04524570753253654();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    AuthError = class extends Error {
      static {
        __name(this, "AuthError");
      }
      static {
        __name2(this, "AuthError");
      }
      constructor(message, status, code) {
        super(message);
        this.__isAuthError = true;
        this.name = "AuthError";
        this.status = status;
        this.code = code;
      }
    };
    __name2(isAuthError, "isAuthError");
    AuthApiError = class extends AuthError {
      static {
        __name(this, "AuthApiError");
      }
      static {
        __name2(this, "AuthApiError");
      }
      constructor(message, status, code) {
        super(message, status, code);
        this.name = "AuthApiError";
        this.status = status;
        this.code = code;
      }
    };
    __name2(isAuthApiError, "isAuthApiError");
    AuthUnknownError = class extends AuthError {
      static {
        __name(this, "AuthUnknownError");
      }
      static {
        __name2(this, "AuthUnknownError");
      }
      constructor(message, originalError) {
        super(message);
        this.name = "AuthUnknownError";
        this.originalError = originalError;
      }
    };
    CustomAuthError = class extends AuthError {
      static {
        __name(this, "CustomAuthError");
      }
      static {
        __name2(this, "CustomAuthError");
      }
      constructor(message, name, status, code) {
        super(message, status, code);
        this.name = name;
        this.status = status;
      }
    };
    AuthSessionMissingError = class extends CustomAuthError {
      static {
        __name(this, "AuthSessionMissingError");
      }
      static {
        __name2(this, "AuthSessionMissingError");
      }
      constructor() {
        super("Auth session missing!", "AuthSessionMissingError", 400, void 0);
      }
    };
    __name2(isAuthSessionMissingError, "isAuthSessionMissingError");
    AuthInvalidTokenResponseError = class extends CustomAuthError {
      static {
        __name(this, "AuthInvalidTokenResponseError");
      }
      static {
        __name2(this, "AuthInvalidTokenResponseError");
      }
      constructor() {
        super("Auth session or user missing", "AuthInvalidTokenResponseError", 500, void 0);
      }
    };
    AuthInvalidCredentialsError = class extends CustomAuthError {
      static {
        __name(this, "AuthInvalidCredentialsError");
      }
      static {
        __name2(this, "AuthInvalidCredentialsError");
      }
      constructor(message) {
        super(message, "AuthInvalidCredentialsError", 400, void 0);
      }
    };
    AuthImplicitGrantRedirectError = class extends CustomAuthError {
      static {
        __name(this, "AuthImplicitGrantRedirectError");
      }
      static {
        __name2(this, "AuthImplicitGrantRedirectError");
      }
      constructor(message, details = null) {
        super(message, "AuthImplicitGrantRedirectError", 500, void 0);
        this.details = null;
        this.details = details;
      }
      toJSON() {
        return {
          name: this.name,
          message: this.message,
          status: this.status,
          details: this.details
        };
      }
    };
    __name2(isAuthImplicitGrantRedirectError, "isAuthImplicitGrantRedirectError");
    AuthPKCEGrantCodeExchangeError = class extends CustomAuthError {
      static {
        __name(this, "AuthPKCEGrantCodeExchangeError");
      }
      static {
        __name2(this, "AuthPKCEGrantCodeExchangeError");
      }
      constructor(message, details = null) {
        super(message, "AuthPKCEGrantCodeExchangeError", 500, void 0);
        this.details = null;
        this.details = details;
      }
      toJSON() {
        return {
          name: this.name,
          message: this.message,
          status: this.status,
          details: this.details
        };
      }
    };
    AuthRetryableFetchError = class extends CustomAuthError {
      static {
        __name(this, "AuthRetryableFetchError");
      }
      static {
        __name2(this, "AuthRetryableFetchError");
      }
      constructor(message, status) {
        super(message, "AuthRetryableFetchError", status, void 0);
      }
    };
    __name2(isAuthRetryableFetchError, "isAuthRetryableFetchError");
    AuthWeakPasswordError = class extends CustomAuthError {
      static {
        __name(this, "AuthWeakPasswordError");
      }
      static {
        __name2(this, "AuthWeakPasswordError");
      }
      constructor(message, status, reasons) {
        super(message, "AuthWeakPasswordError", status, "weak_password");
        this.reasons = reasons;
      }
    };
    AuthInvalidJwtError = class extends CustomAuthError {
      static {
        __name(this, "AuthInvalidJwtError");
      }
      static {
        __name2(this, "AuthInvalidJwtError");
      }
      constructor(message) {
        super(message, "AuthInvalidJwtError", 400, "invalid_jwt");
      }
    };
  }
});
function byteToBase64URL(byte, state, emit2) {
  if (byte !== null) {
    state.queue = state.queue << 8 | byte;
    state.queuedBits += 8;
    while (state.queuedBits >= 6) {
      const pos = state.queue >> state.queuedBits - 6 & 63;
      emit2(TO_BASE64URL[pos]);
      state.queuedBits -= 6;
    }
  } else if (state.queuedBits > 0) {
    state.queue = state.queue << 6 - state.queuedBits;
    state.queuedBits = 6;
    while (state.queuedBits >= 6) {
      const pos = state.queue >> state.queuedBits - 6 & 63;
      emit2(TO_BASE64URL[pos]);
      state.queuedBits -= 6;
    }
  }
}
__name(byteToBase64URL, "byteToBase64URL");
function byteFromBase64URL(charCode, state, emit2) {
  const bits = FROM_BASE64URL[charCode];
  if (bits > -1) {
    state.queue = state.queue << 6 | bits;
    state.queuedBits += 6;
    while (state.queuedBits >= 8) {
      emit2(state.queue >> state.queuedBits - 8 & 255);
      state.queuedBits -= 8;
    }
  } else if (bits === -2) {
    return;
  } else {
    throw new Error(`Invalid Base64-URL character "${String.fromCharCode(charCode)}"`);
  }
}
__name(byteFromBase64URL, "byteFromBase64URL");
function stringFromBase64URL(str) {
  const conv = [];
  const utf8Emit = /* @__PURE__ */ __name2((codepoint) => {
    conv.push(String.fromCodePoint(codepoint));
  }, "utf8Emit");
  const utf8State = {
    utf8seq: 0,
    codepoint: 0
  };
  const b64State = { queue: 0, queuedBits: 0 };
  const byteEmit = /* @__PURE__ */ __name2((byte) => {
    stringFromUTF8(byte, utf8State, utf8Emit);
  }, "byteEmit");
  for (let i = 0; i < str.length; i += 1) {
    byteFromBase64URL(str.charCodeAt(i), b64State, byteEmit);
  }
  return conv.join("");
}
__name(stringFromBase64URL, "stringFromBase64URL");
function codepointToUTF8(codepoint, emit2) {
  if (codepoint <= 127) {
    emit2(codepoint);
    return;
  } else if (codepoint <= 2047) {
    emit2(192 | codepoint >> 6);
    emit2(128 | codepoint & 63);
    return;
  } else if (codepoint <= 65535) {
    emit2(224 | codepoint >> 12);
    emit2(128 | codepoint >> 6 & 63);
    emit2(128 | codepoint & 63);
    return;
  } else if (codepoint <= 1114111) {
    emit2(240 | codepoint >> 18);
    emit2(128 | codepoint >> 12 & 63);
    emit2(128 | codepoint >> 6 & 63);
    emit2(128 | codepoint & 63);
    return;
  }
  throw new Error(`Unrecognized Unicode codepoint: ${codepoint.toString(16)}`);
}
__name(codepointToUTF8, "codepointToUTF8");
function stringToUTF8(str, emit2) {
  for (let i = 0; i < str.length; i += 1) {
    let codepoint = str.charCodeAt(i);
    if (codepoint > 55295 && codepoint <= 56319) {
      const highSurrogate = (codepoint - 55296) * 1024 & 65535;
      const lowSurrogate = str.charCodeAt(i + 1) - 56320 & 65535;
      codepoint = (lowSurrogate | highSurrogate) + 65536;
      i += 1;
    }
    codepointToUTF8(codepoint, emit2);
  }
}
__name(stringToUTF8, "stringToUTF8");
function stringFromUTF8(byte, state, emit2) {
  if (state.utf8seq === 0) {
    if (byte <= 127) {
      emit2(byte);
      return;
    }
    for (let leadingBit = 1; leadingBit < 6; leadingBit += 1) {
      if ((byte >> 7 - leadingBit & 1) === 0) {
        state.utf8seq = leadingBit;
        break;
      }
    }
    if (state.utf8seq === 2) {
      state.codepoint = byte & 31;
    } else if (state.utf8seq === 3) {
      state.codepoint = byte & 15;
    } else if (state.utf8seq === 4) {
      state.codepoint = byte & 7;
    } else {
      throw new Error("Invalid UTF-8 sequence");
    }
    state.utf8seq -= 1;
  } else if (state.utf8seq > 0) {
    if (byte <= 127) {
      throw new Error("Invalid UTF-8 sequence");
    }
    state.codepoint = state.codepoint << 6 | byte & 63;
    state.utf8seq -= 1;
    if (state.utf8seq === 0) {
      emit2(state.codepoint);
    }
  }
}
__name(stringFromUTF8, "stringFromUTF8");
function base64UrlToUint8Array(str) {
  const result = [];
  const state = { queue: 0, queuedBits: 0 };
  const onByte = /* @__PURE__ */ __name2((byte) => {
    result.push(byte);
  }, "onByte");
  for (let i = 0; i < str.length; i += 1) {
    byteFromBase64URL(str.charCodeAt(i), state, onByte);
  }
  return new Uint8Array(result);
}
__name(base64UrlToUint8Array, "base64UrlToUint8Array");
function stringToUint8Array(str) {
  const result = [];
  stringToUTF8(str, (byte) => result.push(byte));
  return new Uint8Array(result);
}
__name(stringToUint8Array, "stringToUint8Array");
function bytesToBase64URL(bytes) {
  const result = [];
  const state = { queue: 0, queuedBits: 0 };
  const onChar = /* @__PURE__ */ __name2((char) => {
    result.push(char);
  }, "onChar");
  bytes.forEach((byte) => byteToBase64URL(byte, state, onChar));
  byteToBase64URL(null, state, onChar);
  return result.join("");
}
__name(bytesToBase64URL, "bytesToBase64URL");
var TO_BASE64URL;
var IGNORE_BASE64URL;
var FROM_BASE64URL;
var init_base64url = __esm({
  "../node_modules/@supabase/auth-js/dist/module/lib/base64url.js"() {
    init_functionsRoutes_0_04524570753253654();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    TO_BASE64URL = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_".split("");
    IGNORE_BASE64URL = " 	\n\r=".split("");
    FROM_BASE64URL = (() => {
      const charMap = new Array(128);
      for (let i = 0; i < charMap.length; i += 1) {
        charMap[i] = -1;
      }
      for (let i = 0; i < IGNORE_BASE64URL.length; i += 1) {
        charMap[IGNORE_BASE64URL[i].charCodeAt(0)] = -2;
      }
      for (let i = 0; i < TO_BASE64URL.length; i += 1) {
        charMap[TO_BASE64URL[i].charCodeAt(0)] = i;
      }
      return charMap;
    })();
    __name2(byteToBase64URL, "byteToBase64URL");
    __name2(byteFromBase64URL, "byteFromBase64URL");
    __name2(stringFromBase64URL, "stringFromBase64URL");
    __name2(codepointToUTF8, "codepointToUTF8");
    __name2(stringToUTF8, "stringToUTF8");
    __name2(stringFromUTF8, "stringFromUTF8");
    __name2(base64UrlToUint8Array, "base64UrlToUint8Array");
    __name2(stringToUint8Array, "stringToUint8Array");
    __name2(bytesToBase64URL, "bytesToBase64URL");
  }
});
function expiresAt(expiresIn) {
  const timeNow = Math.round(Date.now() / 1e3);
  return timeNow + expiresIn;
}
__name(expiresAt, "expiresAt");
function generateCallbackId() {
  return /* @__PURE__ */ Symbol("auth-callback");
}
__name(generateCallbackId, "generateCallbackId");
function parseParametersFromURL(href) {
  const result = {};
  const url = new URL(href);
  if (url.hash && url.hash[0] === "#") {
    try {
      const hashSearchParams = new URLSearchParams(url.hash.substring(1));
      hashSearchParams.forEach((value, key) => {
        result[key] = value;
      });
    } catch (e) {
    }
  }
  url.searchParams.forEach((value, key) => {
    result[key] = value;
  });
  return result;
}
__name(parseParametersFromURL, "parseParametersFromURL");
function decodeJWT(token) {
  const parts = token.split(".");
  if (parts.length !== 3) {
    throw new AuthInvalidJwtError("Invalid JWT structure");
  }
  for (let i = 0; i < parts.length; i++) {
    if (!BASE64URL_REGEX.test(parts[i])) {
      throw new AuthInvalidJwtError("JWT not in base64url format");
    }
  }
  const data = {
    // using base64url lib
    header: JSON.parse(stringFromBase64URL(parts[0])),
    payload: JSON.parse(stringFromBase64URL(parts[1])),
    signature: base64UrlToUint8Array(parts[2]),
    raw: {
      header: parts[0],
      payload: parts[1]
    }
  };
  return data;
}
__name(decodeJWT, "decodeJWT");
async function sleep(time3) {
  return await new Promise((accept) => {
    setTimeout(() => accept(null), time3);
  });
}
__name(sleep, "sleep");
function retryable(fn, isRetryable) {
  const promise = new Promise((accept, reject) => {
    ;
    (async () => {
      for (let attempt = 0; attempt < Infinity; attempt++) {
        try {
          const result = await fn(attempt);
          if (!isRetryable(attempt, null, result)) {
            accept(result);
            return;
          }
        } catch (e) {
          if (!isRetryable(attempt, e)) {
            reject(e);
            return;
          }
        }
      }
    })();
  });
  return promise;
}
__name(retryable, "retryable");
function dec2hex(dec) {
  return ("0" + dec.toString(16)).substr(-2);
}
__name(dec2hex, "dec2hex");
function generatePKCEVerifier() {
  const verifierLength = 56;
  const array = new Uint32Array(verifierLength);
  if (typeof crypto === "undefined") {
    const charSet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";
    const charSetLen = charSet.length;
    let verifier = "";
    for (let i = 0; i < verifierLength; i++) {
      verifier += charSet.charAt(Math.floor(Math.random() * charSetLen));
    }
    return verifier;
  }
  crypto.getRandomValues(array);
  return Array.from(array, dec2hex).join("");
}
__name(generatePKCEVerifier, "generatePKCEVerifier");
async function sha256(randomString) {
  const encoder = new TextEncoder();
  const encodedData = encoder.encode(randomString);
  const hash = await crypto.subtle.digest("SHA-256", encodedData);
  const bytes = new Uint8Array(hash);
  return Array.from(bytes).map((c) => String.fromCharCode(c)).join("");
}
__name(sha256, "sha256");
async function generatePKCEChallenge(verifier) {
  const hasCryptoSupport = typeof crypto !== "undefined" && typeof crypto.subtle !== "undefined" && typeof TextEncoder !== "undefined";
  if (!hasCryptoSupport) {
    console.warn("WebCrypto API is not supported. Code challenge method will default to use plain instead of sha256.");
    return verifier;
  }
  const hashed = await sha256(verifier);
  return btoa(hashed).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
__name(generatePKCEChallenge, "generatePKCEChallenge");
async function getCodeChallengeAndMethod(storage, storageKey, isPasswordRecovery = false) {
  const codeVerifier = generatePKCEVerifier();
  let storedCodeVerifier = codeVerifier;
  if (isPasswordRecovery) {
    storedCodeVerifier += "/PASSWORD_RECOVERY";
  }
  await setItemAsync(storage, `${storageKey}-code-verifier`, storedCodeVerifier);
  const codeChallenge = await generatePKCEChallenge(codeVerifier);
  const codeChallengeMethod = codeVerifier === codeChallenge ? "plain" : "s256";
  return [codeChallenge, codeChallengeMethod];
}
__name(getCodeChallengeAndMethod, "getCodeChallengeAndMethod");
function parseResponseAPIVersion(response) {
  const apiVersion = response.headers.get(API_VERSION_HEADER_NAME);
  if (!apiVersion) {
    return null;
  }
  if (!apiVersion.match(API_VERSION_REGEX)) {
    return null;
  }
  try {
    const date = /* @__PURE__ */ new Date(`${apiVersion}T00:00:00.0Z`);
    return date;
  } catch (e) {
    return null;
  }
}
__name(parseResponseAPIVersion, "parseResponseAPIVersion");
function validateExp(exp) {
  if (!exp) {
    throw new Error("Missing exp claim");
  }
  const timeNow = Math.floor(Date.now() / 1e3);
  if (exp <= timeNow) {
    throw new Error("JWT has expired");
  }
}
__name(validateExp, "validateExp");
function getAlgorithm(alg) {
  switch (alg) {
    case "RS256":
      return {
        name: "RSASSA-PKCS1-v1_5",
        hash: { name: "SHA-256" }
      };
    case "ES256":
      return {
        name: "ECDSA",
        namedCurve: "P-256",
        hash: { name: "SHA-256" }
      };
    default:
      throw new Error("Invalid alg claim");
  }
}
__name(getAlgorithm, "getAlgorithm");
function validateUUID(str) {
  if (!UUID_REGEX.test(str)) {
    throw new Error("@supabase/auth-js: Expected parameter to be UUID but is not");
  }
}
__name(validateUUID, "validateUUID");
function userNotAvailableProxy() {
  const proxyTarget = {};
  return new Proxy(proxyTarget, {
    get: /* @__PURE__ */ __name2((target, prop) => {
      if (prop === "__isUserNotAvailableProxy") {
        return true;
      }
      if (typeof prop === "symbol") {
        const sProp = prop.toString();
        if (sProp === "Symbol(Symbol.toPrimitive)" || sProp === "Symbol(Symbol.toStringTag)" || sProp === "Symbol(util.inspect.custom)") {
          return void 0;
        }
      }
      throw new Error(`@supabase/auth-js: client was created with userStorage option and there was no user stored in the user storage. Accessing the "${prop}" property of the session object is not supported. Please use getUser() instead.`);
    }, "get"),
    set: /* @__PURE__ */ __name2((_target, prop) => {
      throw new Error(`@supabase/auth-js: client was created with userStorage option and there was no user stored in the user storage. Setting the "${prop}" property of the session object is not supported. Please use getUser() to fetch a user object you can manipulate.`);
    }, "set"),
    deleteProperty: /* @__PURE__ */ __name2((_target, prop) => {
      throw new Error(`@supabase/auth-js: client was created with userStorage option and there was no user stored in the user storage. Deleting the "${prop}" property of the session object is not supported. Please use getUser() to fetch a user object you can manipulate.`);
    }, "deleteProperty")
  });
}
__name(userNotAvailableProxy, "userNotAvailableProxy");
function insecureUserWarningProxy(user, suppressWarningRef) {
  return new Proxy(user, {
    get: /* @__PURE__ */ __name2((target, prop, receiver) => {
      if (prop === "__isInsecureUserWarningProxy") {
        return true;
      }
      if (typeof prop === "symbol") {
        const sProp = prop.toString();
        if (sProp === "Symbol(Symbol.toPrimitive)" || sProp === "Symbol(Symbol.toStringTag)" || sProp === "Symbol(util.inspect.custom)" || sProp === "Symbol(nodejs.util.inspect.custom)") {
          return Reflect.get(target, prop, receiver);
        }
      }
      if (!suppressWarningRef.value && typeof prop === "string") {
        console.warn("Using the user object as returned from supabase.auth.getSession() or from some supabase.auth.onAuthStateChange() events could be insecure! This value comes directly from the storage medium (usually cookies on the server) and may not be authentic. Use supabase.auth.getUser() instead which authenticates the data by contacting the Supabase Auth server.");
        suppressWarningRef.value = true;
      }
      return Reflect.get(target, prop, receiver);
    }, "get")
  });
}
__name(insecureUserWarningProxy, "insecureUserWarningProxy");
function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}
__name(deepClone, "deepClone");
var isBrowser;
var localStorageWriteTests;
var supportsLocalStorage;
var resolveFetch5;
var looksLikeFetchResponse;
var setItemAsync;
var getItemAsync;
var removeItemAsync;
var Deferred;
var API_VERSION_REGEX;
var UUID_REGEX;
var init_helpers4 = __esm({
  "../node_modules/@supabase/auth-js/dist/module/lib/helpers.js"() {
    init_functionsRoutes_0_04524570753253654();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_constants7();
    init_errors3();
    init_base64url();
    __name2(expiresAt, "expiresAt");
    __name2(generateCallbackId, "generateCallbackId");
    isBrowser = /* @__PURE__ */ __name2(() => typeof window !== "undefined" && typeof document !== "undefined", "isBrowser");
    localStorageWriteTests = {
      tested: false,
      writable: false
    };
    supportsLocalStorage = /* @__PURE__ */ __name2(() => {
      if (!isBrowser()) {
        return false;
      }
      try {
        if (typeof globalThis.localStorage !== "object") {
          return false;
        }
      } catch (e) {
        return false;
      }
      if (localStorageWriteTests.tested) {
        return localStorageWriteTests.writable;
      }
      const randomKey = `lswt-${Math.random()}${Math.random()}`;
      try {
        globalThis.localStorage.setItem(randomKey, randomKey);
        globalThis.localStorage.removeItem(randomKey);
        localStorageWriteTests.tested = true;
        localStorageWriteTests.writable = true;
      } catch (e) {
        localStorageWriteTests.tested = true;
        localStorageWriteTests.writable = false;
      }
      return localStorageWriteTests.writable;
    }, "supportsLocalStorage");
    __name2(parseParametersFromURL, "parseParametersFromURL");
    resolveFetch5 = /* @__PURE__ */ __name2((customFetch) => {
      if (customFetch) {
        return (...args) => customFetch(...args);
      }
      return (...args) => fetch(...args);
    }, "resolveFetch");
    looksLikeFetchResponse = /* @__PURE__ */ __name2((maybeResponse) => {
      return typeof maybeResponse === "object" && maybeResponse !== null && "status" in maybeResponse && "ok" in maybeResponse && "json" in maybeResponse && typeof maybeResponse.json === "function";
    }, "looksLikeFetchResponse");
    setItemAsync = /* @__PURE__ */ __name2(async (storage, key, data) => {
      await storage.setItem(key, JSON.stringify(data));
    }, "setItemAsync");
    getItemAsync = /* @__PURE__ */ __name2(async (storage, key) => {
      const value = await storage.getItem(key);
      if (!value) {
        return null;
      }
      try {
        return JSON.parse(value);
      } catch (_a2) {
        return value;
      }
    }, "getItemAsync");
    removeItemAsync = /* @__PURE__ */ __name2(async (storage, key) => {
      await storage.removeItem(key);
    }, "removeItemAsync");
    Deferred = class _Deferred {
      static {
        __name(this, "_Deferred");
      }
      static {
        __name2(this, "Deferred");
      }
      constructor() {
        ;
        this.promise = new _Deferred.promiseConstructor((res, rej) => {
          ;
          this.resolve = res;
          this.reject = rej;
        });
      }
    };
    Deferred.promiseConstructor = Promise;
    __name2(decodeJWT, "decodeJWT");
    __name2(sleep, "sleep");
    __name2(retryable, "retryable");
    __name2(dec2hex, "dec2hex");
    __name2(generatePKCEVerifier, "generatePKCEVerifier");
    __name2(sha256, "sha256");
    __name2(generatePKCEChallenge, "generatePKCEChallenge");
    __name2(getCodeChallengeAndMethod, "getCodeChallengeAndMethod");
    API_VERSION_REGEX = /^2[0-9]{3}-(0[1-9]|1[0-2])-(0[1-9]|1[0-9]|2[0-9]|3[0-1])$/i;
    __name2(parseResponseAPIVersion, "parseResponseAPIVersion");
    __name2(validateExp, "validateExp");
    __name2(getAlgorithm, "getAlgorithm");
    UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
    __name2(validateUUID, "validateUUID");
    __name2(userNotAvailableProxy, "userNotAvailableProxy");
    __name2(insecureUserWarningProxy, "insecureUserWarningProxy");
    __name2(deepClone, "deepClone");
  }
});
async function handleError3(error3) {
  var _a2;
  if (!looksLikeFetchResponse(error3)) {
    throw new AuthRetryableFetchError(_getErrorMessage3(error3), 0);
  }
  if (NETWORK_ERROR_CODES.includes(error3.status)) {
    throw new AuthRetryableFetchError(_getErrorMessage3(error3), error3.status);
  }
  let data;
  try {
    data = await error3.json();
  } catch (e) {
    throw new AuthUnknownError(_getErrorMessage3(e), e);
  }
  let errorCode = void 0;
  const responseAPIVersion = parseResponseAPIVersion(error3);
  if (responseAPIVersion && responseAPIVersion.getTime() >= API_VERSIONS["2024-01-01"].timestamp && typeof data === "object" && data && typeof data.code === "string") {
    errorCode = data.code;
  } else if (typeof data === "object" && data && typeof data.error_code === "string") {
    errorCode = data.error_code;
  }
  if (!errorCode) {
    if (typeof data === "object" && data && typeof data.weak_password === "object" && data.weak_password && Array.isArray(data.weak_password.reasons) && data.weak_password.reasons.length && data.weak_password.reasons.reduce((a, i) => a && typeof i === "string", true)) {
      throw new AuthWeakPasswordError(_getErrorMessage3(data), error3.status, data.weak_password.reasons);
    }
  } else if (errorCode === "weak_password") {
    throw new AuthWeakPasswordError(_getErrorMessage3(data), error3.status, ((_a2 = data.weak_password) === null || _a2 === void 0 ? void 0 : _a2.reasons) || []);
  } else if (errorCode === "session_not_found") {
    throw new AuthSessionMissingError();
  }
  throw new AuthApiError(_getErrorMessage3(data), error3.status || 500, errorCode);
}
__name(handleError3, "handleError3");
async function _request(fetcher, method, url, options) {
  var _a2;
  const headers = Object.assign({}, options === null || options === void 0 ? void 0 : options.headers);
  if (!headers[API_VERSION_HEADER_NAME]) {
    headers[API_VERSION_HEADER_NAME] = API_VERSIONS["2024-01-01"].name;
  }
  if (options === null || options === void 0 ? void 0 : options.jwt) {
    headers["Authorization"] = `Bearer ${options.jwt}`;
  }
  const qs = (_a2 = options === null || options === void 0 ? void 0 : options.query) !== null && _a2 !== void 0 ? _a2 : {};
  if (options === null || options === void 0 ? void 0 : options.redirectTo) {
    qs["redirect_to"] = options.redirectTo;
  }
  const queryString = Object.keys(qs).length ? "?" + new URLSearchParams(qs).toString() : "";
  const data = await _handleRequest3(fetcher, method, url + queryString, {
    headers,
    noResolveJson: options === null || options === void 0 ? void 0 : options.noResolveJson
  }, {}, options === null || options === void 0 ? void 0 : options.body);
  return (options === null || options === void 0 ? void 0 : options.xform) ? options === null || options === void 0 ? void 0 : options.xform(data) : { data: Object.assign({}, data), error: null };
}
__name(_request, "_request");
async function _handleRequest3(fetcher, method, url, options, parameters, body) {
  const requestParams = _getRequestParams3(method, options, parameters, body);
  let result;
  try {
    result = await fetcher(url, Object.assign({}, requestParams));
  } catch (e) {
    console.error(e);
    throw new AuthRetryableFetchError(_getErrorMessage3(e), 0);
  }
  if (!result.ok) {
    await handleError3(result);
  }
  if (options === null || options === void 0 ? void 0 : options.noResolveJson) {
    return result;
  }
  try {
    return await result.json();
  } catch (e) {
    await handleError3(e);
  }
}
__name(_handleRequest3, "_handleRequest3");
function _sessionResponse(data) {
  var _a2;
  let session = null;
  if (hasSession(data)) {
    session = Object.assign({}, data);
    if (!data.expires_at) {
      session.expires_at = expiresAt(data.expires_in);
    }
  }
  const user = (_a2 = data.user) !== null && _a2 !== void 0 ? _a2 : data;
  return { data: { session, user }, error: null };
}
__name(_sessionResponse, "_sessionResponse");
function _sessionResponsePassword(data) {
  const response = _sessionResponse(data);
  if (!response.error && data.weak_password && typeof data.weak_password === "object" && Array.isArray(data.weak_password.reasons) && data.weak_password.reasons.length && data.weak_password.message && typeof data.weak_password.message === "string" && data.weak_password.reasons.reduce((a, i) => a && typeof i === "string", true)) {
    response.data.weak_password = data.weak_password;
  }
  return response;
}
__name(_sessionResponsePassword, "_sessionResponsePassword");
function _userResponse(data) {
  var _a2;
  const user = (_a2 = data.user) !== null && _a2 !== void 0 ? _a2 : data;
  return { data: { user }, error: null };
}
__name(_userResponse, "_userResponse");
function _ssoResponse(data) {
  return { data, error: null };
}
__name(_ssoResponse, "_ssoResponse");
function _generateLinkResponse(data) {
  const { action_link, email_otp, hashed_token, redirect_to, verification_type } = data, rest = __rest(data, ["action_link", "email_otp", "hashed_token", "redirect_to", "verification_type"]);
  const properties = {
    action_link,
    email_otp,
    hashed_token,
    redirect_to,
    verification_type
  };
  const user = Object.assign({}, rest);
  return {
    data: {
      properties,
      user
    },
    error: null
  };
}
__name(_generateLinkResponse, "_generateLinkResponse");
function _noResolveJsonResponse(data) {
  return data;
}
__name(_noResolveJsonResponse, "_noResolveJsonResponse");
function hasSession(data) {
  return data.access_token && data.refresh_token && data.expires_in;
}
__name(hasSession, "hasSession");
var _getErrorMessage3;
var NETWORK_ERROR_CODES;
var _getRequestParams3;
var init_fetch4 = __esm({
  "../node_modules/@supabase/auth-js/dist/module/lib/fetch.js"() {
    init_functionsRoutes_0_04524570753253654();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_tslib_es6();
    init_constants7();
    init_helpers4();
    init_errors3();
    _getErrorMessage3 = /* @__PURE__ */ __name2((err) => err.msg || err.message || err.error_description || err.error || JSON.stringify(err), "_getErrorMessage");
    NETWORK_ERROR_CODES = [502, 503, 504];
    __name2(handleError3, "handleError");
    _getRequestParams3 = /* @__PURE__ */ __name2((method, options, parameters, body) => {
      const params = { method, headers: (options === null || options === void 0 ? void 0 : options.headers) || {} };
      if (method === "GET") {
        return params;
      }
      params.headers = Object.assign({ "Content-Type": "application/json;charset=UTF-8" }, options === null || options === void 0 ? void 0 : options.headers);
      params.body = JSON.stringify(body);
      return Object.assign(Object.assign({}, params), parameters);
    }, "_getRequestParams");
    __name2(_request, "_request");
    __name2(_handleRequest3, "_handleRequest");
    __name2(_sessionResponse, "_sessionResponse");
    __name2(_sessionResponsePassword, "_sessionResponsePassword");
    __name2(_userResponse, "_userResponse");
    __name2(_ssoResponse, "_ssoResponse");
    __name2(_generateLinkResponse, "_generateLinkResponse");
    __name2(_noResolveJsonResponse, "_noResolveJsonResponse");
    __name2(hasSession, "hasSession");
  }
});
var SIGN_OUT_SCOPES;
var init_types3 = __esm({
  "../node_modules/@supabase/auth-js/dist/module/lib/types.js"() {
    init_functionsRoutes_0_04524570753253654();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    SIGN_OUT_SCOPES = ["global", "local", "others"];
  }
});
var GoTrueAdminApi;
var init_GoTrueAdminApi = __esm({
  "../node_modules/@supabase/auth-js/dist/module/GoTrueAdminApi.js"() {
    init_functionsRoutes_0_04524570753253654();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_tslib_es6();
    init_fetch4();
    init_helpers4();
    init_types3();
    init_errors3();
    GoTrueAdminApi = class {
      static {
        __name(this, "GoTrueAdminApi");
      }
      static {
        __name2(this, "GoTrueAdminApi");
      }
      /**
       * Creates an admin API client that can be used to manage users and OAuth clients.
       *
       * @example
       * ```ts
       * import { GoTrueAdminApi } from '@supabase/auth-js'
       *
       * const admin = new GoTrueAdminApi({
       *   url: 'https://xyzcompany.supabase.co/auth/v1',
       *   headers: { Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}` },
       * })
       * ```
       */
      constructor({ url = "", headers = {}, fetch: fetch2 }) {
        this.url = url;
        this.headers = headers;
        this.fetch = resolveFetch5(fetch2);
        this.mfa = {
          listFactors: this._listFactors.bind(this),
          deleteFactor: this._deleteFactor.bind(this)
        };
        this.oauth = {
          listClients: this._listOAuthClients.bind(this),
          createClient: this._createOAuthClient.bind(this),
          getClient: this._getOAuthClient.bind(this),
          updateClient: this._updateOAuthClient.bind(this),
          deleteClient: this._deleteOAuthClient.bind(this),
          regenerateClientSecret: this._regenerateOAuthClientSecret.bind(this)
        };
      }
      /**
       * Removes a logged-in session.
       * @param jwt A valid, logged-in JWT.
       * @param scope The logout sope.
       */
      async signOut(jwt, scope = SIGN_OUT_SCOPES[0]) {
        if (SIGN_OUT_SCOPES.indexOf(scope) < 0) {
          throw new Error(`@supabase/auth-js: Parameter scope must be one of ${SIGN_OUT_SCOPES.join(", ")}`);
        }
        try {
          await _request(this.fetch, "POST", `${this.url}/logout?scope=${scope}`, {
            headers: this.headers,
            jwt,
            noResolveJson: true
          });
          return { data: null, error: null };
        } catch (error3) {
          if (isAuthError(error3)) {
            return { data: null, error: error3 };
          }
          throw error3;
        }
      }
      /**
       * Sends an invite link to an email address.
       * @param email The email address of the user.
       * @param options Additional options to be included when inviting.
       */
      async inviteUserByEmail(email, options = {}) {
        try {
          return await _request(this.fetch, "POST", `${this.url}/invite`, {
            body: { email, data: options.data },
            headers: this.headers,
            redirectTo: options.redirectTo,
            xform: _userResponse
          });
        } catch (error3) {
          if (isAuthError(error3)) {
            return { data: { user: null }, error: error3 };
          }
          throw error3;
        }
      }
      /**
       * Generates email links and OTPs to be sent via a custom email provider.
       * @param email The user's email.
       * @param options.password User password. For signup only.
       * @param options.data Optional user metadata. For signup only.
       * @param options.redirectTo The redirect url which should be appended to the generated link
       */
      async generateLink(params) {
        try {
          const { options } = params, rest = __rest(params, ["options"]);
          const body = Object.assign(Object.assign({}, rest), options);
          if ("newEmail" in rest) {
            body.new_email = rest === null || rest === void 0 ? void 0 : rest.newEmail;
            delete body["newEmail"];
          }
          return await _request(this.fetch, "POST", `${this.url}/admin/generate_link`, {
            body,
            headers: this.headers,
            xform: _generateLinkResponse,
            redirectTo: options === null || options === void 0 ? void 0 : options.redirectTo
          });
        } catch (error3) {
          if (isAuthError(error3)) {
            return {
              data: {
                properties: null,
                user: null
              },
              error: error3
            };
          }
          throw error3;
        }
      }
      // User Admin API
      /**
       * Creates a new user.
       * This function should only be called on a server. Never expose your `service_role` key in the browser.
       */
      async createUser(attributes) {
        try {
          return await _request(this.fetch, "POST", `${this.url}/admin/users`, {
            body: attributes,
            headers: this.headers,
            xform: _userResponse
          });
        } catch (error3) {
          if (isAuthError(error3)) {
            return { data: { user: null }, error: error3 };
          }
          throw error3;
        }
      }
      /**
       * Get a list of users.
       *
       * This function should only be called on a server. Never expose your `service_role` key in the browser.
       * @param params An object which supports `page` and `perPage` as numbers, to alter the paginated results.
       */
      async listUsers(params) {
        var _a2, _b, _c, _d, _e, _f, _g;
        try {
          const pagination = { nextPage: null, lastPage: 0, total: 0 };
          const response = await _request(this.fetch, "GET", `${this.url}/admin/users`, {
            headers: this.headers,
            noResolveJson: true,
            query: {
              page: (_b = (_a2 = params === null || params === void 0 ? void 0 : params.page) === null || _a2 === void 0 ? void 0 : _a2.toString()) !== null && _b !== void 0 ? _b : "",
              per_page: (_d = (_c = params === null || params === void 0 ? void 0 : params.perPage) === null || _c === void 0 ? void 0 : _c.toString()) !== null && _d !== void 0 ? _d : ""
            },
            xform: _noResolveJsonResponse
          });
          if (response.error)
            throw response.error;
          const users = await response.json();
          const total = (_e = response.headers.get("x-total-count")) !== null && _e !== void 0 ? _e : 0;
          const links = (_g = (_f = response.headers.get("link")) === null || _f === void 0 ? void 0 : _f.split(",")) !== null && _g !== void 0 ? _g : [];
          if (links.length > 0) {
            links.forEach((link3) => {
              const page = parseInt(link3.split(";")[0].split("=")[1].substring(0, 1));
              const rel = JSON.parse(link3.split(";")[1].split("=")[1]);
              pagination[`${rel}Page`] = page;
            });
            pagination.total = parseInt(total);
          }
          return { data: Object.assign(Object.assign({}, users), pagination), error: null };
        } catch (error3) {
          if (isAuthError(error3)) {
            return { data: { users: [] }, error: error3 };
          }
          throw error3;
        }
      }
      /**
       * Get user by id.
       *
       * @param uid The user's unique identifier
       *
       * This function should only be called on a server. Never expose your `service_role` key in the browser.
       */
      async getUserById(uid) {
        validateUUID(uid);
        try {
          return await _request(this.fetch, "GET", `${this.url}/admin/users/${uid}`, {
            headers: this.headers,
            xform: _userResponse
          });
        } catch (error3) {
          if (isAuthError(error3)) {
            return { data: { user: null }, error: error3 };
          }
          throw error3;
        }
      }
      /**
       * Updates the user data.
       *
       * @param attributes The data you want to update.
       *
       * This function should only be called on a server. Never expose your `service_role` key in the browser.
       */
      async updateUserById(uid, attributes) {
        validateUUID(uid);
        try {
          return await _request(this.fetch, "PUT", `${this.url}/admin/users/${uid}`, {
            body: attributes,
            headers: this.headers,
            xform: _userResponse
          });
        } catch (error3) {
          if (isAuthError(error3)) {
            return { data: { user: null }, error: error3 };
          }
          throw error3;
        }
      }
      /**
       * Delete a user. Requires a `service_role` key.
       *
       * @param id The user id you want to remove.
       * @param shouldSoftDelete If true, then the user will be soft-deleted from the auth schema. Soft deletion allows user identification from the hashed user ID but is not reversible.
       * Defaults to false for backward compatibility.
       *
       * This function should only be called on a server. Never expose your `service_role` key in the browser.
       */
      async deleteUser(id, shouldSoftDelete = false) {
        validateUUID(id);
        try {
          return await _request(this.fetch, "DELETE", `${this.url}/admin/users/${id}`, {
            headers: this.headers,
            body: {
              should_soft_delete: shouldSoftDelete
            },
            xform: _userResponse
          });
        } catch (error3) {
          if (isAuthError(error3)) {
            return { data: { user: null }, error: error3 };
          }
          throw error3;
        }
      }
      async _listFactors(params) {
        validateUUID(params.userId);
        try {
          const { data, error: error3 } = await _request(this.fetch, "GET", `${this.url}/admin/users/${params.userId}/factors`, {
            headers: this.headers,
            xform: /* @__PURE__ */ __name2((factors) => {
              return { data: { factors }, error: null };
            }, "xform")
          });
          return { data, error: error3 };
        } catch (error3) {
          if (isAuthError(error3)) {
            return { data: null, error: error3 };
          }
          throw error3;
        }
      }
      async _deleteFactor(params) {
        validateUUID(params.userId);
        validateUUID(params.id);
        try {
          const data = await _request(this.fetch, "DELETE", `${this.url}/admin/users/${params.userId}/factors/${params.id}`, {
            headers: this.headers
          });
          return { data, error: null };
        } catch (error3) {
          if (isAuthError(error3)) {
            return { data: null, error: error3 };
          }
          throw error3;
        }
      }
      /**
       * Lists all OAuth clients with optional pagination.
       * Only relevant when the OAuth 2.1 server is enabled in Supabase Auth.
       *
       * This function should only be called on a server. Never expose your `service_role` key in the browser.
       */
      async _listOAuthClients(params) {
        var _a2, _b, _c, _d, _e, _f, _g;
        try {
          const pagination = { nextPage: null, lastPage: 0, total: 0 };
          const response = await _request(this.fetch, "GET", `${this.url}/admin/oauth/clients`, {
            headers: this.headers,
            noResolveJson: true,
            query: {
              page: (_b = (_a2 = params === null || params === void 0 ? void 0 : params.page) === null || _a2 === void 0 ? void 0 : _a2.toString()) !== null && _b !== void 0 ? _b : "",
              per_page: (_d = (_c = params === null || params === void 0 ? void 0 : params.perPage) === null || _c === void 0 ? void 0 : _c.toString()) !== null && _d !== void 0 ? _d : ""
            },
            xform: _noResolveJsonResponse
          });
          if (response.error)
            throw response.error;
          const clients = await response.json();
          const total = (_e = response.headers.get("x-total-count")) !== null && _e !== void 0 ? _e : 0;
          const links = (_g = (_f = response.headers.get("link")) === null || _f === void 0 ? void 0 : _f.split(",")) !== null && _g !== void 0 ? _g : [];
          if (links.length > 0) {
            links.forEach((link3) => {
              const page = parseInt(link3.split(";")[0].split("=")[1].substring(0, 1));
              const rel = JSON.parse(link3.split(";")[1].split("=")[1]);
              pagination[`${rel}Page`] = page;
            });
            pagination.total = parseInt(total);
          }
          return { data: Object.assign(Object.assign({}, clients), pagination), error: null };
        } catch (error3) {
          if (isAuthError(error3)) {
            return { data: { clients: [] }, error: error3 };
          }
          throw error3;
        }
      }
      /**
       * Creates a new OAuth client.
       * Only relevant when the OAuth 2.1 server is enabled in Supabase Auth.
       *
       * This function should only be called on a server. Never expose your `service_role` key in the browser.
       */
      async _createOAuthClient(params) {
        try {
          return await _request(this.fetch, "POST", `${this.url}/admin/oauth/clients`, {
            body: params,
            headers: this.headers,
            xform: /* @__PURE__ */ __name2((client) => {
              return { data: client, error: null };
            }, "xform")
          });
        } catch (error3) {
          if (isAuthError(error3)) {
            return { data: null, error: error3 };
          }
          throw error3;
        }
      }
      /**
       * Gets details of a specific OAuth client.
       * Only relevant when the OAuth 2.1 server is enabled in Supabase Auth.
       *
       * This function should only be called on a server. Never expose your `service_role` key in the browser.
       */
      async _getOAuthClient(clientId) {
        try {
          return await _request(this.fetch, "GET", `${this.url}/admin/oauth/clients/${clientId}`, {
            headers: this.headers,
            xform: /* @__PURE__ */ __name2((client) => {
              return { data: client, error: null };
            }, "xform")
          });
        } catch (error3) {
          if (isAuthError(error3)) {
            return { data: null, error: error3 };
          }
          throw error3;
        }
      }
      /**
       * Updates an existing OAuth client.
       * Only relevant when the OAuth 2.1 server is enabled in Supabase Auth.
       *
       * This function should only be called on a server. Never expose your `service_role` key in the browser.
       */
      async _updateOAuthClient(clientId, params) {
        try {
          return await _request(this.fetch, "PUT", `${this.url}/admin/oauth/clients/${clientId}`, {
            body: params,
            headers: this.headers,
            xform: /* @__PURE__ */ __name2((client) => {
              return { data: client, error: null };
            }, "xform")
          });
        } catch (error3) {
          if (isAuthError(error3)) {
            return { data: null, error: error3 };
          }
          throw error3;
        }
      }
      /**
       * Deletes an OAuth client.
       * Only relevant when the OAuth 2.1 server is enabled in Supabase Auth.
       *
       * This function should only be called on a server. Never expose your `service_role` key in the browser.
       */
      async _deleteOAuthClient(clientId) {
        try {
          await _request(this.fetch, "DELETE", `${this.url}/admin/oauth/clients/${clientId}`, {
            headers: this.headers,
            noResolveJson: true
          });
          return { data: null, error: null };
        } catch (error3) {
          if (isAuthError(error3)) {
            return { data: null, error: error3 };
          }
          throw error3;
        }
      }
      /**
       * Regenerates the secret for an OAuth client.
       * Only relevant when the OAuth 2.1 server is enabled in Supabase Auth.
       *
       * This function should only be called on a server. Never expose your `service_role` key in the browser.
       */
      async _regenerateOAuthClientSecret(clientId) {
        try {
          return await _request(this.fetch, "POST", `${this.url}/admin/oauth/clients/${clientId}/regenerate_secret`, {
            headers: this.headers,
            xform: /* @__PURE__ */ __name2((client) => {
              return { data: client, error: null };
            }, "xform")
          });
        } catch (error3) {
          if (isAuthError(error3)) {
            return { data: null, error: error3 };
          }
          throw error3;
        }
      }
    };
  }
});
function memoryLocalStorageAdapter(store = {}) {
  return {
    getItem: /* @__PURE__ */ __name2((key) => {
      return store[key] || null;
    }, "getItem"),
    setItem: /* @__PURE__ */ __name2((key, value) => {
      store[key] = value;
    }, "setItem"),
    removeItem: /* @__PURE__ */ __name2((key) => {
      delete store[key];
    }, "removeItem")
  };
}
__name(memoryLocalStorageAdapter, "memoryLocalStorageAdapter");
var init_local_storage = __esm({
  "../node_modules/@supabase/auth-js/dist/module/lib/local-storage.js"() {
    init_functionsRoutes_0_04524570753253654();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    __name2(memoryLocalStorageAdapter, "memoryLocalStorageAdapter");
  }
});
async function navigatorLock(name, acquireTimeout, fn) {
  if (internals.debug) {
    console.log("@supabase/gotrue-js: navigatorLock: acquire lock", name, acquireTimeout);
  }
  const abortController = new globalThis.AbortController();
  if (acquireTimeout > 0) {
    setTimeout(() => {
      abortController.abort();
      if (internals.debug) {
        console.log("@supabase/gotrue-js: navigatorLock acquire timed out", name);
      }
    }, acquireTimeout);
  }
  return await Promise.resolve().then(() => globalThis.navigator.locks.request(name, acquireTimeout === 0 ? {
    mode: "exclusive",
    ifAvailable: true
  } : {
    mode: "exclusive",
    signal: abortController.signal
  }, async (lock) => {
    if (lock) {
      if (internals.debug) {
        console.log("@supabase/gotrue-js: navigatorLock: acquired", name, lock.name);
      }
      try {
        return await fn();
      } finally {
        if (internals.debug) {
          console.log("@supabase/gotrue-js: navigatorLock: released", name, lock.name);
        }
      }
    } else {
      if (acquireTimeout === 0) {
        if (internals.debug) {
          console.log("@supabase/gotrue-js: navigatorLock: not immediately available", name);
        }
        throw new NavigatorLockAcquireTimeoutError(`Acquiring an exclusive Navigator LockManager lock "${name}" immediately failed`);
      } else {
        if (internals.debug) {
          try {
            const result = await globalThis.navigator.locks.query();
            console.log("@supabase/gotrue-js: Navigator LockManager state", JSON.stringify(result, null, "  "));
          } catch (e) {
            console.warn("@supabase/gotrue-js: Error when querying Navigator LockManager state", e);
          }
        }
        console.warn("@supabase/gotrue-js: Navigator LockManager returned a null lock when using #request without ifAvailable set to true, it appears this browser is not following the LockManager spec https://developer.mozilla.org/en-US/docs/Web/API/LockManager/request");
        return await fn();
      }
    }
  }));
}
__name(navigatorLock, "navigatorLock");
var internals;
var LockAcquireTimeoutError;
var NavigatorLockAcquireTimeoutError;
var init_locks = __esm({
  "../node_modules/@supabase/auth-js/dist/module/lib/locks.js"() {
    init_functionsRoutes_0_04524570753253654();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_helpers4();
    internals = {
      /**
       * @experimental
       */
      debug: !!(globalThis && supportsLocalStorage() && globalThis.localStorage && globalThis.localStorage.getItem("supabase.gotrue-js.locks.debug") === "true")
    };
    LockAcquireTimeoutError = class extends Error {
      static {
        __name(this, "LockAcquireTimeoutError");
      }
      static {
        __name2(this, "LockAcquireTimeoutError");
      }
      constructor(message) {
        super(message);
        this.isAcquireTimeout = true;
      }
    };
    NavigatorLockAcquireTimeoutError = class extends LockAcquireTimeoutError {
      static {
        __name(this, "NavigatorLockAcquireTimeoutError");
      }
      static {
        __name2(this, "NavigatorLockAcquireTimeoutError");
      }
    };
    __name2(navigatorLock, "navigatorLock");
  }
});
function polyfillGlobalThis() {
  if (typeof globalThis === "object")
    return;
  try {
    Object.defineProperty(Object.prototype, "__magic__", {
      get: /* @__PURE__ */ __name2(function() {
        return this;
      }, "get"),
      configurable: true
    });
    __magic__.globalThis = __magic__;
    delete Object.prototype.__magic__;
  } catch (e) {
    if (typeof self !== "undefined") {
      self.globalThis = self;
    }
  }
}
__name(polyfillGlobalThis, "polyfillGlobalThis");
var init_polyfills = __esm({
  "../node_modules/@supabase/auth-js/dist/module/lib/polyfills.js"() {
    init_functionsRoutes_0_04524570753253654();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    __name2(polyfillGlobalThis, "polyfillGlobalThis");
  }
});
function getAddress(address) {
  if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
    throw new Error(`@supabase/auth-js: Address "${address}" is invalid.`);
  }
  return address.toLowerCase();
}
__name(getAddress, "getAddress");
function fromHex(hex) {
  return parseInt(hex, 16);
}
__name(fromHex, "fromHex");
function toHex(value) {
  const bytes = new TextEncoder().encode(value);
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  return "0x" + hex;
}
__name(toHex, "toHex");
function createSiweMessage(parameters) {
  var _a2;
  const { chainId, domain: domain2, expirationTime, issuedAt = /* @__PURE__ */ new Date(), nonce, notBefore, requestId, resources, scheme, uri, version: version7 } = parameters;
  {
    if (!Number.isInteger(chainId))
      throw new Error(`@supabase/auth-js: Invalid SIWE message field "chainId". Chain ID must be a EIP-155 chain ID. Provided value: ${chainId}`);
    if (!domain2)
      throw new Error(`@supabase/auth-js: Invalid SIWE message field "domain". Domain must be provided.`);
    if (nonce && nonce.length < 8)
      throw new Error(`@supabase/auth-js: Invalid SIWE message field "nonce". Nonce must be at least 8 characters. Provided value: ${nonce}`);
    if (!uri)
      throw new Error(`@supabase/auth-js: Invalid SIWE message field "uri". URI must be provided.`);
    if (version7 !== "1")
      throw new Error(`@supabase/auth-js: Invalid SIWE message field "version". Version must be '1'. Provided value: ${version7}`);
    if ((_a2 = parameters.statement) === null || _a2 === void 0 ? void 0 : _a2.includes("\n"))
      throw new Error(`@supabase/auth-js: Invalid SIWE message field "statement". Statement must not include '\\n'. Provided value: ${parameters.statement}`);
  }
  const address = getAddress(parameters.address);
  const origin = scheme ? `${scheme}://${domain2}` : domain2;
  const statement = parameters.statement ? `${parameters.statement}
` : "";
  const prefix = `${origin} wants you to sign in with your Ethereum account:
${address}

${statement}`;
  let suffix = `URI: ${uri}
Version: ${version7}
Chain ID: ${chainId}${nonce ? `
Nonce: ${nonce}` : ""}
Issued At: ${issuedAt.toISOString()}`;
  if (expirationTime)
    suffix += `
Expiration Time: ${expirationTime.toISOString()}`;
  if (notBefore)
    suffix += `
Not Before: ${notBefore.toISOString()}`;
  if (requestId)
    suffix += `
Request ID: ${requestId}`;
  if (resources) {
    let content = "\nResources:";
    for (const resource of resources) {
      if (!resource || typeof resource !== "string")
        throw new Error(`@supabase/auth-js: Invalid SIWE message field "resources". Every resource must be a valid string. Provided value: ${resource}`);
      content += `
- ${resource}`;
    }
    suffix += content;
  }
  return `${prefix}
${suffix}`;
}
__name(createSiweMessage, "createSiweMessage");
var init_ethereum = __esm({
  "../node_modules/@supabase/auth-js/dist/module/lib/web3/ethereum.js"() {
    init_functionsRoutes_0_04524570753253654();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    __name2(getAddress, "getAddress");
    __name2(fromHex, "fromHex");
    __name2(toHex, "toHex");
    __name2(createSiweMessage, "createSiweMessage");
  }
});
function identifyRegistrationError({ error: error3, options }) {
  var _a2, _b, _c;
  const { publicKey } = options;
  if (!publicKey) {
    throw Error("options was missing required publicKey property");
  }
  if (error3.name === "AbortError") {
    if (options.signal instanceof AbortSignal) {
      return new WebAuthnError({
        message: "Registration ceremony was sent an abort signal",
        code: "ERROR_CEREMONY_ABORTED",
        cause: error3
      });
    }
  } else if (error3.name === "ConstraintError") {
    if (((_a2 = publicKey.authenticatorSelection) === null || _a2 === void 0 ? void 0 : _a2.requireResidentKey) === true) {
      return new WebAuthnError({
        message: "Discoverable credentials were required but no available authenticator supported it",
        code: "ERROR_AUTHENTICATOR_MISSING_DISCOVERABLE_CREDENTIAL_SUPPORT",
        cause: error3
      });
    } else if (
      // @ts-ignore: `mediation` doesn't yet exist on CredentialCreationOptions but it's possible as of Sept 2024
      options.mediation === "conditional" && ((_b = publicKey.authenticatorSelection) === null || _b === void 0 ? void 0 : _b.userVerification) === "required"
    ) {
      return new WebAuthnError({
        message: "User verification was required during automatic registration but it could not be performed",
        code: "ERROR_AUTO_REGISTER_USER_VERIFICATION_FAILURE",
        cause: error3
      });
    } else if (((_c = publicKey.authenticatorSelection) === null || _c === void 0 ? void 0 : _c.userVerification) === "required") {
      return new WebAuthnError({
        message: "User verification was required but no available authenticator supported it",
        code: "ERROR_AUTHENTICATOR_MISSING_USER_VERIFICATION_SUPPORT",
        cause: error3
      });
    }
  } else if (error3.name === "InvalidStateError") {
    return new WebAuthnError({
      message: "The authenticator was previously registered",
      code: "ERROR_AUTHENTICATOR_PREVIOUSLY_REGISTERED",
      cause: error3
    });
  } else if (error3.name === "NotAllowedError") {
    return new WebAuthnError({
      message: error3.message,
      code: "ERROR_PASSTHROUGH_SEE_CAUSE_PROPERTY",
      cause: error3
    });
  } else if (error3.name === "NotSupportedError") {
    const validPubKeyCredParams = publicKey.pubKeyCredParams.filter((param) => param.type === "public-key");
    if (validPubKeyCredParams.length === 0) {
      return new WebAuthnError({
        message: 'No entry in pubKeyCredParams was of type "public-key"',
        code: "ERROR_MALFORMED_PUBKEYCREDPARAMS",
        cause: error3
      });
    }
    return new WebAuthnError({
      message: "No available authenticator supported any of the specified pubKeyCredParams algorithms",
      code: "ERROR_AUTHENTICATOR_NO_SUPPORTED_PUBKEYCREDPARAMS_ALG",
      cause: error3
    });
  } else if (error3.name === "SecurityError") {
    const effectiveDomain = window.location.hostname;
    if (!isValidDomain(effectiveDomain)) {
      return new WebAuthnError({
        message: `${window.location.hostname} is an invalid domain`,
        code: "ERROR_INVALID_DOMAIN",
        cause: error3
      });
    } else if (publicKey.rp.id !== effectiveDomain) {
      return new WebAuthnError({
        message: `The RP ID "${publicKey.rp.id}" is invalid for this domain`,
        code: "ERROR_INVALID_RP_ID",
        cause: error3
      });
    }
  } else if (error3.name === "TypeError") {
    if (publicKey.user.id.byteLength < 1 || publicKey.user.id.byteLength > 64) {
      return new WebAuthnError({
        message: "User ID was not between 1 and 64 characters",
        code: "ERROR_INVALID_USER_ID_LENGTH",
        cause: error3
      });
    }
  } else if (error3.name === "UnknownError") {
    return new WebAuthnError({
      message: "The authenticator was unable to process the specified options, or could not create a new credential",
      code: "ERROR_AUTHENTICATOR_GENERAL_ERROR",
      cause: error3
    });
  }
  return new WebAuthnError({
    message: "a Non-Webauthn related error has occurred",
    code: "ERROR_PASSTHROUGH_SEE_CAUSE_PROPERTY",
    cause: error3
  });
}
__name(identifyRegistrationError, "identifyRegistrationError");
function identifyAuthenticationError({ error: error3, options }) {
  const { publicKey } = options;
  if (!publicKey) {
    throw Error("options was missing required publicKey property");
  }
  if (error3.name === "AbortError") {
    if (options.signal instanceof AbortSignal) {
      return new WebAuthnError({
        message: "Authentication ceremony was sent an abort signal",
        code: "ERROR_CEREMONY_ABORTED",
        cause: error3
      });
    }
  } else if (error3.name === "NotAllowedError") {
    return new WebAuthnError({
      message: error3.message,
      code: "ERROR_PASSTHROUGH_SEE_CAUSE_PROPERTY",
      cause: error3
    });
  } else if (error3.name === "SecurityError") {
    const effectiveDomain = window.location.hostname;
    if (!isValidDomain(effectiveDomain)) {
      return new WebAuthnError({
        message: `${window.location.hostname} is an invalid domain`,
        code: "ERROR_INVALID_DOMAIN",
        cause: error3
      });
    } else if (publicKey.rpId !== effectiveDomain) {
      return new WebAuthnError({
        message: `The RP ID "${publicKey.rpId}" is invalid for this domain`,
        code: "ERROR_INVALID_RP_ID",
        cause: error3
      });
    }
  } else if (error3.name === "UnknownError") {
    return new WebAuthnError({
      message: "The authenticator was unable to process the specified options, or could not create a new assertion signature",
      code: "ERROR_AUTHENTICATOR_GENERAL_ERROR",
      cause: error3
    });
  }
  return new WebAuthnError({
    message: "a Non-Webauthn related error has occurred",
    code: "ERROR_PASSTHROUGH_SEE_CAUSE_PROPERTY",
    cause: error3
  });
}
__name(identifyAuthenticationError, "identifyAuthenticationError");
var WebAuthnError;
var WebAuthnUnknownError;
var init_webauthn_errors = __esm({
  "../node_modules/@supabase/auth-js/dist/module/lib/webauthn.errors.js"() {
    init_functionsRoutes_0_04524570753253654();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_webauthn();
    WebAuthnError = class extends Error {
      static {
        __name(this, "WebAuthnError");
      }
      static {
        __name2(this, "WebAuthnError");
      }
      constructor({ message, code, cause, name }) {
        var _a2;
        super(message, { cause });
        this.__isWebAuthnError = true;
        this.name = (_a2 = name !== null && name !== void 0 ? name : cause instanceof Error ? cause.name : void 0) !== null && _a2 !== void 0 ? _a2 : "Unknown Error";
        this.code = code;
      }
    };
    WebAuthnUnknownError = class extends WebAuthnError {
      static {
        __name(this, "WebAuthnUnknownError");
      }
      static {
        __name2(this, "WebAuthnUnknownError");
      }
      constructor(message, originalError) {
        super({
          code: "ERROR_PASSTHROUGH_SEE_CAUSE_PROPERTY",
          cause: originalError,
          message
        });
        this.name = "WebAuthnUnknownError";
        this.originalError = originalError;
      }
    };
    __name2(identifyRegistrationError, "identifyRegistrationError");
    __name2(identifyAuthenticationError, "identifyAuthenticationError");
  }
});
function deserializeCredentialCreationOptions(options) {
  if (!options) {
    throw new Error("Credential creation options are required");
  }
  if (typeof PublicKeyCredential !== "undefined" && "parseCreationOptionsFromJSON" in PublicKeyCredential && typeof PublicKeyCredential.parseCreationOptionsFromJSON === "function") {
    return PublicKeyCredential.parseCreationOptionsFromJSON(
      /** we assert the options here as typescript still doesn't know about future webauthn types */
      options
    );
  }
  const { challenge: challengeStr, user: userOpts, excludeCredentials } = options, restOptions = __rest(
    options,
    ["challenge", "user", "excludeCredentials"]
  );
  const challenge = base64UrlToUint8Array(challengeStr).buffer;
  const user = Object.assign(Object.assign({}, userOpts), { id: base64UrlToUint8Array(userOpts.id).buffer });
  const result = Object.assign(Object.assign({}, restOptions), {
    challenge,
    user
  });
  if (excludeCredentials && excludeCredentials.length > 0) {
    result.excludeCredentials = new Array(excludeCredentials.length);
    for (let i = 0; i < excludeCredentials.length; i++) {
      const cred = excludeCredentials[i];
      result.excludeCredentials[i] = Object.assign(Object.assign({}, cred), {
        id: base64UrlToUint8Array(cred.id).buffer,
        type: cred.type || "public-key",
        // Cast transports to handle future transport types like "cable"
        transports: cred.transports
      });
    }
  }
  return result;
}
__name(deserializeCredentialCreationOptions, "deserializeCredentialCreationOptions");
function deserializeCredentialRequestOptions(options) {
  if (!options) {
    throw new Error("Credential request options are required");
  }
  if (typeof PublicKeyCredential !== "undefined" && "parseRequestOptionsFromJSON" in PublicKeyCredential && typeof PublicKeyCredential.parseRequestOptionsFromJSON === "function") {
    return PublicKeyCredential.parseRequestOptionsFromJSON(options);
  }
  const { challenge: challengeStr, allowCredentials } = options, restOptions = __rest(
    options,
    ["challenge", "allowCredentials"]
  );
  const challenge = base64UrlToUint8Array(challengeStr).buffer;
  const result = Object.assign(Object.assign({}, restOptions), { challenge });
  if (allowCredentials && allowCredentials.length > 0) {
    result.allowCredentials = new Array(allowCredentials.length);
    for (let i = 0; i < allowCredentials.length; i++) {
      const cred = allowCredentials[i];
      result.allowCredentials[i] = Object.assign(Object.assign({}, cred), {
        id: base64UrlToUint8Array(cred.id).buffer,
        type: cred.type || "public-key",
        // Cast transports to handle future transport types like "cable"
        transports: cred.transports
      });
    }
  }
  return result;
}
__name(deserializeCredentialRequestOptions, "deserializeCredentialRequestOptions");
function serializeCredentialCreationResponse(credential) {
  var _a2;
  if ("toJSON" in credential && typeof credential.toJSON === "function") {
    return credential.toJSON();
  }
  const credentialWithAttachment = credential;
  return {
    id: credential.id,
    rawId: credential.id,
    response: {
      attestationObject: bytesToBase64URL(new Uint8Array(credential.response.attestationObject)),
      clientDataJSON: bytesToBase64URL(new Uint8Array(credential.response.clientDataJSON))
    },
    type: "public-key",
    clientExtensionResults: credential.getClientExtensionResults(),
    // Convert null to undefined and cast to AuthenticatorAttachment type
    authenticatorAttachment: (_a2 = credentialWithAttachment.authenticatorAttachment) !== null && _a2 !== void 0 ? _a2 : void 0
  };
}
__name(serializeCredentialCreationResponse, "serializeCredentialCreationResponse");
function serializeCredentialRequestResponse(credential) {
  var _a2;
  if ("toJSON" in credential && typeof credential.toJSON === "function") {
    return credential.toJSON();
  }
  const credentialWithAttachment = credential;
  const clientExtensionResults = credential.getClientExtensionResults();
  const assertionResponse = credential.response;
  return {
    id: credential.id,
    rawId: credential.id,
    // W3C spec expects rawId to match id for JSON format
    response: {
      authenticatorData: bytesToBase64URL(new Uint8Array(assertionResponse.authenticatorData)),
      clientDataJSON: bytesToBase64URL(new Uint8Array(assertionResponse.clientDataJSON)),
      signature: bytesToBase64URL(new Uint8Array(assertionResponse.signature)),
      userHandle: assertionResponse.userHandle ? bytesToBase64URL(new Uint8Array(assertionResponse.userHandle)) : void 0
    },
    type: "public-key",
    clientExtensionResults,
    // Convert null to undefined and cast to AuthenticatorAttachment type
    authenticatorAttachment: (_a2 = credentialWithAttachment.authenticatorAttachment) !== null && _a2 !== void 0 ? _a2 : void 0
  };
}
__name(serializeCredentialRequestResponse, "serializeCredentialRequestResponse");
function isValidDomain(hostname2) {
  return (
    // Consider localhost valid as well since it's okay wrt Secure Contexts
    hostname2 === "localhost" || /^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/i.test(hostname2)
  );
}
__name(isValidDomain, "isValidDomain");
function browserSupportsWebAuthn() {
  var _a2, _b;
  return !!(isBrowser() && "PublicKeyCredential" in window && window.PublicKeyCredential && "credentials" in navigator && typeof ((_a2 = navigator === null || navigator === void 0 ? void 0 : navigator.credentials) === null || _a2 === void 0 ? void 0 : _a2.create) === "function" && typeof ((_b = navigator === null || navigator === void 0 ? void 0 : navigator.credentials) === null || _b === void 0 ? void 0 : _b.get) === "function");
}
__name(browserSupportsWebAuthn, "browserSupportsWebAuthn");
async function createCredential(options) {
  try {
    const response = await navigator.credentials.create(
      /** we assert the type here until typescript types are updated */
      options
    );
    if (!response) {
      return {
        data: null,
        error: new WebAuthnUnknownError("Empty credential response", response)
      };
    }
    if (!(response instanceof PublicKeyCredential)) {
      return {
        data: null,
        error: new WebAuthnUnknownError("Browser returned unexpected credential type", response)
      };
    }
    return { data: response, error: null };
  } catch (err) {
    return {
      data: null,
      error: identifyRegistrationError({
        error: err,
        options
      })
    };
  }
}
__name(createCredential, "createCredential");
async function getCredential(options) {
  try {
    const response = await navigator.credentials.get(
      /** we assert the type here until typescript types are updated */
      options
    );
    if (!response) {
      return {
        data: null,
        error: new WebAuthnUnknownError("Empty credential response", response)
      };
    }
    if (!(response instanceof PublicKeyCredential)) {
      return {
        data: null,
        error: new WebAuthnUnknownError("Browser returned unexpected credential type", response)
      };
    }
    return { data: response, error: null };
  } catch (err) {
    return {
      data: null,
      error: identifyAuthenticationError({
        error: err,
        options
      })
    };
  }
}
__name(getCredential, "getCredential");
function deepMerge(...sources) {
  const isObject = /* @__PURE__ */ __name2((val) => val !== null && typeof val === "object" && !Array.isArray(val), "isObject");
  const isArrayBufferLike = /* @__PURE__ */ __name2((val) => val instanceof ArrayBuffer || ArrayBuffer.isView(val), "isArrayBufferLike");
  const result = {};
  for (const source of sources) {
    if (!source)
      continue;
    for (const key in source) {
      const value = source[key];
      if (value === void 0)
        continue;
      if (Array.isArray(value)) {
        result[key] = value;
      } else if (isArrayBufferLike(value)) {
        result[key] = value;
      } else if (isObject(value)) {
        const existing = result[key];
        if (isObject(existing)) {
          result[key] = deepMerge(existing, value);
        } else {
          result[key] = deepMerge(value);
        }
      } else {
        result[key] = value;
      }
    }
  }
  return result;
}
__name(deepMerge, "deepMerge");
function mergeCredentialCreationOptions(baseOptions, overrides) {
  return deepMerge(DEFAULT_CREATION_OPTIONS, baseOptions, overrides || {});
}
__name(mergeCredentialCreationOptions, "mergeCredentialCreationOptions");
function mergeCredentialRequestOptions(baseOptions, overrides) {
  return deepMerge(DEFAULT_REQUEST_OPTIONS, baseOptions, overrides || {});
}
__name(mergeCredentialRequestOptions, "mergeCredentialRequestOptions");
var WebAuthnAbortService;
var webAuthnAbortService;
var DEFAULT_CREATION_OPTIONS;
var DEFAULT_REQUEST_OPTIONS;
var WebAuthnApi;
var init_webauthn = __esm({
  "../node_modules/@supabase/auth-js/dist/module/lib/webauthn.js"() {
    init_functionsRoutes_0_04524570753253654();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_tslib_es6();
    init_base64url();
    init_errors3();
    init_helpers4();
    init_webauthn_errors();
    WebAuthnAbortService = class {
      static {
        __name(this, "WebAuthnAbortService");
      }
      static {
        __name2(this, "WebAuthnAbortService");
      }
      /**
       * Create an abort signal for a new WebAuthn operation.
       * Automatically cancels any existing operation.
       *
       * @returns {AbortSignal} Signal to pass to navigator.credentials.create() or .get()
       * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal MDN - AbortSignal}
       */
      createNewAbortSignal() {
        if (this.controller) {
          const abortError = new Error("Cancelling existing WebAuthn API call for new one");
          abortError.name = "AbortError";
          this.controller.abort(abortError);
        }
        const newController = new AbortController();
        this.controller = newController;
        return newController.signal;
      }
      /**
       * Manually cancel the current WebAuthn operation.
       * Useful for cleaning up when user cancels or navigates away.
       *
       * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/AbortController/abort MDN - AbortController.abort}
       */
      cancelCeremony() {
        if (this.controller) {
          const abortError = new Error("Manually cancelling existing WebAuthn API call");
          abortError.name = "AbortError";
          this.controller.abort(abortError);
          this.controller = void 0;
        }
      }
    };
    webAuthnAbortService = new WebAuthnAbortService();
    __name2(deserializeCredentialCreationOptions, "deserializeCredentialCreationOptions");
    __name2(deserializeCredentialRequestOptions, "deserializeCredentialRequestOptions");
    __name2(serializeCredentialCreationResponse, "serializeCredentialCreationResponse");
    __name2(serializeCredentialRequestResponse, "serializeCredentialRequestResponse");
    __name2(isValidDomain, "isValidDomain");
    __name2(browserSupportsWebAuthn, "browserSupportsWebAuthn");
    __name2(createCredential, "createCredential");
    __name2(getCredential, "getCredential");
    DEFAULT_CREATION_OPTIONS = {
      hints: ["security-key"],
      authenticatorSelection: {
        authenticatorAttachment: "cross-platform",
        requireResidentKey: false,
        /** set to preferred because older yubikeys don't have PIN/Biometric */
        userVerification: "preferred",
        residentKey: "discouraged"
      },
      attestation: "direct"
    };
    DEFAULT_REQUEST_OPTIONS = {
      /** set to preferred because older yubikeys don't have PIN/Biometric */
      userVerification: "preferred",
      hints: ["security-key"],
      attestation: "direct"
    };
    __name2(deepMerge, "deepMerge");
    __name2(mergeCredentialCreationOptions, "mergeCredentialCreationOptions");
    __name2(mergeCredentialRequestOptions, "mergeCredentialRequestOptions");
    WebAuthnApi = class {
      static {
        __name(this, "WebAuthnApi");
      }
      static {
        __name2(this, "WebAuthnApi");
      }
      constructor(client) {
        this.client = client;
        this.enroll = this._enroll.bind(this);
        this.challenge = this._challenge.bind(this);
        this.verify = this._verify.bind(this);
        this.authenticate = this._authenticate.bind(this);
        this.register = this._register.bind(this);
      }
      /**
       * Enroll a new WebAuthn factor.
       * Creates an unverified WebAuthn factor that must be verified with a credential.
       *
       * @experimental This method is experimental and may change in future releases
       * @param {Omit<MFAEnrollWebauthnParams, 'factorType'>} params - Enrollment parameters (friendlyName required)
       * @returns {Promise<AuthMFAEnrollWebauthnResponse>} Enrolled factor details or error
       * @see {@link https://w3c.github.io/webauthn/#sctn-registering-a-new-credential W3C WebAuthn Spec - Registering a New Credential}
       */
      async _enroll(params) {
        return this.client.mfa.enroll(Object.assign(Object.assign({}, params), { factorType: "webauthn" }));
      }
      /**
       * Challenge for WebAuthn credential creation or authentication.
       * Combines server challenge with browser credential operations.
       * Handles both registration (create) and authentication (request) flows.
       *
       * @experimental This method is experimental and may change in future releases
       * @param {MFAChallengeWebauthnParams & { friendlyName?: string; signal?: AbortSignal }} params - Challenge parameters including factorId
       * @param {Object} overrides - Allows you to override the parameters passed to navigator.credentials
       * @param {PublicKeyCredentialCreationOptionsFuture} overrides.create - Override options for credential creation
       * @param {PublicKeyCredentialRequestOptionsFuture} overrides.request - Override options for credential request
       * @returns {Promise<RequestResult>} Challenge response with credential or error
       * @see {@link https://w3c.github.io/webauthn/#sctn-credential-creation W3C WebAuthn Spec - Credential Creation}
       * @see {@link https://w3c.github.io/webauthn/#sctn-verifying-assertion W3C WebAuthn Spec - Verifying Assertion}
       */
      async _challenge({ factorId, webauthn, friendlyName, signal }, overrides) {
        try {
          const { data: challengeResponse, error: challengeError } = await this.client.mfa.challenge({
            factorId,
            webauthn
          });
          if (!challengeResponse) {
            return { data: null, error: challengeError };
          }
          const abortSignal = signal !== null && signal !== void 0 ? signal : webAuthnAbortService.createNewAbortSignal();
          if (challengeResponse.webauthn.type === "create") {
            const { user } = challengeResponse.webauthn.credential_options.publicKey;
            if (!user.name) {
              user.name = `${user.id}:${friendlyName}`;
            }
            if (!user.displayName) {
              user.displayName = user.name;
            }
          }
          switch (challengeResponse.webauthn.type) {
            case "create": {
              const options = mergeCredentialCreationOptions(challengeResponse.webauthn.credential_options.publicKey, overrides === null || overrides === void 0 ? void 0 : overrides.create);
              const { data, error: error3 } = await createCredential({
                publicKey: options,
                signal: abortSignal
              });
              if (data) {
                return {
                  data: {
                    factorId,
                    challengeId: challengeResponse.id,
                    webauthn: {
                      type: challengeResponse.webauthn.type,
                      credential_response: data
                    }
                  },
                  error: null
                };
              }
              return { data: null, error: error3 };
            }
            case "request": {
              const options = mergeCredentialRequestOptions(challengeResponse.webauthn.credential_options.publicKey, overrides === null || overrides === void 0 ? void 0 : overrides.request);
              const { data, error: error3 } = await getCredential(Object.assign(Object.assign({}, challengeResponse.webauthn.credential_options), { publicKey: options, signal: abortSignal }));
              if (data) {
                return {
                  data: {
                    factorId,
                    challengeId: challengeResponse.id,
                    webauthn: {
                      type: challengeResponse.webauthn.type,
                      credential_response: data
                    }
                  },
                  error: null
                };
              }
              return { data: null, error: error3 };
            }
          }
        } catch (error3) {
          if (isAuthError(error3)) {
            return { data: null, error: error3 };
          }
          return {
            data: null,
            error: new AuthUnknownError("Unexpected error in challenge", error3)
          };
        }
      }
      /**
       * Verify a WebAuthn credential with the server.
       * Completes the WebAuthn ceremony by sending the credential to the server for verification.
       *
       * @experimental This method is experimental and may change in future releases
       * @param {Object} params - Verification parameters
       * @param {string} params.challengeId - ID of the challenge being verified
       * @param {string} params.factorId - ID of the WebAuthn factor
       * @param {MFAVerifyWebauthnParams<T>['webauthn']} params.webauthn - WebAuthn credential response
       * @returns {Promise<AuthMFAVerifyResponse>} Verification result with session or error
       * @see {@link https://w3c.github.io/webauthn/#sctn-verifying-assertion W3C WebAuthn Spec - Verifying an Authentication Assertion}
       * */
      async _verify({ challengeId, factorId, webauthn }) {
        return this.client.mfa.verify({
          factorId,
          challengeId,
          webauthn
        });
      }
      /**
       * Complete WebAuthn authentication flow.
       * Performs challenge and verification in a single operation for existing credentials.
       *
       * @experimental This method is experimental and may change in future releases
       * @param {Object} params - Authentication parameters
       * @param {string} params.factorId - ID of the WebAuthn factor to authenticate with
       * @param {Object} params.webauthn - WebAuthn configuration
       * @param {string} params.webauthn.rpId - Relying Party ID (defaults to current hostname)
       * @param {string[]} params.webauthn.rpOrigins - Allowed origins (defaults to current origin)
       * @param {AbortSignal} params.webauthn.signal - Optional abort signal
       * @param {PublicKeyCredentialRequestOptionsFuture} overrides - Override options for navigator.credentials.get
       * @returns {Promise<RequestResult<AuthMFAVerifyResponseData, WebAuthnError | AuthError>>} Authentication result
       * @see {@link https://w3c.github.io/webauthn/#sctn-authentication W3C WebAuthn Spec - Authentication Ceremony}
       * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/PublicKeyCredentialRequestOptions MDN - PublicKeyCredentialRequestOptions}
       */
      async _authenticate({ factorId, webauthn: { rpId = typeof window !== "undefined" ? window.location.hostname : void 0, rpOrigins = typeof window !== "undefined" ? [window.location.origin] : void 0, signal } = {} }, overrides) {
        if (!rpId) {
          return {
            data: null,
            error: new AuthError("rpId is required for WebAuthn authentication")
          };
        }
        try {
          if (!browserSupportsWebAuthn()) {
            return {
              data: null,
              error: new AuthUnknownError("Browser does not support WebAuthn", null)
            };
          }
          const { data: challengeResponse, error: challengeError } = await this.challenge({
            factorId,
            webauthn: { rpId, rpOrigins },
            signal
          }, { request: overrides });
          if (!challengeResponse) {
            return { data: null, error: challengeError };
          }
          const { webauthn } = challengeResponse;
          return this._verify({
            factorId,
            challengeId: challengeResponse.challengeId,
            webauthn: {
              type: webauthn.type,
              rpId,
              rpOrigins,
              credential_response: webauthn.credential_response
            }
          });
        } catch (error3) {
          if (isAuthError(error3)) {
            return { data: null, error: error3 };
          }
          return {
            data: null,
            error: new AuthUnknownError("Unexpected error in authenticate", error3)
          };
        }
      }
      /**
       * Complete WebAuthn registration flow.
       * Performs enrollment, challenge, and verification in a single operation for new credentials.
       *
       * @experimental This method is experimental and may change in future releases
       * @param {Object} params - Registration parameters
       * @param {string} params.friendlyName - User-friendly name for the credential
       * @param {string} params.rpId - Relying Party ID (defaults to current hostname)
       * @param {string[]} params.rpOrigins - Allowed origins (defaults to current origin)
       * @param {AbortSignal} params.signal - Optional abort signal
       * @param {PublicKeyCredentialCreationOptionsFuture} overrides - Override options for navigator.credentials.create
       * @returns {Promise<RequestResult<AuthMFAVerifyResponseData, WebAuthnError | AuthError>>} Registration result
       * @see {@link https://w3c.github.io/webauthn/#sctn-registering-a-new-credential W3C WebAuthn Spec - Registration Ceremony}
       * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/PublicKeyCredentialCreationOptions MDN - PublicKeyCredentialCreationOptions}
       */
      async _register({ friendlyName, webauthn: { rpId = typeof window !== "undefined" ? window.location.hostname : void 0, rpOrigins = typeof window !== "undefined" ? [window.location.origin] : void 0, signal } = {} }, overrides) {
        if (!rpId) {
          return {
            data: null,
            error: new AuthError("rpId is required for WebAuthn registration")
          };
        }
        try {
          if (!browserSupportsWebAuthn()) {
            return {
              data: null,
              error: new AuthUnknownError("Browser does not support WebAuthn", null)
            };
          }
          const { data: factor, error: enrollError } = await this._enroll({
            friendlyName
          });
          if (!factor) {
            await this.client.mfa.listFactors().then((factors) => {
              var _a2;
              return (_a2 = factors.data) === null || _a2 === void 0 ? void 0 : _a2.all.find((v) => v.factor_type === "webauthn" && v.friendly_name === friendlyName && v.status !== "unverified");
            }).then((factor2) => factor2 ? this.client.mfa.unenroll({ factorId: factor2 === null || factor2 === void 0 ? void 0 : factor2.id }) : void 0);
            return { data: null, error: enrollError };
          }
          const { data: challengeResponse, error: challengeError } = await this._challenge({
            factorId: factor.id,
            friendlyName: factor.friendly_name,
            webauthn: { rpId, rpOrigins },
            signal
          }, {
            create: overrides
          });
          if (!challengeResponse) {
            return { data: null, error: challengeError };
          }
          return this._verify({
            factorId: factor.id,
            challengeId: challengeResponse.challengeId,
            webauthn: {
              rpId,
              rpOrigins,
              type: challengeResponse.webauthn.type,
              credential_response: challengeResponse.webauthn.credential_response
            }
          });
        } catch (error3) {
          if (isAuthError(error3)) {
            return { data: null, error: error3 };
          }
          return {
            data: null,
            error: new AuthUnknownError("Unexpected error in register", error3)
          };
        }
      }
    };
  }
});
async function lockNoOp(name, acquireTimeout, fn) {
  return await fn();
}
__name(lockNoOp, "lockNoOp");
var DEFAULT_OPTIONS;
var GLOBAL_JWKS;
var GoTrueClient;
var GoTrueClient_default;
var init_GoTrueClient = __esm({
  "../node_modules/@supabase/auth-js/dist/module/GoTrueClient.js"() {
    init_functionsRoutes_0_04524570753253654();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_GoTrueAdminApi();
    init_constants7();
    init_errors3();
    init_fetch4();
    init_helpers4();
    init_local_storage();
    init_locks();
    init_polyfills();
    init_version4();
    init_base64url();
    init_ethereum();
    init_webauthn();
    polyfillGlobalThis();
    DEFAULT_OPTIONS = {
      url: GOTRUE_URL,
      storageKey: STORAGE_KEY,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      headers: DEFAULT_HEADERS4,
      flowType: "implicit",
      debug: false,
      hasCustomAuthorizationHeader: false,
      throwOnError: false
    };
    __name2(lockNoOp, "lockNoOp");
    GLOBAL_JWKS = {};
    GoTrueClient = class _GoTrueClient {
      static {
        __name(this, "_GoTrueClient");
      }
      static {
        __name2(this, "GoTrueClient");
      }
      /**
       * The JWKS used for verifying asymmetric JWTs
       */
      get jwks() {
        var _a2, _b;
        return (_b = (_a2 = GLOBAL_JWKS[this.storageKey]) === null || _a2 === void 0 ? void 0 : _a2.jwks) !== null && _b !== void 0 ? _b : { keys: [] };
      }
      set jwks(value) {
        GLOBAL_JWKS[this.storageKey] = Object.assign(Object.assign({}, GLOBAL_JWKS[this.storageKey]), { jwks: value });
      }
      get jwks_cached_at() {
        var _a2, _b;
        return (_b = (_a2 = GLOBAL_JWKS[this.storageKey]) === null || _a2 === void 0 ? void 0 : _a2.cachedAt) !== null && _b !== void 0 ? _b : Number.MIN_SAFE_INTEGER;
      }
      set jwks_cached_at(value) {
        GLOBAL_JWKS[this.storageKey] = Object.assign(Object.assign({}, GLOBAL_JWKS[this.storageKey]), { cachedAt: value });
      }
      /**
       * Create a new client for use in the browser.
       *
       * @example
       * ```ts
       * import { GoTrueClient } from '@supabase/auth-js'
       *
       * const auth = new GoTrueClient({
       *   url: 'https://xyzcompany.supabase.co/auth/v1',
       *   headers: { apikey: 'public-anon-key' },
       *   storageKey: 'supabase-auth',
       * })
       * ```
       */
      constructor(options) {
        var _a2, _b, _c;
        this.userStorage = null;
        this.memoryStorage = null;
        this.stateChangeEmitters = /* @__PURE__ */ new Map();
        this.autoRefreshTicker = null;
        this.visibilityChangedCallback = null;
        this.refreshingDeferred = null;
        this.initializePromise = null;
        this.detectSessionInUrl = true;
        this.hasCustomAuthorizationHeader = false;
        this.suppressGetSessionWarning = false;
        this.lockAcquired = false;
        this.pendingInLock = [];
        this.broadcastChannel = null;
        this.logger = console.log;
        const settings = Object.assign(Object.assign({}, DEFAULT_OPTIONS), options);
        this.storageKey = settings.storageKey;
        this.instanceID = (_a2 = _GoTrueClient.nextInstanceID[this.storageKey]) !== null && _a2 !== void 0 ? _a2 : 0;
        _GoTrueClient.nextInstanceID[this.storageKey] = this.instanceID + 1;
        this.logDebugMessages = !!settings.debug;
        if (typeof settings.debug === "function") {
          this.logger = settings.debug;
        }
        if (this.instanceID > 0 && isBrowser()) {
          const message = `${this._logPrefix()} Multiple GoTrueClient instances detected in the same browser context. It is not an error, but this should be avoided as it may produce undefined behavior when used concurrently under the same storage key.`;
          console.warn(message);
          if (this.logDebugMessages) {
            console.trace(message);
          }
        }
        this.persistSession = settings.persistSession;
        this.autoRefreshToken = settings.autoRefreshToken;
        this.admin = new GoTrueAdminApi({
          url: settings.url,
          headers: settings.headers,
          fetch: settings.fetch
        });
        this.url = settings.url;
        this.headers = settings.headers;
        this.fetch = resolveFetch5(settings.fetch);
        this.lock = settings.lock || lockNoOp;
        this.detectSessionInUrl = settings.detectSessionInUrl;
        this.flowType = settings.flowType;
        this.hasCustomAuthorizationHeader = settings.hasCustomAuthorizationHeader;
        this.throwOnError = settings.throwOnError;
        if (settings.lock) {
          this.lock = settings.lock;
        } else if (isBrowser() && ((_b = globalThis === null || globalThis === void 0 ? void 0 : globalThis.navigator) === null || _b === void 0 ? void 0 : _b.locks)) {
          this.lock = navigatorLock;
        } else {
          this.lock = lockNoOp;
        }
        if (!this.jwks) {
          this.jwks = { keys: [] };
          this.jwks_cached_at = Number.MIN_SAFE_INTEGER;
        }
        this.mfa = {
          verify: this._verify.bind(this),
          enroll: this._enroll.bind(this),
          unenroll: this._unenroll.bind(this),
          challenge: this._challenge.bind(this),
          listFactors: this._listFactors.bind(this),
          challengeAndVerify: this._challengeAndVerify.bind(this),
          getAuthenticatorAssuranceLevel: this._getAuthenticatorAssuranceLevel.bind(this),
          webauthn: new WebAuthnApi(this)
        };
        this.oauth = {
          getAuthorizationDetails: this._getAuthorizationDetails.bind(this),
          approveAuthorization: this._approveAuthorization.bind(this),
          denyAuthorization: this._denyAuthorization.bind(this),
          listGrants: this._listOAuthGrants.bind(this),
          revokeGrant: this._revokeOAuthGrant.bind(this)
        };
        if (this.persistSession) {
          if (settings.storage) {
            this.storage = settings.storage;
          } else {
            if (supportsLocalStorage()) {
              this.storage = globalThis.localStorage;
            } else {
              this.memoryStorage = {};
              this.storage = memoryLocalStorageAdapter(this.memoryStorage);
            }
          }
          if (settings.userStorage) {
            this.userStorage = settings.userStorage;
          }
        } else {
          this.memoryStorage = {};
          this.storage = memoryLocalStorageAdapter(this.memoryStorage);
        }
        if (isBrowser() && globalThis.BroadcastChannel && this.persistSession && this.storageKey) {
          try {
            this.broadcastChannel = new globalThis.BroadcastChannel(this.storageKey);
          } catch (e) {
            console.error("Failed to create a new BroadcastChannel, multi-tab state changes will not be available", e);
          }
          (_c = this.broadcastChannel) === null || _c === void 0 ? void 0 : _c.addEventListener("message", async (event) => {
            this._debug("received broadcast notification from other tab or client", event);
            await this._notifyAllSubscribers(event.data.event, event.data.session, false);
          });
        }
        this.initialize();
      }
      /**
       * Returns whether error throwing mode is enabled for this client.
       */
      isThrowOnErrorEnabled() {
        return this.throwOnError;
      }
      /**
       * Centralizes return handling with optional error throwing. When `throwOnError` is enabled
       * and the provided result contains a non-nullish error, the error is thrown instead of
       * being returned. This ensures consistent behavior across all public API methods.
       */
      _returnResult(result) {
        if (this.throwOnError && result && result.error) {
          throw result.error;
        }
        return result;
      }
      _logPrefix() {
        return `GoTrueClient@${this.storageKey}:${this.instanceID} (${version6}) ${(/* @__PURE__ */ new Date()).toISOString()}`;
      }
      _debug(...args) {
        if (this.logDebugMessages) {
          this.logger(this._logPrefix(), ...args);
        }
        return this;
      }
      /**
       * Initializes the client session either from the url or from storage.
       * This method is automatically called when instantiating the client, but should also be called
       * manually when checking for an error from an auth redirect (oauth, magiclink, password recovery, etc).
       */
      async initialize() {
        if (this.initializePromise) {
          return await this.initializePromise;
        }
        this.initializePromise = (async () => {
          return await this._acquireLock(-1, async () => {
            return await this._initialize();
          });
        })();
        return await this.initializePromise;
      }
      /**
       * IMPORTANT:
       * 1. Never throw in this method, as it is called from the constructor
       * 2. Never return a session from this method as it would be cached over
       *    the whole lifetime of the client
       */
      async _initialize() {
        var _a2;
        try {
          let params = {};
          let callbackUrlType = "none";
          if (isBrowser()) {
            params = parseParametersFromURL(window.location.href);
            if (this._isImplicitGrantCallback(params)) {
              callbackUrlType = "implicit";
            } else if (await this._isPKCECallback(params)) {
              callbackUrlType = "pkce";
            }
          }
          if (isBrowser() && this.detectSessionInUrl && callbackUrlType !== "none") {
            const { data, error: error3 } = await this._getSessionFromURL(params, callbackUrlType);
            if (error3) {
              this._debug("#_initialize()", "error detecting session from URL", error3);
              if (isAuthImplicitGrantRedirectError(error3)) {
                const errorCode = (_a2 = error3.details) === null || _a2 === void 0 ? void 0 : _a2.code;
                if (errorCode === "identity_already_exists" || errorCode === "identity_not_found" || errorCode === "single_identity_not_deletable") {
                  return { error: error3 };
                }
              }
              await this._removeSession();
              return { error: error3 };
            }
            const { session, redirectType } = data;
            this._debug("#_initialize()", "detected session in URL", session, "redirect type", redirectType);
            await this._saveSession(session);
            setTimeout(async () => {
              if (redirectType === "recovery") {
                await this._notifyAllSubscribers("PASSWORD_RECOVERY", session);
              } else {
                await this._notifyAllSubscribers("SIGNED_IN", session);
              }
            }, 0);
            return { error: null };
          }
          await this._recoverAndRefresh();
          return { error: null };
        } catch (error3) {
          if (isAuthError(error3)) {
            return this._returnResult({ error: error3 });
          }
          return this._returnResult({
            error: new AuthUnknownError("Unexpected error during initialization", error3)
          });
        } finally {
          await this._handleVisibilityChange();
          this._debug("#_initialize()", "end");
        }
      }
      /**
       * Creates a new anonymous user.
       *
       * @returns A session where the is_anonymous claim in the access token JWT set to true
       */
      async signInAnonymously(credentials) {
        var _a2, _b, _c;
        try {
          const res = await _request(this.fetch, "POST", `${this.url}/signup`, {
            headers: this.headers,
            body: {
              data: (_b = (_a2 = credentials === null || credentials === void 0 ? void 0 : credentials.options) === null || _a2 === void 0 ? void 0 : _a2.data) !== null && _b !== void 0 ? _b : {},
              gotrue_meta_security: { captcha_token: (_c = credentials === null || credentials === void 0 ? void 0 : credentials.options) === null || _c === void 0 ? void 0 : _c.captchaToken }
            },
            xform: _sessionResponse
          });
          const { data, error: error3 } = res;
          if (error3 || !data) {
            return this._returnResult({ data: { user: null, session: null }, error: error3 });
          }
          const session = data.session;
          const user = data.user;
          if (data.session) {
            await this._saveSession(data.session);
            await this._notifyAllSubscribers("SIGNED_IN", session);
          }
          return this._returnResult({ data: { user, session }, error: null });
        } catch (error3) {
          if (isAuthError(error3)) {
            return this._returnResult({ data: { user: null, session: null }, error: error3 });
          }
          throw error3;
        }
      }
      /**
       * Creates a new user.
       *
       * Be aware that if a user account exists in the system you may get back an
       * error message that attempts to hide this information from the user.
       * This method has support for PKCE via email signups. The PKCE flow cannot be used when autoconfirm is enabled.
       *
       * @returns A logged-in session if the server has "autoconfirm" ON
       * @returns A user if the server has "autoconfirm" OFF
       */
      async signUp(credentials) {
        var _a2, _b, _c;
        try {
          let res;
          if ("email" in credentials) {
            const { email, password, options } = credentials;
            let codeChallenge = null;
            let codeChallengeMethod = null;
            if (this.flowType === "pkce") {
              ;
              [codeChallenge, codeChallengeMethod] = await getCodeChallengeAndMethod(this.storage, this.storageKey);
            }
            res = await _request(this.fetch, "POST", `${this.url}/signup`, {
              headers: this.headers,
              redirectTo: options === null || options === void 0 ? void 0 : options.emailRedirectTo,
              body: {
                email,
                password,
                data: (_a2 = options === null || options === void 0 ? void 0 : options.data) !== null && _a2 !== void 0 ? _a2 : {},
                gotrue_meta_security: { captcha_token: options === null || options === void 0 ? void 0 : options.captchaToken },
                code_challenge: codeChallenge,
                code_challenge_method: codeChallengeMethod
              },
              xform: _sessionResponse
            });
          } else if ("phone" in credentials) {
            const { phone, password, options } = credentials;
            res = await _request(this.fetch, "POST", `${this.url}/signup`, {
              headers: this.headers,
              body: {
                phone,
                password,
                data: (_b = options === null || options === void 0 ? void 0 : options.data) !== null && _b !== void 0 ? _b : {},
                channel: (_c = options === null || options === void 0 ? void 0 : options.channel) !== null && _c !== void 0 ? _c : "sms",
                gotrue_meta_security: { captcha_token: options === null || options === void 0 ? void 0 : options.captchaToken }
              },
              xform: _sessionResponse
            });
          } else {
            throw new AuthInvalidCredentialsError("You must provide either an email or phone number and a password");
          }
          const { data, error: error3 } = res;
          if (error3 || !data) {
            return this._returnResult({ data: { user: null, session: null }, error: error3 });
          }
          const session = data.session;
          const user = data.user;
          if (data.session) {
            await this._saveSession(data.session);
            await this._notifyAllSubscribers("SIGNED_IN", session);
          }
          return this._returnResult({ data: { user, session }, error: null });
        } catch (error3) {
          if (isAuthError(error3)) {
            return this._returnResult({ data: { user: null, session: null }, error: error3 });
          }
          throw error3;
        }
      }
      /**
       * Log in an existing user with an email and password or phone and password.
       *
       * Be aware that you may get back an error message that will not distinguish
       * between the cases where the account does not exist or that the
       * email/phone and password combination is wrong or that the account can only
       * be accessed via social login.
       */
      async signInWithPassword(credentials) {
        try {
          let res;
          if ("email" in credentials) {
            const { email, password, options } = credentials;
            res = await _request(this.fetch, "POST", `${this.url}/token?grant_type=password`, {
              headers: this.headers,
              body: {
                email,
                password,
                gotrue_meta_security: { captcha_token: options === null || options === void 0 ? void 0 : options.captchaToken }
              },
              xform: _sessionResponsePassword
            });
          } else if ("phone" in credentials) {
            const { phone, password, options } = credentials;
            res = await _request(this.fetch, "POST", `${this.url}/token?grant_type=password`, {
              headers: this.headers,
              body: {
                phone,
                password,
                gotrue_meta_security: { captcha_token: options === null || options === void 0 ? void 0 : options.captchaToken }
              },
              xform: _sessionResponsePassword
            });
          } else {
            throw new AuthInvalidCredentialsError("You must provide either an email or phone number and a password");
          }
          const { data, error: error3 } = res;
          if (error3) {
            return this._returnResult({ data: { user: null, session: null }, error: error3 });
          } else if (!data || !data.session || !data.user) {
            const invalidTokenError = new AuthInvalidTokenResponseError();
            return this._returnResult({ data: { user: null, session: null }, error: invalidTokenError });
          }
          if (data.session) {
            await this._saveSession(data.session);
            await this._notifyAllSubscribers("SIGNED_IN", data.session);
          }
          return this._returnResult({
            data: Object.assign({ user: data.user, session: data.session }, data.weak_password ? { weakPassword: data.weak_password } : null),
            error: error3
          });
        } catch (error3) {
          if (isAuthError(error3)) {
            return this._returnResult({ data: { user: null, session: null }, error: error3 });
          }
          throw error3;
        }
      }
      /**
       * Log in an existing user via a third-party provider.
       * This method supports the PKCE flow.
       */
      async signInWithOAuth(credentials) {
        var _a2, _b, _c, _d;
        return await this._handleProviderSignIn(credentials.provider, {
          redirectTo: (_a2 = credentials.options) === null || _a2 === void 0 ? void 0 : _a2.redirectTo,
          scopes: (_b = credentials.options) === null || _b === void 0 ? void 0 : _b.scopes,
          queryParams: (_c = credentials.options) === null || _c === void 0 ? void 0 : _c.queryParams,
          skipBrowserRedirect: (_d = credentials.options) === null || _d === void 0 ? void 0 : _d.skipBrowserRedirect
        });
      }
      /**
       * Log in an existing user by exchanging an Auth Code issued during the PKCE flow.
       */
      async exchangeCodeForSession(authCode) {
        await this.initializePromise;
        return this._acquireLock(-1, async () => {
          return this._exchangeCodeForSession(authCode);
        });
      }
      /**
       * Signs in a user by verifying a message signed by the user's private key.
       * Supports Ethereum (via Sign-In-With-Ethereum) & Solana (Sign-In-With-Solana) standards,
       * both of which derive from the EIP-4361 standard
       * With slight variation on Solana's side.
       * @reference https://eips.ethereum.org/EIPS/eip-4361
       */
      async signInWithWeb3(credentials) {
        const { chain } = credentials;
        switch (chain) {
          case "ethereum":
            return await this.signInWithEthereum(credentials);
          case "solana":
            return await this.signInWithSolana(credentials);
          default:
            throw new Error(`@supabase/auth-js: Unsupported chain "${chain}"`);
        }
      }
      async signInWithEthereum(credentials) {
        var _a2, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
        let message;
        let signature;
        if ("message" in credentials) {
          message = credentials.message;
          signature = credentials.signature;
        } else {
          const { chain, wallet, statement, options } = credentials;
          let resolvedWallet;
          if (!isBrowser()) {
            if (typeof wallet !== "object" || !(options === null || options === void 0 ? void 0 : options.url)) {
              throw new Error("@supabase/auth-js: Both wallet and url must be specified in non-browser environments.");
            }
            resolvedWallet = wallet;
          } else if (typeof wallet === "object") {
            resolvedWallet = wallet;
          } else {
            const windowAny = window;
            if ("ethereum" in windowAny && typeof windowAny.ethereum === "object" && "request" in windowAny.ethereum && typeof windowAny.ethereum.request === "function") {
              resolvedWallet = windowAny.ethereum;
            } else {
              throw new Error(`@supabase/auth-js: No compatible Ethereum wallet interface on the window object (window.ethereum) detected. Make sure the user already has a wallet installed and connected for this app. Prefer passing the wallet interface object directly to signInWithWeb3({ chain: 'ethereum', wallet: resolvedUserWallet }) instead.`);
            }
          }
          const url = new URL((_a2 = options === null || options === void 0 ? void 0 : options.url) !== null && _a2 !== void 0 ? _a2 : window.location.href);
          const accounts = await resolvedWallet.request({
            method: "eth_requestAccounts"
          }).then((accs) => accs).catch(() => {
            throw new Error(`@supabase/auth-js: Wallet method eth_requestAccounts is missing or invalid`);
          });
          if (!accounts || accounts.length === 0) {
            throw new Error(`@supabase/auth-js: No accounts available. Please ensure the wallet is connected.`);
          }
          const address = getAddress(accounts[0]);
          let chainId = (_b = options === null || options === void 0 ? void 0 : options.signInWithEthereum) === null || _b === void 0 ? void 0 : _b.chainId;
          if (!chainId) {
            const chainIdHex = await resolvedWallet.request({
              method: "eth_chainId"
            });
            chainId = fromHex(chainIdHex);
          }
          const siweMessage = {
            domain: url.host,
            address,
            statement,
            uri: url.href,
            version: "1",
            chainId,
            nonce: (_c = options === null || options === void 0 ? void 0 : options.signInWithEthereum) === null || _c === void 0 ? void 0 : _c.nonce,
            issuedAt: (_e = (_d = options === null || options === void 0 ? void 0 : options.signInWithEthereum) === null || _d === void 0 ? void 0 : _d.issuedAt) !== null && _e !== void 0 ? _e : /* @__PURE__ */ new Date(),
            expirationTime: (_f = options === null || options === void 0 ? void 0 : options.signInWithEthereum) === null || _f === void 0 ? void 0 : _f.expirationTime,
            notBefore: (_g = options === null || options === void 0 ? void 0 : options.signInWithEthereum) === null || _g === void 0 ? void 0 : _g.notBefore,
            requestId: (_h = options === null || options === void 0 ? void 0 : options.signInWithEthereum) === null || _h === void 0 ? void 0 : _h.requestId,
            resources: (_j = options === null || options === void 0 ? void 0 : options.signInWithEthereum) === null || _j === void 0 ? void 0 : _j.resources
          };
          message = createSiweMessage(siweMessage);
          signature = await resolvedWallet.request({
            method: "personal_sign",
            params: [toHex(message), address]
          });
        }
        try {
          const { data, error: error3 } = await _request(this.fetch, "POST", `${this.url}/token?grant_type=web3`, {
            headers: this.headers,
            body: Object.assign({
              chain: "ethereum",
              message,
              signature
            }, ((_k = credentials.options) === null || _k === void 0 ? void 0 : _k.captchaToken) ? { gotrue_meta_security: { captcha_token: (_l = credentials.options) === null || _l === void 0 ? void 0 : _l.captchaToken } } : null),
            xform: _sessionResponse
          });
          if (error3) {
            throw error3;
          }
          if (!data || !data.session || !data.user) {
            const invalidTokenError = new AuthInvalidTokenResponseError();
            return this._returnResult({ data: { user: null, session: null }, error: invalidTokenError });
          }
          if (data.session) {
            await this._saveSession(data.session);
            await this._notifyAllSubscribers("SIGNED_IN", data.session);
          }
          return this._returnResult({ data: Object.assign({}, data), error: error3 });
        } catch (error3) {
          if (isAuthError(error3)) {
            return this._returnResult({ data: { user: null, session: null }, error: error3 });
          }
          throw error3;
        }
      }
      async signInWithSolana(credentials) {
        var _a2, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m;
        let message;
        let signature;
        if ("message" in credentials) {
          message = credentials.message;
          signature = credentials.signature;
        } else {
          const { chain, wallet, statement, options } = credentials;
          let resolvedWallet;
          if (!isBrowser()) {
            if (typeof wallet !== "object" || !(options === null || options === void 0 ? void 0 : options.url)) {
              throw new Error("@supabase/auth-js: Both wallet and url must be specified in non-browser environments.");
            }
            resolvedWallet = wallet;
          } else if (typeof wallet === "object") {
            resolvedWallet = wallet;
          } else {
            const windowAny = window;
            if ("solana" in windowAny && typeof windowAny.solana === "object" && ("signIn" in windowAny.solana && typeof windowAny.solana.signIn === "function" || "signMessage" in windowAny.solana && typeof windowAny.solana.signMessage === "function")) {
              resolvedWallet = windowAny.solana;
            } else {
              throw new Error(`@supabase/auth-js: No compatible Solana wallet interface on the window object (window.solana) detected. Make sure the user already has a wallet installed and connected for this app. Prefer passing the wallet interface object directly to signInWithWeb3({ chain: 'solana', wallet: resolvedUserWallet }) instead.`);
            }
          }
          const url = new URL((_a2 = options === null || options === void 0 ? void 0 : options.url) !== null && _a2 !== void 0 ? _a2 : window.location.href);
          if ("signIn" in resolvedWallet && resolvedWallet.signIn) {
            const output = await resolvedWallet.signIn(Object.assign(Object.assign(Object.assign({ issuedAt: (/* @__PURE__ */ new Date()).toISOString() }, options === null || options === void 0 ? void 0 : options.signInWithSolana), {
              // non-overridable properties
              version: "1",
              domain: url.host,
              uri: url.href
            }), statement ? { statement } : null));
            let outputToProcess;
            if (Array.isArray(output) && output[0] && typeof output[0] === "object") {
              outputToProcess = output[0];
            } else if (output && typeof output === "object" && "signedMessage" in output && "signature" in output) {
              outputToProcess = output;
            } else {
              throw new Error("@supabase/auth-js: Wallet method signIn() returned unrecognized value");
            }
            if ("signedMessage" in outputToProcess && "signature" in outputToProcess && (typeof outputToProcess.signedMessage === "string" || outputToProcess.signedMessage instanceof Uint8Array) && outputToProcess.signature instanceof Uint8Array) {
              message = typeof outputToProcess.signedMessage === "string" ? outputToProcess.signedMessage : new TextDecoder().decode(outputToProcess.signedMessage);
              signature = outputToProcess.signature;
            } else {
              throw new Error("@supabase/auth-js: Wallet method signIn() API returned object without signedMessage and signature fields");
            }
          } else {
            if (!("signMessage" in resolvedWallet) || typeof resolvedWallet.signMessage !== "function" || !("publicKey" in resolvedWallet) || typeof resolvedWallet !== "object" || !resolvedWallet.publicKey || !("toBase58" in resolvedWallet.publicKey) || typeof resolvedWallet.publicKey.toBase58 !== "function") {
              throw new Error("@supabase/auth-js: Wallet does not have a compatible signMessage() and publicKey.toBase58() API");
            }
            message = [
              `${url.host} wants you to sign in with your Solana account:`,
              resolvedWallet.publicKey.toBase58(),
              ...statement ? ["", statement, ""] : [""],
              "Version: 1",
              `URI: ${url.href}`,
              `Issued At: ${(_c = (_b = options === null || options === void 0 ? void 0 : options.signInWithSolana) === null || _b === void 0 ? void 0 : _b.issuedAt) !== null && _c !== void 0 ? _c : (/* @__PURE__ */ new Date()).toISOString()}`,
              ...((_d = options === null || options === void 0 ? void 0 : options.signInWithSolana) === null || _d === void 0 ? void 0 : _d.notBefore) ? [`Not Before: ${options.signInWithSolana.notBefore}`] : [],
              ...((_e = options === null || options === void 0 ? void 0 : options.signInWithSolana) === null || _e === void 0 ? void 0 : _e.expirationTime) ? [`Expiration Time: ${options.signInWithSolana.expirationTime}`] : [],
              ...((_f = options === null || options === void 0 ? void 0 : options.signInWithSolana) === null || _f === void 0 ? void 0 : _f.chainId) ? [`Chain ID: ${options.signInWithSolana.chainId}`] : [],
              ...((_g = options === null || options === void 0 ? void 0 : options.signInWithSolana) === null || _g === void 0 ? void 0 : _g.nonce) ? [`Nonce: ${options.signInWithSolana.nonce}`] : [],
              ...((_h = options === null || options === void 0 ? void 0 : options.signInWithSolana) === null || _h === void 0 ? void 0 : _h.requestId) ? [`Request ID: ${options.signInWithSolana.requestId}`] : [],
              ...((_k = (_j = options === null || options === void 0 ? void 0 : options.signInWithSolana) === null || _j === void 0 ? void 0 : _j.resources) === null || _k === void 0 ? void 0 : _k.length) ? [
                "Resources",
                ...options.signInWithSolana.resources.map((resource) => `- ${resource}`)
              ] : []
            ].join("\n");
            const maybeSignature = await resolvedWallet.signMessage(new TextEncoder().encode(message), "utf8");
            if (!maybeSignature || !(maybeSignature instanceof Uint8Array)) {
              throw new Error("@supabase/auth-js: Wallet signMessage() API returned an recognized value");
            }
            signature = maybeSignature;
          }
        }
        try {
          const { data, error: error3 } = await _request(this.fetch, "POST", `${this.url}/token?grant_type=web3`, {
            headers: this.headers,
            body: Object.assign({ chain: "solana", message, signature: bytesToBase64URL(signature) }, ((_l = credentials.options) === null || _l === void 0 ? void 0 : _l.captchaToken) ? { gotrue_meta_security: { captcha_token: (_m = credentials.options) === null || _m === void 0 ? void 0 : _m.captchaToken } } : null),
            xform: _sessionResponse
          });
          if (error3) {
            throw error3;
          }
          if (!data || !data.session || !data.user) {
            const invalidTokenError = new AuthInvalidTokenResponseError();
            return this._returnResult({ data: { user: null, session: null }, error: invalidTokenError });
          }
          if (data.session) {
            await this._saveSession(data.session);
            await this._notifyAllSubscribers("SIGNED_IN", data.session);
          }
          return this._returnResult({ data: Object.assign({}, data), error: error3 });
        } catch (error3) {
          if (isAuthError(error3)) {
            return this._returnResult({ data: { user: null, session: null }, error: error3 });
          }
          throw error3;
        }
      }
      async _exchangeCodeForSession(authCode) {
        const storageItem = await getItemAsync(this.storage, `${this.storageKey}-code-verifier`);
        const [codeVerifier, redirectType] = (storageItem !== null && storageItem !== void 0 ? storageItem : "").split("/");
        try {
          const { data, error: error3 } = await _request(this.fetch, "POST", `${this.url}/token?grant_type=pkce`, {
            headers: this.headers,
            body: {
              auth_code: authCode,
              code_verifier: codeVerifier
            },
            xform: _sessionResponse
          });
          await removeItemAsync(this.storage, `${this.storageKey}-code-verifier`);
          if (error3) {
            throw error3;
          }
          if (!data || !data.session || !data.user) {
            const invalidTokenError = new AuthInvalidTokenResponseError();
            return this._returnResult({
              data: { user: null, session: null, redirectType: null },
              error: invalidTokenError
            });
          }
          if (data.session) {
            await this._saveSession(data.session);
            await this._notifyAllSubscribers("SIGNED_IN", data.session);
          }
          return this._returnResult({ data: Object.assign(Object.assign({}, data), { redirectType: redirectType !== null && redirectType !== void 0 ? redirectType : null }), error: error3 });
        } catch (error3) {
          if (isAuthError(error3)) {
            return this._returnResult({
              data: { user: null, session: null, redirectType: null },
              error: error3
            });
          }
          throw error3;
        }
      }
      /**
       * Allows signing in with an OIDC ID token. The authentication provider used
       * should be enabled and configured.
       */
      async signInWithIdToken(credentials) {
        try {
          const { options, provider, token, access_token, nonce } = credentials;
          const res = await _request(this.fetch, "POST", `${this.url}/token?grant_type=id_token`, {
            headers: this.headers,
            body: {
              provider,
              id_token: token,
              access_token,
              nonce,
              gotrue_meta_security: { captcha_token: options === null || options === void 0 ? void 0 : options.captchaToken }
            },
            xform: _sessionResponse
          });
          const { data, error: error3 } = res;
          if (error3) {
            return this._returnResult({ data: { user: null, session: null }, error: error3 });
          } else if (!data || !data.session || !data.user) {
            const invalidTokenError = new AuthInvalidTokenResponseError();
            return this._returnResult({ data: { user: null, session: null }, error: invalidTokenError });
          }
          if (data.session) {
            await this._saveSession(data.session);
            await this._notifyAllSubscribers("SIGNED_IN", data.session);
          }
          return this._returnResult({ data, error: error3 });
        } catch (error3) {
          if (isAuthError(error3)) {
            return this._returnResult({ data: { user: null, session: null }, error: error3 });
          }
          throw error3;
        }
      }
      /**
       * Log in a user using magiclink or a one-time password (OTP).
       *
       * If the `{{ .ConfirmationURL }}` variable is specified in the email template, a magiclink will be sent.
       * If the `{{ .Token }}` variable is specified in the email template, an OTP will be sent.
       * If you're using phone sign-ins, only an OTP will be sent. You won't be able to send a magiclink for phone sign-ins.
       *
       * Be aware that you may get back an error message that will not distinguish
       * between the cases where the account does not exist or, that the account
       * can only be accessed via social login.
       *
       * Do note that you will need to configure a Whatsapp sender on Twilio
       * if you are using phone sign in with the 'whatsapp' channel. The whatsapp
       * channel is not supported on other providers
       * at this time.
       * This method supports PKCE when an email is passed.
       */
      async signInWithOtp(credentials) {
        var _a2, _b, _c, _d, _e;
        try {
          if ("email" in credentials) {
            const { email, options } = credentials;
            let codeChallenge = null;
            let codeChallengeMethod = null;
            if (this.flowType === "pkce") {
              ;
              [codeChallenge, codeChallengeMethod] = await getCodeChallengeAndMethod(this.storage, this.storageKey);
            }
            const { error: error3 } = await _request(this.fetch, "POST", `${this.url}/otp`, {
              headers: this.headers,
              body: {
                email,
                data: (_a2 = options === null || options === void 0 ? void 0 : options.data) !== null && _a2 !== void 0 ? _a2 : {},
                create_user: (_b = options === null || options === void 0 ? void 0 : options.shouldCreateUser) !== null && _b !== void 0 ? _b : true,
                gotrue_meta_security: { captcha_token: options === null || options === void 0 ? void 0 : options.captchaToken },
                code_challenge: codeChallenge,
                code_challenge_method: codeChallengeMethod
              },
              redirectTo: options === null || options === void 0 ? void 0 : options.emailRedirectTo
            });
            return this._returnResult({ data: { user: null, session: null }, error: error3 });
          }
          if ("phone" in credentials) {
            const { phone, options } = credentials;
            const { data, error: error3 } = await _request(this.fetch, "POST", `${this.url}/otp`, {
              headers: this.headers,
              body: {
                phone,
                data: (_c = options === null || options === void 0 ? void 0 : options.data) !== null && _c !== void 0 ? _c : {},
                create_user: (_d = options === null || options === void 0 ? void 0 : options.shouldCreateUser) !== null && _d !== void 0 ? _d : true,
                gotrue_meta_security: { captcha_token: options === null || options === void 0 ? void 0 : options.captchaToken },
                channel: (_e = options === null || options === void 0 ? void 0 : options.channel) !== null && _e !== void 0 ? _e : "sms"
              }
            });
            return this._returnResult({
              data: { user: null, session: null, messageId: data === null || data === void 0 ? void 0 : data.message_id },
              error: error3
            });
          }
          throw new AuthInvalidCredentialsError("You must provide either an email or phone number.");
        } catch (error3) {
          if (isAuthError(error3)) {
            return this._returnResult({ data: { user: null, session: null }, error: error3 });
          }
          throw error3;
        }
      }
      /**
       * Log in a user given a User supplied OTP or TokenHash received through mobile or email.
       */
      async verifyOtp(params) {
        var _a2, _b;
        try {
          let redirectTo = void 0;
          let captchaToken = void 0;
          if ("options" in params) {
            redirectTo = (_a2 = params.options) === null || _a2 === void 0 ? void 0 : _a2.redirectTo;
            captchaToken = (_b = params.options) === null || _b === void 0 ? void 0 : _b.captchaToken;
          }
          const { data, error: error3 } = await _request(this.fetch, "POST", `${this.url}/verify`, {
            headers: this.headers,
            body: Object.assign(Object.assign({}, params), { gotrue_meta_security: { captcha_token: captchaToken } }),
            redirectTo,
            xform: _sessionResponse
          });
          if (error3) {
            throw error3;
          }
          if (!data) {
            const tokenVerificationError = new Error("An error occurred on token verification.");
            throw tokenVerificationError;
          }
          const session = data.session;
          const user = data.user;
          if (session === null || session === void 0 ? void 0 : session.access_token) {
            await this._saveSession(session);
            await this._notifyAllSubscribers(params.type == "recovery" ? "PASSWORD_RECOVERY" : "SIGNED_IN", session);
          }
          return this._returnResult({ data: { user, session }, error: null });
        } catch (error3) {
          if (isAuthError(error3)) {
            return this._returnResult({ data: { user: null, session: null }, error: error3 });
          }
          throw error3;
        }
      }
      /**
       * Attempts a single-sign on using an enterprise Identity Provider. A
       * successful SSO attempt will redirect the current page to the identity
       * provider authorization page. The redirect URL is implementation and SSO
       * protocol specific.
       *
       * You can use it by providing a SSO domain. Typically you can extract this
       * domain by asking users for their email address. If this domain is
       * registered on the Auth instance the redirect will use that organization's
       * currently active SSO Identity Provider for the login.
       *
       * If you have built an organization-specific login page, you can use the
       * organization's SSO Identity Provider UUID directly instead.
       */
      async signInWithSSO(params) {
        var _a2, _b, _c, _d, _e;
        try {
          let codeChallenge = null;
          let codeChallengeMethod = null;
          if (this.flowType === "pkce") {
            ;
            [codeChallenge, codeChallengeMethod] = await getCodeChallengeAndMethod(this.storage, this.storageKey);
          }
          const result = await _request(this.fetch, "POST", `${this.url}/sso`, {
            body: Object.assign(Object.assign(Object.assign(Object.assign(Object.assign({}, "providerId" in params ? { provider_id: params.providerId } : null), "domain" in params ? { domain: params.domain } : null), { redirect_to: (_b = (_a2 = params.options) === null || _a2 === void 0 ? void 0 : _a2.redirectTo) !== null && _b !== void 0 ? _b : void 0 }), ((_c = params === null || params === void 0 ? void 0 : params.options) === null || _c === void 0 ? void 0 : _c.captchaToken) ? { gotrue_meta_security: { captcha_token: params.options.captchaToken } } : null), { skip_http_redirect: true, code_challenge: codeChallenge, code_challenge_method: codeChallengeMethod }),
            headers: this.headers,
            xform: _ssoResponse
          });
          if (((_d = result.data) === null || _d === void 0 ? void 0 : _d.url) && isBrowser() && !((_e = params.options) === null || _e === void 0 ? void 0 : _e.skipBrowserRedirect)) {
            window.location.assign(result.data.url);
          }
          return this._returnResult(result);
        } catch (error3) {
          if (isAuthError(error3)) {
            return this._returnResult({ data: null, error: error3 });
          }
          throw error3;
        }
      }
      /**
       * Sends a reauthentication OTP to the user's email or phone number.
       * Requires the user to be signed-in.
       */
      async reauthenticate() {
        await this.initializePromise;
        return await this._acquireLock(-1, async () => {
          return await this._reauthenticate();
        });
      }
      async _reauthenticate() {
        try {
          return await this._useSession(async (result) => {
            const { data: { session }, error: sessionError } = result;
            if (sessionError)
              throw sessionError;
            if (!session)
              throw new AuthSessionMissingError();
            const { error: error3 } = await _request(this.fetch, "GET", `${this.url}/reauthenticate`, {
              headers: this.headers,
              jwt: session.access_token
            });
            return this._returnResult({ data: { user: null, session: null }, error: error3 });
          });
        } catch (error3) {
          if (isAuthError(error3)) {
            return this._returnResult({ data: { user: null, session: null }, error: error3 });
          }
          throw error3;
        }
      }
      /**
       * Resends an existing signup confirmation email, email change email, SMS OTP or phone change OTP.
       */
      async resend(credentials) {
        try {
          const endpoint = `${this.url}/resend`;
          if ("email" in credentials) {
            const { email, type: type2, options } = credentials;
            const { error: error3 } = await _request(this.fetch, "POST", endpoint, {
              headers: this.headers,
              body: {
                email,
                type: type2,
                gotrue_meta_security: { captcha_token: options === null || options === void 0 ? void 0 : options.captchaToken }
              },
              redirectTo: options === null || options === void 0 ? void 0 : options.emailRedirectTo
            });
            return this._returnResult({ data: { user: null, session: null }, error: error3 });
          } else if ("phone" in credentials) {
            const { phone, type: type2, options } = credentials;
            const { data, error: error3 } = await _request(this.fetch, "POST", endpoint, {
              headers: this.headers,
              body: {
                phone,
                type: type2,
                gotrue_meta_security: { captcha_token: options === null || options === void 0 ? void 0 : options.captchaToken }
              }
            });
            return this._returnResult({
              data: { user: null, session: null, messageId: data === null || data === void 0 ? void 0 : data.message_id },
              error: error3
            });
          }
          throw new AuthInvalidCredentialsError("You must provide either an email or phone number and a type");
        } catch (error3) {
          if (isAuthError(error3)) {
            return this._returnResult({ data: { user: null, session: null }, error: error3 });
          }
          throw error3;
        }
      }
      /**
       * Returns the session, refreshing it if necessary.
       *
       * The session returned can be null if the session is not detected which can happen in the event a user is not signed-in or has logged out.
       *
       * **IMPORTANT:** This method loads values directly from the storage attached
       * to the client. If that storage is based on request cookies for example,
       * the values in it may not be authentic and therefore it's strongly advised
       * against using this method and its results in such circumstances. A warning
       * will be emitted if this is detected. Use {@link #getUser()} instead.
       */
      async getSession() {
        await this.initializePromise;
        const result = await this._acquireLock(-1, async () => {
          return this._useSession(async (result2) => {
            return result2;
          });
        });
        return result;
      }
      /**
       * Acquires a global lock based on the storage key.
       */
      async _acquireLock(acquireTimeout, fn) {
        this._debug("#_acquireLock", "begin", acquireTimeout);
        try {
          if (this.lockAcquired) {
            const last = this.pendingInLock.length ? this.pendingInLock[this.pendingInLock.length - 1] : Promise.resolve();
            const result = (async () => {
              await last;
              return await fn();
            })();
            this.pendingInLock.push((async () => {
              try {
                await result;
              } catch (e) {
              }
            })());
            return result;
          }
          return await this.lock(`lock:${this.storageKey}`, acquireTimeout, async () => {
            this._debug("#_acquireLock", "lock acquired for storage key", this.storageKey);
            try {
              this.lockAcquired = true;
              const result = fn();
              this.pendingInLock.push((async () => {
                try {
                  await result;
                } catch (e) {
                }
              })());
              await result;
              while (this.pendingInLock.length) {
                const waitOn = [...this.pendingInLock];
                await Promise.all(waitOn);
                this.pendingInLock.splice(0, waitOn.length);
              }
              return await result;
            } finally {
              this._debug("#_acquireLock", "lock released for storage key", this.storageKey);
              this.lockAcquired = false;
            }
          });
        } finally {
          this._debug("#_acquireLock", "end");
        }
      }
      /**
       * Use instead of {@link #getSession} inside the library. It is
       * semantically usually what you want, as getting a session involves some
       * processing afterwards that requires only one client operating on the
       * session at once across multiple tabs or processes.
       */
      async _useSession(fn) {
        this._debug("#_useSession", "begin");
        try {
          const result = await this.__loadSession();
          return await fn(result);
        } finally {
          this._debug("#_useSession", "end");
        }
      }
      /**
       * NEVER USE DIRECTLY!
       *
       * Always use {@link #_useSession}.
       */
      async __loadSession() {
        this._debug("#__loadSession()", "begin");
        if (!this.lockAcquired) {
          this._debug("#__loadSession()", "used outside of an acquired lock!", new Error().stack);
        }
        try {
          let currentSession = null;
          const maybeSession = await getItemAsync(this.storage, this.storageKey);
          this._debug("#getSession()", "session from storage", maybeSession);
          if (maybeSession !== null) {
            if (this._isValidSession(maybeSession)) {
              currentSession = maybeSession;
            } else {
              this._debug("#getSession()", "session from storage is not valid");
              await this._removeSession();
            }
          }
          if (!currentSession) {
            return { data: { session: null }, error: null };
          }
          const hasExpired = currentSession.expires_at ? currentSession.expires_at * 1e3 - Date.now() < EXPIRY_MARGIN_MS : false;
          this._debug("#__loadSession()", `session has${hasExpired ? "" : " not"} expired`, "expires_at", currentSession.expires_at);
          if (!hasExpired) {
            if (this.userStorage) {
              const maybeUser = await getItemAsync(this.userStorage, this.storageKey + "-user");
              if (maybeUser === null || maybeUser === void 0 ? void 0 : maybeUser.user) {
                currentSession.user = maybeUser.user;
              } else {
                currentSession.user = userNotAvailableProxy();
              }
            }
            if (this.storage.isServer && currentSession.user && !currentSession.user.__isUserNotAvailableProxy) {
              const suppressWarningRef = { value: this.suppressGetSessionWarning };
              currentSession.user = insecureUserWarningProxy(currentSession.user, suppressWarningRef);
              if (suppressWarningRef.value) {
                this.suppressGetSessionWarning = true;
              }
            }
            return { data: { session: currentSession }, error: null };
          }
          const { data: session, error: error3 } = await this._callRefreshToken(currentSession.refresh_token);
          if (error3) {
            return this._returnResult({ data: { session: null }, error: error3 });
          }
          return this._returnResult({ data: { session }, error: null });
        } finally {
          this._debug("#__loadSession()", "end");
        }
      }
      /**
       * Gets the current user details if there is an existing session. This method
       * performs a network request to the Supabase Auth server, so the returned
       * value is authentic and can be used to base authorization rules on.
       *
       * @param jwt Takes in an optional access token JWT. If no JWT is provided, the JWT from the current session is used.
       */
      async getUser(jwt) {
        if (jwt) {
          return await this._getUser(jwt);
        }
        await this.initializePromise;
        const result = await this._acquireLock(-1, async () => {
          return await this._getUser();
        });
        return result;
      }
      async _getUser(jwt) {
        try {
          if (jwt) {
            return await _request(this.fetch, "GET", `${this.url}/user`, {
              headers: this.headers,
              jwt,
              xform: _userResponse
            });
          }
          return await this._useSession(async (result) => {
            var _a2, _b, _c;
            const { data, error: error3 } = result;
            if (error3) {
              throw error3;
            }
            if (!((_a2 = data.session) === null || _a2 === void 0 ? void 0 : _a2.access_token) && !this.hasCustomAuthorizationHeader) {
              return { data: { user: null }, error: new AuthSessionMissingError() };
            }
            return await _request(this.fetch, "GET", `${this.url}/user`, {
              headers: this.headers,
              jwt: (_c = (_b = data.session) === null || _b === void 0 ? void 0 : _b.access_token) !== null && _c !== void 0 ? _c : void 0,
              xform: _userResponse
            });
          });
        } catch (error3) {
          if (isAuthError(error3)) {
            if (isAuthSessionMissingError(error3)) {
              await this._removeSession();
              await removeItemAsync(this.storage, `${this.storageKey}-code-verifier`);
            }
            return this._returnResult({ data: { user: null }, error: error3 });
          }
          throw error3;
        }
      }
      /**
       * Updates user data for a logged in user.
       */
      async updateUser(attributes, options = {}) {
        await this.initializePromise;
        return await this._acquireLock(-1, async () => {
          return await this._updateUser(attributes, options);
        });
      }
      async _updateUser(attributes, options = {}) {
        try {
          return await this._useSession(async (result) => {
            const { data: sessionData, error: sessionError } = result;
            if (sessionError) {
              throw sessionError;
            }
            if (!sessionData.session) {
              throw new AuthSessionMissingError();
            }
            const session = sessionData.session;
            let codeChallenge = null;
            let codeChallengeMethod = null;
            if (this.flowType === "pkce" && attributes.email != null) {
              ;
              [codeChallenge, codeChallengeMethod] = await getCodeChallengeAndMethod(this.storage, this.storageKey);
            }
            const { data, error: userError } = await _request(this.fetch, "PUT", `${this.url}/user`, {
              headers: this.headers,
              redirectTo: options === null || options === void 0 ? void 0 : options.emailRedirectTo,
              body: Object.assign(Object.assign({}, attributes), { code_challenge: codeChallenge, code_challenge_method: codeChallengeMethod }),
              jwt: session.access_token,
              xform: _userResponse
            });
            if (userError) {
              throw userError;
            }
            session.user = data.user;
            await this._saveSession(session);
            await this._notifyAllSubscribers("USER_UPDATED", session);
            return this._returnResult({ data: { user: session.user }, error: null });
          });
        } catch (error3) {
          if (isAuthError(error3)) {
            return this._returnResult({ data: { user: null }, error: error3 });
          }
          throw error3;
        }
      }
      /**
       * Sets the session data from the current session. If the current session is expired, setSession will take care of refreshing it to obtain a new session.
       * If the refresh token or access token in the current session is invalid, an error will be thrown.
       * @param currentSession The current session that minimally contains an access token and refresh token.
       */
      async setSession(currentSession) {
        await this.initializePromise;
        return await this._acquireLock(-1, async () => {
          return await this._setSession(currentSession);
        });
      }
      async _setSession(currentSession) {
        try {
          if (!currentSession.access_token || !currentSession.refresh_token) {
            throw new AuthSessionMissingError();
          }
          const timeNow = Date.now() / 1e3;
          let expiresAt2 = timeNow;
          let hasExpired = true;
          let session = null;
          const { payload } = decodeJWT(currentSession.access_token);
          if (payload.exp) {
            expiresAt2 = payload.exp;
            hasExpired = expiresAt2 <= timeNow;
          }
          if (hasExpired) {
            const { data: refreshedSession, error: error3 } = await this._callRefreshToken(currentSession.refresh_token);
            if (error3) {
              return this._returnResult({ data: { user: null, session: null }, error: error3 });
            }
            if (!refreshedSession) {
              return { data: { user: null, session: null }, error: null };
            }
            session = refreshedSession;
          } else {
            const { data, error: error3 } = await this._getUser(currentSession.access_token);
            if (error3) {
              throw error3;
            }
            session = {
              access_token: currentSession.access_token,
              refresh_token: currentSession.refresh_token,
              user: data.user,
              token_type: "bearer",
              expires_in: expiresAt2 - timeNow,
              expires_at: expiresAt2
            };
            await this._saveSession(session);
            await this._notifyAllSubscribers("SIGNED_IN", session);
          }
          return this._returnResult({ data: { user: session.user, session }, error: null });
        } catch (error3) {
          if (isAuthError(error3)) {
            return this._returnResult({ data: { session: null, user: null }, error: error3 });
          }
          throw error3;
        }
      }
      /**
       * Returns a new session, regardless of expiry status.
       * Takes in an optional current session. If not passed in, then refreshSession() will attempt to retrieve it from getSession().
       * If the current session's refresh token is invalid, an error will be thrown.
       * @param currentSession The current session. If passed in, it must contain a refresh token.
       */
      async refreshSession(currentSession) {
        await this.initializePromise;
        return await this._acquireLock(-1, async () => {
          return await this._refreshSession(currentSession);
        });
      }
      async _refreshSession(currentSession) {
        try {
          return await this._useSession(async (result) => {
            var _a2;
            if (!currentSession) {
              const { data, error: error4 } = result;
              if (error4) {
                throw error4;
              }
              currentSession = (_a2 = data.session) !== null && _a2 !== void 0 ? _a2 : void 0;
            }
            if (!(currentSession === null || currentSession === void 0 ? void 0 : currentSession.refresh_token)) {
              throw new AuthSessionMissingError();
            }
            const { data: session, error: error3 } = await this._callRefreshToken(currentSession.refresh_token);
            if (error3) {
              return this._returnResult({ data: { user: null, session: null }, error: error3 });
            }
            if (!session) {
              return this._returnResult({ data: { user: null, session: null }, error: null });
            }
            return this._returnResult({ data: { user: session.user, session }, error: null });
          });
        } catch (error3) {
          if (isAuthError(error3)) {
            return this._returnResult({ data: { user: null, session: null }, error: error3 });
          }
          throw error3;
        }
      }
      /**
       * Gets the session data from a URL string
       */
      async _getSessionFromURL(params, callbackUrlType) {
        try {
          if (!isBrowser())
            throw new AuthImplicitGrantRedirectError("No browser detected.");
          if (params.error || params.error_description || params.error_code) {
            throw new AuthImplicitGrantRedirectError(params.error_description || "Error in URL with unspecified error_description", {
              error: params.error || "unspecified_error",
              code: params.error_code || "unspecified_code"
            });
          }
          switch (callbackUrlType) {
            case "implicit":
              if (this.flowType === "pkce") {
                throw new AuthPKCEGrantCodeExchangeError("Not a valid PKCE flow url.");
              }
              break;
            case "pkce":
              if (this.flowType === "implicit") {
                throw new AuthImplicitGrantRedirectError("Not a valid implicit grant flow url.");
              }
              break;
            default:
          }
          if (callbackUrlType === "pkce") {
            this._debug("#_initialize()", "begin", "is PKCE flow", true);
            if (!params.code)
              throw new AuthPKCEGrantCodeExchangeError("No code detected.");
            const { data: data2, error: error4 } = await this._exchangeCodeForSession(params.code);
            if (error4)
              throw error4;
            const url = new URL(window.location.href);
            url.searchParams.delete("code");
            window.history.replaceState(window.history.state, "", url.toString());
            return { data: { session: data2.session, redirectType: null }, error: null };
          }
          const { provider_token, provider_refresh_token, access_token, refresh_token, expires_in, expires_at, token_type } = params;
          if (!access_token || !expires_in || !refresh_token || !token_type) {
            throw new AuthImplicitGrantRedirectError("No session defined in URL");
          }
          const timeNow = Math.round(Date.now() / 1e3);
          const expiresIn = parseInt(expires_in);
          let expiresAt2 = timeNow + expiresIn;
          if (expires_at) {
            expiresAt2 = parseInt(expires_at);
          }
          const actuallyExpiresIn = expiresAt2 - timeNow;
          if (actuallyExpiresIn * 1e3 <= AUTO_REFRESH_TICK_DURATION_MS) {
            console.warn(`@supabase/gotrue-js: Session as retrieved from URL expires in ${actuallyExpiresIn}s, should have been closer to ${expiresIn}s`);
          }
          const issuedAt = expiresAt2 - expiresIn;
          if (timeNow - issuedAt >= 120) {
            console.warn("@supabase/gotrue-js: Session as retrieved from URL was issued over 120s ago, URL could be stale", issuedAt, expiresAt2, timeNow);
          } else if (timeNow - issuedAt < 0) {
            console.warn("@supabase/gotrue-js: Session as retrieved from URL was issued in the future? Check the device clock for skew", issuedAt, expiresAt2, timeNow);
          }
          const { data, error: error3 } = await this._getUser(access_token);
          if (error3)
            throw error3;
          const session = {
            provider_token,
            provider_refresh_token,
            access_token,
            expires_in: expiresIn,
            expires_at: expiresAt2,
            refresh_token,
            token_type,
            user: data.user
          };
          window.location.hash = "";
          this._debug("#_getSessionFromURL()", "clearing window.location.hash");
          return this._returnResult({ data: { session, redirectType: params.type }, error: null });
        } catch (error3) {
          if (isAuthError(error3)) {
            return this._returnResult({ data: { session: null, redirectType: null }, error: error3 });
          }
          throw error3;
        }
      }
      /**
       * Checks if the current URL contains parameters given by an implicit oauth grant flow (https://www.rfc-editor.org/rfc/rfc6749.html#section-4.2)
       */
      _isImplicitGrantCallback(params) {
        return Boolean(params.access_token || params.error_description);
      }
      /**
       * Checks if the current URL and backing storage contain parameters given by a PKCE flow
       */
      async _isPKCECallback(params) {
        const currentStorageContent = await getItemAsync(this.storage, `${this.storageKey}-code-verifier`);
        return !!(params.code && currentStorageContent);
      }
      /**
       * Inside a browser context, `signOut()` will remove the logged in user from the browser session and log them out - removing all items from localstorage and then trigger a `"SIGNED_OUT"` event.
       *
       * For server-side management, you can revoke all refresh tokens for a user by passing a user's JWT through to `auth.api.signOut(JWT: string)`.
       * There is no way to revoke a user's access token jwt until it expires. It is recommended to set a shorter expiry on the jwt for this reason.
       *
       * If using `others` scope, no `SIGNED_OUT` event is fired!
       */
      async signOut(options = { scope: "global" }) {
        await this.initializePromise;
        return await this._acquireLock(-1, async () => {
          return await this._signOut(options);
        });
      }
      async _signOut({ scope } = { scope: "global" }) {
        return await this._useSession(async (result) => {
          var _a2;
          const { data, error: sessionError } = result;
          if (sessionError) {
            return this._returnResult({ error: sessionError });
          }
          const accessToken = (_a2 = data.session) === null || _a2 === void 0 ? void 0 : _a2.access_token;
          if (accessToken) {
            const { error: error3 } = await this.admin.signOut(accessToken, scope);
            if (error3) {
              if (!(isAuthApiError(error3) && (error3.status === 404 || error3.status === 401 || error3.status === 403))) {
                return this._returnResult({ error: error3 });
              }
            }
          }
          if (scope !== "others") {
            await this._removeSession();
            await removeItemAsync(this.storage, `${this.storageKey}-code-verifier`);
          }
          return this._returnResult({ error: null });
        });
      }
      onAuthStateChange(callback) {
        const id = generateCallbackId();
        const subscription = {
          id,
          callback,
          unsubscribe: /* @__PURE__ */ __name2(() => {
            this._debug("#unsubscribe()", "state change callback with id removed", id);
            this.stateChangeEmitters.delete(id);
          }, "unsubscribe")
        };
        this._debug("#onAuthStateChange()", "registered callback with id", id);
        this.stateChangeEmitters.set(id, subscription);
        (async () => {
          await this.initializePromise;
          await this._acquireLock(-1, async () => {
            this._emitInitialSession(id);
          });
        })();
        return { data: { subscription } };
      }
      async _emitInitialSession(id) {
        return await this._useSession(async (result) => {
          var _a2, _b;
          try {
            const { data: { session }, error: error3 } = result;
            if (error3)
              throw error3;
            await ((_a2 = this.stateChangeEmitters.get(id)) === null || _a2 === void 0 ? void 0 : _a2.callback("INITIAL_SESSION", session));
            this._debug("INITIAL_SESSION", "callback id", id, "session", session);
          } catch (err) {
            await ((_b = this.stateChangeEmitters.get(id)) === null || _b === void 0 ? void 0 : _b.callback("INITIAL_SESSION", null));
            this._debug("INITIAL_SESSION", "callback id", id, "error", err);
            console.error(err);
          }
        });
      }
      /**
       * Sends a password reset request to an email address. This method supports the PKCE flow.
       *
       * @param email The email address of the user.
       * @param options.redirectTo The URL to send the user to after they click the password reset link.
       * @param options.captchaToken Verification token received when the user completes the captcha on the site.
       */
      async resetPasswordForEmail(email, options = {}) {
        let codeChallenge = null;
        let codeChallengeMethod = null;
        if (this.flowType === "pkce") {
          ;
          [codeChallenge, codeChallengeMethod] = await getCodeChallengeAndMethod(
            this.storage,
            this.storageKey,
            true
            // isPasswordRecovery
          );
        }
        try {
          return await _request(this.fetch, "POST", `${this.url}/recover`, {
            body: {
              email,
              code_challenge: codeChallenge,
              code_challenge_method: codeChallengeMethod,
              gotrue_meta_security: { captcha_token: options.captchaToken }
            },
            headers: this.headers,
            redirectTo: options.redirectTo
          });
        } catch (error3) {
          if (isAuthError(error3)) {
            return this._returnResult({ data: null, error: error3 });
          }
          throw error3;
        }
      }
      /**
       * Gets all the identities linked to a user.
       */
      async getUserIdentities() {
        var _a2;
        try {
          const { data, error: error3 } = await this.getUser();
          if (error3)
            throw error3;
          return this._returnResult({ data: { identities: (_a2 = data.user.identities) !== null && _a2 !== void 0 ? _a2 : [] }, error: null });
        } catch (error3) {
          if (isAuthError(error3)) {
            return this._returnResult({ data: null, error: error3 });
          }
          throw error3;
        }
      }
      async linkIdentity(credentials) {
        if ("token" in credentials) {
          return this.linkIdentityIdToken(credentials);
        }
        return this.linkIdentityOAuth(credentials);
      }
      async linkIdentityOAuth(credentials) {
        var _a2;
        try {
          const { data, error: error3 } = await this._useSession(async (result) => {
            var _a3, _b, _c, _d, _e;
            const { data: data2, error: error4 } = result;
            if (error4)
              throw error4;
            const url = await this._getUrlForProvider(`${this.url}/user/identities/authorize`, credentials.provider, {
              redirectTo: (_a3 = credentials.options) === null || _a3 === void 0 ? void 0 : _a3.redirectTo,
              scopes: (_b = credentials.options) === null || _b === void 0 ? void 0 : _b.scopes,
              queryParams: (_c = credentials.options) === null || _c === void 0 ? void 0 : _c.queryParams,
              skipBrowserRedirect: true
            });
            return await _request(this.fetch, "GET", url, {
              headers: this.headers,
              jwt: (_e = (_d = data2.session) === null || _d === void 0 ? void 0 : _d.access_token) !== null && _e !== void 0 ? _e : void 0
            });
          });
          if (error3)
            throw error3;
          if (isBrowser() && !((_a2 = credentials.options) === null || _a2 === void 0 ? void 0 : _a2.skipBrowserRedirect)) {
            window.location.assign(data === null || data === void 0 ? void 0 : data.url);
          }
          return this._returnResult({
            data: { provider: credentials.provider, url: data === null || data === void 0 ? void 0 : data.url },
            error: null
          });
        } catch (error3) {
          if (isAuthError(error3)) {
            return this._returnResult({ data: { provider: credentials.provider, url: null }, error: error3 });
          }
          throw error3;
        }
      }
      async linkIdentityIdToken(credentials) {
        return await this._useSession(async (result) => {
          var _a2;
          try {
            const { error: sessionError, data: { session } } = result;
            if (sessionError)
              throw sessionError;
            const { options, provider, token, access_token, nonce } = credentials;
            const res = await _request(this.fetch, "POST", `${this.url}/token?grant_type=id_token`, {
              headers: this.headers,
              jwt: (_a2 = session === null || session === void 0 ? void 0 : session.access_token) !== null && _a2 !== void 0 ? _a2 : void 0,
              body: {
                provider,
                id_token: token,
                access_token,
                nonce,
                link_identity: true,
                gotrue_meta_security: { captcha_token: options === null || options === void 0 ? void 0 : options.captchaToken }
              },
              xform: _sessionResponse
            });
            const { data, error: error3 } = res;
            if (error3) {
              return this._returnResult({ data: { user: null, session: null }, error: error3 });
            } else if (!data || !data.session || !data.user) {
              return this._returnResult({
                data: { user: null, session: null },
                error: new AuthInvalidTokenResponseError()
              });
            }
            if (data.session) {
              await this._saveSession(data.session);
              await this._notifyAllSubscribers("USER_UPDATED", data.session);
            }
            return this._returnResult({ data, error: error3 });
          } catch (error3) {
            if (isAuthError(error3)) {
              return this._returnResult({ data: { user: null, session: null }, error: error3 });
            }
            throw error3;
          }
        });
      }
      /**
       * Unlinks an identity from a user by deleting it. The user will no longer be able to sign in with that identity once it's unlinked.
       */
      async unlinkIdentity(identity) {
        try {
          return await this._useSession(async (result) => {
            var _a2, _b;
            const { data, error: error3 } = result;
            if (error3) {
              throw error3;
            }
            return await _request(this.fetch, "DELETE", `${this.url}/user/identities/${identity.identity_id}`, {
              headers: this.headers,
              jwt: (_b = (_a2 = data.session) === null || _a2 === void 0 ? void 0 : _a2.access_token) !== null && _b !== void 0 ? _b : void 0
            });
          });
        } catch (error3) {
          if (isAuthError(error3)) {
            return this._returnResult({ data: null, error: error3 });
          }
          throw error3;
        }
      }
      /**
       * Generates a new JWT.
       * @param refreshToken A valid refresh token that was returned on login.
       */
      async _refreshAccessToken(refreshToken) {
        const debugName = `#_refreshAccessToken(${refreshToken.substring(0, 5)}...)`;
        this._debug(debugName, "begin");
        try {
          const startedAt = Date.now();
          return await retryable(async (attempt) => {
            if (attempt > 0) {
              await sleep(200 * Math.pow(2, attempt - 1));
            }
            this._debug(debugName, "refreshing attempt", attempt);
            return await _request(this.fetch, "POST", `${this.url}/token?grant_type=refresh_token`, {
              body: { refresh_token: refreshToken },
              headers: this.headers,
              xform: _sessionResponse
            });
          }, (attempt, error3) => {
            const nextBackOffInterval = 200 * Math.pow(2, attempt);
            return error3 && isAuthRetryableFetchError(error3) && // retryable only if the request can be sent before the backoff overflows the tick duration
            Date.now() + nextBackOffInterval - startedAt < AUTO_REFRESH_TICK_DURATION_MS;
          });
        } catch (error3) {
          this._debug(debugName, "error", error3);
          if (isAuthError(error3)) {
            return this._returnResult({ data: { session: null, user: null }, error: error3 });
          }
          throw error3;
        } finally {
          this._debug(debugName, "end");
        }
      }
      _isValidSession(maybeSession) {
        const isValidSession = typeof maybeSession === "object" && maybeSession !== null && "access_token" in maybeSession && "refresh_token" in maybeSession && "expires_at" in maybeSession;
        return isValidSession;
      }
      async _handleProviderSignIn(provider, options) {
        const url = await this._getUrlForProvider(`${this.url}/authorize`, provider, {
          redirectTo: options.redirectTo,
          scopes: options.scopes,
          queryParams: options.queryParams
        });
        this._debug("#_handleProviderSignIn()", "provider", provider, "options", options, "url", url);
        if (isBrowser() && !options.skipBrowserRedirect) {
          window.location.assign(url);
        }
        return { data: { provider, url }, error: null };
      }
      /**
       * Recovers the session from LocalStorage and refreshes the token
       * Note: this method is async to accommodate for AsyncStorage e.g. in React native.
       */
      async _recoverAndRefresh() {
        var _a2, _b;
        const debugName = "#_recoverAndRefresh()";
        this._debug(debugName, "begin");
        try {
          const currentSession = await getItemAsync(this.storage, this.storageKey);
          if (currentSession && this.userStorage) {
            let maybeUser = await getItemAsync(this.userStorage, this.storageKey + "-user");
            if (!this.storage.isServer && Object.is(this.storage, this.userStorage) && !maybeUser) {
              maybeUser = { user: currentSession.user };
              await setItemAsync(this.userStorage, this.storageKey + "-user", maybeUser);
            }
            currentSession.user = (_a2 = maybeUser === null || maybeUser === void 0 ? void 0 : maybeUser.user) !== null && _a2 !== void 0 ? _a2 : userNotAvailableProxy();
          } else if (currentSession && !currentSession.user) {
            if (!currentSession.user) {
              const separateUser = await getItemAsync(this.storage, this.storageKey + "-user");
              if (separateUser && (separateUser === null || separateUser === void 0 ? void 0 : separateUser.user)) {
                currentSession.user = separateUser.user;
                await removeItemAsync(this.storage, this.storageKey + "-user");
                await setItemAsync(this.storage, this.storageKey, currentSession);
              } else {
                currentSession.user = userNotAvailableProxy();
              }
            }
          }
          this._debug(debugName, "session from storage", currentSession);
          if (!this._isValidSession(currentSession)) {
            this._debug(debugName, "session is not valid");
            if (currentSession !== null) {
              await this._removeSession();
            }
            return;
          }
          const expiresWithMargin = ((_b = currentSession.expires_at) !== null && _b !== void 0 ? _b : Infinity) * 1e3 - Date.now() < EXPIRY_MARGIN_MS;
          this._debug(debugName, `session has${expiresWithMargin ? "" : " not"} expired with margin of ${EXPIRY_MARGIN_MS}s`);
          if (expiresWithMargin) {
            if (this.autoRefreshToken && currentSession.refresh_token) {
              const { error: error3 } = await this._callRefreshToken(currentSession.refresh_token);
              if (error3) {
                console.error(error3);
                if (!isAuthRetryableFetchError(error3)) {
                  this._debug(debugName, "refresh failed with a non-retryable error, removing the session", error3);
                  await this._removeSession();
                }
              }
            }
          } else if (currentSession.user && currentSession.user.__isUserNotAvailableProxy === true) {
            try {
              const { data, error: userError } = await this._getUser(currentSession.access_token);
              if (!userError && (data === null || data === void 0 ? void 0 : data.user)) {
                currentSession.user = data.user;
                await this._saveSession(currentSession);
                await this._notifyAllSubscribers("SIGNED_IN", currentSession);
              } else {
                this._debug(debugName, "could not get user data, skipping SIGNED_IN notification");
              }
            } catch (getUserError) {
              console.error("Error getting user data:", getUserError);
              this._debug(debugName, "error getting user data, skipping SIGNED_IN notification", getUserError);
            }
          } else {
            await this._notifyAllSubscribers("SIGNED_IN", currentSession);
          }
        } catch (err) {
          this._debug(debugName, "error", err);
          console.error(err);
          return;
        } finally {
          this._debug(debugName, "end");
        }
      }
      async _callRefreshToken(refreshToken) {
        var _a2, _b;
        if (!refreshToken) {
          throw new AuthSessionMissingError();
        }
        if (this.refreshingDeferred) {
          return this.refreshingDeferred.promise;
        }
        const debugName = `#_callRefreshToken(${refreshToken.substring(0, 5)}...)`;
        this._debug(debugName, "begin");
        try {
          this.refreshingDeferred = new Deferred();
          const { data, error: error3 } = await this._refreshAccessToken(refreshToken);
          if (error3)
            throw error3;
          if (!data.session)
            throw new AuthSessionMissingError();
          await this._saveSession(data.session);
          await this._notifyAllSubscribers("TOKEN_REFRESHED", data.session);
          const result = { data: data.session, error: null };
          this.refreshingDeferred.resolve(result);
          return result;
        } catch (error3) {
          this._debug(debugName, "error", error3);
          if (isAuthError(error3)) {
            const result = { data: null, error: error3 };
            if (!isAuthRetryableFetchError(error3)) {
              await this._removeSession();
            }
            (_a2 = this.refreshingDeferred) === null || _a2 === void 0 ? void 0 : _a2.resolve(result);
            return result;
          }
          (_b = this.refreshingDeferred) === null || _b === void 0 ? void 0 : _b.reject(error3);
          throw error3;
        } finally {
          this.refreshingDeferred = null;
          this._debug(debugName, "end");
        }
      }
      async _notifyAllSubscribers(event, session, broadcast = true) {
        const debugName = `#_notifyAllSubscribers(${event})`;
        this._debug(debugName, "begin", session, `broadcast = ${broadcast}`);
        try {
          if (this.broadcastChannel && broadcast) {
            this.broadcastChannel.postMessage({ event, session });
          }
          const errors = [];
          const promises = Array.from(this.stateChangeEmitters.values()).map(async (x) => {
            try {
              await x.callback(event, session);
            } catch (e) {
              errors.push(e);
            }
          });
          await Promise.all(promises);
          if (errors.length > 0) {
            for (let i = 0; i < errors.length; i += 1) {
              console.error(errors[i]);
            }
            throw errors[0];
          }
        } finally {
          this._debug(debugName, "end");
        }
      }
      /**
       * set currentSession and currentUser
       * process to _startAutoRefreshToken if possible
       */
      async _saveSession(session) {
        this._debug("#_saveSession()", session);
        this.suppressGetSessionWarning = true;
        const sessionToProcess = Object.assign({}, session);
        const userIsProxy = sessionToProcess.user && sessionToProcess.user.__isUserNotAvailableProxy === true;
        if (this.userStorage) {
          if (!userIsProxy && sessionToProcess.user) {
            await setItemAsync(this.userStorage, this.storageKey + "-user", {
              user: sessionToProcess.user
            });
          } else if (userIsProxy) {
          }
          const mainSessionData = Object.assign({}, sessionToProcess);
          delete mainSessionData.user;
          const clonedMainSessionData = deepClone(mainSessionData);
          await setItemAsync(this.storage, this.storageKey, clonedMainSessionData);
        } else {
          const clonedSession = deepClone(sessionToProcess);
          await setItemAsync(this.storage, this.storageKey, clonedSession);
        }
      }
      async _removeSession() {
        this._debug("#_removeSession()");
        await removeItemAsync(this.storage, this.storageKey);
        await removeItemAsync(this.storage, this.storageKey + "-code-verifier");
        await removeItemAsync(this.storage, this.storageKey + "-user");
        if (this.userStorage) {
          await removeItemAsync(this.userStorage, this.storageKey + "-user");
        }
        await this._notifyAllSubscribers("SIGNED_OUT", null);
      }
      /**
       * Removes any registered visibilitychange callback.
       *
       * {@see #startAutoRefresh}
       * {@see #stopAutoRefresh}
       */
      _removeVisibilityChangedCallback() {
        this._debug("#_removeVisibilityChangedCallback()");
        const callback = this.visibilityChangedCallback;
        this.visibilityChangedCallback = null;
        try {
          if (callback && isBrowser() && (window === null || window === void 0 ? void 0 : window.removeEventListener)) {
            window.removeEventListener("visibilitychange", callback);
          }
        } catch (e) {
          console.error("removing visibilitychange callback failed", e);
        }
      }
      /**
       * This is the private implementation of {@link #startAutoRefresh}. Use this
       * within the library.
       */
      async _startAutoRefresh() {
        await this._stopAutoRefresh();
        this._debug("#_startAutoRefresh()");
        const ticker = setInterval(() => this._autoRefreshTokenTick(), AUTO_REFRESH_TICK_DURATION_MS);
        this.autoRefreshTicker = ticker;
        if (ticker && typeof ticker === "object" && typeof ticker.unref === "function") {
          ticker.unref();
        } else if (typeof Deno !== "undefined" && typeof Deno.unrefTimer === "function") {
          Deno.unrefTimer(ticker);
        }
        setTimeout(async () => {
          await this.initializePromise;
          await this._autoRefreshTokenTick();
        }, 0);
      }
      /**
       * This is the private implementation of {@link #stopAutoRefresh}. Use this
       * within the library.
       */
      async _stopAutoRefresh() {
        this._debug("#_stopAutoRefresh()");
        const ticker = this.autoRefreshTicker;
        this.autoRefreshTicker = null;
        if (ticker) {
          clearInterval(ticker);
        }
      }
      /**
       * Starts an auto-refresh process in the background. The session is checked
       * every few seconds. Close to the time of expiration a process is started to
       * refresh the session. If refreshing fails it will be retried for as long as
       * necessary.
       *
       * If you set the {@link GoTrueClientOptions#autoRefreshToken} you don't need
       * to call this function, it will be called for you.
       *
       * On browsers the refresh process works only when the tab/window is in the
       * foreground to conserve resources as well as prevent race conditions and
       * flooding auth with requests. If you call this method any managed
       * visibility change callback will be removed and you must manage visibility
       * changes on your own.
       *
       * On non-browser platforms the refresh process works *continuously* in the
       * background, which may not be desirable. You should hook into your
       * platform's foreground indication mechanism and call these methods
       * appropriately to conserve resources.
       *
       * {@see #stopAutoRefresh}
       */
      async startAutoRefresh() {
        this._removeVisibilityChangedCallback();
        await this._startAutoRefresh();
      }
      /**
       * Stops an active auto refresh process running in the background (if any).
       *
       * If you call this method any managed visibility change callback will be
       * removed and you must manage visibility changes on your own.
       *
       * See {@link #startAutoRefresh} for more details.
       */
      async stopAutoRefresh() {
        this._removeVisibilityChangedCallback();
        await this._stopAutoRefresh();
      }
      /**
       * Runs the auto refresh token tick.
       */
      async _autoRefreshTokenTick() {
        this._debug("#_autoRefreshTokenTick()", "begin");
        try {
          await this._acquireLock(0, async () => {
            try {
              const now = Date.now();
              try {
                return await this._useSession(async (result) => {
                  const { data: { session } } = result;
                  if (!session || !session.refresh_token || !session.expires_at) {
                    this._debug("#_autoRefreshTokenTick()", "no session");
                    return;
                  }
                  const expiresInTicks = Math.floor((session.expires_at * 1e3 - now) / AUTO_REFRESH_TICK_DURATION_MS);
                  this._debug("#_autoRefreshTokenTick()", `access token expires in ${expiresInTicks} ticks, a tick lasts ${AUTO_REFRESH_TICK_DURATION_MS}ms, refresh threshold is ${AUTO_REFRESH_TICK_THRESHOLD} ticks`);
                  if (expiresInTicks <= AUTO_REFRESH_TICK_THRESHOLD) {
                    await this._callRefreshToken(session.refresh_token);
                  }
                });
              } catch (e) {
                console.error("Auto refresh tick failed with error. This is likely a transient error.", e);
              }
            } finally {
              this._debug("#_autoRefreshTokenTick()", "end");
            }
          });
        } catch (e) {
          if (e.isAcquireTimeout || e instanceof LockAcquireTimeoutError) {
            this._debug("auto refresh token tick lock not available");
          } else {
            throw e;
          }
        }
      }
      /**
       * Registers callbacks on the browser / platform, which in-turn run
       * algorithms when the browser window/tab are in foreground. On non-browser
       * platforms it assumes always foreground.
       */
      async _handleVisibilityChange() {
        this._debug("#_handleVisibilityChange()");
        if (!isBrowser() || !(window === null || window === void 0 ? void 0 : window.addEventListener)) {
          if (this.autoRefreshToken) {
            this.startAutoRefresh();
          }
          return false;
        }
        try {
          this.visibilityChangedCallback = async () => await this._onVisibilityChanged(false);
          window === null || window === void 0 ? void 0 : window.addEventListener("visibilitychange", this.visibilityChangedCallback);
          await this._onVisibilityChanged(true);
        } catch (error3) {
          console.error("_handleVisibilityChange", error3);
        }
      }
      /**
       * Callback registered with `window.addEventListener('visibilitychange')`.
       */
      async _onVisibilityChanged(calledFromInitialize) {
        const methodName = `#_onVisibilityChanged(${calledFromInitialize})`;
        this._debug(methodName, "visibilityState", document.visibilityState);
        if (document.visibilityState === "visible") {
          if (this.autoRefreshToken) {
            this._startAutoRefresh();
          }
          if (!calledFromInitialize) {
            await this.initializePromise;
            await this._acquireLock(-1, async () => {
              if (document.visibilityState !== "visible") {
                this._debug(methodName, "acquired the lock to recover the session, but the browser visibilityState is no longer visible, aborting");
                return;
              }
              await this._recoverAndRefresh();
            });
          }
        } else if (document.visibilityState === "hidden") {
          if (this.autoRefreshToken) {
            this._stopAutoRefresh();
          }
        }
      }
      /**
       * Generates the relevant login URL for a third-party provider.
       * @param options.redirectTo A URL or mobile address to send the user to after they are confirmed.
       * @param options.scopes A space-separated list of scopes granted to the OAuth application.
       * @param options.queryParams An object of key-value pairs containing query parameters granted to the OAuth application.
       */
      async _getUrlForProvider(url, provider, options) {
        const urlParams = [`provider=${encodeURIComponent(provider)}`];
        if (options === null || options === void 0 ? void 0 : options.redirectTo) {
          urlParams.push(`redirect_to=${encodeURIComponent(options.redirectTo)}`);
        }
        if (options === null || options === void 0 ? void 0 : options.scopes) {
          urlParams.push(`scopes=${encodeURIComponent(options.scopes)}`);
        }
        if (this.flowType === "pkce") {
          const [codeChallenge, codeChallengeMethod] = await getCodeChallengeAndMethod(this.storage, this.storageKey);
          const flowParams = new URLSearchParams({
            code_challenge: `${encodeURIComponent(codeChallenge)}`,
            code_challenge_method: `${encodeURIComponent(codeChallengeMethod)}`
          });
          urlParams.push(flowParams.toString());
        }
        if (options === null || options === void 0 ? void 0 : options.queryParams) {
          const query = new URLSearchParams(options.queryParams);
          urlParams.push(query.toString());
        }
        if (options === null || options === void 0 ? void 0 : options.skipBrowserRedirect) {
          urlParams.push(`skip_http_redirect=${options.skipBrowserRedirect}`);
        }
        return `${url}?${urlParams.join("&")}`;
      }
      async _unenroll(params) {
        try {
          return await this._useSession(async (result) => {
            var _a2;
            const { data: sessionData, error: sessionError } = result;
            if (sessionError) {
              return this._returnResult({ data: null, error: sessionError });
            }
            return await _request(this.fetch, "DELETE", `${this.url}/factors/${params.factorId}`, {
              headers: this.headers,
              jwt: (_a2 = sessionData === null || sessionData === void 0 ? void 0 : sessionData.session) === null || _a2 === void 0 ? void 0 : _a2.access_token
            });
          });
        } catch (error3) {
          if (isAuthError(error3)) {
            return this._returnResult({ data: null, error: error3 });
          }
          throw error3;
        }
      }
      async _enroll(params) {
        try {
          return await this._useSession(async (result) => {
            var _a2, _b;
            const { data: sessionData, error: sessionError } = result;
            if (sessionError) {
              return this._returnResult({ data: null, error: sessionError });
            }
            const body = Object.assign({ friendly_name: params.friendlyName, factor_type: params.factorType }, params.factorType === "phone" ? { phone: params.phone } : params.factorType === "totp" ? { issuer: params.issuer } : {});
            const { data, error: error3 } = await _request(this.fetch, "POST", `${this.url}/factors`, {
              body,
              headers: this.headers,
              jwt: (_a2 = sessionData === null || sessionData === void 0 ? void 0 : sessionData.session) === null || _a2 === void 0 ? void 0 : _a2.access_token
            });
            if (error3) {
              return this._returnResult({ data: null, error: error3 });
            }
            if (params.factorType === "totp" && data.type === "totp" && ((_b = data === null || data === void 0 ? void 0 : data.totp) === null || _b === void 0 ? void 0 : _b.qr_code)) {
              data.totp.qr_code = `data:image/svg+xml;utf-8,${data.totp.qr_code}`;
            }
            return this._returnResult({ data, error: null });
          });
        } catch (error3) {
          if (isAuthError(error3)) {
            return this._returnResult({ data: null, error: error3 });
          }
          throw error3;
        }
      }
      async _verify(params) {
        return this._acquireLock(-1, async () => {
          try {
            return await this._useSession(async (result) => {
              var _a2;
              const { data: sessionData, error: sessionError } = result;
              if (sessionError) {
                return this._returnResult({ data: null, error: sessionError });
              }
              const body = Object.assign({ challenge_id: params.challengeId }, "webauthn" in params ? {
                webauthn: Object.assign(Object.assign({}, params.webauthn), { credential_response: params.webauthn.type === "create" ? serializeCredentialCreationResponse(params.webauthn.credential_response) : serializeCredentialRequestResponse(params.webauthn.credential_response) })
              } : { code: params.code });
              const { data, error: error3 } = await _request(this.fetch, "POST", `${this.url}/factors/${params.factorId}/verify`, {
                body,
                headers: this.headers,
                jwt: (_a2 = sessionData === null || sessionData === void 0 ? void 0 : sessionData.session) === null || _a2 === void 0 ? void 0 : _a2.access_token
              });
              if (error3) {
                return this._returnResult({ data: null, error: error3 });
              }
              await this._saveSession(Object.assign({ expires_at: Math.round(Date.now() / 1e3) + data.expires_in }, data));
              await this._notifyAllSubscribers("MFA_CHALLENGE_VERIFIED", data);
              return this._returnResult({ data, error: error3 });
            });
          } catch (error3) {
            if (isAuthError(error3)) {
              return this._returnResult({ data: null, error: error3 });
            }
            throw error3;
          }
        });
      }
      async _challenge(params) {
        return this._acquireLock(-1, async () => {
          try {
            return await this._useSession(async (result) => {
              var _a2;
              const { data: sessionData, error: sessionError } = result;
              if (sessionError) {
                return this._returnResult({ data: null, error: sessionError });
              }
              const response = await _request(this.fetch, "POST", `${this.url}/factors/${params.factorId}/challenge`, {
                body: params,
                headers: this.headers,
                jwt: (_a2 = sessionData === null || sessionData === void 0 ? void 0 : sessionData.session) === null || _a2 === void 0 ? void 0 : _a2.access_token
              });
              if (response.error) {
                return response;
              }
              const { data } = response;
              if (data.type !== "webauthn") {
                return { data, error: null };
              }
              switch (data.webauthn.type) {
                case "create":
                  return {
                    data: Object.assign(Object.assign({}, data), { webauthn: Object.assign(Object.assign({}, data.webauthn), { credential_options: Object.assign(Object.assign({}, data.webauthn.credential_options), { publicKey: deserializeCredentialCreationOptions(data.webauthn.credential_options.publicKey) }) }) }),
                    error: null
                  };
                case "request":
                  return {
                    data: Object.assign(Object.assign({}, data), { webauthn: Object.assign(Object.assign({}, data.webauthn), { credential_options: Object.assign(Object.assign({}, data.webauthn.credential_options), { publicKey: deserializeCredentialRequestOptions(data.webauthn.credential_options.publicKey) }) }) }),
                    error: null
                  };
              }
            });
          } catch (error3) {
            if (isAuthError(error3)) {
              return this._returnResult({ data: null, error: error3 });
            }
            throw error3;
          }
        });
      }
      /**
       * {@see GoTrueMFAApi#challengeAndVerify}
       */
      async _challengeAndVerify(params) {
        const { data: challengeData, error: challengeError } = await this._challenge({
          factorId: params.factorId
        });
        if (challengeError) {
          return this._returnResult({ data: null, error: challengeError });
        }
        return await this._verify({
          factorId: params.factorId,
          challengeId: challengeData.id,
          code: params.code
        });
      }
      /**
       * {@see GoTrueMFAApi#listFactors}
       */
      async _listFactors() {
        var _a2;
        const { data: { user }, error: userError } = await this.getUser();
        if (userError) {
          return { data: null, error: userError };
        }
        const data = {
          all: [],
          phone: [],
          totp: [],
          webauthn: []
        };
        for (const factor of (_a2 = user === null || user === void 0 ? void 0 : user.factors) !== null && _a2 !== void 0 ? _a2 : []) {
          data.all.push(factor);
          if (factor.status === "verified") {
            ;
            data[factor.factor_type].push(factor);
          }
        }
        return {
          data,
          error: null
        };
      }
      /**
       * {@see GoTrueMFAApi#getAuthenticatorAssuranceLevel}
       */
      async _getAuthenticatorAssuranceLevel() {
        var _a2, _b;
        const { data: { session }, error: sessionError } = await this.getSession();
        if (sessionError) {
          return this._returnResult({ data: null, error: sessionError });
        }
        if (!session) {
          return {
            data: { currentLevel: null, nextLevel: null, currentAuthenticationMethods: [] },
            error: null
          };
        }
        const { payload } = decodeJWT(session.access_token);
        let currentLevel = null;
        if (payload.aal) {
          currentLevel = payload.aal;
        }
        let nextLevel = currentLevel;
        const verifiedFactors = (_b = (_a2 = session.user.factors) === null || _a2 === void 0 ? void 0 : _a2.filter((factor) => factor.status === "verified")) !== null && _b !== void 0 ? _b : [];
        if (verifiedFactors.length > 0) {
          nextLevel = "aal2";
        }
        const currentAuthenticationMethods = payload.amr || [];
        return { data: { currentLevel, nextLevel, currentAuthenticationMethods }, error: null };
      }
      /**
       * Retrieves details about an OAuth authorization request.
       * Only relevant when the OAuth 2.1 server is enabled in Supabase Auth.
       *
       * Returns authorization details including client info, scopes, and user information.
       * If the API returns a redirect_uri, it means consent was already given - the caller
       * should handle the redirect manually if needed.
       */
      async _getAuthorizationDetails(authorizationId) {
        try {
          return await this._useSession(async (result) => {
            const { data: { session }, error: sessionError } = result;
            if (sessionError) {
              return this._returnResult({ data: null, error: sessionError });
            }
            if (!session) {
              return this._returnResult({ data: null, error: new AuthSessionMissingError() });
            }
            return await _request(this.fetch, "GET", `${this.url}/oauth/authorizations/${authorizationId}`, {
              headers: this.headers,
              jwt: session.access_token,
              xform: /* @__PURE__ */ __name2((data) => ({ data, error: null }), "xform")
            });
          });
        } catch (error3) {
          if (isAuthError(error3)) {
            return this._returnResult({ data: null, error: error3 });
          }
          throw error3;
        }
      }
      /**
       * Approves an OAuth authorization request.
       * Only relevant when the OAuth 2.1 server is enabled in Supabase Auth.
       */
      async _approveAuthorization(authorizationId, options) {
        try {
          return await this._useSession(async (result) => {
            const { data: { session }, error: sessionError } = result;
            if (sessionError) {
              return this._returnResult({ data: null, error: sessionError });
            }
            if (!session) {
              return this._returnResult({ data: null, error: new AuthSessionMissingError() });
            }
            const response = await _request(this.fetch, "POST", `${this.url}/oauth/authorizations/${authorizationId}/consent`, {
              headers: this.headers,
              jwt: session.access_token,
              body: { action: "approve" },
              xform: /* @__PURE__ */ __name2((data) => ({ data, error: null }), "xform")
            });
            if (response.data && response.data.redirect_url) {
              if (isBrowser() && !(options === null || options === void 0 ? void 0 : options.skipBrowserRedirect)) {
                window.location.assign(response.data.redirect_url);
              }
            }
            return response;
          });
        } catch (error3) {
          if (isAuthError(error3)) {
            return this._returnResult({ data: null, error: error3 });
          }
          throw error3;
        }
      }
      /**
       * Denies an OAuth authorization request.
       * Only relevant when the OAuth 2.1 server is enabled in Supabase Auth.
       */
      async _denyAuthorization(authorizationId, options) {
        try {
          return await this._useSession(async (result) => {
            const { data: { session }, error: sessionError } = result;
            if (sessionError) {
              return this._returnResult({ data: null, error: sessionError });
            }
            if (!session) {
              return this._returnResult({ data: null, error: new AuthSessionMissingError() });
            }
            const response = await _request(this.fetch, "POST", `${this.url}/oauth/authorizations/${authorizationId}/consent`, {
              headers: this.headers,
              jwt: session.access_token,
              body: { action: "deny" },
              xform: /* @__PURE__ */ __name2((data) => ({ data, error: null }), "xform")
            });
            if (response.data && response.data.redirect_url) {
              if (isBrowser() && !(options === null || options === void 0 ? void 0 : options.skipBrowserRedirect)) {
                window.location.assign(response.data.redirect_url);
              }
            }
            return response;
          });
        } catch (error3) {
          if (isAuthError(error3)) {
            return this._returnResult({ data: null, error: error3 });
          }
          throw error3;
        }
      }
      /**
       * Lists all OAuth grants that the authenticated user has authorized.
       * Only relevant when the OAuth 2.1 server is enabled in Supabase Auth.
       */
      async _listOAuthGrants() {
        try {
          return await this._useSession(async (result) => {
            const { data: { session }, error: sessionError } = result;
            if (sessionError) {
              return this._returnResult({ data: null, error: sessionError });
            }
            if (!session) {
              return this._returnResult({ data: null, error: new AuthSessionMissingError() });
            }
            return await _request(this.fetch, "GET", `${this.url}/user/oauth/grants`, {
              headers: this.headers,
              jwt: session.access_token,
              xform: /* @__PURE__ */ __name2((data) => ({ data, error: null }), "xform")
            });
          });
        } catch (error3) {
          if (isAuthError(error3)) {
            return this._returnResult({ data: null, error: error3 });
          }
          throw error3;
        }
      }
      /**
       * Revokes a user's OAuth grant for a specific client.
       * Only relevant when the OAuth 2.1 server is enabled in Supabase Auth.
       */
      async _revokeOAuthGrant(options) {
        try {
          return await this._useSession(async (result) => {
            const { data: { session }, error: sessionError } = result;
            if (sessionError) {
              return this._returnResult({ data: null, error: sessionError });
            }
            if (!session) {
              return this._returnResult({ data: null, error: new AuthSessionMissingError() });
            }
            await _request(this.fetch, "DELETE", `${this.url}/user/oauth/grants`, {
              headers: this.headers,
              jwt: session.access_token,
              query: { client_id: options.clientId },
              noResolveJson: true
            });
            return { data: {}, error: null };
          });
        } catch (error3) {
          if (isAuthError(error3)) {
            return this._returnResult({ data: null, error: error3 });
          }
          throw error3;
        }
      }
      async fetchJwk(kid, jwks = { keys: [] }) {
        let jwk = jwks.keys.find((key) => key.kid === kid);
        if (jwk) {
          return jwk;
        }
        const now = Date.now();
        jwk = this.jwks.keys.find((key) => key.kid === kid);
        if (jwk && this.jwks_cached_at + JWKS_TTL > now) {
          return jwk;
        }
        const { data, error: error3 } = await _request(this.fetch, "GET", `${this.url}/.well-known/jwks.json`, {
          headers: this.headers
        });
        if (error3) {
          throw error3;
        }
        if (!data.keys || data.keys.length === 0) {
          return null;
        }
        this.jwks = data;
        this.jwks_cached_at = now;
        jwk = data.keys.find((key) => key.kid === kid);
        if (!jwk) {
          return null;
        }
        return jwk;
      }
      /**
       * Extracts the JWT claims present in the access token by first verifying the
       * JWT against the server's JSON Web Key Set endpoint
       * `/.well-known/jwks.json` which is often cached, resulting in significantly
       * faster responses. Prefer this method over {@link #getUser} which always
       * sends a request to the Auth server for each JWT.
       *
       * If the project is not using an asymmetric JWT signing key (like ECC or
       * RSA) it always sends a request to the Auth server (similar to {@link
       * #getUser}) to verify the JWT.
       *
       * @param jwt An optional specific JWT you wish to verify, not the one you
       *            can obtain from {@link #getSession}.
       * @param options Various additional options that allow you to customize the
       *                behavior of this method.
       */
      async getClaims(jwt, options = {}) {
        try {
          let token = jwt;
          if (!token) {
            const { data, error: error3 } = await this.getSession();
            if (error3 || !data.session) {
              return this._returnResult({ data: null, error: error3 });
            }
            token = data.session.access_token;
          }
          const { header, payload, signature, raw: { header: rawHeader, payload: rawPayload } } = decodeJWT(token);
          if (!(options === null || options === void 0 ? void 0 : options.allowExpired)) {
            validateExp(payload.exp);
          }
          const signingKey = !header.alg || header.alg.startsWith("HS") || !header.kid || !("crypto" in globalThis && "subtle" in globalThis.crypto) ? null : await this.fetchJwk(header.kid, (options === null || options === void 0 ? void 0 : options.keys) ? { keys: options.keys } : options === null || options === void 0 ? void 0 : options.jwks);
          if (!signingKey) {
            const { error: error3 } = await this.getUser(token);
            if (error3) {
              throw error3;
            }
            return {
              data: {
                claims: payload,
                header,
                signature
              },
              error: null
            };
          }
          const algorithm = getAlgorithm(header.alg);
          const publicKey = await crypto.subtle.importKey("jwk", signingKey, algorithm, true, [
            "verify"
          ]);
          const isValid = await crypto.subtle.verify(algorithm, publicKey, signature, stringToUint8Array(`${rawHeader}.${rawPayload}`));
          if (!isValid) {
            throw new AuthInvalidJwtError("Invalid JWT signature");
          }
          return {
            data: {
              claims: payload,
              header,
              signature
            },
            error: null
          };
        } catch (error3) {
          if (isAuthError(error3)) {
            return this._returnResult({ data: null, error: error3 });
          }
          throw error3;
        }
      }
    };
    GoTrueClient.nextInstanceID = {};
    GoTrueClient_default = GoTrueClient;
  }
});
var init_AuthAdminApi = __esm({
  "../node_modules/@supabase/auth-js/dist/module/AuthAdminApi.js"() {
    init_functionsRoutes_0_04524570753253654();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_GoTrueAdminApi();
  }
});
var AuthClient;
var AuthClient_default;
var init_AuthClient = __esm({
  "../node_modules/@supabase/auth-js/dist/module/AuthClient.js"() {
    init_functionsRoutes_0_04524570753253654();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_GoTrueClient();
    AuthClient = GoTrueClient_default;
    AuthClient_default = AuthClient;
  }
});
var init_module4 = __esm({
  "../node_modules/@supabase/auth-js/dist/module/index.js"() {
    init_functionsRoutes_0_04524570753253654();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_GoTrueAdminApi();
    init_GoTrueClient();
    init_AuthAdminApi();
    init_AuthClient();
    init_types3();
    init_errors3();
    init_locks();
  }
});
var SupabaseAuthClient;
var init_SupabaseAuthClient = __esm({
  "../node_modules/@supabase/supabase-js/dist/module/lib/SupabaseAuthClient.js"() {
    init_functionsRoutes_0_04524570753253654();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_module4();
    SupabaseAuthClient = class extends AuthClient_default {
      static {
        __name(this, "SupabaseAuthClient");
      }
      static {
        __name2(this, "SupabaseAuthClient");
      }
      constructor(options) {
        super(options);
      }
    };
  }
});
var SupabaseClient;
var init_SupabaseClient = __esm({
  "../node_modules/@supabase/supabase-js/dist/module/SupabaseClient.js"() {
    init_functionsRoutes_0_04524570753253654();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_module();
    init_wrapper();
    init_module2();
    init_module3();
    init_constants6();
    init_fetch3();
    init_helpers3();
    init_SupabaseAuthClient();
    SupabaseClient = class {
      static {
        __name(this, "SupabaseClient");
      }
      static {
        __name2(this, "SupabaseClient");
      }
      /**
       * Create a new client for use in the browser.
       * @param supabaseUrl The unique Supabase URL which is supplied when you create a new project in your project dashboard.
       * @param supabaseKey The unique Supabase Key which is supplied when you create a new project in your project dashboard.
       * @param options.db.schema You can switch in between schemas. The schema needs to be on the list of exposed schemas inside Supabase.
       * @param options.auth.autoRefreshToken Set to "true" if you want to automatically refresh the token before expiring.
       * @param options.auth.persistSession Set to "true" if you want to automatically save the user session into local storage.
       * @param options.auth.detectSessionInUrl Set to "true" if you want to automatically detects OAuth grants in the URL and signs in the user.
       * @param options.realtime Options passed along to realtime-js constructor.
       * @param options.storage Options passed along to the storage-js constructor.
       * @param options.global.fetch A custom fetch implementation.
       * @param options.global.headers Any additional headers to send with each network request.
       * @example
       * ```ts
       * import { createClient } from '@supabase/supabase-js'
       *
       * const supabase = createClient('https://xyzcompany.supabase.co', 'public-anon-key')
       * const { data } = await supabase.from('profiles').select('*')
       * ```
       */
      constructor(supabaseUrl, supabaseKey, options) {
        var _a2, _b, _c;
        this.supabaseUrl = supabaseUrl;
        this.supabaseKey = supabaseKey;
        const baseUrl = validateSupabaseUrl(supabaseUrl);
        if (!supabaseKey)
          throw new Error("supabaseKey is required.");
        this.realtimeUrl = new URL("realtime/v1", baseUrl);
        this.realtimeUrl.protocol = this.realtimeUrl.protocol.replace("http", "ws");
        this.authUrl = new URL("auth/v1", baseUrl);
        this.storageUrl = new URL("storage/v1", baseUrl);
        this.functionsUrl = new URL("functions/v1", baseUrl);
        const defaultStorageKey = `sb-${baseUrl.hostname.split(".")[0]}-auth-token`;
        const DEFAULTS = {
          db: DEFAULT_DB_OPTIONS,
          realtime: DEFAULT_REALTIME_OPTIONS,
          auth: Object.assign(Object.assign({}, DEFAULT_AUTH_OPTIONS), { storageKey: defaultStorageKey }),
          global: DEFAULT_GLOBAL_OPTIONS
        };
        const settings = applySettingDefaults(options !== null && options !== void 0 ? options : {}, DEFAULTS);
        this.storageKey = (_a2 = settings.auth.storageKey) !== null && _a2 !== void 0 ? _a2 : "";
        this.headers = (_b = settings.global.headers) !== null && _b !== void 0 ? _b : {};
        if (!settings.accessToken) {
          this.auth = this._initSupabaseAuthClient((_c = settings.auth) !== null && _c !== void 0 ? _c : {}, this.headers, settings.global.fetch);
        } else {
          this.accessToken = settings.accessToken;
          this.auth = new Proxy({}, {
            get: /* @__PURE__ */ __name2((_, prop) => {
              throw new Error(`@supabase/supabase-js: Supabase Client is configured with the accessToken option, accessing supabase.auth.${String(prop)} is not possible`);
            }, "get")
          });
        }
        this.fetch = fetchWithAuth(supabaseKey, this._getAccessToken.bind(this), settings.global.fetch);
        this.realtime = this._initRealtimeClient(Object.assign({ headers: this.headers, accessToken: this._getAccessToken.bind(this) }, settings.realtime));
        if (this.accessToken) {
          this.accessToken().then((token) => this.realtime.setAuth(token)).catch((e) => console.warn("Failed to set initial Realtime auth token:", e));
        }
        this.rest = new PostgrestClient(new URL("rest/v1", baseUrl).href, {
          headers: this.headers,
          schema: settings.db.schema,
          fetch: this.fetch
        });
        this.storage = new StorageClient(this.storageUrl.href, this.headers, this.fetch, options === null || options === void 0 ? void 0 : options.storage);
        if (!settings.accessToken) {
          this._listenForAuthEvents();
        }
      }
      /**
       * Supabase Functions allows you to deploy and invoke edge functions.
       */
      get functions() {
        return new FunctionsClient(this.functionsUrl.href, {
          headers: this.headers,
          customFetch: this.fetch
        });
      }
      /**
       * Perform a query on a table or a view.
       *
       * @param relation - The table or view name to query
       */
      from(relation) {
        return this.rest.from(relation);
      }
      // NOTE: signatures must be kept in sync with PostgrestClient.schema
      /**
       * Select a schema to query or perform an function (rpc) call.
       *
       * The schema needs to be on the list of exposed schemas inside Supabase.
       *
       * @param schema - The schema to query
       */
      schema(schema) {
        return this.rest.schema(schema);
      }
      // NOTE: signatures must be kept in sync with PostgrestClient.rpc
      /**
       * Perform a function call.
       *
       * @param fn - The function name to call
       * @param args - The arguments to pass to the function call
       * @param options - Named parameters
       * @param options.head - When set to `true`, `data` will not be returned.
       * Useful if you only need the count.
       * @param options.get - When set to `true`, the function will be called with
       * read-only access mode.
       * @param options.count - Count algorithm to use to count rows returned by the
       * function. Only applicable for [set-returning
       * functions](https://www.postgresql.org/docs/current/functions-srf.html).
       *
       * `"exact"`: Exact but slow count algorithm. Performs a `COUNT(*)` under the
       * hood.
       *
       * `"planned"`: Approximated but fast count algorithm. Uses the Postgres
       * statistics under the hood.
       *
       * `"estimated"`: Uses exact count for low numbers and planned count for high
       * numbers.
       */
      rpc(fn, args = {}, options = {
        head: false,
        get: false,
        count: void 0
      }) {
        return this.rest.rpc(fn, args, options);
      }
      /**
       * Creates a Realtime channel with Broadcast, Presence, and Postgres Changes.
       *
       * @param {string} name - The name of the Realtime channel.
       * @param {Object} opts - The options to pass to the Realtime channel.
       *
       */
      channel(name, opts = { config: {} }) {
        return this.realtime.channel(name, opts);
      }
      /**
       * Returns all Realtime channels.
       */
      getChannels() {
        return this.realtime.getChannels();
      }
      /**
       * Unsubscribes and removes Realtime channel from Realtime client.
       *
       * @param {RealtimeChannel} channel - The name of the Realtime channel.
       *
       */
      removeChannel(channel2) {
        return this.realtime.removeChannel(channel2);
      }
      /**
       * Unsubscribes and removes all Realtime channels from Realtime client.
       */
      removeAllChannels() {
        return this.realtime.removeAllChannels();
      }
      async _getAccessToken() {
        var _a2, _b;
        if (this.accessToken) {
          return await this.accessToken();
        }
        const { data } = await this.auth.getSession();
        return (_b = (_a2 = data.session) === null || _a2 === void 0 ? void 0 : _a2.access_token) !== null && _b !== void 0 ? _b : this.supabaseKey;
      }
      _initSupabaseAuthClient({ autoRefreshToken, persistSession, detectSessionInUrl, storage, userStorage, storageKey, flowType, lock, debug: debug3, throwOnError }, headers, fetch2) {
        const authHeaders = {
          Authorization: `Bearer ${this.supabaseKey}`,
          apikey: `${this.supabaseKey}`
        };
        return new SupabaseAuthClient({
          url: this.authUrl.href,
          headers: Object.assign(Object.assign({}, authHeaders), headers),
          storageKey,
          autoRefreshToken,
          persistSession,
          detectSessionInUrl,
          storage,
          userStorage,
          flowType,
          lock,
          debug: debug3,
          throwOnError,
          fetch: fetch2,
          // auth checks if there is a custom authorizaiton header using this flag
          // so it knows whether to return an error when getUser is called with no session
          hasCustomAuthorizationHeader: Object.keys(this.headers).some((key) => key.toLowerCase() === "authorization")
        });
      }
      _initRealtimeClient(options) {
        return new RealtimeClient(this.realtimeUrl.href, Object.assign(Object.assign({}, options), { params: Object.assign({ apikey: this.supabaseKey }, options === null || options === void 0 ? void 0 : options.params) }));
      }
      _listenForAuthEvents() {
        const data = this.auth.onAuthStateChange((event, session) => {
          this._handleTokenChanged(event, "CLIENT", session === null || session === void 0 ? void 0 : session.access_token);
        });
        return data;
      }
      _handleTokenChanged(event, source, token) {
        if ((event === "TOKEN_REFRESHED" || event === "SIGNED_IN") && this.changedAccessToken !== token) {
          this.changedAccessToken = token;
          this.realtime.setAuth(token);
        } else if (event === "SIGNED_OUT") {
          this.realtime.setAuth();
          if (source == "STORAGE")
            this.auth.signOut();
          this.changedAccessToken = void 0;
        }
      }
    };
  }
});
function shouldShowDeprecationWarning() {
  if (typeof window !== "undefined") {
    return false;
  }
  if (typeof process === "undefined") {
    return false;
  }
  const processVersion = process["version"];
  if (processVersion === void 0 || processVersion === null) {
    return false;
  }
  const versionMatch = processVersion.match(/^v(\d+)\./);
  if (!versionMatch) {
    return false;
  }
  const majorVersion = parseInt(versionMatch[1], 10);
  return majorVersion <= 18;
}
__name(shouldShowDeprecationWarning, "shouldShowDeprecationWarning");
var createClient;
var init_module5 = __esm({
  "../node_modules/@supabase/supabase-js/dist/module/index.js"() {
    init_functionsRoutes_0_04524570753253654();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_SupabaseClient();
    init_module4();
    init_wrapper();
    init_module2();
    createClient = /* @__PURE__ */ __name2((supabaseUrl, supabaseKey, options) => {
      return new SupabaseClient(supabaseUrl, supabaseKey, options);
    }, "createClient");
    __name2(shouldShowDeprecationWarning, "shouldShowDeprecationWarning");
    if (shouldShowDeprecationWarning()) {
      console.warn(`\u26A0\uFE0F  Node.js 18 and below are deprecated and will no longer be supported in future versions of @supabase/supabase-js. Please upgrade to Node.js 20 or later. For more information, visit: https://github.com/orgs/supabase/discussions/37217`);
    }
  }
});
function readEnv() {
  const rawUrl = String(process.env.SUPABASE_URL || process.env.SUPABASE_PROJECT_REF || "").trim();
  const serviceRoleKey = String(
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || ""
  ).trim();
  let url = rawUrl;
  if (url && !/^https?:\/\//i.test(url)) {
    if (/^[a-z0-9]{20}$/i.test(url)) {
      url = `https://${url}.supabase.co`;
    } else if (/supabase\.co/i.test(url)) {
      url = `https://${url}`;
    }
  }
  return { url, serviceRoleKey };
}
__name(readEnv, "readEnv");
function getSupabaseAdminClient() {
  if (attempted) return cachedClient || null;
  attempted = true;
  const { url, serviceRoleKey } = readEnv();
  if (!url || !serviceRoleKey) {
    cachedClient = null;
    return null;
  }
  cachedClient = createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
  return cachedClient;
}
__name(getSupabaseAdminClient, "getSupabaseAdminClient");
var cachedClient;
var attempted;
var init_supabase_admin = __esm({
  "../backend/lib/supabase-admin.js"() {
    init_functionsRoutes_0_04524570753253654();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_module5();
    attempted = false;
    __name2(readEnv, "readEnv");
    __name2(getSupabaseAdminClient, "getSupabaseAdminClient");
  }
});
function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}
__name(normalizeEmail, "normalizeEmail");
function normalizeFullName(value) {
  return String(value || "").trim().slice(0, 80);
}
__name(normalizeFullName, "normalizeFullName");
function normalizeUsername(value) {
  const normalized = String(value || "").trim().replace(/^@+/, "").toLowerCase().replace(/['\u2019]/g, "").replace(/[^a-z0-9_]+/g, "_").replace(/_+/g, "_").replace(/^_+|_+$/g, "").slice(0, 30);
  return normalized.length >= 3 ? normalized : "";
}
__name(normalizeUsername, "normalizeUsername");
function isValidEmail(value) {
  return /\S+@\S+\.\S+/.test(String(value || "").trim());
}
__name(isValidEmail, "isValidEmail");
function isValidUsername(value) {
  return /^[a-z0-9_]{3,30}$/.test(String(value || ""));
}
__name(isValidUsername, "isValidUsername");
function shouldStripProfileColumn(error3, columnName) {
  return String(error3?.message || "").toLowerCase().includes(String(columnName || "").toLowerCase());
}
__name(shouldStripProfileColumn, "shouldStripProfileColumn");
function mapSupabaseSignupError(error3) {
  const message = String(error3?.message || "").trim() || "Signup failed";
  const normalized = message.toLowerCase();
  if (normalized.includes("already registered") || normalized.includes("already been registered")) {
    return { status: 409, message: "This email is already registered. Please log in instead." };
  }
  if (normalized.includes("invalid api key")) {
    return { status: 503, message: "Signup is temporarily unavailable because the server auth key is invalid." };
  }
  if (normalized.includes("password")) return { status: 400, message };
  if (normalized.includes("email")) return { status: 400, message };
  return { status: Number(error3?.status || 500) || 500, message };
}
__name(mapSupabaseSignupError, "mapSupabaseSignupError");
function readQuery2(req) {
  if (req.query && typeof req.query === "object") return req.query;
  try {
    const url = new URL(req.url || "", "http://localhost");
    return Object.fromEntries(url.searchParams.entries());
  } catch (_error) {
    return {};
  }
}
__name(readQuery2, "readQuery2");
function readPathParts2(query) {
  const rawPath = query?.path;
  if (Array.isArray(rawPath)) return rawPath.filter(Boolean);
  return String(rawPath || "").split("/").filter(Boolean);
}
__name(readPathParts2, "readPathParts2");
async function handler2(req, res) {
  const query = readQuery2(req);
  const pathParts = readPathParts2(query);
  const section = String(pathParts[0] || "").trim().toLowerCase();
  const method = String(req.method || "GET").toUpperCase();
  if (!section || section === "health" && method === "GET") {
    return res.status(200).json({
      ok: true,
      service: "auth",
      supabase_admin: Boolean(getSupabaseAdminClient())
    });
  }
  if (section === "password-signup" && method === "POST") {
    try {
      const fullName = normalizeFullName(req.body?.fullName);
      const username = normalizeUsername(req.body?.username);
      const email = normalizeEmail(req.body?.email);
      const password = String(req.body?.password || "");
      const onboardingCompletedAt = (/* @__PURE__ */ new Date()).toISOString();
      if (!fullName || fullName.length < 2) {
        return res.status(400).json({ success: false, message: "Full name is required." });
      }
      if (!isValidUsername(username)) {
        return res.status(400).json({
          success: false,
          message: "Username must be 3-30 characters and use only letters, numbers, or underscores."
        });
      }
      if (!isValidEmail(email)) {
        return res.status(400).json({ success: false, message: "Please provide a valid email address." });
      }
      if (password.length < 8) {
        return res.status(400).json({ success: false, message: "Password must be at least 8 characters." });
      }
      const admin = getSupabaseAdminClient();
      if (!admin) {
        return res.status(500).json({
          success: false,
          message: "Signup service is not configured."
        });
      }
      const existingUsername = await admin.from("user_profiles").select("id").eq("username", username).limit(1);
      if (existingUsername.error) {
        return res.status(500).json({
          success: false,
          message: existingUsername.error.message || "Could not verify username availability."
        });
      }
      if (Array.isArray(existingUsername.data) && existingUsername.data.length > 0) {
        return res.status(409).json({
          success: false,
          message: "That username is already taken."
        });
      }
      const { data, error: error3 } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          full_name: fullName,
          name: fullName,
          username,
          zo2y_username: username,
          onboarding_completed_at: onboardingCompletedAt,
          zo2y_onboarded_at: onboardingCompletedAt
        }
      });
      if (error3 || !data?.user?.id) {
        const mapped = mapSupabaseSignupError(error3);
        return res.status(mapped.status).json({
          success: false,
          message: mapped.message
        });
      }
      const profilePayload = {
        id: data.user.id,
        user_id: data.user.id,
        username,
        full_name: fullName,
        onboarding_completed_at: onboardingCompletedAt,
        created_at: onboardingCompletedAt,
        updated_at: onboardingCompletedAt
      };
      let profileWrite = await admin.from("user_profiles").upsert(profilePayload, { onConflict: "id" });
      if (profileWrite.error && (shouldStripProfileColumn(profileWrite.error, "user_id") || shouldStripProfileColumn(profileWrite.error, "onboarding_completed_at"))) {
        const fallbackPayload = { ...profilePayload };
        if (shouldStripProfileColumn(profileWrite.error, "user_id")) delete fallbackPayload.user_id;
        if (shouldStripProfileColumn(profileWrite.error, "onboarding_completed_at")) delete fallbackPayload.onboarding_completed_at;
        profileWrite = await admin.from("user_profiles").upsert(fallbackPayload, { onConflict: "id" });
      }
      if (profileWrite.error) {
        return res.status(500).json({
          success: false,
          message: profileWrite.error.message || "Account was created, but the profile could not be saved."
        });
      }
      return res.status(201).json({
        success: true,
        user: {
          id: data.user.id,
          email: data.user.email || email,
          full_name: fullName,
          username
        }
      });
    } catch (error3) {
      return res.status(500).json({
        success: false,
        message: error3?.message || "Signup failed"
      });
    }
  }
  return res.status(404).json({ message: "Not found" });
}
__name(handler2, "handler2");
var init_auth_handler = __esm({
  "../api/auth-handler.js"() {
    init_functionsRoutes_0_04524570753253654();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_supabase_admin();
    __name2(normalizeEmail, "normalizeEmail");
    __name2(normalizeFullName, "normalizeFullName");
    __name2(normalizeUsername, "normalizeUsername");
    __name2(isValidEmail, "isValidEmail");
    __name2(isValidUsername, "isValidUsername");
    __name2(shouldStripProfileColumn, "shouldStripProfileColumn");
    __name2(mapSupabaseSignupError, "mapSupabaseSignupError");
    __name2(readQuery2, "readQuery");
    __name2(readPathParts2, "readPathParts");
    __name2(handler2, "handler");
  }
});
function getBooksKey() {
  return String(process.env.GOOGLE_BOOKS_KEY || "").trim();
}
__name(getBooksKey, "getBooksKey");
function clampInt(value, min, max, fallback) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, Math.floor(n)));
}
__name(clampInt, "clampInt");
function toHttpsUrl(value) {
  return String(value || "").replace(/^http:\/\//i, "https://").trim();
}
__name(toHttpsUrl, "toHttpsUrl");
function normalizeBook(input) {
  if (!input) return null;
  const title2 = String(input?.title || input?.name || "").trim();
  if (!title2) return null;
  const rawId = String(input?.id || "").trim();
  const rawKey = String(input?.key || "").trim();
  const googleId = String(input?._googleVolumeId || "").trim();
  const idFromKey = rawKey.startsWith("/works/") ? rawKey.replace("/works/", "").trim() : rawKey;
  const id = rawId || googleId || idFromKey || "";
  const authorCandidate = Array.isArray(input?.author_name) ? String(input.author_name[0] || "").trim() : String(input?.author || input?.authors || "").trim();
  const author = authorCandidate || "Unknown author";
  const year = Number(input?.first_publish_year || input?.published_year || input?.year || 0) || null;
  const coverCandidate = toHttpsUrl(input?.cover || input?.coverImage || input?.thumbnail || input?._googleThumbnail || "");
  const cover = coverCandidate || DEFAULT_BOOK_COVER;
  const source = String(input?._source || input?.source || "").trim() || (googleId ? "google-books" : rawKey ? "openlibrary" : "book");
  return { id, title: title2, author, year, cover, source };
}
__name(normalizeBook, "normalizeBook");
function dedupeBooks(rows = [], limit = 20) {
  const seen = /* @__PURE__ */ new Set();
  const out = [];
  for (const row of Array.isArray(rows) ? rows : []) {
    if (!row) continue;
    const title2 = String(row?.title || "").trim().toLowerCase();
    const author = String(row?.author || "").trim().toLowerCase();
    const id = String(row?.id || "").trim().toLowerCase();
    const key = id || `${title2}::${author}`;
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(row);
    if (out.length >= limit) break;
  }
  return out;
}
__name(dedupeBooks, "dedupeBooks");
function normalizePublishedDate(value) {
  if (value === void 0 || value === null) return null;
  if (typeof value === "number" && Number.isFinite(value)) {
    const year = Math.floor(value);
    if (year > 0) return `${year}-01-01`;
  }
  const raw = String(value || "").trim();
  if (!raw) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  const yearMatch = raw.match(/\d{4}/);
  if (yearMatch) return `${yearMatch[0]}-01-01`;
  return null;
}
__name(normalizePublishedDate, "normalizePublishedDate");
function normalizeAuthors(value) {
  if (Array.isArray(value)) {
    const joined = value.map((entry) => String(entry || "").trim()).filter(Boolean).join(", ");
    return joined || null;
  }
  const text = String(value || "").trim();
  return text || null;
}
__name(normalizeAuthors, "normalizeAuthors");
function normalizeCategories(value) {
  if (!value) return [];
  const raw = Array.isArray(value) ? value : [value];
  return raw.map((entry) => String(entry || "").trim()).filter(Boolean).slice(0, 40);
}
__name(normalizeCategories, "normalizeCategories");
function sanitizeBookPayload(body = {}) {
  const id = String(body.id || body.book_id || body.bookId || "").trim();
  if (!id) return null;
  const titleRaw = String(body.title || body.name || "").trim();
  const title2 = titleRaw || `Book ${id}`;
  const authors = normalizeAuthors(body.authors || body.author_name || body.author || body.subtitle);
  const thumbnail = toHttpsUrl(body.thumbnail || body.image || body.cover || "");
  const publishedDate = normalizePublishedDate(
    body.published_date || body.first_publish_date || body.first_publish_year || body.published || body.year
  );
  const categories = normalizeCategories(body.categories || body.subject);
  const description = String(body.description || "").trim();
  const pageCount = Number(body.page_count || body.pageCount || 0);
  const publisher = String(body.publisher || "").trim();
  return {
    id,
    title: title2,
    authors: authors || null,
    thumbnail: thumbnail || null,
    published_date: publishedDate,
    categories: categories.length ? categories : null,
    description: description || null,
    page_count: Number.isFinite(pageCount) && pageCount > 0 ? Math.floor(pageCount) : null,
    publisher: publisher || null,
    updated_at: (/* @__PURE__ */ new Date()).toISOString()
  };
}
__name(sanitizeBookPayload, "sanitizeBookPayload");
function getSupabasePublicKeyFromReq(req) {
  const headerGetter = req && typeof req.get === "function" ? req : null;
  const headersObj = req?.headers && typeof req.headers === "object" ? req.headers : {};
  const direct = headerGetter ? String(headerGetter.get(SUPABASE_KEY_HEADER) || "").trim() : "";
  const alt = headerGetter ? String(headerGetter.get("apikey") || headerGetter.get("x-supabase-anon-key") || "").trim() : "";
  const fromObj = String(headersObj[SUPABASE_KEY_HEADER] || headersObj[SUPABASE_KEY_HEADER.toLowerCase()] || "").trim() || String(headersObj.apikey || headersObj["x-supabase-anon-key"] || "").trim();
  return String(direct || alt || fromObj || "").trim();
}
__name(getSupabasePublicKeyFromReq, "getSupabasePublicKeyFromReq");
async function testBooksWriteRls({ supabaseUrl, apikey, bearerToken }) {
  if (!supabaseUrl || !apikey || !bearerToken) {
    return { ok: false, configured: false, status: 0, message: "Missing SUPABASE_URL / apikey / bearer token" };
  }
  const id = `diag-${Date.now()}`;
  const url = `${supabaseUrl.replace(/\/+$/, "")}/rest/v1/books`;
  try {
    const upstream = await fetch(url, {
      method: "POST",
      headers: {
        apikey,
        Authorization: `Bearer ${bearerToken}`,
        Prefer: "return=minimal,tx=rollback",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        id,
        title: "diag",
        authors: "diag",
        updated_at: (/* @__PURE__ */ new Date()).toISOString()
      })
    });
    if (upstream.ok) {
      return { ok: true, configured: true, status: upstream.status };
    }
    const text = await upstream.text().catch(() => "");
    return {
      ok: false,
      configured: true,
      status: upstream.status,
      message: text || `Books write failed (${upstream.status})`
    };
  } catch (error3) {
    return { ok: false, configured: true, status: 0, message: error3?.message || "Network error" };
  }
}
__name(testBooksWriteRls, "testBooksWriteRls");
function pushQueryParam(params, key, value) {
  if (value === void 0 || value === null) return;
  if (Array.isArray(value)) {
    value.forEach((entry) => {
      if (entry === void 0 || entry === null) return;
      params.append(key, String(entry));
    });
    return;
  }
  params.append(key, String(value));
}
__name(pushQueryParam, "pushQueryParam");
function buildGoogleQuery(params = {}) {
  const qRaw = String(params?.q || "").trim();
  const title2 = String(params?.title || "").trim();
  const author = String(params?.author || "").trim();
  const subject = String(params?.subject || "").trim();
  const year = String(params?.first_publish_year || params?.year || "").trim();
  const chunks = [];
  if (qRaw) chunks.push(qRaw);
  if (title2) chunks.push(`intitle:"${title2}"`);
  if (author) chunks.push(`inauthor:"${author}"`);
  if (subject) chunks.push(`subject:${subject}`);
  if (year) chunks.push(year);
  return chunks.join(" ").trim();
}
__name(buildGoogleQuery, "buildGoogleQuery");
function buildOpenLibraryCoverUrl(doc = {}, size = "L") {
  const safeSize = ["S", "M", "L"].includes(String(size || "").toUpperCase()) ? String(size || "L").toUpperCase() : "L";
  const coverId = Number(doc?.cover_i || 0) || 0;
  if (coverId > 0) {
    return `https://covers.openlibrary.org/b/id/${encodeURIComponent(String(coverId))}-${safeSize}.jpg`;
  }
  const isbnRaw = Array.isArray(doc?.isbn) ? String(doc.isbn[0] || "").trim() : "";
  const isbn = isbnRaw.replace(/[^0-9Xx]/g, "");
  if (isbn) {
    return `https://covers.openlibrary.org/b/isbn/${encodeURIComponent(isbn)}-${safeSize}.jpg`;
  }
  return "";
}
__name(buildOpenLibraryCoverUrl, "buildOpenLibraryCoverUrl");
function normalizeGoogleBookDoc(volume, idx = 0) {
  const info3 = volume?.volumeInfo || {};
  const title2 = String(info3?.title || `Book ${idx + 1}`).trim();
  if (!title2) return null;
  const authorNames = Array.isArray(info3?.authors) ? info3.authors.map((name) => String(name || "").trim()).filter(Boolean) : [];
  const published = String(info3?.publishedDate || "").trim();
  const yearMatch = published.match(/\d{4}/);
  const year = yearMatch ? Number(yearMatch[0]) : null;
  const categories = Array.isArray(info3?.categories) ? info3.categories.map((entry) => String(entry || "").trim()).filter(Boolean) : [];
  const publisher = String(info3?.publisher || "").trim();
  const identifiers = Array.isArray(info3?.industryIdentifiers) ? info3.industryIdentifiers : [];
  const isbn = identifiers.map((entry) => String(entry?.identifier || "").replace(/[^0-9Xx]/g, "")).filter(Boolean);
  const thumb = toHttpsUrl(info3?.imageLinks?.thumbnail || info3?.imageLinks?.smallThumbnail || "");
  const previewLink = toHttpsUrl(info3?.previewLink || "");
  const infoLink = toHttpsUrl(info3?.infoLink || "");
  return {
    key: "",
    title: title2,
    author_name: authorNames.length ? authorNames : ["Unknown author"],
    first_publish_year: Number.isFinite(year) ? year : null,
    isbn,
    subject: categories,
    publisher: publisher ? [publisher] : [],
    cover_i: null,
    coverImage: thumb || "",
    _googleThumbnail: thumb || "",
    _googleVolumeId: String(volume?.id || "").trim(),
    _source: "google-books",
    _previewLink: previewLink,
    _infoLink: infoLink
  };
}
__name(normalizeGoogleBookDoc, "normalizeGoogleBookDoc");
function normalizeOpenLibraryDoc(doc, idx = 0) {
  const title2 = String(doc?.title || `Book ${idx + 1}`).trim();
  if (!title2) return null;
  const authorNames = Array.isArray(doc?.author_name) ? doc.author_name.map((name) => String(name || "").trim()).filter(Boolean) : [];
  const coverId = Number(doc?.cover_i || 0) || null;
  const firstYear = Number(doc?.first_publish_year || 0) || null;
  const isbn = Array.isArray(doc?.isbn) ? doc.isbn.map((entry) => String(entry || "").replace(/[^0-9Xx]/g, "")).filter(Boolean) : [];
  const publishers = Array.isArray(doc?.publisher) ? doc.publisher.map((entry) => String(entry || "").trim()).filter(Boolean) : [];
  const subjects = Array.isArray(doc?.subject) ? doc.subject.map((entry) => String(entry || "").trim()).filter(Boolean) : [];
  const key = String(doc?.key || "").trim();
  const coverImage = buildOpenLibraryCoverUrl({ cover_i: coverId, isbn }, "L");
  return {
    key,
    title: title2,
    author_name: authorNames.length ? authorNames : ["Unknown author"],
    first_publish_year: firstYear,
    isbn,
    subject: subjects,
    publisher: publishers,
    cover_i: coverId,
    coverImage: coverImage || "",
    _googleThumbnail: "",
    _googleVolumeId: "",
    _source: "openlibrary"
  };
}
__name(normalizeOpenLibraryDoc, "normalizeOpenLibraryDoc");
function dedupeDocs(rows = [], limit = 20) {
  const seen = /* @__PURE__ */ new Set();
  const out = [];
  for (const row of rows) {
    if (!row) continue;
    const title2 = String(row?.title || "").trim().toLowerCase();
    const author = String((Array.isArray(row?.author_name) ? row.author_name[0] : "") || "").trim().toLowerCase();
    const key = `${title2}::${author}`;
    if (!title2 || seen.has(key)) continue;
    seen.add(key);
    out.push(row);
    if (out.length >= limit) break;
  }
  return out;
}
__name(dedupeDocs, "dedupeDocs");
function hasUsableCover(doc) {
  const googleThumb = toHttpsUrl(doc?._googleThumbnail || doc?.coverImage || "");
  if (googleThumb) return true;
  return !!buildOpenLibraryCoverUrl(doc, "L");
}
__name(hasUsableCover, "hasUsableCover");
async function fetchWithRetry(url, init = {}, attempts = 3) {
  let lastError = null;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 9e3 + attempt * 1200);
    try {
      const res = await fetch(url, { ...init, signal: controller.signal });
      clearTimeout(timeoutId);
      const retryable2 = res.status === 429 || res.status >= 500;
      if (!retryable2 || attempt === attempts - 1) return res;
      lastError = new Error(`HTTP ${res.status}`);
    } catch (error3) {
      clearTimeout(timeoutId);
      lastError = error3;
    }
    if (attempt < attempts - 1) {
      await new Promise((resolve) => setTimeout(resolve, 280 * (attempt + 1)));
    }
  }
  if (lastError) throw lastError;
  throw new Error("Upstream request failed");
}
__name(fetchWithRetry, "fetchWithRetry");
async function fetchGoogleDocs(params = {}) {
  const key = getBooksKey();
  const query = buildGoogleQuery(params);
  if (!query) return { docs: [], numFound: 0, source: "google-books" };
  const limit = clampInt(params.limit, 1, 40, 20);
  const page = clampInt(params.page, 1, 1e3, 1);
  const startIndex = clampInt(params.startIndex, 0, 2e3, (page - 1) * limit);
  const orderBy = String(params.orderBy || "").trim();
  let lang = String(params.language || params.lang || "en").trim().toLowerCase();
  if (lang === "eng") lang = "en";
  if (lang.length > 2) lang = lang.slice(0, 2);
  const url = new URL(`${GOOGLE_BOOKS_BASE}/volumes`);
  url.searchParams.set("q", query);
  url.searchParams.set("printType", "books");
  if (lang) url.searchParams.set("langRestrict", lang);
  url.searchParams.set("maxResults", String(limit));
  url.searchParams.set("startIndex", String(Math.max(0, startIndex)));
  if (orderBy === "newest" || orderBy === "relevance") {
    url.searchParams.set("orderBy", orderBy);
  }
  if (key) url.searchParams.set("key", key);
  const upstream = await fetchWithRetry(url.toString(), { headers: { Accept: "application/json" } }, 3);
  if (!upstream.ok) {
    return { docs: [], numFound: 0, source: "google-books" };
  }
  const json3 = await upstream.json();
  const items = Array.isArray(json3?.items) ? json3.items : [];
  const docs = items.map((entry, idx) => normalizeGoogleBookDoc(entry, idx)).filter(Boolean);
  const totalItems = Number(json3?.totalItems || 0);
  return {
    docs,
    numFound: Number.isFinite(totalItems) && totalItems > 0 ? totalItems : docs.length,
    source: "google-books"
  };
}
__name(fetchGoogleDocs, "fetchGoogleDocs");
async function fetchOpenLibraryDocs(params = {}) {
  const limit = clampInt(params.limit, 1, 40, 20);
  const page = clampInt(params.page, 1, 1e3, 1);
  const q = String(params.q || "").trim();
  const title2 = String(params.title || "").trim();
  const author = String(params.author || "").trim();
  const subject = String(params.subject || "").trim();
  const year = String(params.first_publish_year || params.year || "").trim();
  const url = new URL(`${OPEN_LIBRARY_BASE}/search.json`);
  if (q) url.searchParams.set("q", q);
  if (!q && title2) url.searchParams.set("title", title2);
  if (author) url.searchParams.set("author", author);
  if (subject) url.searchParams.set("subject", subject);
  if (year) url.searchParams.set("first_publish_year", year);
  if (!q && !title2 && !author && !subject && !year) {
    url.searchParams.set("q", "bestseller");
  }
  if (String(params.language || "").trim()) {
    url.searchParams.set("language", String(params.language).trim());
  } else {
    url.searchParams.set("language", "eng");
  }
  url.searchParams.set("limit", String(limit));
  url.searchParams.set("page", String(page));
  const upstream = await fetchWithRetry(url.toString(), { headers: { Accept: "application/json" } }, 3);
  if (!upstream.ok) {
    return { docs: [], numFound: 0, source: "openlibrary" };
  }
  const json3 = await upstream.json();
  const docsRaw = Array.isArray(json3?.docs) ? json3.docs : [];
  const docs = docsRaw.map((doc, idx) => normalizeOpenLibraryDoc(doc, idx)).filter(Boolean);
  return {
    docs,
    numFound: Number(json3?.numFound || 0) || docs.length,
    source: "openlibrary"
  };
}
__name(fetchOpenLibraryDocs, "fetchOpenLibraryDocs");
async function enrichMissingCoversWithGoogle(docs = [], maxLookups = 8) {
  if (!Array.isArray(docs) || !docs.length) return docs;
  const indexed = docs.map((doc, index2) => ({ doc, index: index2 }));
  const candidates = indexed.filter(({ doc }) => !hasUsableCover(doc)).slice(0, maxLookups);
  if (!candidates.length) return docs;
  const patches = await Promise.all(
    candidates.map(async ({ doc, index: index2 }) => {
      const qParts = [];
      const title2 = String(doc?.title || "").trim();
      const author = String((Array.isArray(doc?.author_name) ? doc.author_name[0] : "") || "").trim();
      if (title2) qParts.push(`intitle:"${title2}"`);
      if (author) qParts.push(`inauthor:"${author}"`);
      const q = qParts.join(" ").trim() || [title2, author].filter(Boolean).join(" ");
      if (!q) return { index: index2, patch: null };
      try {
        const google = await fetchGoogleDocs({ q, limit: 1, page: 1, orderBy: "relevance" });
        const best = Array.isArray(google.docs) ? google.docs[0] : null;
        if (!best) return { index: index2, patch: null };
        return {
          index: index2,
          patch: {
            ...doc,
            isbn: Array.isArray(doc?.isbn) && doc.isbn.length ? doc.isbn : best.isbn || [],
            first_publish_year: doc?.first_publish_year || best.first_publish_year || null,
            _googleThumbnail: toHttpsUrl(best._googleThumbnail || best.coverImage || ""),
            _googleVolumeId: String(best._googleVolumeId || "").trim(),
            coverImage: toHttpsUrl(best.coverImage || best._googleThumbnail || "")
          }
        };
      } catch (_err) {
        return { index: index2, patch: null };
      }
    })
  );
  if (!patches.some((entry) => entry?.patch)) return docs;
  const nextDocs = docs.slice();
  patches.forEach((entry) => {
    if (!entry?.patch) return;
    nextDocs[entry.index] = entry.patch;
  });
  return nextDocs;
}
__name(enrichMissingCoversWithGoogle, "enrichMissingCoversWithGoogle");
function readQuery3(req) {
  if (req.query && typeof req.query === "object") return req.query;
  try {
    const url = new URL(req.url || "", "http://localhost");
    return Object.fromEntries(url.searchParams.entries());
  } catch (_error) {
    return {};
  }
}
__name(readQuery3, "readQuery3");
function readPathParts3(query) {
  const rawPath = query?.path;
  if (Array.isArray(rawPath)) return rawPath.filter(Boolean);
  return String(rawPath || "").split("/").filter(Boolean);
}
__name(readPathParts3, "readPathParts3");
function getBearerToken(req) {
  const raw = String(
    req?.headers?.authorization || req?.headers?.Authorization || ""
  ).trim();
  if (!/^bearer\s+/i.test(raw)) return "";
  return raw.replace(/^bearer\s+/i, "").trim();
}
__name(getBearerToken, "getBearerToken");
async function readJsonBody2(req) {
  if (req.body && typeof req.body === "object") return req.body;
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }
  if (!chunks.length) return null;
  const text = Buffer.concat(chunks).toString("utf8");
  try {
    return JSON.parse(text);
  } catch (_error) {
    return null;
  }
}
__name(readJsonBody2, "readJsonBody2");
async function handler3(req, res) {
  const query = readQuery3(req);
  const pathParts = readPathParts3(query);
  const rawSection = String(pathParts[0] || "").trim().toLowerCase();
  const section = rawSection.replace(/\.json$/i, "");
  if (!section) {
    return res.json({ ok: true, service: "books-proxy", configured: !!getBooksKey() });
  }
  if (section === "diagnostics") {
    const supabaseUrl = String(process.env.SUPABASE_URL || "").trim();
    const serviceRoleSet = Boolean(String(process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || "").trim());
    const anonFromEnv = String(process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "").trim();
    const anonFromHeader = getSupabasePublicKeyFromReq(req);
    const apikey = anonFromEnv || anonFromHeader;
    const bearerToken = getBearerToken(req);
    const rlsProbe = bearerToken && apikey && supabaseUrl ? await testBooksWriteRls({ supabaseUrl, apikey, bearerToken }) : { ok: false, configured: false, status: 0, message: "Send Authorization + apikey to test RLS" };
    return res.json({
      ok: true,
      supabase: {
        url_set: Boolean(supabaseUrl),
        service_role_set: serviceRoleSet,
        anon_key_set: Boolean(anonFromEnv),
        anon_key_from_header: Boolean(anonFromHeader)
      },
      rls_probe: rlsProbe,
      hint_rls_fix_sql: "sql/books_rls_write_policy.sql"
    });
  }
  if (section === "sync" && String(req.method || "").toUpperCase() === "POST") {
    try {
      let client = getSupabaseAdminClient();
      const body = await readJsonBody2(req);
      const payload = sanitizeBookPayload(body || {});
      if (!payload) {
        return res.status(400).json({ ok: false, message: "Missing book id" });
      }
      if (!client) {
        const supabaseUrl = String(process.env.SUPABASE_URL || "").trim();
        const supabaseAnonKey = String(process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "").trim() || getSupabasePublicKeyFromReq(req);
        const bearerToken = getBearerToken(req);
        if (supabaseUrl && supabaseAnonKey && bearerToken) {
          client = createClient(supabaseUrl, supabaseAnonKey, {
            global: { headers: { Authorization: `Bearer ${bearerToken}` } },
            auth: { persistSession: false, autoRefreshToken: false }
          });
        } else {
          const urlSet = Boolean(supabaseUrl);
          const serviceRoleSet = Boolean(String(process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || "").trim());
          const anonSet = Boolean(supabaseAnonKey);
          return res.status(503).json({
            ok: false,
            message: "Supabase admin not configured",
            hint: `Provide SUPABASE_SERVICE_ROLE_KEY, or send Authorization + ${SUPABASE_KEY_HEADER} with a Supabase publishable/anon key.`,
            required_env: ["SUPABASE_URL"],
            required_secrets: ["SUPABASE_SERVICE_ROLE_KEY"],
            optional_fallback_env: ["SUPABASE_ANON_KEY"],
            supabase_url_set: urlSet,
            supabase_service_role_set: serviceRoleSet,
            supabase_anon_set: anonSet
          });
        }
      }
      const { error: error3 } = await client.from("books").upsert(payload, { onConflict: "id" });
      if (error3) {
        const isRls = String(error3?.code || "").trim() === "42501" || String(error3?.message || "").toLowerCase().includes("row-level security") || String(error3?.message || "").toLowerCase().includes("permission");
        return res.status(isRls ? 403 : 500).json({
          ok: false,
          message: error3.message || "Book sync failed",
          code: error3.code || null,
          details: error3.details || null,
          hint: isRls ? "RLS blocked book upsert. Apply sql/books_rls_write_policy.sql" : null
        });
      }
      return res.json({ ok: true });
    } catch (error3) {
      return res.status(500).json({ ok: false, message: error3?.message || "Book sync error" });
    }
  }
  if (section === "search") {
    try {
      const limit = clampInt(query.limit, 1, 40, 20);
      const page = clampInt(query.page, 1, 1e3, 1);
      const orderByRaw = String(query.orderBy || "").trim().toLowerCase();
      const orderBy = orderByRaw === "newest" ? "newest" : "relevance";
      const params = {
        q: query.q,
        title: query.title,
        author: query.author,
        subject: query.subject,
        first_publish_year: query.first_publish_year,
        year: query.year,
        language: query.language,
        limit,
        page,
        orderBy
      };
      const google = await fetchGoogleDocs(params);
      let source = google.source;
      let docs = Array.isArray(google.docs) ? google.docs : [];
      let numFound = Number(google.numFound || 0);
      if (docs.length < limit) {
        const open3 = await fetchOpenLibraryDocs(params);
        if (Array.isArray(open3.docs) && open3.docs.length) {
          docs = dedupeDocs([...docs, ...open3.docs], limit);
          numFound = Math.max(numFound, Number(open3.numFound || docs.length), docs.length);
          source = docs.length > (google.docs?.length || 0) ? "google-books+openlibrary" : source;
        }
      }
      const enriched = await enrichMissingCoversWithGoogle(docs, 8);
      const books = dedupeBooks(enriched.map(normalizeBook).filter(Boolean), limit);
      return res.json({
        ok: true,
        books,
        meta: {
          source,
          page,
          limit,
          numFound: Math.max(numFound, books.length)
        }
      });
    } catch (error3) {
      return res.status(502).json({ message: error3?.message || "Book search failed" });
    }
  }
  if (section === "popular") {
    try {
      const limit = clampInt(query.limit, 1, 40, 20);
      const page = clampInt(query.page, 1, 1e3, 1);
      const subject = String(query.subject || "fiction").trim() || "fiction";
      const q = String(query.q || "").trim() || `subject:${subject}`;
      const google = await fetchGoogleDocs({
        q,
        limit,
        page,
        language: String(query.language || "en").trim() || "en",
        orderBy: String(query.orderBy || "relevance").trim() || "relevance"
      });
      let docs = Array.isArray(google.docs) ? google.docs : [];
      let source = google.source;
      let numFound = Number(google.numFound || 0);
      if (docs.length < limit) {
        const open3 = await fetchOpenLibraryDocs({
          q: String(query.fallback_q || query.q || subject || "fiction"),
          subject,
          limit,
          page: 1,
          language: "eng"
        });
        if (Array.isArray(open3.docs) && open3.docs.length) {
          docs = dedupeDocs([...docs, ...open3.docs], limit);
          numFound = Math.max(numFound, Number(open3.numFound || docs.length), docs.length);
          source = "google-books+openlibrary";
        }
      }
      res.setHeader("Cache-Control", "public, max-age=120, s-maxage=600, stale-while-revalidate=1200");
      const enriched = await enrichMissingCoversWithGoogle(docs, 8);
      const books = dedupeBooks(enriched.map(normalizeBook).filter(Boolean), limit);
      return res.json({
        ok: true,
        books,
        meta: {
          source,
          query: q,
          page,
          limit,
          numFound: Math.max(numFound, books.length)
        }
      });
    } catch (error3) {
      return res.status(502).json({ message: error3?.message || "Popular books request failed" });
    }
  }
  if (section === "trending") {
    try {
      const periodRaw = String(query.period || "weekly").trim().toLowerCase();
      const period = ["daily", "weekly", "monthly"].includes(periodRaw) ? periodRaw : "weekly";
      const limit = clampInt(query.limit, 1, 40, 20);
      const url = new URL(`${OPEN_LIBRARY_BASE}/trending/${period}.json`);
      const upstream = await fetchWithRetry(url.toString(), { headers: { Accept: "application/json" } }, 3);
      const json3 = upstream.ok ? await upstream.json() : {};
      const works = Array.isArray(json3?.works) ? json3.works : [];
      let docs = dedupeDocs(
        works.map((work, idx) => normalizeOpenLibraryDoc(work, idx)).filter(Boolean),
        limit
      );
      if (!docs.length) {
        const popular = await fetchGoogleDocs({
          q: "subject:fiction",
          orderBy: "relevance",
          limit,
          page: 1,
          language: "en"
        });
        docs = Array.isArray(popular.docs) ? popular.docs : [];
        res.setHeader("Cache-Control", "public, max-age=120, s-maxage=600, stale-while-revalidate=1200");
        const enriched2 = await enrichMissingCoversWithGoogle(docs, 8);
        const books2 = dedupeBooks(enriched2.map(normalizeBook).filter(Boolean), limit);
        return res.json({
          ok: true,
          books: books2,
          meta: {
            source: "google-books-fallback",
            period,
            limit,
            numFound: books2.length
          }
        });
      }
      res.setHeader("Cache-Control", "public, max-age=120, s-maxage=600, stale-while-revalidate=1200");
      const enriched = await enrichMissingCoversWithGoogle(docs, 8);
      const books = dedupeBooks(enriched.map(normalizeBook).filter(Boolean), limit);
      return res.json({
        ok: true,
        books,
        meta: {
          source: "openlibrary-trending",
          period,
          limit,
          numFound: books.length
        }
      });
    } catch (error3) {
      return res.status(502).json({ message: error3?.message || "Trending books request failed" });
    }
  }
  if (section) {
    try {
      const key = getBooksKey();
      const relativePath = pathParts.join("/");
      const url = new URL(`${GOOGLE_BOOKS_BASE}/${relativePath}`);
      Object.entries(query || {}).forEach(([paramKey, value]) => {
        if (paramKey === "path") return;
        pushQueryParam(url.searchParams, paramKey, value);
      });
      if (key && !url.searchParams.get("key")) {
        url.searchParams.set("key", key);
      }
      let lastError = null;
      for (let attempt = 0; attempt < 3; attempt += 1) {
        try {
          const booksRes = await fetch(url.toString());
          const text = await booksRes.text();
          const retryable2 = booksRes.status === 429 || booksRes.status >= 500;
          if (!retryable2 || attempt === 2) {
            res.status(booksRes.status);
            res.setHeader("content-type", booksRes.headers.get("content-type") || "application/json; charset=utf-8");
            return res.send(text);
          }
          lastError = new Error(`Google Books error ${booksRes.status}: ${text}`);
        } catch (error3) {
          lastError = error3;
        }
        if (attempt < 2) {
          await new Promise((resolve) => setTimeout(resolve, 250 * (attempt + 1)));
        }
      }
      return res.status(502).json({ message: lastError?.message || "Books proxy upstream failure" });
    } catch (error3) {
      return res.status(500).json({ message: error3.message || "Books proxy error" });
    }
  }
  return res.status(404).json({ message: "Not found" });
}
__name(handler3, "handler3");
var import_dotenv2;
var GOOGLE_BOOKS_BASE;
var OPEN_LIBRARY_BASE;
var SUPABASE_KEY_HEADER;
var DEFAULT_BOOK_COVER;
var init_books_handler = __esm({
  "../api/books-handler.js"() {
    init_functionsRoutes_0_04524570753253654();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    import_dotenv2 = __toESM(require_main(), 1);
    init_module5();
    init_supabase_admin();
    import_dotenv2.default.config();
    import_dotenv2.default.config({ path: "backend/.env" });
    import_dotenv2.default.config({ path: "backend/authRoutes/.env" });
    GOOGLE_BOOKS_BASE = "https://www.googleapis.com/books/v1";
    OPEN_LIBRARY_BASE = "https://openlibrary.org";
    SUPABASE_KEY_HEADER = "x-zo2y-supabase-key";
    DEFAULT_BOOK_COVER = "/images/patterns/open-book-01.svg";
    __name2(getBooksKey, "getBooksKey");
    __name2(clampInt, "clampInt");
    __name2(toHttpsUrl, "toHttpsUrl");
    __name2(normalizeBook, "normalizeBook");
    __name2(dedupeBooks, "dedupeBooks");
    __name2(normalizePublishedDate, "normalizePublishedDate");
    __name2(normalizeAuthors, "normalizeAuthors");
    __name2(normalizeCategories, "normalizeCategories");
    __name2(sanitizeBookPayload, "sanitizeBookPayload");
    __name2(getSupabasePublicKeyFromReq, "getSupabasePublicKeyFromReq");
    __name2(testBooksWriteRls, "testBooksWriteRls");
    __name2(pushQueryParam, "pushQueryParam");
    __name2(buildGoogleQuery, "buildGoogleQuery");
    __name2(buildOpenLibraryCoverUrl, "buildOpenLibraryCoverUrl");
    __name2(normalizeGoogleBookDoc, "normalizeGoogleBookDoc");
    __name2(normalizeOpenLibraryDoc, "normalizeOpenLibraryDoc");
    __name2(dedupeDocs, "dedupeDocs");
    __name2(hasUsableCover, "hasUsableCover");
    __name2(fetchWithRetry, "fetchWithRetry");
    __name2(fetchGoogleDocs, "fetchGoogleDocs");
    __name2(fetchOpenLibraryDocs, "fetchOpenLibraryDocs");
    __name2(enrichMissingCoversWithGoogle, "enrichMissingCoversWithGoogle");
    __name2(readQuery3, "readQuery");
    __name2(readPathParts3, "readPathParts");
    __name2(getBearerToken, "getBearerToken");
    __name2(readJsonBody2, "readJsonBody");
    __name2(handler3, "handler");
  }
});
function assertEmailConfig() {
  if (!process.env.RESEND_API_KEY) {
    throw new Error("Missing RESEND_API_KEY");
  }
  if (!process.env.EMAIL_FROM) {
    throw new Error("Missing EMAIL_FROM");
  }
}
__name(assertEmailConfig, "assertEmailConfig");
function escapeHtml(value) {
  return String(value || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\"/g, "&quot;").replace(/'/g, "&#039;");
}
__name(escapeHtml, "escapeHtml");
function baseTemplate({ title: title2, subtitle, bodyHtml, ctaLabel, ctaUrl, footerText, preheader }) {
  const safeTitle = escapeHtml(title2);
  const safeSubtitle = escapeHtml(subtitle);
  const safeFooter = escapeHtml(footerText || "You are receiving this email because you have a Zo2y account.");
  const safeCtaLabel = escapeHtml(ctaLabel || "Open Zo2y");
  const safeCtaUrl = escapeHtml(ctaUrl || process.env.APP_BASE_URL || "https://zo2y.com");
  const safePreheader = escapeHtml(preheader || subtitle || title2 || "Zo2y update");
  const baseUrl = String(process.env.APP_BASE_URL || "https://zo2y.com").replace(/\/+$/, "");
  const safeLogoUrl = escapeHtml(`${baseUrl}/newlogo.webp`);
  const safeSupportAddress = escapeHtml(process.env.EMAIL_REPLY_TO || "darkpastadude@gmail.com");
  return `
  <html>
    <head>
      <meta name="viewport" content="width=device-width,initial-scale=1" />
      <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
      <style>
        body { margin: 0; padding: 0; background: #061022; }
        .outer { width: 100%; background: #061022; padding: 22px 10px; }
        .container { width: 100%; max-width: 660px; margin: 0 auto; border-radius: 20px; overflow: hidden; border: 1px solid #d9e1f2; background: #ffffff; }
        .hero {
          background: radial-gradient(130% 90% at 0% 0%, #27488d 0%, #132347 56%, #102347 100%);
          color: #ffffff;
          padding: 30px 30px 24px 30px;
        }
        .pill { display: inline-block; padding: 7px 12px; border: 1px solid rgba(255,255,255,0.35); border-radius: 999px; color: #e2e8f0; font-size: 12px; }
        .hero-title { margin: 16px 0 8px 0; font-size: 40px; line-height: 1.1; font-weight: 800; letter-spacing: -0.02em; }
        .hero-sub { margin: 0; font-size: 18px; line-height: 1.5; color: #dbeafe; }
        .brand-row { margin-bottom: 10px; }
        .brand-logo { width: 52px; height: 52px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.4); display: block; }
        .discover {
          margin-top: 18px;
          border: 1px solid rgba(255,255,255,0.3);
          border-radius: 14px;
          background: rgba(255,255,255,0.08);
          padding: 16px;
        }
        .discover-title { font-size: 13px; font-weight: 700; color: #fde68a; margin-bottom: 10px; }
        .chips { line-height: 2; }
        .chip {
          display: inline-block;
          border-radius: 999px;
          padding: 6px 11px;
          margin-right: 6px;
          margin-bottom: 6px;
          background: rgba(255,255,255,0.15);
          color: #f8fafc;
          font-size: 15px;
        }
        .content { padding: 28px 30px 12px 30px; color: #334155; font-size: 24px; line-height: 1.66; }
        .action { padding: 10px 30px 26px 30px; }
        .btn {
          display: inline-block;
          text-decoration: none;
          background: linear-gradient(135deg, #f59e0b, #d97706);
          color: #111827;
          font-weight: 800;
          font-size: 16px;
          padding: 14px 18px;
          border-radius: 12px;
        }
        .grid { padding: 0 30px 24px 30px; }
        .grid-box {
          width: 100%;
          border: 1px solid #dbe4f2;
          border-radius: 12px;
          background: #f8fafc;
        }
        .grid-row { font-size: 14px; color: #1e293b; padding: 11px 14px; border-bottom: 1px solid #e2e8f0; }
        .grid-row:last-child { border-bottom: none; }
        .footer { border-top: 1px solid #e2e8f0; padding: 16px 30px 26px 30px; color: #64748b; font-size: 12px; line-height: 1.55; }
        @media only screen and (max-width: 620px) {
          .outer { padding: 0 !important; }
          .container { border-radius: 0 !important; border-left: none !important; border-right: none !important; }
          .hero { padding: 22px 18px 18px 18px !important; }
          .hero-title { font-size: 32px !important; line-height: 1.1 !important; }
          .hero-sub { font-size: 17px !important; }
          .chip { font-size: 14px !important; }
          .content { padding: 20px 18px 8px 18px !important; font-size: 21px !important; line-height: 1.6 !important; }
          .action { padding: 10px 18px 18px 18px !important; }
          .grid { padding: 0 18px 18px 18px !important; }
          .footer { padding: 14px 18px 24px 18px !important; }
        }
      </style>
    </head>
    <body>
      <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${safePreheader}</div>
      <div class="outer">
        <table role="presentation" class="container" cellpadding="0" cellspacing="0">
          <tr>
            <td class="hero">
              <div class="brand-row">
                <table role="presentation" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="vertical-align:middle;">
                      <img src="${safeLogoUrl}" alt="Zo2y" class="brand-logo" />
                    </td>
                    <td style="vertical-align:middle;padding-left:12px;">
                      <div style="font-size:26px;font-weight:800;letter-spacing:-0.02em;color:#ffffff;">Zo2y</div>
                      <div style="font-size:13px;color:#cbd5e1;">Official account email</div>
                    </td>
                  </tr>
                </table>
              </div>
              <span class="pill">Zo2y Updates</span>
              <h1 class="hero-title">${safeTitle}</h1>
              <p class="hero-sub">${safeSubtitle}</p>
              <div class="discover">
                <div class="discover-title">Discover</div>
                <div class="chips">
                  <span class="chip">Places</span>
                  <span class="chip">Movies</span>
                  <span class="chip">Music</span>
                  <span class="chip">Books</span>
                </div>
              </div>
            </td>
          </tr>
          <tr>
            <td class="content">${bodyHtml}</td>
          </tr>
          <tr>
            <td class="action">
              <a href="${safeCtaUrl}" class="btn">${safeCtaLabel}</a>
            </td>
          </tr>
          <tr>
            <td class="grid">
              <table role="presentation" class="grid-box" cellpadding="0" cellspacing="0">
                <tr><td class="grid-row">Save to custom lists in one tap</td></tr>
                <tr><td class="grid-row">Follow friends and discover new picks</td></tr>
                <tr><td class="grid-row">Get reminders when your lists need updates</td></tr>
              </table>
            </td>
          </tr>
          <tr>
            <td class="footer">${safeFooter}<br /><br />Need help? Reply to this email or contact ${safeSupportAddress}.</td>
          </tr>
        </table>
      </div>
    </body>
  </html>`;
}
__name(baseTemplate, "baseTemplate");
function buildWelcomeEmail({ name, appUrl }) {
  const safeName = escapeHtml(name || "there");
  const safeAppUrl = appUrl || process.env.APP_BASE_URL || "https://zo2y.com";
  return {
    subject: "Welcome to Zo2y",
    text: `Welcome to Zo2y, ${safeName}. Start building your lists at ${safeAppUrl}.`,
    html: baseTemplate({
      title: "Welcome to Zo2y",
      subtitle: "Track favorites, build custom lists, and follow friends.",
      preheader: "Your Zo2y account is ready. Start building lists across every category.",
      bodyHtml: `
        <p style="margin:0 0 10px 0;">Hi ${safeName},</p>
        <p style="margin:0 0 10px 0;">Your account is ready. You can start saving places, movies, books, games, and music into custom lists.</p>
        <p style="margin:0;">Use your profile to follow friends and discover what they are enjoying.</p>
      `,
      ctaLabel: "Open Zo2y",
      ctaUrl: safeAppUrl,
      footerText: "If you did not create this account, you can ignore this email."
    })
  };
}
__name(buildWelcomeEmail, "buildWelcomeEmail");
function buildReminderEmail({ name, reminderText, actionUrl, actionLabel }) {
  const safeName = escapeHtml(name || "there");
  const safeReminderText = escapeHtml(reminderText || "You have items waiting in your lists.");
  return {
    subject: "Zo2y reminder",
    text: `Hi ${safeName}, ${safeReminderText}`,
    html: baseTemplate({
      title: "Friendly Reminder",
      subtitle: "Your lists are waiting for you.",
      preheader: safeReminderText,
      bodyHtml: `
        <p style="margin:0 0 10px 0;">Hi ${safeName},</p>
        <p style="margin:0;">${safeReminderText}</p>
      `,
      ctaLabel: actionLabel || "Continue on Zo2y",
      ctaUrl: actionUrl || process.env.APP_BASE_URL || "https://zo2y.com"
    })
  };
}
__name(buildReminderEmail, "buildReminderEmail");
async function sendEmail({ to, subject, html, text, tags = [] }) {
  assertEmailConfig();
  const response = await fetch(RESEND_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      text,
      reply_to: process.env.EMAIL_REPLY_TO || void 0,
      tags: tags.length ? tags : void 0
    })
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = data?.message || data?.error || `Email send failed with ${response.status}`;
    throw new Error(message);
  }
  return data;
}
__name(sendEmail, "sendEmail");
async function sendWelcomeEmail({ to, name, appUrl }) {
  const payload = buildWelcomeEmail({ name, appUrl });
  return sendEmail({
    to,
    subject: payload.subject,
    html: payload.html,
    text: payload.text,
    tags: [{ name: "type", value: "welcome" }]
  });
}
__name(sendWelcomeEmail, "sendWelcomeEmail");
async function sendReminderEmail({ to, name, reminderText, actionUrl, actionLabel }) {
  const payload = buildReminderEmail({ name, reminderText, actionUrl, actionLabel });
  return sendEmail({
    to,
    subject: payload.subject,
    html: payload.html,
    text: payload.text,
    tags: [{ name: "type", value: "reminder" }]
  });
}
__name(sendReminderEmail, "sendReminderEmail");
function emailConfigured() {
  return Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);
}
__name(emailConfigured, "emailConfigured");
var RESEND_API_URL;
var init_service = __esm({
  "../backend/lib/email/service.js"() {
    init_functionsRoutes_0_04524570753253654();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    RESEND_API_URL = "https://api.resend.com/emails";
    __name2(assertEmailConfig, "assertEmailConfig");
    __name2(escapeHtml, "escapeHtml");
    __name2(baseTemplate, "baseTemplate");
    __name2(buildWelcomeEmail, "buildWelcomeEmail");
    __name2(buildReminderEmail, "buildReminderEmail");
    __name2(sendEmail, "sendEmail");
    __name2(sendWelcomeEmail, "sendWelcomeEmail");
    __name2(sendReminderEmail, "sendReminderEmail");
    __name2(emailConfigured, "emailConfigured");
  }
});
function getHeader(req, name) {
  const key = String(name || "").toLowerCase();
  if (!key) return "";
  const headers = req?.headers || {};
  const direct = headers[key];
  if (Array.isArray(direct)) return String(direct[0] || "").trim();
  if (direct !== void 0 && direct !== null) return String(direct).trim();
  if (typeof req?.get === "function") {
    return String(req.get(name) || "").trim();
  }
  return "";
}
__name(getHeader, "getHeader");
function normalizeEmail2(value) {
  return String(value || "").trim().toLowerCase();
}
__name(normalizeEmail2, "normalizeEmail2");
function isValidEmail2(value) {
  return /\S+@\S+\.\S+/.test(String(value || "").trim());
}
__name(isValidEmail2, "isValidEmail2");
function normalizeText(value, maxLength = 255) {
  return String(value || "").trim().slice(0, maxLength);
}
__name(normalizeText, "normalizeText");
function readQuery4(req) {
  if (req.query && typeof req.query === "object") return req.query;
  try {
    const url = new URL(req.url || "", "http://localhost");
    return Object.fromEntries(url.searchParams.entries());
  } catch (_error) {
    return {};
  }
}
__name(readQuery4, "readQuery4");
function readPathParts4(query) {
  const rawPath = query?.path;
  if (Array.isArray(rawPath)) return rawPath.filter(Boolean);
  return String(rawPath || "").split("/").filter(Boolean);
}
__name(readPathParts4, "readPathParts4");
async function readJsonBody3(req) {
  if (req.body && typeof req.body === "object") return req.body;
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }
  if (!chunks.length) return {};
  const text = Buffer.concat(chunks).toString("utf8");
  try {
    return JSON.parse(text);
  } catch (_error) {
    return {};
  }
}
__name(readJsonBody3, "readJsonBody3");
function requireEmailApiKey(req) {
  const expected = normalizeText(process.env.EMAIL_API_KEY, 200);
  if (!expected) return true;
  const provided = normalizeText(getHeader(req, "x-email-api-key"), 200);
  return !!provided && provided === expected;
}
__name(requireEmailApiKey, "requireEmailApiKey");
function resolveWelcomeName(user) {
  const metadata = user?.user_metadata || {};
  const fullName = String(
    metadata.full_name || metadata.name || user?.email?.split("@")[0] || "there"
  ).trim();
  return fullName || "there";
}
__name(resolveWelcomeName, "resolveWelcomeName");
function getBearerToken2(req) {
  const authHeader = getHeader(req, "authorization");
  if (!authHeader.toLowerCase().startsWith("bearer ")) return "";
  return authHeader.slice(7).trim();
}
__name(getBearerToken2, "getBearerToken2");
async function getAuthenticatedSupabaseUser(req) {
  const accessToken = getBearerToken2(req);
  if (!accessToken) {
    return { error: "Missing bearer token", status: 401, admin: null, user: null };
  }
  const admin = getSupabaseAdminClient();
  if (!admin) {
    return { error: "Supabase admin client is not configured", status: 500, admin: null, user: null };
  }
  const { data, error: error3 } = await admin.auth.getUser(accessToken);
  if (error3 || !data?.user?.id) {
    return {
      error: error3?.message || "Invalid session",
      status: 401,
      admin,
      user: null
    };
  }
  return { error: null, status: 200, admin, user: data.user };
}
__name(getAuthenticatedSupabaseUser, "getAuthenticatedSupabaseUser");
function json(res, status, body, extraHeaders = {}) {
  Object.entries(extraHeaders || {}).forEach(([key, value]) => {
    if (value !== void 0 && value !== null && value !== "") {
      res.setHeader(key, value);
    }
  });
  return res.status(status).json(body);
}
__name(json, "json");
async function handler4(req, res) {
  try {
    const query = readQuery4(req);
    const pathParts = readPathParts4(query);
    const section = String(pathParts[0] || "").trim().toLowerCase();
    const subSection = String(pathParts[1] || "").trim().toLowerCase();
    const method = String(req.method || "GET").toUpperCase();
    if (!section || section === "health" && method === "GET") {
      return json(res, 200, {
        configured: emailConfigured(),
        hasApiKeyProtection: Boolean(normalizeText(process.env.EMAIL_API_KEY, 200)),
        hasSupabaseAdmin: Boolean(getSupabaseAdminClient())
      });
    }
    if (section === "welcome" && subSection === "trigger" && method === "POST") {
      if (!emailConfigured()) {
        return json(res, 200, {
          success: true,
          status: "skipped_unconfigured"
        });
      }
      const auth = await getAuthenticatedSupabaseUser(req);
      if (auth.error || !auth.user || !auth.admin) {
        return json(res, auth.status || 401, { success: false, message: auth.error || "Unauthorized" });
      }
      const body = await readJsonBody3(req);
      const appUrl = String(body?.appUrl || process.env.APP_BASE_URL || "https://zo2y.com").trim();
      const { data: fullUserData, error: fullUserError } = await auth.admin.auth.admin.getUserById(auth.user.id);
      if (fullUserError || !fullUserData?.user) {
        return json(res, 500, {
          success: false,
          message: fullUserError?.message || "Failed to load authenticated user"
        });
      }
      const fullUser = fullUserData.user;
      const appMetadata = fullUser.app_metadata || {};
      if (appMetadata.zo2y_welcome_email_sent_at) {
        return json(res, 200, {
          success: true,
          status: "already_sent",
          sent_at: appMetadata.zo2y_welcome_email_sent_at
        });
      }
      const to = normalizeEmail2(fullUser.email);
      if (!to || !isValidEmail2(to)) {
        return json(res, 400, { success: false, message: "Authenticated user email is unavailable" });
      }
      const result = await sendWelcomeEmail({
        to,
        name: resolveWelcomeName(fullUser),
        appUrl
      });
      const sentAt = (/* @__PURE__ */ new Date()).toISOString();
      const nextAppMetadata = {
        ...appMetadata,
        zo2y_welcome_email_sent_at: sentAt,
        zo2y_welcome_email_provider: "resend",
        zo2y_welcome_email_message_id: result?.id || null
      };
      const { error: updateError } = await auth.admin.auth.admin.updateUserById(fullUser.id, {
        app_metadata: nextAppMetadata
      });
      if (updateError) {
        return json(res, 500, {
          success: false,
          message: `Welcome email sent but user metadata update failed: ${updateError.message}`
        });
      }
      return json(res, 200, {
        success: true,
        status: "sent",
        sent_at: sentAt,
        message_id: result?.id || null
      });
    }
    if (section === "welcome" && method === "POST") {
      if (!requireEmailApiKey(req)) {
        return json(res, 401, { message: "Unauthorized" });
      }
      const body = await readJsonBody3(req);
      const to = normalizeEmail2(body?.email);
      const name = normalizeText(body?.name, 120);
      const appUrl = String(body?.appUrl || process.env.APP_BASE_URL || "https://zo2y.com").trim();
      if (!to || !isValidEmail2(to)) {
        return json(res, 400, { message: "Valid email is required" });
      }
      const result = await sendWelcomeEmail({ to, name, appUrl });
      return json(res, 200, { success: true, result });
    }
    if (section === "reminder" && method === "POST") {
      if (!requireEmailApiKey(req)) {
        return json(res, 401, { message: "Unauthorized" });
      }
      const body = await readJsonBody3(req);
      const to = normalizeEmail2(body?.email);
      const name = normalizeText(body?.name, 120);
      const reminderText = normalizeText(body?.reminderText, 2e3);
      const actionUrl = String(body?.actionUrl || process.env.APP_BASE_URL || "https://zo2y.com").trim();
      const actionLabel = normalizeText(body?.actionLabel || "Open Zo2y", 120);
      if (!to || !isValidEmail2(to)) {
        return json(res, 400, { message: "Valid email is required" });
      }
      if (!reminderText) {
        return json(res, 400, { message: "reminderText is required" });
      }
      const result = await sendReminderEmail({
        to,
        name,
        reminderText,
        actionUrl,
        actionLabel
      });
      return json(res, 200, { success: true, result });
    }
    if (section === "reminders" && subSection === "bulk" && method === "POST") {
      if (!requireEmailApiKey(req)) {
        return json(res, 401, { message: "Unauthorized" });
      }
      const body = await readJsonBody3(req);
      const recipients = Array.isArray(body?.recipients) ? body.recipients : [];
      const reminderText = normalizeText(body?.reminderText, 2e3);
      const actionUrl = String(body?.actionUrl || process.env.APP_BASE_URL || "https://zo2y.com").trim();
      const actionLabel = normalizeText(body?.actionLabel || "Open Zo2y", 120);
      if (!recipients.length) {
        return json(res, 400, { message: "recipients is required" });
      }
      if (recipients.length > 100) {
        return json(res, 400, { message: "Maximum 100 recipients per request" });
      }
      if (!reminderText) {
        return json(res, 400, { message: "reminderText is required" });
      }
      const results = await Promise.all(recipients.map(async (item) => {
        const to = normalizeEmail2(item?.email);
        const name = normalizeText(item?.name, 120);
        if (!to || !isValidEmail2(to)) {
          return { email: to, success: false, message: "Invalid email" };
        }
        try {
          const result = await sendReminderEmail({
            to,
            name,
            reminderText,
            actionUrl,
            actionLabel
          });
          return { email: to, success: true, result };
        } catch (error3) {
          return { email: to, success: false, message: error3?.message || "Failed" };
        }
      }));
      const sent = results.filter((row) => row.success).length;
      const failed = results.length - sent;
      return json(res, 200, { success: true, sent, failed, results });
    }
    return json(res, 404, { message: "Not found" });
  } catch (error3) {
    return json(res, 500, {
      success: false,
      message: error3?.message || "Failed to handle email request"
    });
  }
}
__name(handler4, "handler4");
var import_dotenv3;
var init_emails_handler = __esm({
  "../api/emails-handler.js"() {
    init_functionsRoutes_0_04524570753253654();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    import_dotenv3 = __toESM(require_main(), 1);
    init_service();
    init_supabase_admin();
    import_dotenv3.default.config();
    import_dotenv3.default.config({ path: "backend/.env" });
    __name2(getHeader, "getHeader");
    __name2(normalizeEmail2, "normalizeEmail");
    __name2(isValidEmail2, "isValidEmail");
    __name2(normalizeText, "normalizeText");
    __name2(readQuery4, "readQuery");
    __name2(readPathParts4, "readPathParts");
    __name2(readJsonBody3, "readJsonBody");
    __name2(requireEmailApiKey, "requireEmailApiKey");
    __name2(resolveWelcomeName, "resolveWelcomeName");
    __name2(getBearerToken2, "getBearerToken");
    __name2(getAuthenticatedSupabaseUser, "getAuthenticatedSupabaseUser");
    __name2(json, "json");
    __name2(handler4, "handler");
  }
});
function bool(value) {
  return Boolean(String(value || "").trim());
}
__name(bool, "bool");
function handler5(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }
  const supabaseUrlSet = bool(process.env.SUPABASE_URL);
  const supabaseServiceRoleSet = bool(process.env.SUPABASE_SERVICE_ROLE_KEY) || bool(process.env.SUPABASE_SERVICE_KEY);
  return res.status(200).json({
    ok: true,
    service: "zo2y-api",
    now: (/* @__PURE__ */ new Date()).toISOString(),
    config: {
      supabase_admin: supabaseUrlSet && supabaseServiceRoleSet,
      supabase_url_set: supabaseUrlSet,
      supabase_service_role_set: supabaseServiceRoleSet,
      spotify: bool(process.env.SPOTIFY_CLIENT_ID) && bool(process.env.SPOTIFY_CLIENT_SECRET),
      igdb: bool(process.env.TWITCH_CLIENT_ID) && bool(process.env.TWITCH_CLIENT_SECRET),
      tmdb: bool(process.env.TMDB_TOKEN) || bool(process.env.TMDB_API_KEY) || bool(process.env.TMDB_ACCESS_TOKEN) || bool(process.env.TMDB_BEARER_TOKEN) || bool(process.env.TMDB_API_READ_TOKEN),
      books: bool(process.env.GOOGLE_BOOKS_KEY),
      resend: bool(process.env.RESEND_API_KEY)
    }
  });
}
__name(handler5, "handler5");
var import_dotenv4;
var init_health = __esm({
  "../api/health.js"() {
    init_functionsRoutes_0_04524570753253654();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    import_dotenv4 = __toESM(require_main(), 1);
    import_dotenv4.default.config();
    import_dotenv4.default.config({ path: "backend/.env" });
    __name2(bool, "bool");
    __name2(handler5, "handler");
  }
});
function resolveBaseUrl(req) {
  const protocol = String(req.headers["x-forwarded-proto"] || "https");
  const host = String(req.headers["x-forwarded-host"] || req.headers.host || "").trim();
  if (!host) return "";
  return `${protocol}://${host}`;
}
__name(resolveBaseUrl, "resolveBaseUrl");
async function fetchJson(url, attempts = 2) {
  let lastError = null;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5500 + attempt * 800);
    try {
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);
      if (res.ok) return await res.json();
      if (res.status < 500 && res.status !== 429) return null;
      lastError = new Error(`http_${res.status}`);
    } catch (error3) {
      clearTimeout(timeoutId);
      lastError = error3;
    }
    if (attempt < attempts - 1) {
      await new Promise((resolve) => setTimeout(resolve, 260 * (attempt + 1)));
    }
  }
  if (lastError) return null;
  return null;
}
__name(fetchJson, "fetchJson");
function mapMovies(rows = []) {
  return rows.filter((row) => row && (row.poster_path || row.backdrop_path)).slice(0, TARGET_ITEMS).map((row) => ({
    mediaType: "movie",
    itemId: String(row.id || ""),
    title: row.title || "Movie",
    subtitle: row.release_date ? String(row.release_date).slice(0, 4) : "Movie",
    image: row.poster_path ? `${TMDB_POSTER}${row.poster_path}` : "",
    backgroundImage: row.backdrop_path ? `${TMDB_BACKDROP}${row.backdrop_path}` : "",
    spotlightImage: row.backdrop_path ? `${TMDB_BACKDROP}${row.backdrop_path}` : "",
    spotlightMediaImage: row.poster_path ? `${TMDB_SPOT_POSTER}${row.poster_path}` : row.backdrop_path ? `${TMDB_BACKDROP}${row.backdrop_path}` : "",
    spotlightMediaFit: "contain",
    spotlightMediaShape: "poster",
    href: row.id ? `movie.html?id=${encodeURIComponent(String(row.id))}` : "movies.html"
  }));
}
__name(mapMovies, "mapMovies");
function mapTv(rows = []) {
  return rows.filter((row) => row && (row.poster_path || row.backdrop_path)).slice(0, TARGET_ITEMS).map((row) => ({
    mediaType: "tv",
    itemId: String(row.id || ""),
    title: row.name || "TV Show",
    subtitle: row.first_air_date ? String(row.first_air_date).slice(0, 4) : "TV Show",
    image: row.poster_path ? `${TMDB_POSTER}${row.poster_path}` : "",
    backgroundImage: row.backdrop_path ? `${TMDB_BACKDROP}${row.backdrop_path}` : "",
    spotlightImage: row.backdrop_path ? `${TMDB_BACKDROP}${row.backdrop_path}` : "",
    spotlightMediaImage: row.poster_path ? `${TMDB_SPOT_POSTER}${row.poster_path}` : row.backdrop_path ? `${TMDB_BACKDROP}${row.backdrop_path}` : "",
    spotlightMediaFit: "contain",
    spotlightMediaShape: "poster",
    href: row.id ? `tvshow.html?id=${encodeURIComponent(String(row.id))}` : "tvshows.html"
  }));
}
__name(mapTv, "mapTv");
function mapGames(rows = []) {
  return rows.filter((row) => row && row.id).slice(0, TARGET_ITEMS).map((row) => {
    const cover = String(row.cover || row.cover_url || "").trim();
    const hero = String(row.hero || row.hero_url || row.background_image || "").trim();
    return {
      mediaType: "game",
      itemId: String(row.id || ""),
      title: row.name || "Game",
      subtitle: row.released ? String(row.released).slice(0, 4) : "Game",
      extra: Array.isArray(row.genres) && row.genres.length ? row.genres.slice(0, 2).map((entry) => entry?.name).filter(Boolean).join(" | ") : "Video Game",
      image: cover || hero,
      backgroundImage: hero || cover,
      spotlightImage: hero || cover,
      spotlightMediaImage: cover || hero,
      spotlightMediaFit: "contain",
      spotlightMediaShape: "poster",
      href: row.id ? `game.html?id=${encodeURIComponent(String(row.id))}` : "games.html"
    };
  }).filter((row) => row.image || row.backgroundImage);
}
__name(mapGames, "mapGames");
async function buildLiveFeed(baseUrl) {
  const [moviesJson, tvJson, gamesJson] = await Promise.all([
    fetchJson(`${baseUrl}/api/tmdb/movie/popular?language=en-US&page=1`),
    fetchJson(`${baseUrl}/api/tmdb/tv/popular?language=en-US&page=1`),
    fetchJson(`${baseUrl}/api/igdb/games?page_size=28&ordering=-follows&min_rating_count=50&provider=igdb&dates=2000-01-01,2027-12-31&page=1`)
  ]);
  return {
    movie: mapMovies(Array.isArray(moviesJson?.results) ? moviesJson.results : []),
    tv: mapTv(Array.isArray(tvJson?.results) ? tvJson.results : []),
    game: mapGames(Array.isArray(gamesJson?.results) ? gamesJson.results : Array.isArray(gamesJson) ? gamesJson : [])
  };
}
__name(buildLiveFeed, "buildLiveFeed");
function isFeedUseful(feed) {
  return ["movie", "tv", "game"].some((key) => Array.isArray(feed?.[key]) && feed[key].length);
}
__name(isFeedUseful, "isFeedUseful");
async function handler6(req, res) {
  if (String(req.method || "GET").toUpperCase() !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }
  const admin = getSupabaseAdminClient();
  if (admin) {
    const { data, error: error3 } = await admin.from("home_spotlight_cache").select("feed_payload, generated_at, expires_at").eq("cache_key", "global").maybeSingle();
    const feed = data?.feed_payload;
    if (!error3 && feed && typeof feed === "object" && isFeedUseful(feed)) {
      res.setHeader("Cache-Control", "public, max-age=60, s-maxage=300, stale-while-revalidate=600");
      return res.status(200).json({
        ok: true,
        source: "supabase-cache",
        generatedAt: data?.generated_at || null,
        expiresAt: data?.expires_at || null,
        feed
      });
    }
  }
  const baseUrl = resolveBaseUrl(req);
  if (!baseUrl) {
    return res.status(503).json({ ok: false, message: "Could not resolve host" });
  }
  const liveFeed = await buildLiveFeed(baseUrl);
  if (!isFeedUseful(liveFeed)) {
    return res.status(503).json({ ok: false, message: "Could not build live feed" });
  }
  res.setHeader("Cache-Control", "public, max-age=30, s-maxage=120, stale-while-revalidate=240");
  return res.status(200).json({
    ok: true,
    source: "live-fallback",
    generatedAt: (/* @__PURE__ */ new Date()).toISOString(),
    expiresAt: null,
    feed: liveFeed
  });
}
__name(handler6, "handler6");
var TMDB_POSTER;
var TMDB_SPOT_POSTER;
var TMDB_BACKDROP;
var TARGET_ITEMS;
var init_home_feed = __esm({
  "../api/home-feed.js"() {
    init_functionsRoutes_0_04524570753253654();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_supabase_admin();
    TMDB_POSTER = "https://image.tmdb.org/t/p/w500";
    TMDB_SPOT_POSTER = "https://image.tmdb.org/t/p/w780";
    TMDB_BACKDROP = "https://image.tmdb.org/t/p/w1280";
    TARGET_ITEMS = 16;
    __name2(resolveBaseUrl, "resolveBaseUrl");
    __name2(fetchJson, "fetchJson");
    __name2(mapMovies, "mapMovies");
    __name2(mapTv, "mapTv");
    __name2(mapGames, "mapGames");
    __name2(buildLiveFeed, "buildLiveFeed");
    __name2(isFeedUseful, "isFeedUseful");
    __name2(handler6, "handler");
  }
});
function clampInt2(value, min, max, fallback) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, Math.floor(n)));
}
__name(clampInt2, "clampInt2");
function chunkArray(values = [], size = 40) {
  const out = [];
  const list = Array.isArray(values) ? values : [];
  for (let i = 0; i < list.length; i += Math.max(1, Number(size) || 40)) {
    out.push(list.slice(i, i + Math.max(1, Number(size) || 40)));
  }
  return out;
}
__name(chunkArray, "chunkArray");
async function runWithConcurrency(items = [], concurrency = 6, worker) {
  const list = Array.isArray(items) ? items : [];
  if (!list.length) return;
  const queue = [...list];
  const maxWorkers = Math.max(1, Math.min(Number(concurrency) || 1, queue.length));
  await Promise.all(Array.from({ length: maxWorkers }, async () => {
    while (queue.length) {
      const item = queue.shift();
      if (!item) continue;
      await worker(item);
    }
  }));
}
__name(runWithConcurrency, "runWithConcurrency");
function normalizeGameKey(value) {
  const normalized = String(value || "").normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  if (!normalized) return "";
  return normalized.split(/\s+/).map((token) => ROMAN_NUMERAL_MAP[token] || token).join(" ").trim();
}
__name(normalizeGameKey, "normalizeGameKey");
function buildAcronym(tokens = []) {
  return tokens.map((token) => token.slice(0, 1)).join("");
}
__name(buildAcronym, "buildAcronym");
function isOneEditAway(a = "", b = "") {
  if (a === b) return true;
  const lenA = a.length;
  const lenB = b.length;
  if (Math.abs(lenA - lenB) > 1) return false;
  let i = 0;
  let j = 0;
  let edits = 0;
  while (i < lenA && j < lenB) {
    if (a[i] === b[j]) {
      i += 1;
      j += 1;
      continue;
    }
    edits += 1;
    if (edits > 1) return false;
    if (lenA > lenB) {
      i += 1;
    } else if (lenB > lenA) {
      j += 1;
    } else {
      i += 1;
      j += 1;
    }
  }
  if (i < lenA || j < lenB) edits += 1;
  return edits <= 1;
}
__name(isOneEditAway, "isOneEditAway");
function isTransposition(a = "", b = "") {
  if (a.length !== b.length || a.length < 2) return false;
  const diffs = [];
  for (let i = 0; i < a.length; i += 1) {
    if (a[i] !== b[i]) diffs.push(i);
    if (diffs.length > 2) return false;
  }
  if (diffs.length !== 2) return false;
  if (diffs[1] !== diffs[0] + 1) return false;
  return a[diffs[0]] === b[diffs[1]] && a[diffs[1]] === b[diffs[0]];
}
__name(isTransposition, "isTransposition");
function tokenMatchesQuery(titleToken, queryToken) {
  if (!titleToken || !queryToken) return false;
  if (titleToken.startsWith(queryToken)) return true;
  if (queryToken.length >= 3 && titleToken.includes(queryToken)) return true;
  if (queryToken.length >= 4 && isTransposition(titleToken, queryToken)) return true;
  if (queryToken.length >= 4 && isOneEditAway(titleToken, queryToken)) return true;
  return false;
}
__name(tokenMatchesQuery, "tokenMatchesQuery");
function titleMatchesQueryLoose(title2, query) {
  const titleKey = normalizeGameKey(title2);
  const queryKey = normalizeGameKey(query);
  if (!queryKey) return true;
  if (titleKey.includes(queryKey)) return true;
  const compactTitle = titleKey.replace(/\s+/g, "");
  const compactQuery = queryKey.replace(/\s+/g, "");
  if (compactQuery && compactTitle.includes(compactQuery)) return true;
  const titleTokens = titleKey.split(/\s+/).filter(Boolean);
  const queryTokens = queryKey.split(/\s+/).filter(Boolean);
  if (!queryTokens.length) return true;
  if (queryTokens.length === 1) {
    const acronym = buildAcronym(titleTokens);
    if (acronym && (acronym === queryKey || acronym.startsWith(queryKey))) return true;
  }
  return queryTokens.every((token) => titleTokens.some((titleToken) => tokenMatchesQuery(titleToken, token)));
}
__name(titleMatchesQueryLoose, "titleMatchesQueryLoose");
function titleIncludesQuery(title2, query) {
  return titleMatchesQueryLoose(title2, query);
}
__name(titleIncludesQuery, "titleIncludesQuery");
function canonicalGenreSlugFromText(value) {
  const normalized = normalizeGameKey(value);
  if (!normalized) return "";
  const compact = normalized.replace(/\s+/g, "-");
  if (CANONICAL_GENRE_BY_SLUG.has(compact)) return compact;
  for (const rule of GENRE_ALIAS_RULES) {
    if (rule.patterns.some((pattern) => pattern.test(normalized))) {
      return rule.slug;
    }
  }
  return "";
}
__name(canonicalGenreSlugFromText, "canonicalGenreSlugFromText");
function toCanonicalGenreRow(value, fallbackId = 0) {
  const raw = String(value || "").trim();
  if (!raw) return null;
  const slug = canonicalGenreSlugFromText(raw);
  if (slug && CANONICAL_GENRE_BY_SLUG.has(slug)) {
    const canonical = CANONICAL_GENRE_BY_SLUG.get(slug);
    return {
      id: Number(canonical.id || 0),
      name: String(canonical.name || raw).trim(),
      slug: String(canonical.slug || slug).trim()
    };
  }
  return {
    id: Number(fallbackId || 0),
    name: raw,
    slug: normalizeGameKey(raw).replace(/\s+/g, "-")
  };
}
__name(toCanonicalGenreRow, "toCanonicalGenreRow");
function resolveGenreFilterToken(token) {
  const text = String(token || "").trim();
  if (!text) return "";
  if (/^\d+$/.test(text)) {
    const byId = CANONICAL_GENRE_BY_ID.get(Number(text));
    return String(byId?.slug || "").trim().toLowerCase();
  }
  const slug = text.toLowerCase();
  if (CANONICAL_GENRE_BY_SLUG.has(slug)) return slug;
  return canonicalGenreSlugFromText(text);
}
__name(resolveGenreFilterToken, "resolveGenreFilterToken");
function stripHtml(value) {
  return String(value || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}
__name(stripHtml, "stripHtml");
function normalizeTitle(value) {
  return String(value || "").replace(/_/g, " ").replace(/\s+/g, " ").trim();
}
__name(normalizeTitle, "normalizeTitle");
function encodeTitle(value) {
  return encodeURIComponent(normalizeTitle(value).replace(/\s+/g, "_"));
}
__name(encodeTitle, "encodeTitle");
function isExcludedTitle(value) {
  const title2 = String(value || "").trim().toLowerCase();
  if (!title2) return true;
  if (title2.startsWith("list of ")) return true;
  return title2.includes("(film)") || title2.includes("(novel)") || title2.includes("(book)") || title2.includes("(disambiguation)") || title2.includes("(album)") || title2.includes("(song)");
}
__name(isExcludedTitle, "isExcludedTitle");
function toHttpsUrl2(value) {
  const text = String(value || "").trim();
  if (!text) return "";
  if (text.startsWith("//")) return `https:${text}`;
  if (/^http:\/\//i.test(text)) return text.replace(/^http:\/\//i, "https://");
  return text;
}
__name(toHttpsUrl2, "toHttpsUrl2");
function normalizeMediaUrl(url) {
  return toHttpsUrl2(url).replace(/\?.*$/, "").trim().toLowerCase();
}
__name(normalizeMediaUrl, "normalizeMediaUrl");
function expandWikimediaThumbUrl(url) {
  const raw = toHttpsUrl2(url);
  if (!raw.includes("/thumb/")) return raw;
  const match2 = raw.match(/^(https:\/\/upload\.wikimedia\.org\/[^/]+)\/thumb\/(.+)\/([^/]+)$/i);
  if (!match2) return raw;
  const base = match2[1];
  const thumbPath = match2[2];
  const sourcePath = thumbPath.replace(/\/[^/]+$/, "");
  if (!sourcePath) return raw;
  return `${base}/${sourcePath}`;
}
__name(expandWikimediaThumbUrl, "expandWikimediaThumbUrl");
function resolveMediaItemImageUrl(item) {
  const srcset = Array.isArray(item?.srcset) ? item.srcset : [];
  const sorted = [...srcset].sort((a, b) => {
    const aScale = Number(String(a?.scale || "1").replace(/[^\d.]/g, "")) || 1;
    const bScale = Number(String(b?.scale || "1").replace(/[^\d.]/g, "")) || 1;
    return bScale - aScale;
  });
  const candidate = String(
    sorted[0]?.src || item?.src || item?.original?.source || item?.thumbnail?.source || ""
  ).trim();
  if (!candidate) return "";
  return expandWikimediaThumbUrl(candidate);
}
__name(resolveMediaItemImageUrl, "resolveMediaItemImageUrl");
function isLikelyScreenshotMediaItem(item) {
  const title2 = String(item?.title || "").toLowerCase();
  const caption = String(item?.caption?.text || "").toLowerCase();
  const text = `${title2} ${caption}`;
  if (!text.trim()) return false;
  if (/\b(gameplay|in-?game|screenshot|screen|battle|combat|mission|map|level|hud|boss)\b/i.test(text)) return true;
  if (/\b(cover|box art|logo|wordmark|icon|portrait|awards?|developer|director|actor)\b/i.test(text)) return false;
  return !item?.leadImage;
}
__name(isLikelyScreenshotMediaItem, "isLikelyScreenshotMediaItem");
function readTimedCache(cache, key) {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() >= Number(entry.expiresAt || 0)) {
    cache.delete(key);
    return null;
  }
  return entry.value;
}
__name(readTimedCache, "readTimedCache");
function writeTimedCache(cache, key, value, ttlMs) {
  cache.set(key, { value, expiresAt: Date.now() + Math.max(1, Number(ttlMs) || 1) });
  while (cache.size > MAX_CACHE_ENTRIES) {
    const oldest = cache.keys().next().value;
    if (!oldest) break;
    cache.delete(oldest);
  }
}
__name(writeTimedCache, "writeTimedCache");
function parseDateToUnix(dateText, endOfDay = false) {
  const text = String(dateText || "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return null;
  const ms = Date.parse(`${text}T${endOfDay ? "23:59:59" : "00:00:00"}Z`);
  if (Number.isNaN(ms)) return null;
  return Math.floor(ms / 1e3);
}
__name(parseDateToUnix, "parseDateToUnix");
function parseDatesRange(datesRaw) {
  const raw = String(datesRaw || "").trim();
  if (!raw.includes(",")) return { startUnix: null, endUnix: null };
  const [startText, endText] = raw.split(",", 2);
  return {
    startUnix: parseDateToUnix(startText, false),
    endUnix: parseDateToUnix(endText, true)
  };
}
__name(parseDatesRange, "parseDatesRange");
function parseWikidataDate(value) {
  const raw = String(value?.time || "").trim();
  const match2 = raw.match(/^([+-]\d+)-(\d{2})-(\d{2})T/);
  if (!match2) return "";
  const year = match2[1].replace(/^\+/, "");
  if (!/^\d{4}$/.test(year)) return "";
  const precision = Number(value?.precision || 0);
  const month = precision >= 10 && match2[2] !== "00" ? match2[2] : "01";
  const day = precision >= 11 && match2[3] !== "00" ? match2[3] : "01";
  return `${year}-${month}-${day}`;
}
__name(parseWikidataDate, "parseWikidataDate");
function extractYearFallback(text) {
  const match2 = String(text || "").match(/\b(19|20)\d{2}\b/);
  return match2 ? `${match2[0]}-01-01` : "";
}
__name(extractYearFallback, "extractYearFallback");
function claimEntityIds(entity, propertyId) {
  const set = /* @__PURE__ */ new Set();
  const claims = Array.isArray(entity?.claims?.[propertyId]) ? entity.claims[propertyId] : [];
  claims.forEach((claim) => {
    const id = String(claim?.mainsnak?.datavalue?.value?.id || "").trim();
    if (/^Q\d+$/i.test(id)) set.add(id);
  });
  return [...set];
}
__name(claimEntityIds, "claimEntityIds");
function claimStringValues(entity, propertyId) {
  const out = [];
  const seen = /* @__PURE__ */ new Set();
  const claims = Array.isArray(entity?.claims?.[propertyId]) ? entity.claims[propertyId] : [];
  claims.forEach((claim) => {
    const value = String(claim?.mainsnak?.datavalue?.value || "").trim();
    if (!value) return;
    if (seen.has(value.toLowerCase())) return;
    seen.add(value.toLowerCase());
    out.push(value);
  });
  return out;
}
__name(claimStringValues, "claimStringValues");
function isVideoGameEntity(entity) {
  return claimEntityIds(entity, "P31").includes(WIKIDATA_VIDEO_GAME_QID);
}
__name(isVideoGameEntity, "isVideoGameEntity");
function pickLabel(entity) {
  return String(entity?.labels?.en?.value || entity?.labels?.en?.text || "").trim();
}
__name(pickLabel, "pickLabel");
function extractReleaseDate(entity, fallbackText = "") {
  const rows = [...Array.isArray(entity?.claims?.P577) ? entity.claims.P577 : [], ...Array.isArray(entity?.claims?.P571) ? entity.claims.P571 : []];
  const dates = rows.map((claim) => parseWikidataDate(claim?.mainsnak?.datavalue?.value)).filter(Boolean).sort();
  if (dates.length) return dates[0];
  return extractYearFallback(fallbackText);
}
__name(extractReleaseDate, "extractReleaseDate");
function toSortEpoch(dateText) {
  const text = String(dateText || "").trim();
  if (!text) return 0;
  const ms = Date.parse(`${text}T00:00:00Z`);
  return Number.isFinite(ms) ? ms : 0;
}
__name(toSortEpoch, "toSortEpoch");
function filterRowsByDates(rows, datesRaw) {
  const { startUnix, endUnix } = parseDatesRange(datesRaw);
  if (!startUnix && !endUnix) return [...Array.isArray(rows) ? rows : []];
  return (Array.isArray(rows) ? rows : []).filter((row) => {
    const released = String(row?.released || "").trim();
    if (!released) return false;
    const unix = Math.floor(toSortEpoch(released) / 1e3);
    if (!Number.isFinite(unix) || unix <= 0) return false;
    if (Number.isFinite(startUnix) && unix < startUnix) return false;
    if (Number.isFinite(endUnix) && unix > endUnix) return false;
    return true;
  });
}
__name(filterRowsByDates, "filterRowsByDates");
function parseGenreFilterTokens(genresRaw) {
  return new Set(String(genresRaw || "").split(",").map((token) => resolveGenreFilterToken(token)).filter(Boolean));
}
__name(parseGenreFilterTokens, "parseGenreFilterTokens");
function filterRowsByGenres(rows, genresRaw) {
  const tokens = parseGenreFilterTokens(genresRaw);
  if (!tokens.size) return [...Array.isArray(rows) ? rows : []];
  return (Array.isArray(rows) ? rows : []).filter((row) => {
    const genres = Array.isArray(row?.genres) ? row.genres : [];
    return genres.some((genre) => {
      const slug = resolveGenreFilterToken(genre?.slug || genre?.name || "");
      return !!slug && tokens.has(slug);
    });
  });
}
__name(filterRowsByGenres, "filterRowsByGenres");
function sortRows(rows, orderingRaw = "-added") {
  const ordering = String(orderingRaw || "-added").trim().toLowerCase();
  const list = [...Array.isArray(rows) ? rows : []];
  if (ordering === "-name") return list.sort((a, b) => String(a?.name || "").localeCompare(String(b?.name || "")));
  if (ordering === "name") return list.sort((a, b) => String(b?.name || "").localeCompare(String(a?.name || "")));
  if (ordering === "released") return list.sort((a, b) => toSortEpoch(a?.released) - toSortEpoch(b?.released));
  return list.sort((a, b) => toSortEpoch(b?.released) - toSortEpoch(a?.released));
}
__name(sortRows, "sortRows");
function dedupeRows(rows = []) {
  const out = [];
  const seenIds = /* @__PURE__ */ new Set();
  const seenNames = /* @__PURE__ */ new Set();
  (Array.isArray(rows) ? rows : []).forEach((row) => {
    const id = Number(row?.id || 0);
    if (Number.isFinite(id) && id > 0) {
      if (seenIds.has(id)) return;
      seenIds.add(id);
    }
    const nameKey = normalizeGameKey(row?.name || "");
    const yearKey = String(row?.released || "").slice(0, 4);
    const compositeKey = nameKey ? `${nameKey}|${yearKey}` : "";
    if (compositeKey) {
      if (seenNames.has(compositeKey)) return;
      seenNames.add(compositeKey);
    }
    out.push(row);
  });
  return out;
}
__name(dedupeRows, "dedupeRows");
async function fetchJson2(url, timeoutMs = WIKI_REQUEST_TIMEOUT_MS) {
  const attempts = 2;
  let lastError = null;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers: {
          accept: "application/json",
          "user-agent": "zo2y-games/1.0 (+https://www.zo2y.com; contact: zo2hyq@gmail.com)",
          "api-user-agent": "zo2y-games/1.0 (+https://www.zo2y.com; contact: zo2hyq@gmail.com)"
        },
        signal: typeof AbortSignal?.timeout === "function" ? AbortSignal.timeout(timeoutMs) : void 0
      });
      if (response.ok) return await response.json();
      const body = await response.text();
      const status = Number(response.status || 0);
      const retryable2 = status === 429 || status === 500 || status === 502 || status === 503 || status === 504;
      if (retryable2 && attempt < attempts - 1) {
        await new Promise((resolve) => setTimeout(resolve, 250 * (attempt + 1)));
        continue;
      }
      throw new Error(`UPSTREAM ${status}: ${body}`);
    } catch (error3) {
      lastError = error3;
      if (attempt < attempts - 1) {
        await new Promise((resolve) => setTimeout(resolve, 200 * (attempt + 1)));
        continue;
      }
    }
  }
  throw lastError || new Error("UPSTREAM REQUEST FAILED");
}
__name(fetchJson2, "fetchJson2");
async function wikiQuery(params = {}) {
  const url = new URL(WIKIPEDIA_API_BASE);
  Object.entries({ action: "query", format: "json", formatversion: "2", origin: "*", ...params }).forEach(([key, value]) => {
    if (value === void 0 || value === null || String(value).trim() === "") return;
    url.searchParams.set(key, String(value));
  });
  return await fetchJson2(url.toString());
}
__name(wikiQuery, "wikiQuery");
async function wikidataQuery(params = {}) {
  const url = new URL(WIKIDATA_API_BASE);
  Object.entries({ action: "wbgetentities", format: "json", origin: "*", ...params }).forEach(([key, value]) => {
    if (value === void 0 || value === null || String(value).trim() === "") return;
    url.searchParams.set(key, String(value));
  });
  return await fetchJson2(url.toString());
}
__name(wikidataQuery, "wikidataQuery");
async function fetchSummaryViaQuery(title2) {
  const normalized = normalizeTitle(title2);
  if (!normalized || isExcludedTitle(normalized)) return null;
  const json3 = await wikiQuery({
    titles: normalized,
    redirects: "1",
    prop: "description|extracts|pageimages|pageprops",
    exintro: "1",
    explaintext: "1",
    piprop: "original|thumbnail",
    pithumbsize: "900",
    ppprop: "wikibase_item"
  }).catch(() => null);
  const page = Array.isArray(json3?.query?.pages) ? json3.query.pages[0] : null;
  if (!page || page.missing || isExcludedTitle(page?.title)) return null;
  const payload = {
    type: "standard",
    title: normalizeTitle(page?.title || normalized),
    pageid: Number(page?.pageid || 0),
    extract: String(page?.extract || "").trim(),
    description: String(page?.description || "").trim(),
    wikibase_item: String(page?.pageprops?.wikibase_item || "").trim(),
    thumbnail: page?.thumbnail?.source ? { source: toHttpsUrl2(page.thumbnail.source), width: Number(page?.thumbnail?.width || 0), height: Number(page?.thumbnail?.height || 0) } : null,
    originalimage: page?.original?.source ? { source: toHttpsUrl2(page.original.source), width: Number(page?.original?.width || 0), height: Number(page?.original?.height || 0) } : null
  };
  if (payload.pageid <= 0 || !payload.title) return null;
  return payload;
}
__name(fetchSummaryViaQuery, "fetchSummaryViaQuery");
async function fetchSummary(title2) {
  const normalized = normalizeTitle(title2);
  if (!normalized || isExcludedTitle(normalized)) return null;
  const cached = readTimedCache(summaryCache, normalized.toLowerCase());
  if (cached) return cached;
  let payload = null;
  try {
    payload = await fetchJson2(`${WIKIPEDIA_REST_BASE}/page/summary/${encodeTitle(normalized)}`);
  } catch (_error) {
    payload = null;
  }
  if (!payload || payload.type === "disambiguation" || isExcludedTitle(payload?.title) || Number(payload?.pageid || 0) <= 0) {
    payload = await fetchSummaryViaQuery(normalized);
  }
  if (!payload || payload.type === "disambiguation" || isExcludedTitle(payload?.title)) return null;
  writeTimedCache(summaryCache, normalized.toLowerCase(), payload, WIKI_SUMMARY_TTL_MS);
  return payload;
}
__name(fetchSummary, "fetchSummary");
async function fetchPageById(id) {
  const json3 = await wikiQuery({ pageids: String(id), prop: "pageprops|info", ppprop: "wikibase_item", inprop: "url" });
  const page = Array.isArray(json3?.query?.pages) ? json3.query.pages[0] : null;
  return page && !page.missing ? page : null;
}
__name(fetchPageById, "fetchPageById");
async function fetchInfoboxCover(title2) {
  const json3 = await wikiQuery({ prop: "pageimages", titles: normalizeTitle(title2), piprop: "original|thumbnail", pithumbsize: "900" });
  const page = Array.isArray(json3?.query?.pages) ? json3.query.pages[0] : null;
  return toHttpsUrl2(page?.original?.source || page?.thumbnail?.source || "");
}
__name(fetchInfoboxCover, "fetchInfoboxCover");
async function fetchSpotlightScreenshot(title2, fallbackCover = "") {
  const normalizedTitle = normalizeTitle(title2);
  if (!normalizedTitle) return toHttpsUrl2(fallbackCover);
  const cacheKey = normalizedTitle.toLowerCase();
  const cached = readTimedCache(mediaCache, cacheKey);
  if (cached !== null) return cached;
  const fallbackUrl = toHttpsUrl2(fallbackCover);
  const fallbackNormalized = normalizeMediaUrl(fallbackUrl);
  let selected = "";
  try {
    const mediaJson = await fetchJson2(`${WIKIPEDIA_REST_BASE}/page/media-list/${encodeTitle(normalizedTitle)}`);
    const items = (Array.isArray(mediaJson?.items) ? mediaJson.items : []).filter((item) => String(item?.type || "").toLowerCase() === "image");
    const prioritized = [];
    const secondary = [];
    items.forEach((item) => {
      const url = resolveMediaItemImageUrl(item);
      if (!url) return;
      const normalizedUrl = normalizeMediaUrl(url);
      if (!normalizedUrl || fallbackNormalized && normalizedUrl === fallbackNormalized) return;
      if (isLikelyScreenshotMediaItem(item)) {
        prioritized.push(url);
      } else {
        secondary.push(url);
      }
    });
    selected = prioritized[0] || secondary[0] || fallbackUrl;
  } catch (_error) {
    selected = fallbackUrl;
  }
  writeTimedCache(mediaCache, cacheKey, selected || "", WIKI_MEDIA_TTL_MS);
  return selected || "";
}
__name(fetchSpotlightScreenshot, "fetchSpotlightScreenshot");
async function fetchEntities(ids = [], props = "claims|labels") {
  const uniqueIds = [...new Set((Array.isArray(ids) ? ids : []).map((id) => String(id || "").trim()).filter((id) => /^Q\d+$/i.test(id)))];
  if (!uniqueIds.length) return /* @__PURE__ */ new Map();
  const out = /* @__PURE__ */ new Map();
  const pending = [];
  uniqueIds.forEach((id) => {
    const key = `${props}:${id}`;
    const cached = readTimedCache(entityCache, key);
    if (cached !== null) out.set(id, cached);
    else pending.push(id);
  });
  for (const chunk of chunkArray(pending, 40)) {
    let entities = {};
    try {
      entities = (await wikidataQuery({ ids: chunk.join("|"), props, languages: "en" }))?.entities || {};
    } catch (_error) {
      entities = {};
    }
    chunk.forEach((id) => {
      const entity = entities?.[id] || null;
      writeTimedCache(entityCache, `${props}:${id}`, entity, WIKI_ENTITY_TTL_MS);
      out.set(id, entity);
    });
  }
  return out;
}
__name(fetchEntities, "fetchEntities");
async function labelMapForEntities(ids = []) {
  const map = /* @__PURE__ */ new Map();
  const entities = await fetchEntities(ids, "labels");
  entities.forEach((entity, id) => {
    const label = pickLabel(entity);
    if (label) map.set(id, label);
  });
  return map;
}
__name(labelMapForEntities, "labelMapForEntities");
function mapGenres(entity, labels) {
  const seen = /* @__PURE__ */ new Set();
  return claimEntityIds(entity, "P136").map((qid, idx) => {
    const name = String(labels.get(qid) || "").trim();
    if (!name) return null;
    const mapped = toCanonicalGenreRow(name, idx + 1);
    if (!mapped) return null;
    const key = String(mapped.slug || "").trim().toLowerCase() || String(mapped.name || "").toLowerCase();
    if (!key || seen.has(key)) return null;
    seen.add(key);
    return mapped;
  }).filter(Boolean).slice(0, 4);
}
__name(mapGenres, "mapGenres");
function inferGenresFromText(text) {
  const normalized = normalizeGameKey(text);
  if (!normalized) return [];
  const rows = [];
  const seen = /* @__PURE__ */ new Set();
  GENRE_ALIAS_RULES.forEach((rule) => {
    if (!rule?.slug || seen.has(rule.slug)) return;
    if (!Array.isArray(rule.patterns) || !rule.patterns.length) return;
    if (!rule.patterns.some((pattern) => pattern.test(normalized))) return;
    const canonical = CANONICAL_GENRE_BY_SLUG.get(rule.slug);
    if (!canonical) return;
    seen.add(rule.slug);
    rows.push({
      id: Number(canonical.id || 0),
      name: String(canonical.name || "").trim() || rule.slug,
      slug: String(canonical.slug || rule.slug).trim()
    });
  });
  return rows.slice(0, 3);
}
__name(inferGenresFromText, "inferGenresFromText");
function mapPlatforms(entity, labels) {
  return claimEntityIds(entity, "P400").map((qid) => String(labels.get(qid) || "").trim()).filter(Boolean).slice(0, 6).map((name) => ({ platform: { name } }));
}
__name(mapPlatforms, "mapPlatforms");
function mapCompanies(entity, propertyId, labels) {
  return claimEntityIds(entity, propertyId).map((qid) => String(labels.get(qid) || "").trim()).filter(Boolean).slice(0, 6).map((name) => ({ name }));
}
__name(mapCompanies, "mapCompanies");
function mapListRow(summary, entity, labels, infoboxCover = "") {
  const cover = toHttpsUrl2(infoboxCover || summary?.originalimage?.source || summary?.thumbnail?.source || "");
  if (!cover) return null;
  const description = String(summary?.description || summary?.extract || "").trim();
  const mappedGenres = mapGenres(entity, labels);
  const inferredGenres = inferGenresFromText(`${summary?.title || ""} ${description}`);
  const genres = [];
  const seenGenreSlugs = /* @__PURE__ */ new Set();
  [...mappedGenres, ...inferredGenres].forEach((genre) => {
    const slug = String(genre?.slug || "").trim().toLowerCase();
    if (!slug || seenGenreSlugs.has(slug)) return;
    seenGenreSlugs.add(slug);
    genres.push(genre);
  });
  return {
    id: Number(summary?.pageid || 0),
    name: String(summary?.title || "Game").trim() || "Game",
    slug: normalizeGameKey(summary?.title || "").replace(/\s+/g, "-"),
    released: extractReleaseDate(entity, description),
    cover,
    hero: cover,
    screenshots: [cover],
    background_image: cover,
    short_screenshots: [{ id: 1, image: cover }],
    rating: null,
    ratings_count: 0,
    metacritic: null,
    genres,
    platforms: mapPlatforms(entity, labels),
    source: "wikipedia"
  };
}
__name(mapListRow, "mapListRow");
function mapSummaryBackfillRow(summary) {
  const pageid = Number(summary?.pageid || 0);
  const name = String(summary?.title || "").trim();
  const cover = toHttpsUrl2(summary?.originalimage?.source || summary?.thumbnail?.source || "");
  if (pageid <= 0 || !name || !cover) return null;
  const releaseText = `${summary?.description || ""} ${summary?.extract || ""}`.trim();
  const released = extractYearFallback(releaseText);
  const inferredGenres = inferGenresFromText(`${name} ${releaseText}`);
  return {
    id: pageid,
    name,
    slug: normalizeGameKey(name).replace(/\s+/g, "-"),
    released,
    cover,
    hero: cover,
    screenshots: [cover],
    background_image: cover,
    short_screenshots: [{ id: 1, image: cover }],
    rating: null,
    ratings_count: 0,
    metacritic: null,
    genres: inferredGenres,
    platforms: [],
    source: "wikipedia"
  };
}
__name(mapSummaryBackfillRow, "mapSummaryBackfillRow");
function mapDetailRow(summary, entity, labels, infoboxCover = "") {
  const base = mapListRow(summary, entity, labels, infoboxCover);
  if (!base) return null;
  const summaryText = String(summary?.extract || "").trim();
  const subreddit = claimStringValues(entity, "P3984")[0] || "";
  const website = claimStringValues(entity, "P856")[0] || "";
  return {
    ...base,
    description_raw: summaryText,
    description: summaryText,
    playtime: null,
    developers: mapCompanies(entity, "P178", labels),
    publishers: mapCompanies(entity, "P123", labels),
    stores: [],
    website: toHttpsUrl2(website),
    reddit_url: subreddit ? `https://www.reddit.com/r/${encodeURIComponent(subreddit.replace(/^r\//i, ""))}` : "",
    clip: null,
    youtube_url: "",
    player_scores: []
  };
}
__name(mapDetailRow, "mapDetailRow");
function mergeScreenshotUrls(primary = [], secondary = []) {
  const seen = /* @__PURE__ */ new Set();
  const out = [];
  [...Array.isArray(primary) ? primary : [], ...Array.isArray(secondary) ? secondary : []].forEach((value) => {
    const url = toHttpsUrl2(value);
    if (!url) return;
    const key = normalizeMediaUrl(url);
    if (!key || seen.has(key)) return;
    seen.add(key);
    out.push(url);
  });
  return out;
}
__name(mergeScreenshotUrls, "mergeScreenshotUrls");
async function enrichRowsWithSpotlightScreenshots(rows = [], maxToEnrich = 20) {
  const baseRows = Array.isArray(rows) ? rows : [];
  const out = [...baseRows];
  const limit = clampInt2(maxToEnrich, 1, Math.max(1, out.length), Math.min(20, out.length || 1));
  await runWithConcurrency(out.slice(0, limit).map((row, index2) => ({ row, index: index2 })), 8, async ({ row, index: index2 }) => {
    if (!row || !row.name) return;
    const cover = toHttpsUrl2(row.cover || "");
    const hero = await fetchSpotlightScreenshot(row.name, cover).catch(() => cover);
    if (!hero || normalizeMediaUrl(hero) === normalizeMediaUrl(cover)) return;
    const screenshots = mergeScreenshotUrls([hero, cover], row.screenshots || []);
    out[index2] = {
      ...row,
      hero,
      background_image: hero,
      screenshots,
      short_screenshots: screenshots.map((image, idx) => ({ id: idx + 1, image }))
    };
  });
  return out;
}
__name(enrichRowsWithSpotlightScreenshots, "enrichRowsWithSpotlightScreenshots");
async function hydrateRows(candidates = []) {
  const deduped = [];
  const seen = /* @__PURE__ */ new Set();
  (Array.isArray(candidates) ? candidates : []).forEach((candidate) => {
    const pageid = Number(candidate?.pageid || 0);
    const title2 = normalizeTitle(candidate?.title || "");
    if (!title2 || isExcludedTitle(title2)) return;
    const key = pageid > 0 ? `${pageid}:${title2.toLowerCase()}` : `title:${title2.toLowerCase()}`;
    if (seen.has(key)) return;
    seen.add(key);
    deduped.push({ pageid, title: title2 });
  });
  const summaries = (await Promise.all(deduped.map((candidate) => fetchSummary(candidate.title).catch(() => null)))).filter(Boolean);
  const qids = [...new Set(summaries.map((row) => String(row?.wikibase_item || "").trim()).filter((id) => /^Q\d+$/i.test(id)))];
  const entities = await fetchEntities(qids, "claims|labels");
  const linked = /* @__PURE__ */ new Set();
  [...entities.values()].filter(Boolean).forEach((entity) => ["P136", "P400", "P178", "P123"].forEach((prop) => claimEntityIds(entity, prop).forEach((id) => linked.add(id))));
  const labels = await labelMapForEntities([...linked]);
  return summaries.map((summary) => {
    const qid = String(summary?.wikibase_item || "").trim();
    const entity = entities.get(qid) || {};
    const text = `${summary?.description || ""} ${summary?.extract || ""}`.toLowerCase();
    if (qid && entity && !isVideoGameEntity(entity)) return null;
    if (!qid && !text.includes("video game")) return null;
    return mapListRow(summary, entity, labels);
  }).filter(Boolean);
}
__name(hydrateRows, "hydrateRows");
function parseRequestedYears(datesRaw = "") {
  const currentYear = (/* @__PURE__ */ new Date()).getUTCFullYear();
  const { startUnix, endUnix } = parseDatesRange(datesRaw);
  const startYear = Number.isFinite(startUnix) ? new Date(startUnix * 1e3).getUTCFullYear() : currentYear - 2;
  const endYear = Number.isFinite(endUnix) ? new Date(endUnix * 1e3).getUTCFullYear() : currentYear;
  const minYear = Math.max(1970, Math.min(startYear, endYear));
  const maxYear = Math.max(minYear, Math.max(startYear, endYear));
  const out = [];
  for (let year = maxYear; year >= minYear && out.length < WIKI_YEAR_CANDIDATE_LIMIT; year -= 1) out.push(year);
  if (!out.length) out.push(currentYear);
  return out;
}
__name(parseRequestedYears, "parseRequestedYears");
async function fetchCategoryCandidates(datesRaw = "", target = 80) {
  const years = parseRequestedYears(datesRaw);
  const out = [];
  const seen = /* @__PURE__ */ new Set();
  for (const year of years) {
    if (out.length >= target) break;
    let cmcontinue = "";
    for (let pass = 0; pass < 2; pass += 1) {
      const json3 = await wikiQuery({
        list: "categorymembers",
        cmtitle: `Category:${year}_video_games`,
        cmnamespace: "0",
        cmtype: "page",
        cmlimit: "50",
        cmcontinue
      }).catch(() => null);
      const rows = Array.isArray(json3?.query?.categorymembers) ? json3.query.categorymembers : [];
      rows.forEach((row) => {
        const pageid = Number(row?.pageid || 0);
        const title2 = normalizeTitle(row?.title || "");
        if (pageid <= 0 || !title2 || isExcludedTitle(title2)) return;
        const key = `${pageid}:${title2.toLowerCase()}`;
        if (seen.has(key)) return;
        seen.add(key);
        out.push({ pageid, title: title2 });
      });
      cmcontinue = String(json3?.continue?.cmcontinue || "").trim();
      if (!cmcontinue || out.length >= target) break;
    }
  }
  return out;
}
__name(fetchCategoryCandidates, "fetchCategoryCandidates");
async function fetchSearchCandidates(search, offset = 0, limit = 40, titleOnly = false) {
  const q = String(search || "").trim();
  if (!q) return { rows: [], totalHits: 0 };
  const queryKey = normalizeGameKey(q);
  const queryTokens = queryKey.split(/\s+/).filter(Boolean);
  const compactQueryKey = queryKey.replace(/\s+/g, "");
  const json3 = await wikiQuery({ list: "search", srsearch: `${q} video game`, srnamespace: "0", sroffset: String(Math.max(0, offset)), srlimit: String(clampInt2(limit, 1, 50, 40)) }).catch(() => null);
  const rows = (Array.isArray(json3?.query?.search) ? json3.query.search : []).filter((row) => !isExcludedTitle(row?.title)).filter((row) => {
    const title2 = normalizeTitle(row?.title || "");
    const titleKey = normalizeGameKey(title2);
    const compactTitleKey = titleKey.replace(/\s+/g, "");
    const snippet = stripHtml(row?.snippet || "").toLowerCase();
    const snippetLooksLikeGame = snippet.includes("video game") || snippet.includes("developed by") || snippet.includes("published by") || snippet.includes(" game");
    const titleMatchesQuery = titleMatchesQueryLoose(title2, q) || !!titleKey && (titleKey.includes(queryKey) || compactQueryKey && compactTitleKey.includes(compactQueryKey) || queryTokens.length > 0 && queryTokens.every((token) => titleKey.includes(token)));
    if (titleOnly) return titleMatchesQuery;
    return snippetLooksLikeGame || titleMatchesQuery;
  }).map((row) => ({ pageid: Number(row?.pageid || 0), title: normalizeTitle(row?.title || "") })).filter((row) => row.pageid > 0 && row.title);
  return { rows, totalHits: Number(json3?.query?.searchinfo?.totalhits || 0) };
}
__name(fetchSearchCandidates, "fetchSearchCandidates");
async function fetchPopularSeedCandidates(limit = POPULAR_SEED_BATCH_SIZE) {
  const take = clampInt2(limit, 12, POPULAR_GAME_TITLE_SEEDS.length, POPULAR_SEED_BATCH_SIZE);
  return POPULAR_GAME_TITLE_SEEDS.slice(0, take).map((title2) => ({ pageid: 0, title: normalizeTitle(title2) })).filter((row) => !!row.title && !isExcludedTitle(row.title));
}
__name(fetchPopularSeedCandidates, "fetchPopularSeedCandidates");
async function fetchPopularSearchSeedCandidates() {
  const buckets = await Promise.all(POPULAR_SEARCH_SEEDS.map((seed) => fetchSearchCandidates(seed, 0, 22).catch(() => ({ rows: [] }))));
  const seen = /* @__PURE__ */ new Set();
  const out = [];
  buckets.forEach((bucket) => {
    (Array.isArray(bucket?.rows) ? bucket.rows : []).forEach((row) => {
      const pageid = Number(row?.pageid || 0);
      const title2 = normalizeTitle(row?.title || "");
      if (pageid <= 0 || !title2 || isExcludedTitle(title2)) return;
      const key = `${pageid}:${title2.toLowerCase()}`;
      if (seen.has(key)) return;
      seen.add(key);
      out.push({ pageid, title: title2 });
    });
  });
  return out;
}
__name(fetchPopularSearchSeedCandidates, "fetchPopularSearchSeedCandidates");
async function fetchSummaryBackfillRows(limit = 12, excludedIds = /* @__PURE__ */ new Set(), genresRaw = "") {
  const take = clampInt2(limit, 1, POPULAR_GAME_TITLE_SEEDS.length, 12);
  const preferred = buildGenreSeedCandidates(genresRaw, Math.max(take * 2, 24)).map((row) => row.title);
  const titlePool = [...new Set([...preferred, ...POPULAR_GAME_TITLE_SEEDS].map((row) => normalizeTitle(row)).filter(Boolean))];
  const rows = [];
  for (const title2 of titlePool) {
    if (rows.length >= take) break;
    const summary = await fetchSummary(title2).catch(() => null);
    const mapped = mapSummaryBackfillRow(summary);
    if (!mapped) continue;
    if (excludedIds.has(mapped.id)) continue;
    excludedIds.add(mapped.id);
    rows.push(mapped);
  }
  return rows;
}
__name(fetchSummaryBackfillRows, "fetchSummaryBackfillRows");
function sortRowsByPopularity(rows = [], orderingRaw = "") {
  const ordering = String(orderingRaw || "").trim().toLowerCase();
  const popularOrdering = ordering === "-rating" || ordering === "-metacritic" || ordering === "-added" || ordering === "";
  if (!popularOrdering) return sortRows(rows, orderingRaw);
  const list = [...Array.isArray(rows) ? rows : []];
  list.sort((a, b) => {
    const rankA = Number(POPULAR_TITLE_RANK.get(normalizeGameKey(a?.name || "")) || 9999);
    const rankB = Number(POPULAR_TITLE_RANK.get(normalizeGameKey(b?.name || "")) || 9999);
    if (rankA !== rankB) return rankA - rankB;
    const releaseDiff = toSortEpoch(b?.released) - toSortEpoch(a?.released);
    if (releaseDiff) return releaseDiff;
    return String(a?.name || "").localeCompare(String(b?.name || ""));
  });
  return list;
}
__name(sortRowsByPopularity, "sortRowsByPopularity");
function sortSearchRowsByQuery(rows = [], query = "") {
  const normalizedQuery = normalizeGameKey(query);
  const queryTokens = normalizedQuery.split(/\s+/).filter(Boolean);
  const compactQuery = normalizedQuery.replace(/\s+/g, "");
  if (!normalizedQuery) return [...Array.isArray(rows) ? rows : []];
  const scored = (Array.isArray(rows) ? rows : []).map((row, index2) => {
    const title2 = String(row?.name || "").trim();
    const titleKey = normalizeGameKey(title2);
    const slugKey = normalizeGameKey(row?.slug || "");
    const combined = `${titleKey} ${slugKey}`.trim();
    const compactCombined = combined.replace(/\s+/g, "");
    const titleTokens = titleKey.split(/\s+/).filter(Boolean);
    const acronym = buildAcronym(titleTokens);
    let score = 0;
    if (titleKey === normalizedQuery) score += 1200;
    if (combined.startsWith(normalizedQuery)) score += 880;
    if (combined.includes(normalizedQuery)) score += 620;
    if (compactQuery && compactCombined.includes(compactQuery)) score += 520;
    if (acronym && (acronym === normalizedQuery || acronym.startsWith(normalizedQuery))) score += 420;
    queryTokens.forEach((token) => {
      if (!token) return;
      if (combined.startsWith(token)) score += 60;
      if (combined.includes(token)) score += 55;
      else score -= 30;
    });
    if (/\bvideo game\b/i.test(title2)) score += 45;
    const popularityRank = Number(POPULAR_TITLE_RANK.get(titleKey) || 0);
    if (popularityRank > 0) score += Math.max(0, 320 - popularityRank);
    score += Math.max(0, Math.min(90, Math.floor(toSortEpoch(row?.released) / (1e3 * 60 * 60 * 24 * 365 * 8))));
    return { row, score, index: index2 };
  });
  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    const releaseDiff = toSortEpoch(b.row?.released) - toSortEpoch(a.row?.released);
    if (releaseDiff !== 0) return releaseDiff;
    const rankA = Number(POPULAR_TITLE_RANK.get(normalizeGameKey(a.row?.name || "")) || 9999);
    const rankB = Number(POPULAR_TITLE_RANK.get(normalizeGameKey(b.row?.name || "")) || 9999);
    if (rankA !== rankB) return rankA - rankB;
    return a.index - b.index;
  });
  return scored.map((entry) => entry.row);
}
__name(sortSearchRowsByQuery, "sortSearchRowsByQuery");
function buildSeedQueryMatchCandidates(query, limit = 20) {
  const queryKey = normalizeGameKey(query);
  const tokens = queryKey.split(/\s+/).filter(Boolean);
  const compactQueryKey = queryKey.replace(/\s+/g, "");
  if (!queryKey) return [];
  const matched = POPULAR_GAME_TITLE_SEEDS.map((title2) => ({ title: title2, key: normalizeGameKey(title2) })).filter((entry) => {
    if (!entry.key) return false;
    if (titleMatchesQueryLoose(entry.title, query)) return true;
    const compactKey = entry.key.replace(/\s+/g, "");
    if (entry.key.includes(queryKey)) return true;
    if (compactQueryKey && compactKey.includes(compactQueryKey)) return true;
    if (tokens.length && tokens.every((token) => entry.key.includes(token))) return true;
    if (tokens.length === 1 && tokens[0].length >= 3 && entry.key.startsWith(tokens[0])) return true;
    return false;
  }).slice(0, clampInt2(limit, 1, 40, 20)).map((entry) => ({ pageid: 0, title: normalizeTitle(entry.title) }));
  return matched;
}
__name(buildSeedQueryMatchCandidates, "buildSeedQueryMatchCandidates");
function titleMatchesGenreTokens(title2, genreTokens = /* @__PURE__ */ new Set()) {
  const tokens = genreTokens instanceof Set ? genreTokens : /* @__PURE__ */ new Set();
  if (!tokens.size) return false;
  const titleText = normalizeTitle(title2);
  if (!titleText) return false;
  const titleKey = normalizeGameKey(titleText);
  if (!titleKey) return false;
  const inferred = inferGenresFromText(titleText);
  if (inferred.some((genre) => tokens.has(resolveGenreFilterToken(genre?.slug || genre?.name || "")))) return true;
  for (const token of tokens) {
    if (!token) continue;
    const rule = GENRE_ALIAS_RULES.find((entry) => entry.slug === token);
    if (Array.isArray(rule?.patterns) && rule.patterns.some((pattern) => pattern.test(titleKey))) return true;
  }
  return false;
}
__name(titleMatchesGenreTokens, "titleMatchesGenreTokens");
function buildGenreSeedCandidates(genresRaw = "", limit = 60) {
  const tokens = parseGenreFilterTokens(genresRaw);
  if (!tokens.size) return [];
  const out = [];
  const seen = /* @__PURE__ */ new Set();
  const maxRows = clampInt2(limit, 1, POPULAR_GAME_TITLE_SEEDS.length, 60);
  for (const title2 of POPULAR_GAME_TITLE_SEEDS) {
    if (out.length >= maxRows) break;
    const normalizedTitle = normalizeTitle(title2);
    if (!normalizedTitle || isExcludedTitle(normalizedTitle)) continue;
    if (!titleMatchesGenreTokens(normalizedTitle, tokens)) continue;
    const key = normalizedTitle.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ pageid: 0, title: normalizedTitle });
  }
  return out;
}
__name(buildGenreSeedCandidates, "buildGenreSeedCandidates");
function buildGenreSearchQueries(genresRaw = "", limit = 8) {
  const tokens = [...parseGenreFilterTokens(genresRaw)];
  if (!tokens.length) return [];
  const out = [];
  const seen = /* @__PURE__ */ new Set();
  tokens.forEach((token) => {
    if (!token) return;
    const canonical = CANONICAL_GENRE_BY_SLUG.get(token);
    const defaultQuery = `${String(canonical?.name || token).trim()} video game`;
    const genreQueries = [defaultQuery, ...Array.isArray(GENRE_SEARCH_QUERY_SEEDS[token]) ? GENRE_SEARCH_QUERY_SEEDS[token] : []];
    genreQueries.forEach((query) => {
      const value = String(query || "").trim();
      if (!value) return;
      const key = value.toLowerCase();
      if (seen.has(key)) return;
      seen.add(key);
      out.push(value);
    });
  });
  return out.slice(0, clampInt2(limit, 1, 16, 8));
}
__name(buildGenreSearchQueries, "buildGenreSearchQueries");
async function fetchGenreSearchCandidates(genresRaw = "", limit = 80) {
  const queries = buildGenreSearchQueries(genresRaw, 10);
  if (!queries.length) return [];
  const maxRows = clampInt2(limit, 1, 320, 80);
  const perQuery = clampInt2(Math.ceil(maxRows / queries.length) + 8, 8, 40, 24);
  const buckets = await Promise.all(queries.map((query) => fetchSearchCandidates(query, 0, perQuery).catch(() => ({ rows: [] }))));
  const out = [];
  const seen = /* @__PURE__ */ new Set();
  buckets.forEach((bucket) => {
    (Array.isArray(bucket?.rows) ? bucket.rows : []).forEach((row) => {
      const pageid = Number(row?.pageid || 0);
      const title2 = normalizeTitle(row?.title || "");
      if (pageid <= 0 || !title2 || isExcludedTitle(title2)) return;
      const key = `${pageid}:${title2.toLowerCase()}`;
      if (seen.has(key)) return;
      seen.add(key);
      out.push({ pageid, title: title2 });
    });
  });
  return out.slice(0, maxRows);
}
__name(fetchGenreSearchCandidates, "fetchGenreSearchCandidates");
async function fetchWikipediaGameDetailsById(gameId) {
  const id = Number(gameId);
  if (!Number.isFinite(id) || id <= 0) return null;
  const cached = readTimedCache(detailCache, String(id));
  if (cached) return cached;
  const page = await fetchPageById(id);
  if (!page?.title) return null;
  const summary = await fetchSummary(page.title);
  if (!summary) return null;
  const qid = String(summary?.wikibase_item || page?.pageprops?.wikibase_item || "").trim();
  const entity = (await fetchEntities(qid ? [qid] : [], "claims|labels")).get(qid) || {};
  if (qid && entity && !isVideoGameEntity(entity)) return null;
  const linked = [...new Set(["P136", "P400", "P178", "P123"].flatMap((prop) => claimEntityIds(entity, prop)))];
  const labels = await labelMapForEntities(linked);
  const cover = await fetchInfoboxCover(summary?.title || page?.title || "").catch(() => "");
  const mapped = mapDetailRow(summary, entity, labels, cover);
  if (!mapped) return null;
  const hero = await fetchSpotlightScreenshot(mapped.name, mapped.cover).catch(() => mapped.cover || "");
  const screenshots = mergeScreenshotUrls([hero, mapped.cover], mapped.screenshots || []);
  const normalized = {
    ...mapped,
    hero: hero || mapped.hero || mapped.cover || "",
    background_image: hero || mapped.background_image || mapped.cover || "",
    screenshots,
    short_screenshots: screenshots.map((image, idx) => ({ id: idx + 1, image }))
  };
  writeTimedCache(detailCache, String(id), normalized, WIKI_DETAIL_TTL_MS);
  return normalized;
}
__name(fetchWikipediaGameDetailsById, "fetchWikipediaGameDetailsById");
async function fetchGamesByExplicitIds(ids = []) {
  const rows = (await Promise.all((Array.isArray(ids) ? ids : []).slice(0, 60).map((id) => fetchWikipediaGameDetailsById(id).catch(() => null)))).filter(Boolean);
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    slug: row.slug,
    released: row.released,
    cover: row.cover,
    hero: row.hero,
    screenshots: row.screenshots,
    background_image: row.background_image,
    short_screenshots: row.short_screenshots,
    rating: row.rating,
    ratings_count: row.ratings_count,
    metacritic: row.metacritic,
    genres: row.genres,
    platforms: row.platforms,
    website: row.website,
    source: row.source
  }));
}
__name(fetchGamesByExplicitIds, "fetchGamesByExplicitIds");
async function fetchWikipediaGamesList({ page = 1, pageSize = 20, search = "", id = "", ids = "", ordering = "-added", dates = "", genres = "", titleOnly = false, spotlight = false } = {}) {
  const safePage = clampInt2(page, 1, 1e5, 1);
  const safePageSize = clampInt2(pageSize, 1, 50, 20);
  const offset = (safePage - 1) * safePageSize;
  const explicitIds = [...new Set(String(`${ids || ""},${id || ""}`).split(",").map((entry) => Number(String(entry || "").trim())).filter((value) => Number.isFinite(value) && value > 0))];
  const numericSearchId = /^\d+$/.test(String(search || "").trim()) ? Number(search) : 0;
  if (numericSearchId > 0) explicitIds.push(numericSearchId);
  if (explicitIds.length) {
    let rows2 = await fetchGamesByExplicitIds(explicitIds);
    rows2 = dedupeRows(sortRows(filterRowsByDates(filterRowsByGenres(rows2, genres), dates), ordering));
    const totalCount = rows2.length;
    rows2 = rows2.slice(0, safePageSize);
    if (spotlight) {
      rows2 = await enrichRowsWithSpotlightScreenshots(rows2, Math.min(10, safePageSize));
    }
    return { count: totalCount, results: rows2 };
  }
  const cacheKey = JSON.stringify({ safePage, safePageSize, search: String(search || "").trim().toLowerCase(), ordering: String(ordering || "").trim().toLowerCase(), dates: String(dates || "").trim(), genres: String(genres || "").trim().toLowerCase(), titleOnly: !!titleOnly, spotlight: !!spotlight });
  const cached = readTimedCache(listCache, cacheKey);
  if (cached) return cached;
  let rows = [];
  let count3 = 0;
  const genreTokens = parseGenreFilterTokens(genres);
  if (String(search || "").trim()) {
    const searchLimit = titleOnly ? Math.max(20, safePageSize * 2) : Math.max(36, safePageSize * 4);
    const searched = await fetchSearchCandidates(search, offset, searchLimit, titleOnly);
    rows = await hydrateRows(searched.rows);
    if (titleOnly) {
      const seedQueryMatches = buildSeedQueryMatchCandidates(search, Math.max(24, safePageSize * 2));
      if (rows.length < safePageSize) {
        const queryBackfill = await hydrateRows(seedQueryMatches);
        rows = [...rows, ...queryBackfill];
      }
    } else {
      const popularSeeds = await fetchPopularSeedCandidates(36);
      const seedQueryMatches = buildSeedQueryMatchCandidates(search, 24);
      const genreSeedMatches = buildGenreSeedCandidates(genres, Math.max(18, safePageSize * 2));
      const genreSearchMatches = genreTokens.size ? await fetchGenreSearchCandidates(genres, Math.max(28, safePageSize * 2)) : [];
      if (rows.length < safePageSize) {
        const [popularBackfill, queryBackfill, genreBackfill, genreQueryBackfill] = await Promise.all([
          hydrateRows(popularSeeds),
          hydrateRows(seedQueryMatches),
          hydrateRows(genreSeedMatches),
          hydrateRows(genreSearchMatches)
        ]);
        rows = [...rows, ...queryBackfill, ...genreBackfill, ...genreQueryBackfill, ...popularBackfill];
      }
    }
    rows = dedupeRows(rows);
    rows = filterRowsByDates(filterRowsByGenres(rows, genres), dates);
    rows = dedupeRows(rows);
    rows = sortSearchRowsByQuery(rows, search);
    if (titleOnly) {
      rows = rows.filter((row) => titleIncludesQuery(row?.name || row?.title || "", search));
    } else if (String(ordering || "").trim().toLowerCase() !== "-added") {
      rows = sortRowsByPopularity(rows, ordering);
    }
    const hasExtraFilters = !!String(dates || "").trim() || genreTokens.size > 0;
    count3 = titleOnly ? Math.max(offset + rows.length, rows.length) : hasExtraFilters ? offset + rows.length + (rows.length >= safePageSize ? safePageSize : 0) : Math.max(Number(searched.totalHits || 0), offset + rows.length);
    rows = rows.slice(0, safePageSize);
    if (spotlight) {
      rows = await enrichRowsWithSpotlightScreenshots(rows, Math.min(titleOnly ? 6 : 10, safePageSize));
    }
  } else {
    const candidateTarget = Math.min(Math.max(offset + safePageSize * 3 + 24, 96), 560);
    const candidates = await fetchCategoryCandidates(dates, candidateTarget);
    const popularCandidates = await fetchPopularSeedCandidates(POPULAR_SEED_BATCH_SIZE);
    const popularSearchCandidates = await fetchPopularSearchSeedCandidates();
    const genreSeedCandidates = buildGenreSeedCandidates(genres, Math.max(30, safePageSize * 3));
    const genreSearchCandidates = genreTokens.size ? await fetchGenreSearchCandidates(genres, Math.max(42, safePageSize * 4)) : [];
    const blendedCandidates = [
      ...genreSeedCandidates,
      ...genreSearchCandidates,
      ...popularCandidates,
      ...popularSearchCandidates,
      ...candidates
    ].slice(0, Math.min(Math.max(offset + safePageSize * 4 + 48, 160), 720));
    rows = dedupeRows(await hydrateRows(blendedCandidates));
    rows = filterRowsByDates(filterRowsByGenres(rows, genres), dates);
    rows = dedupeRows(rows);
    rows = sortRowsByPopularity(rows, ordering);
    const neededPoolSize = offset + safePageSize;
    if (rows.length < neededPoolSize) {
      const excludedIds = new Set(rows.map((row) => Number(row?.id || 0)).filter((id2) => Number.isFinite(id2) && id2 > 0));
      let backfillRows = await fetchSummaryBackfillRows(Math.max(neededPoolSize - rows.length, 0) + 8, excludedIds, genres);
      backfillRows = filterRowsByDates(filterRowsByGenres(backfillRows, genres), dates);
      rows = sortRowsByPopularity(dedupeRows([...rows, ...backfillRows]), ordering);
    }
    count3 = rows.length;
    rows = rows.slice(offset, offset + safePageSize);
    if (spotlight) {
      rows = await enrichRowsWithSpotlightScreenshots(rows, Math.min(12, safePageSize));
    }
  }
  const payload = { count: Number(count3 || rows.length || 0), results: rows };
  writeTimedCache(listCache, cacheKey, payload, WIKI_LIST_TTL_MS);
  return payload;
}
__name(fetchWikipediaGamesList, "fetchWikipediaGamesList");
var WIKIPEDIA_API_BASE;
var WIKIPEDIA_REST_BASE;
var WIKIDATA_API_BASE;
var WIKI_REQUEST_TIMEOUT_MS;
var WIKIDATA_VIDEO_GAME_QID;
var WIKI_SUMMARY_TTL_MS;
var WIKI_LIST_TTL_MS;
var WIKI_DETAIL_TTL_MS;
var WIKI_ENTITY_TTL_MS;
var WIKI_MEDIA_TTL_MS;
var MAX_CACHE_ENTRIES;
var POPULAR_SEED_BATCH_SIZE;
var WIKI_YEAR_CANDIDATE_LIMIT;
var WIKIPEDIA_GAME_GENRES;
var summaryCache;
var listCache;
var detailCache;
var entityCache;
var mediaCache;
var POPULAR_GAME_TITLE_SEEDS;
var POPULAR_SEARCH_SEEDS;
var GENRE_SEARCH_QUERY_SEEDS;
var CANONICAL_GENRE_BY_SLUG;
var CANONICAL_GENRE_BY_ID;
var GENRE_ALIAS_RULES;
var ROMAN_NUMERAL_MAP;
var POPULAR_TITLE_RANK;
var init_wiki_games_provider = __esm({
  "../backend/lib/wiki-games-provider.js"() {
    init_functionsRoutes_0_04524570753253654();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    WIKIPEDIA_API_BASE = "https://en.wikipedia.org/w/api.php";
    WIKIPEDIA_REST_BASE = "https://en.wikipedia.org/api/rest_v1";
    WIKIDATA_API_BASE = "https://www.wikidata.org/w/api.php";
    WIKI_REQUEST_TIMEOUT_MS = 7e3;
    WIKIDATA_VIDEO_GAME_QID = "Q7889";
    WIKI_SUMMARY_TTL_MS = 1e3 * 60 * 30;
    WIKI_LIST_TTL_MS = 1e3 * 60 * 4;
    WIKI_DETAIL_TTL_MS = 1e3 * 60 * 30;
    WIKI_ENTITY_TTL_MS = 1e3 * 60 * 60;
    WIKI_MEDIA_TTL_MS = 1e3 * 60 * 60;
    MAX_CACHE_ENTRIES = 500;
    POPULAR_SEED_BATCH_SIZE = 42;
    WIKI_YEAR_CANDIDATE_LIMIT = 20;
    WIKIPEDIA_GAME_GENRES = [
      { id: 1, name: "Action", slug: "action" },
      { id: 2, name: "Action-adventure", slug: "action-adventure" },
      { id: 3, name: "Adventure", slug: "adventure" },
      { id: 4, name: "Role-playing", slug: "role-playing" },
      { id: 5, name: "Strategy", slug: "strategy" },
      { id: 6, name: "Simulation", slug: "simulation" },
      { id: 7, name: "Sports", slug: "sports" },
      { id: 8, name: "Racing", slug: "racing" },
      { id: 9, name: "Fighting", slug: "fighting" },
      { id: 10, name: "Shooter", slug: "shooter" },
      { id: 11, name: "Platformer", slug: "platformer" },
      { id: 12, name: "Puzzle", slug: "puzzle" },
      { id: 13, name: "Horror", slug: "horror" },
      { id: 14, name: "Stealth", slug: "stealth" },
      { id: 15, name: "Survival", slug: "survival" },
      { id: 16, name: "Sandbox", slug: "sandbox" },
      { id: 17, name: "MMO", slug: "mmo" },
      { id: 18, name: "Indie", slug: "indie" }
    ];
    summaryCache = /* @__PURE__ */ new Map();
    listCache = /* @__PURE__ */ new Map();
    detailCache = /* @__PURE__ */ new Map();
    entityCache = /* @__PURE__ */ new Map();
    mediaCache = /* @__PURE__ */ new Map();
    POPULAR_GAME_TITLE_SEEDS = [
      "Minecraft",
      "Grand Theft Auto V",
      "Fortnite Battle Royale",
      "Roblox",
      "League of Legends",
      "Valorant",
      "Counter-Strike 2",
      "Dota 2",
      "Apex Legends",
      "Call of Duty: Warzone",
      "Elden Ring",
      "Baldur's Gate 3",
      "The Legend of Zelda: Tears of the Kingdom",
      "The Legend of Zelda: Breath of the Wild",
      "Cyberpunk 2077",
      "Red Dead Redemption 2",
      "The Witcher 3: Wild Hunt",
      "God of War Ragnar\xF6k",
      "Hades",
      "Helldivers 2",
      "Palworld",
      "Black Myth: Wukong",
      "Final Fantasy VII Rebirth",
      "Alan Wake 2",
      "Metaphor: ReFantazio",
      "Dragon's Dogma 2",
      "Hollow Knight",
      "Hollow Knight: Silksong",
      "Persona 5",
      "Persona 3 Reload",
      "Like a Dragon: Infinite Wealth",
      "Resident Evil 4 (2023 video game)",
      "Silent Hill 2 (2024 video game)",
      "Dead Space (2023 video game)",
      "Resident Evil Village",
      "Stardew Valley",
      "Terraria",
      "No Man's Sky",
      "Sea of Thieves",
      "Destiny 2",
      "Rainbow Six Siege",
      "Overwatch 2",
      "Rocket League",
      "Genshin Impact",
      "Honkai: Star Rail",
      "Zenless Zone Zero",
      "Marvel Rivals",
      "PUBG: Battlegrounds",
      "Escape from Tarkov",
      "Path of Exile",
      "Path of Exile 2",
      "Civilization VI",
      "Age of Empires IV",
      "StarCraft II",
      "Total War: Warhammer III",
      "XCOM 2",
      "Crusader Kings III",
      "Diablo IV",
      "World of Warcraft",
      "Final Fantasy XIV",
      "Monster Hunter: World",
      "Monster Hunter Wilds",
      "EA Sports FC 25",
      "EA Sports FC 24",
      "FIFA 23",
      "FIFA 22",
      "FIFA 21",
      "FIFA 20",
      "FIFA 19",
      "FIFA 18",
      "FIFA 17",
      "FIFA 16",
      "NBA 2K25",
      "Madden NFL 25",
      "Gran Turismo 7",
      "Forza Horizon 5",
      "Need for Speed Unbound",
      "Tekken 8",
      "Street Fighter 6",
      "Mortal Kombat 1",
      "Super Smash Bros. Ultimate",
      "Super Mario Odyssey",
      "Super Mario Bros. Wonder",
      "Animal Crossing: New Horizons",
      "Pok\xE9mon Scarlet and Violet",
      "Pok\xE9mon Legends: Arceus",
      "Splatoon 3",
      "Fire Emblem Engage",
      "Metroid Dread",
      "Starfield (video game)",
      "Avowed",
      "S.T.A.L.K.E.R. 2: Heart of Chornobyl",
      "Lies of P",
      "Lethal Company",
      "Phasmophobia",
      "Among Us",
      "The Finals",
      "Remnant II",
      "Warframe",
      "The Last of Us Part II",
      "Ghost of Tsushima",
      "Death Stranding",
      "Assassin's Creed Valhalla",
      "Assassin's Creed Shadows",
      "Hogwarts Legacy",
      "Marvel's Spider-Man 2",
      "The Elder Scrolls V: Skyrim",
      "Fallout 4",
      "Fallout: New Vegas",
      "Nier: Automata",
      "Sekiro: Shadows Die Twice",
      "Bloodborne",
      "Dark Souls III",
      "Clair Obscur: Expedition 33"
    ];
    POPULAR_SEARCH_SEEDS = [
      "best-selling video games",
      "most played video games",
      "game of the year video game",
      "top video games"
    ];
    GENRE_SEARCH_QUERY_SEEDS = {
      action: ["action video game", "best action games"],
      "action-adventure": ["action-adventure video game", "open world action game"],
      adventure: ["adventure video game"],
      "role-playing": ["role-playing video game", "rpg video game", "jrpg video game"],
      strategy: ["strategy video game", "turn-based strategy game", "real-time strategy game"],
      simulation: ["simulation video game", "simulator video game"],
      sports: ["sports video game", "fifa video game", "ea sports fc", "madden nfl video game", "nba 2k video game"],
      racing: ["racing video game", "forza video game", "gran turismo video game", "need for speed video game"],
      fighting: ["fighting video game", "tekken video game", "street fighter video game"],
      shooter: ["shooter video game", "fps video game", "battle royale video game"],
      platformer: ["platform game", "platformer video game"],
      puzzle: ["puzzle video game"],
      horror: ["horror video game", "survival horror game"],
      stealth: ["stealth video game"],
      survival: ["survival video game"],
      sandbox: ["sandbox video game"],
      mmo: ["mmorpg video game", "massively multiplayer online game"],
      indie: ["indie video game"]
    };
    CANONICAL_GENRE_BY_SLUG = new Map(
      WIKIPEDIA_GAME_GENRES.map((genre) => [String(genre.slug || "").trim().toLowerCase(), genre])
    );
    CANONICAL_GENRE_BY_ID = new Map(
      WIKIPEDIA_GAME_GENRES.map((genre) => [Number(genre.id || 0), genre])
    );
    GENRE_ALIAS_RULES = [
      { slug: "action-adventure", patterns: [/action adventure/, /action[-\s]?adventure/] },
      { slug: "role-playing", patterns: [/role[-\s]?playing/, /\brpg\b/] },
      { slug: "strategy", patterns: [/strategy/, /real[-\s]?time strategy/, /turn[-\s]?based strategy/, /civilization/, /age of empires/, /starcraft/, /xcom/, /total war/, /crusader kings/, /hearts of iron/] },
      { slug: "simulation", patterns: [/simulation/, /simulator/, /management/] },
      { slug: "sports", patterns: [/sports?/, /football/, /soccer/, /basketball/, /baseball/, /hockey/, /tennis/, /golf/, /fifa/, /madden/, /nba\s*2k/, /ea sports fc/, /wwe\s*2k/, /mlb the show/, /\bufc\b/, /\bpga\b/] },
      { slug: "racing", patterns: [/racing/, /driving/, /kart/, /forza/, /gran turismo/, /need for speed/, /mario kart/, /\bf1\b/, /rally/] },
      { slug: "fighting", patterns: [/fighting/, /beat em up/, /brawler/, /tekken/, /street fighter/, /mortal kombat/, /smash bros/, /super smash/] },
      { slug: "shooter", patterns: [/shooter/, /first person shooter/, /third person shooter/, /\bfps\b/, /call of duty/, /battlefield/, /counter[-\s]?strike/, /rainbow six/, /valorant/] },
      { slug: "platformer", patterns: [/platform/, /platformer/] },
      { slug: "puzzle", patterns: [/puzzle/] },
      { slug: "horror", patterns: [/horror/] },
      { slug: "stealth", patterns: [/stealth/] },
      { slug: "survival", patterns: [/survival/, /survive/] },
      { slug: "sandbox", patterns: [/sandbox/, /open world/] },
      { slug: "mmo", patterns: [/massively multiplayer/, /\bmmo\b/, /\bmmorpg\b/] },
      { slug: "indie", patterns: [/indie/] },
      { slug: "adventure", patterns: [/\badventure\b/] },
      { slug: "action", patterns: [/\baction\b/] }
    ];
    __name2(clampInt2, "clampInt");
    __name2(chunkArray, "chunkArray");
    __name2(runWithConcurrency, "runWithConcurrency");
    ROMAN_NUMERAL_MAP = {
      i: "1",
      ii: "2",
      iii: "3",
      iv: "4",
      v: "5",
      vi: "6",
      vii: "7",
      viii: "8",
      ix: "9",
      x: "10"
    };
    __name2(normalizeGameKey, "normalizeGameKey");
    POPULAR_TITLE_RANK = new Map(
      POPULAR_GAME_TITLE_SEEDS.map((title2, index2) => [normalizeGameKey(title2), index2 + 1])
    );
    __name2(buildAcronym, "buildAcronym");
    __name2(isOneEditAway, "isOneEditAway");
    __name2(isTransposition, "isTransposition");
    __name2(tokenMatchesQuery, "tokenMatchesQuery");
    __name2(titleMatchesQueryLoose, "titleMatchesQueryLoose");
    __name2(titleIncludesQuery, "titleIncludesQuery");
    __name2(canonicalGenreSlugFromText, "canonicalGenreSlugFromText");
    __name2(toCanonicalGenreRow, "toCanonicalGenreRow");
    __name2(resolveGenreFilterToken, "resolveGenreFilterToken");
    __name2(stripHtml, "stripHtml");
    __name2(normalizeTitle, "normalizeTitle");
    __name2(encodeTitle, "encodeTitle");
    __name2(isExcludedTitle, "isExcludedTitle");
    __name2(toHttpsUrl2, "toHttpsUrl");
    __name2(normalizeMediaUrl, "normalizeMediaUrl");
    __name2(expandWikimediaThumbUrl, "expandWikimediaThumbUrl");
    __name2(resolveMediaItemImageUrl, "resolveMediaItemImageUrl");
    __name2(isLikelyScreenshotMediaItem, "isLikelyScreenshotMediaItem");
    __name2(readTimedCache, "readTimedCache");
    __name2(writeTimedCache, "writeTimedCache");
    __name2(parseDateToUnix, "parseDateToUnix");
    __name2(parseDatesRange, "parseDatesRange");
    __name2(parseWikidataDate, "parseWikidataDate");
    __name2(extractYearFallback, "extractYearFallback");
    __name2(claimEntityIds, "claimEntityIds");
    __name2(claimStringValues, "claimStringValues");
    __name2(isVideoGameEntity, "isVideoGameEntity");
    __name2(pickLabel, "pickLabel");
    __name2(extractReleaseDate, "extractReleaseDate");
    __name2(toSortEpoch, "toSortEpoch");
    __name2(filterRowsByDates, "filterRowsByDates");
    __name2(parseGenreFilterTokens, "parseGenreFilterTokens");
    __name2(filterRowsByGenres, "filterRowsByGenres");
    __name2(sortRows, "sortRows");
    __name2(dedupeRows, "dedupeRows");
    __name2(fetchJson2, "fetchJson");
    __name2(wikiQuery, "wikiQuery");
    __name2(wikidataQuery, "wikidataQuery");
    __name2(fetchSummaryViaQuery, "fetchSummaryViaQuery");
    __name2(fetchSummary, "fetchSummary");
    __name2(fetchPageById, "fetchPageById");
    __name2(fetchInfoboxCover, "fetchInfoboxCover");
    __name2(fetchSpotlightScreenshot, "fetchSpotlightScreenshot");
    __name2(fetchEntities, "fetchEntities");
    __name2(labelMapForEntities, "labelMapForEntities");
    __name2(mapGenres, "mapGenres");
    __name2(inferGenresFromText, "inferGenresFromText");
    __name2(mapPlatforms, "mapPlatforms");
    __name2(mapCompanies, "mapCompanies");
    __name2(mapListRow, "mapListRow");
    __name2(mapSummaryBackfillRow, "mapSummaryBackfillRow");
    __name2(mapDetailRow, "mapDetailRow");
    __name2(mergeScreenshotUrls, "mergeScreenshotUrls");
    __name2(enrichRowsWithSpotlightScreenshots, "enrichRowsWithSpotlightScreenshots");
    __name2(hydrateRows, "hydrateRows");
    __name2(parseRequestedYears, "parseRequestedYears");
    __name2(fetchCategoryCandidates, "fetchCategoryCandidates");
    __name2(fetchSearchCandidates, "fetchSearchCandidates");
    __name2(fetchPopularSeedCandidates, "fetchPopularSeedCandidates");
    __name2(fetchPopularSearchSeedCandidates, "fetchPopularSearchSeedCandidates");
    __name2(fetchSummaryBackfillRows, "fetchSummaryBackfillRows");
    __name2(sortRowsByPopularity, "sortRowsByPopularity");
    __name2(sortSearchRowsByQuery, "sortSearchRowsByQuery");
    __name2(buildSeedQueryMatchCandidates, "buildSeedQueryMatchCandidates");
    __name2(titleMatchesGenreTokens, "titleMatchesGenreTokens");
    __name2(buildGenreSeedCandidates, "buildGenreSeedCandidates");
    __name2(buildGenreSearchQueries, "buildGenreSearchQueries");
    __name2(fetchGenreSearchCandidates, "fetchGenreSearchCandidates");
    __name2(fetchWikipediaGameDetailsById, "fetchWikipediaGameDetailsById");
    __name2(fetchGamesByExplicitIds, "fetchGamesByExplicitIds");
    __name2(fetchWikipediaGamesList, "fetchWikipediaGamesList");
  }
});
function clampInt3(value, min, max, fallback) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, Math.floor(n)));
}
__name(clampInt3, "clampInt3");
function isTruthyFlag(value) {
  const normalized = String(value || "").trim().toLowerCase();
  return ["1", "true", "yes", "on"].includes(normalized);
}
__name(isTruthyFlag, "isTruthyFlag");
function readQuery5(req) {
  if (req.query && typeof req.query === "object") return req.query;
  try {
    const url = new URL(req.url || "", "http://localhost");
    return Object.fromEntries(url.searchParams.entries());
  } catch (_error) {
    return {};
  }
}
__name(readQuery5, "readQuery5");
function readPathParts5(query) {
  const rawPath = query?.path;
  if (Array.isArray(rawPath)) return rawPath.filter(Boolean);
  return String(rawPath || "").split("/").filter(Boolean);
}
__name(readPathParts5, "readPathParts5");
async function handler7(req, res) {
  const query = readQuery5(req);
  const pathParts = readPathParts5(query);
  const section = String(pathParts[0] || "").trim().toLowerCase();
  if (!section) {
    return res.json({
      ok: true,
      service: "igdb-lite",
      configured: false,
      source: "wikipedia"
    });
  }
  if (section === "genres") {
    return res.json({
      count: WIKIPEDIA_GAME_GENRES.length,
      results: WIKIPEDIA_GAME_GENRES
    });
  }
  if (section === "games" && pathParts.length === 1) {
    const page = clampInt3(query.page, 1, 1e5, 1);
    const pageSize = clampInt3(query.page_size, 1, 80, 20);
    const search = String(query.search || "").trim().slice(0, 120);
    const ordering = String(query.ordering || "-added").trim();
    const dates = String(query.dates || "").trim();
    const genres = String(query.genres || "").trim();
    const titleOnly = isTruthyFlag(query.title_only || query.search_title_only || query.titleOnly);
    const spotlight = isTruthyFlag(query.spotlight || query.include_spotlight || query.includeSpotlight);
    try {
      const payload = await fetchWikipediaGamesList({
        page,
        pageSize,
        search,
        ordering,
        dates,
        genres,
        titleOnly,
        spotlight
      });
      const results = Array.isArray(payload?.results) ? payload.results : [];
      return res.json({
        count: Number(payload?.count || results.length),
        page,
        page_size: pageSize,
        results,
        sources: {
          wikipedia: true,
          igdb: false,
          rawg: false,
          gamebrain: false
        }
      });
    } catch (error3) {
      return res.status(502).json({
        count: 0,
        page,
        page_size: pageSize,
        results: [],
        message: "Wikipedia games request failed.",
        detail: String(error3?.message || error3 || "")
      });
    }
  }
  if (section === "games" && pathParts.length >= 2) {
    const id = Number(pathParts[1]);
    if (!Number.isFinite(id) || id <= 0) {
      return res.status(400).json({ message: "Invalid game id." });
    }
    try {
      const detail = await fetchWikipediaGameDetailsById(id);
      if (!detail) return res.status(404).json({ message: "Game not found." });
      return res.json(detail);
    } catch (error3) {
      return res.status(502).json({ message: "Game detail request failed.", detail: String(error3?.message || error3 || "") });
    }
  }
  return res.status(404).json({ message: "Not found" });
}
__name(handler7, "handler7");
var init_igdb_handler = __esm({
  "../api/igdb-handler.js"() {
    init_functionsRoutes_0_04524570753253654();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_wiki_games_provider();
    __name2(clampInt3, "clampInt");
    __name2(isTruthyFlag, "isTruthyFlag");
    __name2(readQuery5, "readQuery");
    __name2(readPathParts5, "readPathParts");
    __name2(handler7, "handler");
  }
});
function sanitizeDomain(value) {
  return String(value || "").trim().toLowerCase().replace(/^https?:\/\//i, "").replace(/^www\./i, "").replace(/\/.*/, "").replace(/[^a-z0-9.-]/g, "");
}
__name(sanitizeDomain, "sanitizeDomain");
function toCommonsFilePath(filename, size) {
  const safeName = String(filename || "").replace(/\s+/g, "_");
  const width = Number.isFinite(size) ? size : 256;
  return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(safeName)}?width=${width}`;
}
__name(toCommonsFilePath, "toCommonsFilePath");
function normalizeCommonsLogo(value, size) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (raw.startsWith("/")) return raw;
  if (raw.includes("Special:FilePath/")) {
    const url = raw.split("?")[0];
    return `${url}?width=${Number.isFinite(size) ? size : 256}`;
  }
  if (raw.startsWith("http")) {
    if (!/wikimedia|wikipedia/i.test(raw)) return raw;
    const parts = raw.split("/");
    const filename = parts[parts.length - 1];
    return toCommonsFilePath(filename, size);
  }
  return toCommonsFilePath(raw, size);
}
__name(normalizeCommonsLogo, "normalizeCommonsLogo");
function getManualLogoOverride(title2, domain2, size) {
  const titleKey = `title:${String(title2 || "").trim().toLowerCase()}`;
  const domainKey = `domain:${String(domain2 || "").trim().toLowerCase()}`;
  const match2 = MANUAL_LOGO_OVERRIDES.get(domainKey) || MANUAL_LOGO_OVERRIDES.get(titleKey) || "";
  return match2 ? normalizeCommonsLogo(match2, size) : "";
}
__name(getManualLogoOverride, "getManualLogoOverride");
function escapeRegex(value) {
  return String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
__name(escapeRegex, "escapeRegex");
async function fetchWikiLogo(title2, size) {
  if (!title2) return "";
  const normalizedTitle = TITLE_OVERRIDES.get(String(title2 || "").trim().toLowerCase()) || title2;
  const summaryUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(normalizedTitle)}?redirect=true`;
  const summaryRes = await fetch(summaryUrl, {
    headers: { "User-Agent": "Zo2yWikiLogo/1.0" }
  });
  if (!summaryRes.ok) return "";
  const payload = await summaryRes.json();
  const wikibaseId = payload?.wikibase_item;
  if (!wikibaseId) return "";
  const entityUrl = `https://www.wikidata.org/wiki/Special:EntityData/${encodeURIComponent(wikibaseId)}.json`;
  const entityRes = await fetch(entityUrl, {
    headers: { "User-Agent": "Zo2yWikiLogo/1.0" }
  });
  if (!entityRes.ok) return "";
  const entityPayload = await entityRes.json();
  const entity = entityPayload?.entities?.[wikibaseId];
  const logoClaim = entity?.claims?.P154?.[0];
  const logoFile = logoClaim?.mainsnak?.datavalue?.value;
  if (!logoFile) return "";
  return normalizeCommonsLogo(logoFile, size);
}
__name(fetchWikiLogo, "fetchWikiLogo");
async function fetchWikiLogoByDomain(domain2, size) {
  const cleanDomain = String(domain2 || "").trim().toLowerCase();
  if (!cleanDomain) return "";
  const domainPattern = escapeRegex(cleanDomain);
  const sparql = `
    SELECT ?logo WHERE {
      ?item wdt:P856 ?site .
      FILTER(REGEX(LCASE(STR(?site)), "^https?://(www\\.)?${domainPattern}(/|$)"))
      ?item wdt:P154 ?logo .
    } LIMIT 1
  `;
  const url = `https://query.wikidata.org/sparql?format=json&query=${encodeURIComponent(sparql)}`;
  const response = await fetch(url, {
    headers: {
      "User-Agent": "Zo2yWikiLogo/1.0",
      "Accept": "application/sparql-results+json"
    }
  });
  if (!response.ok) return "";
  const json3 = await response.json();
  const value = json3?.results?.bindings?.[0]?.logo?.value;
  if (!value) return "";
  return normalizeCommonsLogo(value, size);
}
__name(fetchWikiLogoByDomain, "fetchWikiLogoByDomain");
async function handler8(req, res) {
  try {
    if (req.method && req.method !== "GET") {
      res.status(405).json({ message: "Method not allowed" });
      return;
    }
    const query = req.query || {};
    const titleRaw = String(query.title || "").trim();
    const domainRaw = sanitizeDomain(query.domain || "");
    const sizeRaw = Number(query.size || 256);
    const size = Number.isFinite(sizeRaw) ? Math.max(64, Math.min(512, sizeRaw)) : 256;
    const logoOnly = String(query.mode || "").toLowerCase() === "logo";
    const domainOverride = DOMAIN_TITLE_OVERRIDES.get(domainRaw) || "";
    const normalizedTitle = domainOverride || titleRaw;
    const manualLogo = getManualLogoOverride(normalizedTitle, domainRaw, size);
    if (manualLogo) {
      res.setHeader("Cache-Control", "public, s-maxage=86400, stale-while-revalidate=604800");
      res.status(302);
      res.setHeader("Location", manualLogo);
      res.end();
      return;
    }
    if (domainRaw && logoOnly && typeof fetch === "function") {
      try {
        const logoUrl = await fetchWikiLogoByDomain(domainRaw, size);
        if (logoUrl) {
          res.setHeader("Cache-Control", "public, s-maxage=86400, stale-while-revalidate=604800");
          res.status(302);
          res.setHeader("Location", logoUrl);
          res.end();
          return;
        }
      } catch (_err) {
      }
    }
    if (normalizedTitle && typeof fetch === "function") {
      try {
        const logoUrl = await fetchWikiLogo(normalizedTitle, size);
        if (logoUrl) {
          res.setHeader("Cache-Control", "public, s-maxage=86400, stale-while-revalidate=604800");
          res.status(302);
          res.setHeader("Location", logoUrl);
          res.end();
          return;
        }
      } catch (_err) {
      }
    }
    if (domainRaw && !logoOnly && typeof fetch === "function") {
      try {
        const googleUrl = `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domainRaw)}&sz=${size}`;
        const googleRes = await fetch(googleUrl);
        if (googleRes.ok) {
          res.setHeader("Cache-Control", "public, s-maxage=86400, stale-while-revalidate=604800");
          res.setHeader("Content-Type", googleRes.headers.get("content-type") || "image/png");
          const buffer = Buffer.from(await googleRes.arrayBuffer());
          res.status(200);
          res.end(buffer);
          return;
        }
      } catch (_err) {
      }
      try {
        const ddgUrl = `https://icons.duckduckgo.com/ip3/${encodeURIComponent(domainRaw)}.ico`;
        res.setHeader("Cache-Control", "public, s-maxage=86400, stale-while-revalidate=604800");
        res.status(302);
        res.setHeader("Location", ddgUrl);
        res.end();
        return;
      } catch (_err) {
      }
    }
    res.status(302);
    res.setHeader("Location", logoOnly ? "/logo-placeholder.svg" : "/newlogo.webp");
    res.end();
  } catch (_err) {
    res.status(302);
    res.setHeader("Location", "/logo-placeholder.svg");
    res.end();
  }
}
__name(handler8, "handler8");
var TITLE_OVERRIDES;
var DOMAIN_TITLE_OVERRIDES;
var MANUAL_LOGO_OVERRIDES;
var init_logo = __esm({
  "../api/logo.js"() {
    init_functionsRoutes_0_04524570753253654();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    __name2(sanitizeDomain, "sanitizeDomain");
    __name2(toCommonsFilePath, "toCommonsFilePath");
    TITLE_OVERRIDES = /* @__PURE__ */ new Map([
      ["american eagle", "American Eagle Outfitters"],
      ["american eagle outfitters", "American Eagle Outfitters"],
      ["ae", "American Eagle Outfitters"],
      ["arbys", "Arby's"],
      ["arby's", "Arby's"],
      ["chipotle", "Chipotle Mexican Grill"],
      ["cava", "Cava Group"],
      ["dunkin", "Dunkin'"],
      ["dunkin donuts", "Dunkin'"],
      ["chick-fil-a", "Chick-fil-A"],
      ["chick fil a", "Chick-fil-A"],
      ["popeyes", "Popeyes"],
      ["burger king", "Burger King"],
      ["kfc", "KFC"],
      ["mcdonalds", "McDonald's"],
      ["mcdonald's", "McDonald's"],
      ["wendys", "Wendy's"],
      ["wendy's", "Wendy's"],
      ["in-n-out", "In-N-Out Burger"],
      ["in n out", "In-N-Out Burger"],
      ["subway", "Subway (restaurant)"],
      ["taco bell", "Taco Bell"],
      ["panda express", "Panda Express"],
      ["dominos", "Domino's"],
      ["domino's", "Domino's"],
      ["pizza hut", "Pizza Hut"],
      ["panera", "Panera Bread"],
      ["panera bread", "Panera Bread"],
      ["starbucks", "Starbucks"],
      ["five guys", "Five Guys"],
      ["shake shack", "Shake Shack"],
      ["chipotle mexican grill", "Chipotle Mexican Grill"],
      ["nike", "Nike, Inc."],
      ["adidas", "Adidas"],
      ["new balance", "New Balance"],
      ["under armour", "Under Armour"],
      ["lululemon", "Lululemon Athletica"],
      ["supreme", "Supreme (skateboard shop)"],
      ["off-white", "Off-White (brand)"],
      ["off white", "Off-White (brand)"],
      ["h&m", "H&M"],
      ["hm", "H&M"],
      ["arcteryx", "Arc'teryx"],
      ["arc'teryx", "Arc'teryx"],
      ["aritzia", "Aritzia"],
      ["allbirds", "Allbirds"],
      ["& other stories", "& Other Stories"],
      ["and other stories", "& Other Stories"],
      ["aerie", "Aerie (brand)"],
      ["aeropostale", "Aeropostale"],
      ["alexander mcqueen", "Alexander McQueen"],
      ["abercrombie & fitch", "Abercrombie & Fitch"],
      ["abercrombie and fitch", "Abercrombie & Fitch"],
      ["asos", "ASOS"],
      ["asics", "ASICS"],
      ["stone island", "Stone Island"],
      ["the north face", "The North Face"],
      ["patagonia", "Patagonia (clothing)"],
      ["gucci", "Gucci"],
      ["prada", "Prada"],
      ["louis vuitton", "Louis Vuitton"],
      ["burberry", "Burberry"],
      ["balenciaga", "Balenciaga"],
      ["moncler", "Moncler"],
      ["hermes", "Herm\xE8s"],
      ["dior", "Dior"],
      ["versace", "Versace"],
      ["ralph lauren", "Ralph Lauren Corporation"],
      ["calvin klein", "Calvin Klein"],
      ["tommy hilfiger", "Tommy Hilfiger"],
      ["coach", "Coach (company)"],
      ["converse", "Converse (shoe company)"],
      ["vans", "Vans"],
      ["puma", "Puma (brand)"],
      ["reebok", "Reebok"],
      ["fila", "Fila (company)"],
      ["gap", "Gap Inc."],
      ["old navy", "Old Navy"],
      ["bananarepublic", "Banana Republic"],
      ["banana republic", "Banana Republic"],
      ["forever 21", "Forever 21"],
      ["shein", "Shein"],
      ["uniqlo", "Uniqlo"],
      ["zara", "Zara (retailer)"],
      ["cos", "COS (fashion brand)"],
      ["arket", "Arket"],
      ["bmw", "BMW"],
      ["mercedes", "Mercedes-Benz"],
      ["mercedes-benz", "Mercedes-Benz"],
      ["vw", "Volkswagen"],
      ["volkswagen", "Volkswagen"],
      ["toyota", "Toyota"],
      ["honda", "Honda"],
      ["ford", "Ford Motor Company"],
      ["chevrolet", "Chevrolet"],
      ["nissan", "Nissan"],
      ["hyundai", "Hyundai Motor Company"],
      ["kia", "Kia"],
      ["audi", "Audi"],
      ["lexus", "Lexus"],
      ["tesla", "Tesla, Inc."],
      ["porsche", "Porsche"],
      ["ferrari", "Ferrari"],
      ["lamborghini", "Lamborghini"],
      ["land rover", "Land Rover"],
      ["jaguar", "Jaguar Cars"],
      ["volvo", "Volvo Cars"],
      ["subaru", "Subaru"],
      ["mazda", "Mazda"],
      ["mitsubishi", "Mitsubishi Motors"],
      ["suzuki", "Suzuki"],
      ["peugeot", "Peugeot"],
      ["renault", "Renault"],
      ["fiat", "Fiat"],
      ["alfa romeo", "Alfa Romeo"],
      ["skoda", "Skoda Auto"],
      ["seat", "SEAT"],
      ["bentley", "Bentley"],
      ["rolls-royce", "Rolls-Royce Motor Cars"],
      ["mini", "Mini (marque)"],
      ["jeep", "Jeep"],
      ["gmc", "GMC (automobile)"],
      ["cadillac", "Cadillac"],
      ["buick", "Buick"],
      ["dodge", "Dodge"],
      ["chrysler", "Chrysler"],
      ["acura", "Acura"],
      ["infiniti", "Infiniti"],
      ["genesis", "Genesis Motor"],
      ["polestar", "Polestar"],
      ["rivian", "Rivian"],
      ["lucid", "Lucid Motors"],
      ["byd", "BYD Auto"],
      ["maserati", "Maserati"],
      ["bugatti", "Bugatti"],
      ["mclaren", "McLaren"],
      ["aston martin", "Aston Martin"],
      ["citroen", "Citroen"],
      ["opel", "Opel"],
      ["vauxhall", "Vauxhall Motors"],
      ["lincoln", "Lincoln Motor Company"],
      ["saab", "Saab Automobile"],
      ["lancia", "Lancia"]
    ]);
    DOMAIN_TITLE_OVERRIDES = /* @__PURE__ */ new Map([
      ["ae.com", "American Eagle Outfitters"],
      ["americaneagle.com", "American Eagle Outfitters"],
      ["aritzia.com", "Aritzia"],
      ["arcteryx.com", "Arc'teryx"],
      ["abercrombie.com", "Abercrombie & Fitch"],
      ["aeropostale.com", "Aeropostale"],
      ["aerie.com", "Aerie (brand)"],
      ["stories.com", "& Other Stories"],
      ["alexandermcqueen.com", "Alexander McQueen"],
      ["arket.com", "Arket"],
      ["erewhon.com", "Erewhon"],
      ["hm.com", "H&M"],
      ["supremenewyork.com", "Supreme (skateboard shop)"],
      ["offwhite.com", "Off-White (brand)"],
      ["lululemon.com", "Lululemon Athletica"],
      ["patagonia.com", "Patagonia (clothing)"],
      ["thenorthface.com", "The North Face"],
      ["newbalance.com", "New Balance"],
      ["underarmour.com", "Under Armour"],
      ["allbirds.com", "Allbirds"],
      ["asos.com", "ASOS"],
      ["asics.com", "ASICS"],
      ["nike.com", "Nike, Inc."],
      ["adidas.com", "Adidas"],
      ["gucci.com", "Gucci"],
      ["prada.com", "Prada"],
      ["louisvuitton.com", "Louis Vuitton"],
      ["burberry.com", "Burberry"],
      ["balenciaga.com", "Balenciaga"],
      ["mcdonalds.com", "McDonald's"],
      ["burgerking.com", "Burger King"],
      ["kfc.com", "KFC"],
      ["tacobell.com", "Taco Bell"],
      ["dominos.com", "Domino's"],
      ["pizzahut.com", "Pizza Hut"],
      ["subway.com", "Subway (restaurant)"],
      ["starbucks.com", "Starbucks"],
      ["chipotle.com", "Chipotle Mexican Grill"],
      ["panerabread.com", "Panera Bread"],
      ["chick-fil-a.com", "Chick-fil-A"],
      ["fiveguys.com", "Five Guys"],
      ["shakeshack.com", "Shake Shack"],
      ["dunkin.com", "Dunkin'"],
      ["auntieannes.com", "Auntie Anne's"],
      ["baskinrobbins.com", "Baskin-Robbins"],
      ["applebees.com", "Applebee's"],
      ["bojangles.com", "Bojangles'"],
      ["arbys.com", "Arby's"],
      ["pizzahut.com", "Pizza Hut"],
      ["wendys.com", "Wendy's"],
      ["in-n-out.com", "In-N-Out Burger"],
      ["toyota.com", "Toyota"],
      ["honda.com", "Honda"],
      ["ford.com", "Ford Motor Company"],
      ["chevrolet.com", "Chevrolet"],
      ["nissan-global.com", "Nissan"],
      ["hyundai.com", "Hyundai Motor Company"],
      ["kia.com", "Kia"],
      ["bmw.com", "BMW"],
      ["mercedes-benz.com", "Mercedes-Benz"],
      ["audi.com", "Audi"],
      ["lexus.com", "Lexus"],
      ["tesla.com", "Tesla, Inc."],
      ["porsche.com", "Porsche"],
      ["ferrari.com", "Ferrari"],
      ["lamborghini.com", "Lamborghini"],
      ["landrover.com", "Land Rover"],
      ["jaguar.com", "Jaguar Cars"],
      ["volvocars.com", "Volvo Cars"],
      ["subaru.com", "Subaru"],
      ["mazda.com", "Mazda"],
      ["mitsubishi-motors.com", "Mitsubishi Motors"],
      ["suzuki.com", "Suzuki"],
      ["peugeot.com", "Peugeot"],
      ["renault.com", "Renault"],
      ["fiat.com", "Fiat"],
      ["alfaromeo.com", "Alfa Romeo"],
      ["skoda-auto.com", "Skoda Auto"],
      ["seat.com", "SEAT"],
      ["bentleymotors.com", "Bentley"],
      ["rolls-roycemotorcars.com", "Rolls-Royce Motor Cars"],
      ["mini.com", "Mini (marque)"],
      ["jeep.com", "Jeep"],
      ["gmc.com", "GMC (automobile)"],
      ["cadillac.com", "Cadillac"],
      ["buick.com", "Buick"],
      ["dodge.com", "Dodge"],
      ["chrysler.com", "Chrysler"],
      ["acura.com", "Acura"],
      ["infinitiusa.com", "Infiniti"],
      ["genesis.com", "Genesis Motor"],
      ["polestar.com", "Polestar"],
      ["rivian.com", "Rivian"],
      ["lucidmotors.com", "Lucid Motors"],
      ["byd.com", "BYD Auto"],
      ["maserati.com", "Maserati"],
      ["bugatti.com", "Bugatti"],
      ["mclaren.com", "McLaren"],
      ["astonmartin.com", "Aston Martin"],
      ["citroen.com", "Citroen"],
      ["opel.com", "Opel"],
      ["vauxhall.co.uk", "Vauxhall Motors"],
      ["lincoln.com", "Lincoln Motor Company"]
    ]);
    MANUAL_LOGO_OVERRIDES = /* @__PURE__ */ new Map([
      ["title:skoda", "Skoda-Auto-Logo-2011-present.svg"],
      ["title:skoda auto", "Skoda-Auto-Logo-2011-present.svg"],
      ["domain:skoda-auto.com", "Skoda-Auto-Logo-2011-present.svg"],
      ["title:porsche", "Porsche_Logo_2024.png"],
      ["domain:porsche.com", "Porsche_Logo_2024.png"],
      ["title:volkswagen", "Volkswagen_logo_2019.svg"],
      ["title:vw", "Volkswagen_logo_2019.svg"],
      ["domain:volkswagen.com", "Volkswagen_logo_2019.svg"],
      ["title:smart", "Smart_2022.svg"],
      ["domain:smart.com", "Smart_2022.svg"],
      ["title:alfa romeo", "Logo_Alfa_Romeo_(2015).svg"],
      ["domain:alfaromeo.com", "Logo_Alfa_Romeo_(2015).svg"],
      ["title:changan", "Changan_icon.svg"],
      ["title:changan automobile", "Changan_icon.svg"],
      ["domain:changan.com", "Changan_icon.svg"],
      ["title:bentley", "https://www.bentleymotors.com/content/dam/bm/websites/bmcom/bentleymotors-com/logos/Simplified%20Positive_BMdotCom_1000x500_2x1.png/_jcr_content/renditions/original./Simplified%20Positive_BMdotCom_1000x500_2x1.png"],
      ["domain:bentleymotors.com", "https://www.bentleymotors.com/content/dam/bm/websites/bmcom/bentleymotors-com/logos/Simplified%20Positive_BMdotCom_1000x500_2x1.png/_jcr_content/renditions/original./Simplified%20Positive_BMdotCom_1000x500_2x1.png"],
      ["title:aston martin", "/assets/manual-logos/aston-martin.svg"],
      ["domain:astonmartin.com", "/assets/manual-logos/aston-martin.svg"],
      ["title:lee", "/assets/manual-logos/lee.svg"],
      ["domain:lee.com", "/assets/manual-logos/lee.svg"],
      ["title:first watch", "https://upload.wikimedia.org/wikipedia/en/9/9a/First-watch-logo.png"],
      ["domain:firstwatch.com", "https://upload.wikimedia.org/wikipedia/en/9/9a/First-watch-logo.png"],
      ["title:church's chicken", "https://upload.wikimedia.org/wikipedia/commons/3/34/Churchs-logo.svg"],
      ["title:churchs chicken", "https://upload.wikimedia.org/wikipedia/commons/3/34/Churchs-logo.svg"],
      ["domain:churchs.com", "https://upload.wikimedia.org/wikipedia/commons/3/34/Churchs-logo.svg"],
      ["domain:churchschicken.com", "https://upload.wikimedia.org/wikipedia/commons/3/34/Churchs-logo.svg"],
      ["title:culichi town", "https://d2gqo3h0psesgi.cloudfront.net/auto/culichi-town-restaurant-z7mnsplj-logo.png"],
      ["domain:culichitown.com", "https://d2gqo3h0psesgi.cloudfront.net/auto/culichi-town-restaurant-z7mnsplj-logo.png"],
      ["title:zoe's kitchen", "https://upload.wikimedia.org/wikipedia/commons/5/57/Zoeslogo.jpg"],
      ["title:zoes kitchen", "https://upload.wikimedia.org/wikipedia/commons/5/57/Zoeslogo.jpg"],
      ["domain:zoeskitchen.com", "https://upload.wikimedia.org/wikipedia/commons/5/57/Zoeslogo.jpg"]
    ]);
    __name2(normalizeCommonsLogo, "normalizeCommonsLogo");
    __name2(getManualLogoOverride, "getManualLogoOverride");
    __name2(escapeRegex, "escapeRegex");
    __name2(fetchWikiLogo, "fetchWikiLogo");
    __name2(fetchWikiLogoByDomain, "fetchWikiLogoByDomain");
    __name2(handler8, "handler");
  }
});
function setResponseCache(res, { maxAge = 300, staleWhileRevalidate = 900 } = {}) {
  const age = Math.max(0, Math.floor(Number(maxAge) || 0));
  const swr = Math.max(0, Math.floor(Number(staleWhileRevalidate) || 0));
  res.setHeader("Cache-Control", `public, s-maxage=${age}, stale-while-revalidate=${swr}`);
}
__name(setResponseCache, "setResponseCache");
function clampInt4(value, min, max, fallback) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, Math.floor(n)));
}
__name(clampInt4, "clampInt4");
function toHttpsUrl3(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (raw.startsWith("//")) return `https:${raw}`;
  if (/^http:\/\//i.test(raw)) return raw.replace(/^http:\/\//i, "https://");
  return raw;
}
__name(toHttpsUrl3, "toHttpsUrl3");
function upgradeItunesArtwork(url, size = 1200) {
  const src = toHttpsUrl3(url);
  if (!src) return "";
  return src.replace(/\/[0-9]+x[0-9]+bb\./i, `/${size}x${size}bb.`).replace(/\/[0-9]+x[0-9]+\./i, `/${size}x${size}.`);
}
__name(upgradeItunesArtwork, "upgradeItunesArtwork");
function normalizeMarket(value = "US") {
  return String(value || "US").trim().slice(0, 2).toUpperCase() || "US";
}
__name(normalizeMarket, "normalizeMarket");
function normalizeMusicTypes(raw) {
  const allowed = /* @__PURE__ */ new Set(["track", "album"]);
  const rows = String(raw || "track").split(",").map((value) => String(value || "").trim().toLowerCase()).filter((value) => allowed.has(value));
  return rows.length ? rows : ["track"];
}
__name(normalizeMusicTypes, "normalizeMusicTypes");
function normalizeAlbumTypes(raw) {
  const rows = String(raw || "album").split(",").map((value) => String(value || "").trim().toLowerCase()).filter(Boolean);
  return rows.length ? rows : ["album"];
}
__name(normalizeAlbumTypes, "normalizeAlbumTypes");
function normalizeItunesTrackRow(track) {
  const collectionType = String(track?.collectionType || "").trim().toLowerCase();
  const rawArtwork = String(track?.artworkUrl100 || track?.artworkUrl60 || "").trim();
  const hiResArtwork = upgradeItunesArtwork(rawArtwork, 1200) || toHttpsUrl3(rawArtwork);
  return {
    source: "itunes",
    kind: "track",
    id: String(track?.trackId || track?.collectionId || ""),
    name: String(track?.trackName || track?.collectionName || "Track"),
    artists: [String(track?.artistName || "").trim()].filter(Boolean),
    artist_ids: [],
    album: {
      id: String(track?.collectionId || ""),
      name: String(track?.collectionName || "").trim(),
      album_type: collectionType === "single" ? "single" : collectionType || "album",
      release_date: String(track?.releaseDate || "").trim().slice(0, 10),
      total_tracks: Number(track?.trackCount || 0),
      images: [hiResArtwork].filter(Boolean).map((url) => ({ url, width: 1200, height: 1200 }))
    },
    image: hiResArtwork,
    preview_url: String(track?.previewUrl || "").trim(),
    external_url: String(track?.trackViewUrl || "").trim(),
    popularity: 0,
    duration_ms: Number(track?.trackTimeMillis || 0),
    explicit: false
  };
}
__name(normalizeItunesTrackRow, "normalizeItunesTrackRow");
function normalizeItunesAlbumRow(album) {
  const artistName = String(album?.artistName || "").trim();
  const rawArtwork = String(album?.artworkUrl100 || album?.artworkUrl60 || "").trim();
  const hiResArtwork = upgradeItunesArtwork(rawArtwork, 1200) || toHttpsUrl3(rawArtwork);
  return {
    source: "itunes",
    id: String(album?.collectionId || album?.id || ""),
    kind: "album",
    name: String(album?.collectionName || "Album"),
    artists: [artistName].filter(Boolean),
    artist_ids: [],
    artist_name: artistName,
    artist_id: "",
    image: hiResArtwork,
    images: [hiResArtwork].filter(Boolean).map((url) => ({ url, width: 1200, height: 1200 })),
    external_url: String(album?.collectionViewUrl || "").trim(),
    release_date: String(album?.releaseDate || "").trim().slice(0, 10),
    total_tracks: Number(album?.trackCount || 0),
    album_type: "album",
    popularity: 0,
    label: "",
    genres: [],
    explicit: false
  };
}
__name(normalizeItunesAlbumRow, "normalizeItunesAlbumRow");
function normalizeAppleChartTrackRow(track) {
  const rawArtwork = String(track?.artworkUrl100 || "").trim();
  const hiResArtwork = upgradeItunesArtwork(rawArtwork, 1200) || toHttpsUrl3(rawArtwork);
  return {
    source: "apple",
    kind: "track",
    id: String(track?.id || track?.url || ""),
    name: String(track?.name || "Track"),
    artists: [String(track?.artistName || "").trim()].filter(Boolean),
    artist_ids: [],
    album: {
      id: "",
      name: String(track?.albumName || track?.name || "").trim(),
      album_type: "album",
      release_date: String(track?.releaseDate || "").trim().slice(0, 10),
      total_tracks: Number(track?.trackCount || 0),
      images: hiResArtwork ? [{ url: hiResArtwork, width: 1200, height: 1200 }] : []
    },
    image: hiResArtwork,
    preview_url: "",
    external_url: String(track?.url || "").trim(),
    popularity: 0,
    duration_ms: 0,
    explicit: !!track?.contentAdvisoryRating
  };
}
__name(normalizeAppleChartTrackRow, "normalizeAppleChartTrackRow");
function dedupeByKey(rows = [], keyBuilder) {
  const seen = /* @__PURE__ */ new Set();
  const output = [];
  (Array.isArray(rows) ? rows : []).forEach((row) => {
    const key = String(keyBuilder(row) || "").trim().toLowerCase();
    if (!key || seen.has(key)) return;
    seen.add(key);
    output.push(row);
  });
  return output;
}
__name(dedupeByKey, "dedupeByKey");
function dedupeTracks(rows = []) {
  return dedupeByKey(rows, (row) => {
    const id = String(row?.id || "").trim();
    if (id) return `id:${id}`;
    const name = String(row?.name || "").trim().toLowerCase();
    const artist = Array.isArray(row?.artists) ? String(row.artists[0] || "").trim().toLowerCase() : "";
    return `${name}:${artist}`;
  });
}
__name(dedupeTracks, "dedupeTracks");
function dedupeAlbums(rows = []) {
  return dedupeByKey(rows, (row) => {
    const id = String(row?.id || "").trim();
    if (id) return `id:${id}`;
    const name = String(row?.name || "").trim().toLowerCase();
    const artist = Array.isArray(row?.artists) ? String(row.artists[0] || "").trim().toLowerCase() : "";
    return `${name}:${artist}`;
  });
}
__name(dedupeAlbums, "dedupeAlbums");
function filterAlbumsByType(rows = [], albumTypes = ["album"]) {
  const allow = new Set((Array.isArray(albumTypes) ? albumTypes : []).map((value) => String(value || "").trim().toLowerCase()));
  if (!allow.size) return rows;
  return (Array.isArray(rows) ? rows : []).filter((row) => {
    const type2 = String(row?.album_type || "").trim().toLowerCase() || "album";
    return allow.has(type2);
  });
}
__name(filterAlbumsByType, "filterAlbumsByType");
function mergeMixedResults(tracks = [], albums = [], maxCount = 20) {
  const t = [...Array.isArray(tracks) ? tracks : []];
  const a = [...Array.isArray(albums) ? albums : []];
  const mixed = [];
  while (mixed.length < maxCount && (a.length || t.length)) {
    if (a.length) mixed.push(a.shift());
    if (t.length && mixed.length < maxCount) mixed.push(t.shift());
    if (t.length && mixed.length < maxCount) mixed.push(t.shift());
  }
  while (mixed.length < maxCount && a.length) mixed.push(a.shift());
  while (mixed.length < maxCount && t.length) mixed.push(t.shift());
  return mixed.slice(0, maxCount);
}
__name(mergeMixedResults, "mergeMixedResults");
function readCache(cacheKey) {
  const hit = requestCache.get(cacheKey);
  if (!hit) return null;
  if (Date.now() >= Number(hit.expiresAt || 0)) {
    requestCache.delete(cacheKey);
    return null;
  }
  return hit.value;
}
__name(readCache, "readCache");
function writeCache(cacheKey, value, ttlMs = REQUEST_CACHE_TTL_MS) {
  requestCache.set(cacheKey, {
    value,
    expiresAt: Date.now() + Math.max(1e3, Number(ttlMs) || REQUEST_CACHE_TTL_MS)
  });
}
__name(writeCache, "writeCache");
async function fetchJson3(url, { cacheKey = "", ttlMs = 0, timeoutMs = 7e3 } = {}) {
  const key = String(cacheKey || "").trim();
  if (key && ttlMs > 0) {
    const hit = readCache(key);
    if (hit) return hit;
  }
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), Math.max(1e3, Number(timeoutMs) || 7e3));
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { accept: "application/json" }
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const json3 = await response.json();
    if (key && ttlMs > 0) writeCache(key, json3, ttlMs);
    return json3;
  } finally {
    clearTimeout(timeout);
  }
}
__name(fetchJson3, "fetchJson3");
async function searchItunesTracks({ q, limit = 20, market = "US" }) {
  const url = new URL(ITUNES_SEARCH_URL);
  url.searchParams.set("term", String(q || "").trim());
  url.searchParams.set("media", "music");
  url.searchParams.set("entity", "song");
  url.searchParams.set("country", normalizeMarket(market));
  url.searchParams.set("limit", String(clampInt4(limit, 1, 100, 20)));
  const json3 = await fetchJson3(url.toString(), {
    cacheKey: `itunes:tracks:${url.searchParams.toString()}`,
    ttlMs: 1e3 * 60 * 6
  });
  const rows = Array.isArray(json3?.results) ? json3.results : [];
  return dedupeTracks(rows.map(normalizeItunesTrackRow).filter((row) => !!row.id));
}
__name(searchItunesTracks, "searchItunesTracks");
async function searchItunesAlbums({ q, limit = 20, market = "US" }) {
  const url = new URL(ITUNES_SEARCH_URL);
  url.searchParams.set("term", String(q || "").trim());
  url.searchParams.set("media", "music");
  url.searchParams.set("entity", "album");
  url.searchParams.set("country", normalizeMarket(market));
  url.searchParams.set("limit", String(clampInt4(limit, 1, 100, 20)));
  const json3 = await fetchJson3(url.toString(), {
    cacheKey: `itunes:albums:${url.searchParams.toString()}`,
    ttlMs: 1e3 * 60 * 8
  });
  const rows = Array.isArray(json3?.results) ? json3.results : [];
  return dedupeAlbums(rows.map(normalizeItunesAlbumRow).filter((row) => !!row.id));
}
__name(searchItunesAlbums, "searchItunesAlbums");
async function fetchAppleMostPlayedSongs({ market = "US", limit = 50 }) {
  const country = normalizeMarket(market).toLowerCase();
  const safeLimit = clampInt4(limit, 1, 100, 50);
  const url = `${APPLE_MARKETING_API_BASE}/${encodeURIComponent(country)}/music/most-played/${safeLimit}/songs.json`;
  const json3 = await fetchJson3(url, {
    cacheKey: `apple:chart:most-played:${country}:${safeLimit}`,
    ttlMs: 1e3 * 60 * 8
  });
  const rows = Array.isArray(json3?.feed?.results) ? json3.feed.results : [];
  return dedupeTracks(rows.map(normalizeAppleChartTrackRow).filter((row) => !!row.id));
}
__name(fetchAppleMostPlayedSongs, "fetchAppleMostPlayedSongs");
async function fetchItunesAlbumDetails(id, { market = "US", limit = 120 } = {}) {
  const albumId = String(id || "").trim();
  if (!albumId) return null;
  const url = new URL(ITUNES_LOOKUP_URL);
  url.searchParams.set("id", albumId);
  url.searchParams.set("entity", "song");
  url.searchParams.set("country", normalizeMarket(market));
  url.searchParams.set("limit", String(clampInt4(limit, 1, 200, 120)));
  const json3 = await fetchJson3(url.toString(), {
    cacheKey: `itunes:album:${url.searchParams.toString()}`,
    ttlMs: 1e3 * 60 * 8
  });
  const rows = Array.isArray(json3?.results) ? json3.results : [];
  if (!rows.length) return null;
  const collection = rows.find((row) => String(row?.wrapperType || "").toLowerCase() === "collection");
  const trackRows = rows.filter((row) => String(row?.wrapperType || "").toLowerCase() === "track");
  const normalizedCollection = collection ? normalizeItunesAlbumRow(collection) : null;
  const tracks = dedupeTracks(trackRows.map((row) => {
    const normalized = normalizeItunesTrackRow(row);
    if (normalizedCollection) {
      normalized.album = {
        id: normalizedCollection.id,
        name: normalizedCollection.name,
        album_type: normalizedCollection.album_type || "album",
        release_date: normalizedCollection.release_date || "",
        total_tracks: normalizedCollection.total_tracks || 0,
        images: Array.isArray(normalizedCollection.images) ? normalizedCollection.images : []
      };
      normalized.image = normalizedCollection.image || normalized.image;
    }
    return normalized;
  }).filter((row) => !!row.id));
  const album = normalizedCollection || (tracks[0]?.album?.id ? {
    source: "itunes",
    id: String(tracks[0].album.id),
    kind: "album",
    name: String(tracks[0].album.name || "Album"),
    artists: Array.isArray(tracks[0].artists) ? tracks[0].artists : [],
    artist_ids: [],
    artist_name: Array.isArray(tracks[0].artists) ? String(tracks[0].artists[0] || "") : "",
    artist_id: "",
    image: String(tracks[0].image || ""),
    images: Array.isArray(tracks[0].album.images) ? tracks[0].album.images : [],
    external_url: String(tracks[0].external_url || ""),
    release_date: String(tracks[0].album.release_date || ""),
    total_tracks: Number(tracks[0].album.total_tracks || tracks.length || 0),
    album_type: String(tracks[0].album.album_type || "album"),
    popularity: 0,
    label: "",
    genres: [],
    explicit: false
  } : null);
  if (!album) return null;
  return { album, tracks };
}
__name(fetchItunesAlbumDetails, "fetchItunesAlbumDetails");
async function fetchItunesTrackDetails(id, market = "US") {
  const trackId = String(id || "").trim();
  if (!trackId) return null;
  const url = new URL(ITUNES_LOOKUP_URL);
  url.searchParams.set("id", trackId);
  url.searchParams.set("entity", "song");
  url.searchParams.set("country", normalizeMarket(market));
  const json3 = await fetchJson3(url.toString(), {
    cacheKey: `itunes:track:${url.searchParams.toString()}`,
    ttlMs: 1e3 * 60 * 8
  });
  const rows = Array.isArray(json3?.results) ? json3.results : [];
  const track = rows.find((row) => String(row?.wrapperType || "").toLowerCase() === "track");
  return track ? normalizeItunesTrackRow(track) : null;
}
__name(fetchItunesTrackDetails, "fetchItunesTrackDetails");
function readQuery6(req) {
  if (req.query && typeof req.query === "object") return req.query;
  try {
    const url = new URL(req.url || "", "http://localhost");
    return Object.fromEntries(url.searchParams.entries());
  } catch (_error) {
    return {};
  }
}
__name(readQuery6, "readQuery6");
function readPathParts6(query) {
  const rawPath = query?.path;
  if (Array.isArray(rawPath)) return rawPath.filter(Boolean);
  return String(rawPath || "").split("/").filter(Boolean);
}
__name(readPathParts6, "readPathParts6");
async function handler9(req, res) {
  const query = readQuery6(req);
  const pathParts = readPathParts6(query);
  const section = String(pathParts[0] || "").trim().toLowerCase();
  const id = String(pathParts[1] || "").trim();
  if (!section) {
    setResponseCache(res, { maxAge: 900, staleWhileRevalidate: 3600 });
    return res.json({
      ok: true,
      service: "music-fallback",
      configured: false,
      source: "itunes-fallback",
      routes: ["/search", "/top-50", "/popular", "/popular-albums", "/featured-playlists", "/new-releases", "/albums/:id", "/tracks/:id"]
    });
  }
  if (section === "health") {
    setResponseCache(res, { maxAge: 600, staleWhileRevalidate: 3600 });
    return res.json({
      ok: true,
      service: "music-fallback",
      source: "itunes-fallback"
    });
  }
  if (section === "top-50") {
    setResponseCache(res, { maxAge: 300, staleWhileRevalidate: 1800 });
    const limit = clampInt4(query.limit, 1, 100, 50);
    const market = normalizeMarket(query.market || "US");
    try {
      const chartRows = await fetchAppleMostPlayedSongs({ market, limit: Math.max(50, limit) }).catch(() => []);
      const searchRows = await searchItunesTracks({ q: `top songs ${market}`, limit: Math.max(limit, 24), market }).catch(() => []);
      const results = dedupeTracks([...chartRows, ...searchRows]).slice(0, limit);
      return res.json({
        count: results.length,
        limit,
        offset: 0,
        source: "itunes-fallback",
        results
      });
    } catch (_error) {
      return res.json({ count: 0, limit, offset: 0, source: "unavailable", results: [] });
    }
  }
  if (section === "popular") {
    setResponseCache(res, { maxAge: 300, staleWhileRevalidate: 1800 });
    const limit = clampInt4(query.limit, 1, 100, 24);
    const market = normalizeMarket(query.market || "US");
    try {
      const chartRows = await fetchAppleMostPlayedSongs({ market, limit: Math.max(50, limit) }).catch(() => []);
      const popularRows = await searchItunesTracks({ q: `popular songs ${market}`, limit: Math.max(limit, 24), market }).catch(() => []);
      const globalRows = await searchItunesTracks({ q: "top songs", limit: Math.max(limit, 24), market: "US" }).catch(() => []);
      const results = dedupeTracks([...chartRows, ...popularRows, ...globalRows]).slice(0, limit);
      return res.json({
        count: results.length,
        limit,
        offset: 0,
        source: "itunes-fallback",
        results
      });
    } catch (_error) {
      return res.json({ count: 0, limit, offset: 0, source: "unavailable", results: [] });
    }
  }
  if (section === "popular-albums") {
    setResponseCache(res, { maxAge: 300, staleWhileRevalidate: 1800 });
    const limit = clampInt4(query.limit, 1, 60, 24);
    const market = normalizeMarket(query.market || "US");
    const albumTypes = normalizeAlbumTypes(query.album_types || "album");
    const albumTypesKey = albumTypes.join(",") || "album";
    try {
      const rows = await searchItunesAlbums({ q: `top albums ${market}`, limit: Math.max(limit * 2, 40), market });
      const results = filterAlbumsByType(rows, albumTypes).slice(0, limit);
      return res.json({
        count: results.length,
        limit,
        album_types: albumTypesKey,
        source: "itunes-fallback",
        results
      });
    } catch (_error) {
      return res.json({ count: 0, limit, album_types: albumTypesKey, source: "unavailable", results: [] });
    }
  }
  if (section === "new-releases") {
    setResponseCache(res, { maxAge: 300, staleWhileRevalidate: 1800 });
    const limit = clampInt4(query.limit, 1, 60, 20);
    const market = normalizeMarket(query.market || "US");
    const albumTypes = normalizeAlbumTypes(query.album_types || "album");
    const albumTypesKey = albumTypes.join(",") || "album";
    try {
      const newRows = await searchItunesAlbums({ q: `new albums ${market}`, limit: Math.max(limit * 2, 40), market }).catch(() => []);
      const trendingRows = await searchItunesAlbums({ q: `top albums ${market}`, limit: Math.max(limit * 2, 40), market }).catch(() => []);
      const merged = dedupeAlbums([...newRows, ...trendingRows]);
      const results = filterAlbumsByType(merged, albumTypes).slice(0, limit);
      return res.json({
        count: results.length,
        limit,
        album_types: albumTypesKey,
        source: "itunes-fallback",
        results
      });
    } catch (_error) {
      return res.json({ count: 0, limit, album_types: albumTypesKey, source: "unavailable", results: [] });
    }
  }
  if (section === "featured-playlists") {
    setResponseCache(res, { maxAge: 600, staleWhileRevalidate: 3600 });
    const limit = clampInt4(query.limit, 1, 20, 8);
    return res.json({ count: 0, limit, source: "unavailable", results: [] });
  }
  if (section === "search") {
    setResponseCache(res, { maxAge: 120, staleWhileRevalidate: 600 });
    const q = String(query.q || "").trim().slice(0, 120);
    if (!q) {
      return res.status(400).json({ message: "Missing q query parameter." });
    }
    const limit = clampInt4(query.limit, 1, 50, 20);
    const market = normalizeMarket(query.market || "US");
    const types = normalizeMusicTypes(query.type || "track");
    const includeTracks = types.includes("track");
    const includeAlbums = types.includes("album");
    const albumTypes = normalizeAlbumTypes(query.album_types || "album");
    const albumTypesKey = albumTypes.join(",") || "album";
    try {
      const [tracksRaw, albumsRaw] = await Promise.all([
        includeTracks ? searchItunesTracks({ q, limit: Math.max(limit * 2, 30), market }) : Promise.resolve([]),
        includeAlbums ? searchItunesAlbums({ q, limit: Math.max(limit * 2, 30), market }) : Promise.resolve([])
      ]);
      const tracks = includeTracks ? dedupeTracks(tracksRaw) : [];
      const albums = includeAlbums ? filterAlbumsByType(dedupeAlbums(albumsRaw), albumTypes) : [];
      const primaryResults = includeTracks && includeAlbums ? mergeMixedResults(tracks, albums, limit) : includeTracks ? tracks.slice(0, limit) : albums.slice(0, limit);
      return res.json({
        count: includeTracks && includeAlbums ? tracks.length + albums.length : includeTracks ? tracks.length : albums.length,
        track_count: tracks.length,
        album_count: albums.length,
        limit,
        offset: 0,
        source: "itunes-fallback",
        type: types.join(","),
        album_types: albumTypesKey,
        results: primaryResults,
        tracks,
        albums
      });
    } catch (_error) {
      return res.json({
        count: 0,
        track_count: 0,
        album_count: 0,
        limit,
        offset: 0,
        source: "unavailable",
        type: types.join(","),
        album_types: albumTypesKey,
        results: [],
        tracks: [],
        albums: []
      });
    }
  }
  if (section === "albums") {
    setResponseCache(res, { maxAge: 1800, staleWhileRevalidate: 86400 });
    if (!id) return res.status(400).json({ message: "Invalid album id." });
    const market = normalizeMarket(query.market || "US");
    const includeTracks = String(query.include_tracks || "true").trim().toLowerCase() !== "false";
    const trackLimit = clampInt4(query.limit, 1, 200, 120);
    try {
      const details = await fetchItunesAlbumDetails(id, { market, limit: trackLimit });
      if (!details?.album) return res.status(404).json({ message: "Album not found." });
      const tracks = includeTracks ? details.tracks : [];
      return res.json({ album: details.album, tracks, count: tracks.length, source: "itunes-fallback" });
    } catch (_error) {
      return res.status(404).json({ message: "Album not found." });
    }
  }
  if (section === "tracks") {
    setResponseCache(res, { maxAge: 1800, staleWhileRevalidate: 86400 });
    if (!id) return res.status(400).json({ message: "Invalid track id." });
    const market = normalizeMarket(query.market || "US");
    try {
      const track = await fetchItunesTrackDetails(id, market);
      if (!track) return res.status(404).json({ message: "Track not found." });
      return res.json(track);
    } catch (_error) {
      return res.status(404).json({ message: "Track not found." });
    }
  }
  if (section === "artists") {
    setResponseCache(res, { maxAge: 600, staleWhileRevalidate: 3600 });
    return res.status(404).json({ message: "Artist details are unavailable right now." });
  }
  return res.status(404).json({ message: "Not found" });
}
__name(handler9, "handler9");
var import_dotenv5;
var ITUNES_SEARCH_URL;
var ITUNES_LOOKUP_URL;
var APPLE_MARKETING_API_BASE;
var REQUEST_CACHE_TTL_MS;
var requestCache;
var init_music_handler = __esm({
  "../api/music-handler.js"() {
    init_functionsRoutes_0_04524570753253654();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    import_dotenv5 = __toESM(require_main(), 1);
    import_dotenv5.default.config();
    import_dotenv5.default.config({ path: "backend/.env" });
    ITUNES_SEARCH_URL = "https://itunes.apple.com/search";
    ITUNES_LOOKUP_URL = "https://itunes.apple.com/lookup";
    APPLE_MARKETING_API_BASE = "https://rss.applemarketingtools.com/api/v2";
    REQUEST_CACHE_TTL_MS = 1e3 * 60 * 10;
    requestCache = /* @__PURE__ */ new Map();
    __name2(setResponseCache, "setResponseCache");
    __name2(clampInt4, "clampInt");
    __name2(toHttpsUrl3, "toHttpsUrl");
    __name2(upgradeItunesArtwork, "upgradeItunesArtwork");
    __name2(normalizeMarket, "normalizeMarket");
    __name2(normalizeMusicTypes, "normalizeMusicTypes");
    __name2(normalizeAlbumTypes, "normalizeAlbumTypes");
    __name2(normalizeItunesTrackRow, "normalizeItunesTrackRow");
    __name2(normalizeItunesAlbumRow, "normalizeItunesAlbumRow");
    __name2(normalizeAppleChartTrackRow, "normalizeAppleChartTrackRow");
    __name2(dedupeByKey, "dedupeByKey");
    __name2(dedupeTracks, "dedupeTracks");
    __name2(dedupeAlbums, "dedupeAlbums");
    __name2(filterAlbumsByType, "filterAlbumsByType");
    __name2(mergeMixedResults, "mergeMixedResults");
    __name2(readCache, "readCache");
    __name2(writeCache, "writeCache");
    __name2(fetchJson3, "fetchJson");
    __name2(searchItunesTracks, "searchItunesTracks");
    __name2(searchItunesAlbums, "searchItunesAlbums");
    __name2(fetchAppleMostPlayedSongs, "fetchAppleMostPlayedSongs");
    __name2(fetchItunesAlbumDetails, "fetchItunesAlbumDetails");
    __name2(fetchItunesTrackDetails, "fetchItunesTrackDetails");
    __name2(readQuery6, "readQuery");
    __name2(readPathParts6, "readPathParts");
    __name2(handler9, "handler");
  }
});
function readQuery7(req) {
  if (req.query && typeof req.query === "object") return req.query;
  try {
    const url = new URL(req.url || "", "http://localhost");
    return Object.fromEntries(url.searchParams.entries());
  } catch (_error) {
    return {};
  }
}
__name(readQuery7, "readQuery7");
function readPathParts7(query) {
  const rawPath = query?.path;
  if (Array.isArray(rawPath)) return rawPath.filter(Boolean);
  return String(rawPath || "").split("/").filter(Boolean);
}
__name(readPathParts7, "readPathParts7");
function pushQueryParam2(params, key, value) {
  if (value === void 0 || value === null) return;
  if (Array.isArray(value)) {
    value.forEach((entry) => {
      if (entry === void 0 || entry === null) return;
      params.append(key, String(entry));
    });
    return;
  }
  params.append(key, String(value));
}
__name(pushQueryParam2, "pushQueryParam2");
async function fetchWithRetry2(url, init = {}, attempts = 4) {
  let lastError = null;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8e3 + attempt * 1e3);
    try {
      const res = await fetch(url, { ...init, signal: controller.signal });
      clearTimeout(timeoutId);
      if (res.ok) return res;
      const retryable2 = res.status === 429 || res.status >= 500;
      if (!retryable2) return res;
      lastError = new Error(`Open Library error ${res.status}`);
    } catch (error3) {
      clearTimeout(timeoutId);
      lastError = error3;
    }
    if (attempt < attempts - 1) {
      await new Promise((resolve) => setTimeout(resolve, 300 * (attempt + 1)));
    }
  }
  throw lastError || new Error("Open Library request failed");
}
__name(fetchWithRetry2, "fetchWithRetry2");
async function handler10(req, res) {
  try {
    const query = readQuery7(req);
    const pathParts = readPathParts7(query);
    const method = String(req.method || "GET").toUpperCase();
    if (method !== "GET") {
      return res.status(405).json({ message: "Method not allowed" });
    }
    if (!pathParts.length) {
      return res.status(200).json({ ok: true, service: "openlibrary-proxy" });
    }
    const sanitizedPath = pathParts.join("/").replace(/^\/+/, "");
    const target = new URL(`${OPEN_LIBRARY_BASE2}/${sanitizedPath}`);
    Object.entries(query || {}).forEach(([key, value]) => {
      if (key === "path") return;
      pushQueryParam2(target.searchParams, key, value);
    });
    const upstream = await fetchWithRetry2(target.toString(), {
      headers: { Accept: "application/json" }
    });
    const text = await upstream.text();
    res.status(upstream.status);
    res.setHeader("content-type", upstream.headers.get("content-type") || "application/json; charset=utf-8");
    res.setHeader("cache-control", upstream.ok ? "public, s-maxage=300, stale-while-revalidate=600" : "no-store");
    return res.send(text);
  } catch (error3) {
    return res.status(502).json({ message: error3?.message || "Open Library proxy failed" });
  }
}
__name(handler10, "handler10");
var OPEN_LIBRARY_BASE2;
var init_openlibrary_handler = __esm({
  "../api/openlibrary-handler.js"() {
    init_functionsRoutes_0_04524570753253654();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    OPEN_LIBRARY_BASE2 = "https://openlibrary.org";
    __name2(readQuery7, "readQuery");
    __name2(readPathParts7, "readPathParts");
    __name2(pushQueryParam2, "pushQueryParam");
    __name2(fetchWithRetry2, "fetchWithRetry");
    __name2(handler10, "handler");
  }
});
function getSportsDbKey() {
  return String(
    process.env.SPORTSDB_API_KEY || process.env.SPORTSDB_KEY || process.env.THESPORTSDB_KEY || "3"
  ).trim() || "3";
}
__name(getSportsDbKey, "getSportsDbKey");
function pushQueryParam3(params, key, value) {
  if (value === void 0 || value === null) return;
  if (Array.isArray(value)) {
    value.forEach((entry) => {
      if (entry === void 0 || entry === null) return;
      params.append(key, String(entry));
    });
    return;
  }
  params.append(key, String(value));
}
__name(pushQueryParam3, "pushQueryParam3");
async function fetchWithRetry3(url, init = {}, attempts = 4) {
  let lastError = null;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8e3 + attempt * 1e3);
    try {
      const res = await fetch(url, { ...init, signal: controller.signal });
      clearTimeout(timeoutId);
      if (res.ok) return res;
      const retryable2 = res.status === 429 || res.status >= 500;
      if (!retryable2) return res;
      lastError = new Error(`SportsDB error ${res.status}`);
    } catch (error3) {
      clearTimeout(timeoutId);
      lastError = error3;
    }
    if (attempt < attempts - 1) {
      await new Promise((resolve) => setTimeout(resolve, 300 * (attempt + 1)));
    }
  }
  throw lastError || new Error("SportsDB request failed");
}
__name(fetchWithRetry3, "fetchWithRetry3");
function readQuery8(req) {
  if (req.query && typeof req.query === "object") return req.query;
  try {
    const url = new URL(req.url || "", "http://localhost");
    return Object.fromEntries(url.searchParams.entries());
  } catch (_error) {
    return {};
  }
}
__name(readQuery8, "readQuery8");
function readPathParts8(query) {
  const rawPath = query?.path;
  if (Array.isArray(rawPath)) return rawPath.filter(Boolean);
  return String(rawPath || "").split("/").filter(Boolean);
}
__name(readPathParts8, "readPathParts8");
async function handler11(req, res) {
  const query = readQuery8(req);
  const pathParts = readPathParts8(query);
  const relativePath = pathParts.join("/");
  if (!relativePath) {
    return res.json({ ok: true, service: "sportsdb-proxy", configured: Boolean(getSportsDbKey()) });
  }
  try {
    const sanitizedPath = String(relativePath || "").replace(/^\/+/, "");
    if (!sanitizedPath) {
      return res.status(400).json({ message: "SportsDB path is required." });
    }
    const key = getSportsDbKey();
    const target = new URL(`${SPORTSDB_BASE}/${encodeURIComponent(key)}/${sanitizedPath}`);
    Object.entries(query || {}).forEach(([paramKey, value]) => {
      if (paramKey === "path") return;
      pushQueryParam3(target.searchParams, paramKey, value);
    });
    const upstream = await fetchWithRetry3(target.toString(), {
      headers: { Accept: "application/json" }
    });
    const text = await upstream.text();
    res.status(upstream.status);
    res.setHeader("content-type", upstream.headers.get("content-type") || "application/json; charset=utf-8");
    res.setHeader("cache-control", upstream.ok ? "public, s-maxage=300, stale-while-revalidate=900" : "no-store");
    return res.send(text);
  } catch (error3) {
    return res.status(502).json({ message: error3?.message || "SportsDB proxy failed" });
  }
}
__name(handler11, "handler11");
var import_dotenv6;
var SPORTSDB_BASE;
var init_sportsdb_handler = __esm({
  "../api/sportsdb-handler.js"() {
    init_functionsRoutes_0_04524570753253654();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    import_dotenv6 = __toESM(require_main(), 1);
    import_dotenv6.default.config();
    import_dotenv6.default.config({ path: "backend/.env" });
    SPORTSDB_BASE = "https://www.thesportsdb.com/api/v1/json";
    __name2(getSportsDbKey, "getSportsDbKey");
    __name2(pushQueryParam3, "pushQueryParam");
    __name2(fetchWithRetry3, "fetchWithRetry");
    __name2(readQuery8, "readQuery");
    __name2(readPathParts8, "readPathParts");
    __name2(handler11, "handler");
  }
});
function getClientIp(req) {
  const forwarded = req.headers["x-forwarded-for"];
  const realIp = req.headers["x-real-ip"];
  const socketIp = req.socket?.remoteAddress || "";
  const raw = forwarded || realIp || socketIp || "unknown";
  return String(raw).split(",")[0].trim() || "unknown";
}
__name(getClientIp, "getClientIp");
function hashValue(value) {
  const text = String(value || "").trim();
  if (!text) return "";
  return crypto2.createHash("sha256").update(text).digest("hex");
}
__name(hashValue, "hashValue");
var init_guardrails = __esm({
  "../backend/lib/guardrails.js"() {
    init_functionsRoutes_0_04524570753253654();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    __name2(getClientIp, "getClientIp");
    __name2(hashValue, "hashValue");
  }
});
function normalizeText2(value, maxLength = 255) {
  return String(value || "").trim().slice(0, maxLength);
}
__name(normalizeText2, "normalizeText2");
function normalizeEmail3(value) {
  return normalizeText2(value, 180).toLowerCase();
}
__name(normalizeEmail3, "normalizeEmail3");
function isValidEmail3(value) {
  return /\S+@\S+\.\S+/.test(String(value || "").trim());
}
__name(isValidEmail3, "isValidEmail3");
function parseUuid(value) {
  const text = normalizeText2(value, 100).toLowerCase();
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(text)) {
    return null;
  }
  return text;
}
__name(parseUuid, "parseUuid");
function readQuery9(req) {
  if (req.query && typeof req.query === "object") return req.query;
  try {
    const url = new URL(req.url || "", "http://localhost");
    return Object.fromEntries(url.searchParams.entries());
  } catch (_error) {
    return {};
  }
}
__name(readQuery9, "readQuery9");
function readPathParts9(query) {
  const rawPath = query?.path;
  if (Array.isArray(rawPath)) return rawPath.filter(Boolean);
  return String(rawPath || "").split("/").filter(Boolean);
}
__name(readPathParts9, "readPathParts9");
async function readJsonBody4(req) {
  if (req.body && typeof req.body === "object") return req.body;
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }
  if (!chunks.length) return {};
  const text = Buffer.concat(chunks).toString("utf8");
  try {
    return JSON.parse(text);
  } catch (_error) {
    return {};
  }
}
__name(readJsonBody4, "readJsonBody4");
function getHeader2(req, name) {
  const key = String(name || "").toLowerCase();
  const headers = req?.headers || {};
  const direct = headers[key];
  if (Array.isArray(direct)) return String(direct[0] || "").trim();
  if (direct !== void 0 && direct !== null) return String(direct).trim();
  if (typeof req?.get === "function") return String(req.get(name) || "").trim();
  return "";
}
__name(getHeader2, "getHeader2");
function supportStorage() {
  return getSupabaseAdminClient();
}
__name(supportStorage, "supportStorage");
function supportAdminAuthed(req) {
  const expected = normalizeText2(process.env.SUPPORT_ADMIN_API_KEY, 200);
  if (!expected) return false;
  const provided = normalizeText2(getHeader2(req, "x-support-api-key"), 200);
  return !!provided && provided === expected;
}
__name(supportAdminAuthed, "supportAdminAuthed");
function inferPriority(category) {
  if (category === "abuse") return "high";
  if (category === "billing") return "medium";
  if (category === "bug") return "medium";
  return "low";
}
__name(inferPriority, "inferPriority");
function json2(res, status, body, extraHeaders = {}) {
  Object.entries(extraHeaders || {}).forEach(([key, value]) => {
    if (value !== void 0 && value !== null && value !== "") {
      res.setHeader(key, value);
    }
  });
  return res.status(status).json(body);
}
__name(json2, "json2");
async function handler12(req, res) {
  try {
    const query = readQuery9(req);
    const pathParts = readPathParts9(query);
    const section = String(pathParts[0] || "").trim().toLowerCase();
    const maybeId = String(pathParts[1] || "").trim();
    const method = String(req.method || "GET").toUpperCase();
    if (!section || section === "health" && method === "GET") {
      return json2(res, 200, {
        ok: true,
        service: "support",
        storage: supportStorage() ? "supabase" : "disabled",
        admin_api_key_configured: Boolean(normalizeText2(process.env.SUPPORT_ADMIN_API_KEY, 200))
      });
    }
    if (section === "tickets" && method === "POST") {
      const body = await readJsonBody4(req);
      const honeypot = normalizeText2(body.website, 120);
      if (honeypot) {
        return json2(res, 202, { ok: true });
      }
      const name = normalizeText2(body.name, 120);
      const email = normalizeEmail3(body.email);
      const categoryRaw = normalizeText2(body.category, 50).toLowerCase();
      const category = SUPPORT_CATEGORIES.has(categoryRaw) ? categoryRaw : "other";
      const message = normalizeText2(body.message, 4e3);
      const pageUrl = normalizeText2(body.page_url || body.pageUrl, 400);
      const userAgent = normalizeText2(getHeader2(req, "user-agent"), 280);
      const userId = parseUuid(body.user_id || body.userId);
      const metadata = body.metadata && typeof body.metadata === "object" ? body.metadata : {};
      if (!message || message.length < 12) {
        return json2(res, 400, { message: "Please provide more detail (min 12 chars)." });
      }
      if (email && !isValidEmail3(email)) {
        return json2(res, 400, { message: "Please provide a valid email address." });
      }
      const client = supportStorage();
      if (!client) {
        return json2(res, 503, { message: "Support storage is not configured." });
      }
      const row = {
        name: name || null,
        email: email || null,
        category,
        message,
        status: "open",
        priority: inferPriority(category),
        page_url: pageUrl || null,
        user_agent: userAgent || null,
        user_id: userId,
        ip_hash: hashValue(getClientIp(req)) || null,
        metadata,
        source: "web"
      };
      const { data, error: error3 } = await client.from("support_tickets").insert(row).select("id,status,priority,created_at").single();
      if (error3) throw error3;
      return json2(res, 201, { ok: true, ticket: data });
    }
    if (section === "tickets" && method === "GET" && !maybeId) {
      if (!supportAdminAuthed(req)) {
        return json2(res, 401, { message: "Unauthorized" });
      }
      const client = supportStorage();
      if (!client) {
        return json2(res, 503, { message: "Support storage is not configured." });
      }
      const limit = Math.max(1, Math.min(200, Number(query.limit || 40)));
      const statusRaw = normalizeText2(query.status, 40).toLowerCase();
      let supabaseQuery = client.from("support_tickets").select("id,name,email,category,message,status,priority,page_url,user_id,source,created_at,updated_at,admin_note").order("created_at", { ascending: false }).limit(limit);
      if (statusRaw && SUPPORT_STATUSES.has(statusRaw)) {
        supabaseQuery = supabaseQuery.eq("status", statusRaw);
      }
      const { data, error: error3 } = await supabaseQuery;
      if (error3) throw error3;
      return json2(res, 200, { ok: true, tickets: data || [] });
    }
    if (section === "tickets" && method === "PATCH" && maybeId) {
      if (!supportAdminAuthed(req)) {
        return json2(res, 401, { message: "Unauthorized" });
      }
      const client = supportStorage();
      if (!client) {
        return json2(res, 503, { message: "Support storage is not configured." });
      }
      const id = Number(maybeId);
      if (!Number.isFinite(id) || id <= 0) {
        return json2(res, 400, { message: "Invalid ticket id." });
      }
      const body = await readJsonBody4(req);
      const status = normalizeText2(body.status, 40).toLowerCase();
      const adminNote = normalizeText2(body.admin_note || body.adminNote, 1200);
      const update = {};
      if (status && SUPPORT_STATUSES.has(status)) update.status = status;
      if (adminNote) update.admin_note = adminNote;
      if (!Object.keys(update).length) {
        return json2(res, 400, { message: "No supported fields to update." });
      }
      const { data, error: error3 } = await client.from("support_tickets").update(update).eq("id", id).select("id,status,priority,updated_at,admin_note").single();
      if (error3) throw error3;
      return json2(res, 200, { ok: true, ticket: data });
    }
    return json2(res, 404, { message: "Not found" });
  } catch (error3) {
    return json2(res, 500, {
      message: "Could not handle support request",
      error: String(error3?.message || error3)
    });
  }
}
__name(handler12, "handler12");
var import_dotenv7;
var SUPPORT_STATUSES;
var SUPPORT_CATEGORIES;
var init_support_handler = __esm({
  "../api/support-handler.js"() {
    init_functionsRoutes_0_04524570753253654();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    import_dotenv7 = __toESM(require_main(), 1);
    init_supabase_admin();
    init_guardrails();
    import_dotenv7.default.config();
    import_dotenv7.default.config({ path: "backend/.env" });
    SUPPORT_STATUSES = /* @__PURE__ */ new Set(["open", "triaged", "in_progress", "resolved", "closed", "spam"]);
    SUPPORT_CATEGORIES = /* @__PURE__ */ new Set(["bug", "billing", "account", "feature", "abuse", "other"]);
    __name2(normalizeText2, "normalizeText");
    __name2(normalizeEmail3, "normalizeEmail");
    __name2(isValidEmail3, "isValidEmail");
    __name2(parseUuid, "parseUuid");
    __name2(readQuery9, "readQuery");
    __name2(readPathParts9, "readPathParts");
    __name2(readJsonBody4, "readJsonBody");
    __name2(getHeader2, "getHeader");
    __name2(supportStorage, "supportStorage");
    __name2(supportAdminAuthed, "supportAdminAuthed");
    __name2(inferPriority, "inferPriority");
    __name2(json2, "json");
    __name2(handler12, "handler");
  }
});
function setResponseCache2(res, { maxAge = 300, staleWhileRevalidate = 900 } = {}) {
  const age = Math.max(0, Math.floor(Number(maxAge) || 0));
  const swr = Math.max(0, Math.floor(Number(staleWhileRevalidate) || 0));
  res.setHeader("Cache-Control", `public, s-maxage=${age}, stale-while-revalidate=${swr}`);
}
__name(setResponseCache2, "setResponseCache2");
function getTmdbCacheProfile(path = "") {
  const normalized = String(path || "").toLowerCase();
  if (normalized.includes("/configuration")) return { maxAge: 3600, staleWhileRevalidate: 86400 };
  if (normalized.includes("/genre/")) return { maxAge: 1800, staleWhileRevalidate: 43200 };
  if (normalized.includes("/watch/providers")) return { maxAge: 1800, staleWhileRevalidate: 43200 };
  if (normalized.includes("/images") || normalized.includes("/videos")) return { maxAge: 1800, staleWhileRevalidate: 21600 };
  if (normalized.includes("/search")) return { maxAge: 120, staleWhileRevalidate: 600 };
  if (normalized.includes("/discover") || normalized.includes("/trending") || normalized.includes("/popular")) {
    return { maxAge: 300, staleWhileRevalidate: 1200 };
  }
  return { maxAge: 300, staleWhileRevalidate: 900 };
}
__name(getTmdbCacheProfile, "getTmdbCacheProfile");
function getTmdbToken() {
  return String(
    process.env.TMDB_TOKEN || process.env.TMDB_API_KEY || process.env.TMDB_ACCESS_TOKEN || process.env.TMDB_BEARER_TOKEN || process.env.TMDB_API_READ_TOKEN || ""
  ).trim();
}
__name(getTmdbToken, "getTmdbToken");
function pushQueryParam4(params, key, value) {
  if (value === void 0 || value === null) return;
  if (Array.isArray(value)) {
    value.forEach((entry) => {
      if (entry === void 0 || entry === null) return;
      params.append(key, String(entry));
    });
    return;
  }
  params.append(key, String(value));
}
__name(pushQueryParam4, "pushQueryParam4");
function buildTmdbFallbackPayload(relativePath, query = {}) {
  const path = `/${String(relativePath || "").trim().toLowerCase()}`;
  const page = Math.max(1, Number(query?.page || 1) || 1);
  if (path.endsWith("/genre/movie/list") || path.endsWith("/genre/tv/list")) {
    return { genres: [] };
  }
  if (path.endsWith("/credits")) {
    return { id: 0, cast: [], crew: [] };
  }
  if (path.endsWith("/videos")) {
    return { id: 0, results: [] };
  }
  if (path.endsWith("/images")) {
    return { id: 0, backdrops: [], posters: [], logos: [] };
  }
  if (path.includes("/watch/providers")) {
    return { id: 0, results: {} };
  }
  return {
    page,
    results: [],
    total_pages: 1,
    total_results: 0
  };
}
__name(buildTmdbFallbackPayload, "buildTmdbFallbackPayload");
function readQuery10(req) {
  if (req.query && typeof req.query === "object") return req.query;
  try {
    const url = new URL(req.url || "", "http://localhost");
    return Object.fromEntries(url.searchParams.entries());
  } catch (_error) {
    return {};
  }
}
__name(readQuery10, "readQuery10");
function readPathParts10(query) {
  const rawPath = query?.path;
  if (Array.isArray(rawPath)) return rawPath.filter(Boolean);
  return String(rawPath || "").split("/").filter(Boolean);
}
__name(readPathParts10, "readPathParts10");
async function handler13(req, res) {
  const query = readQuery10(req);
  const pathParts = readPathParts10(query);
  const relativePath = pathParts.join("/");
  const strictMode = String(query?.strict || "").trim().toLowerCase();
  const shouldFailOpen = !["1", "true", "yes", "on"].includes(strictMode);
  if (!relativePath) {
    setResponseCache2(res, { maxAge: 600, staleWhileRevalidate: 3600 });
    return res.json({ ok: true, service: "tmdb-proxy", configured: Boolean(getTmdbToken()) });
  }
  const fallbackPayload = buildTmdbFallbackPayload(relativePath, query);
  setResponseCache2(res, getTmdbCacheProfile(relativePath));
  try {
    const token = getTmdbToken();
    if (!token) {
      const status = shouldFailOpen ? 200 : 503;
      return res.status(status).json({
        ...fallbackPayload,
        source: "tmdb-fallback",
        message: "TMDB is not configured"
      });
    }
    const url = new URL(`${TMDB_BASE}/${relativePath}`);
    Object.entries(query || {}).forEach(([key, value]) => {
      if (key === "path") return;
      pushQueryParam4(url.searchParams, key, value);
    });
    const tmdbRes = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!tmdbRes.ok) {
      const status = shouldFailOpen ? 200 : tmdbRes.status;
      return res.status(status).json({
        ...fallbackPayload,
        source: "tmdb-fallback",
        upstream_status: tmdbRes.status
      });
    }
    const text = await tmdbRes.text();
    res.status(tmdbRes.status);
    res.setHeader("content-type", tmdbRes.headers.get("content-type") || "application/json; charset=utf-8");
    return res.send(text);
  } catch (error3) {
    const status = shouldFailOpen ? 200 : 502;
    return res.status(status).json({
      ...fallbackPayload,
      source: "tmdb-fallback",
      message: error3?.message || "TMDB proxy error"
    });
  }
}
__name(handler13, "handler13");
var import_dotenv8;
var TMDB_BASE;
var init_tmdb_handler = __esm({
  "../api/tmdb-handler.js"() {
    init_functionsRoutes_0_04524570753253654();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    import_dotenv8 = __toESM(require_main(), 1);
    import_dotenv8.default.config();
    import_dotenv8.default.config({ path: "backend/.env" });
    TMDB_BASE = "https://api.themoviedb.org/3";
    __name2(setResponseCache2, "setResponseCache");
    __name2(getTmdbCacheProfile, "getTmdbCacheProfile");
    __name2(getTmdbToken, "getTmdbToken");
    __name2(pushQueryParam4, "pushQueryParam");
    __name2(buildTmdbFallbackPayload, "buildTmdbFallbackPayload");
    __name2(readQuery10, "readQuery");
    __name2(readPathParts10, "readPathParts");
    __name2(handler13, "handler");
  }
});
function getLowerCaseHeaders(request) {
  const out = {};
  request.headers.forEach((value, key) => {
    out[String(key || "").toLowerCase()] = value;
  });
  return out;
}
__name(getLowerCaseHeaders, "getLowerCaseHeaders");
async function buildNodeLikeRequest(request, env2) {
  const url = new URL(request.url);
  const headers = getLowerCaseHeaders(request);
  const contentType = String(headers["content-type"] || "").toLowerCase();
  const bodyText = ["GET", "HEAD"].includes(request.method) ? "" : await request.text();
  let parsedBody = void 0;
  if (bodyText) {
    if (contentType.includes("application/json")) {
      try {
        parsedBody = JSON.parse(bodyText);
      } catch (_error) {
        parsedBody = void 0;
      }
    } else if (contentType.includes("application/x-www-form-urlencoded")) {
      parsedBody = Object.fromEntries(new URLSearchParams(bodyText).entries());
    }
  }
  const bodyBuffer = bodyText ? Buffer.from(bodyText, "utf8") : Buffer.alloc(0);
  const req = {
    method: request.method,
    url: request.url,
    originalUrl: `${url.pathname}${url.search}`,
    path: url.pathname,
    query: Object.fromEntries(url.searchParams.entries()),
    headers,
    body: parsedBody,
    socket: {
      remoteAddress: headers["cf-connecting-ip"] || headers["x-forwarded-for"] || ""
    },
    cf: request.cf || {},
    env: env2,
    get(name) {
      return headers[String(name || "").toLowerCase()] || "";
    },
    async *[Symbol.asyncIterator]() {
      if (!bodyBuffer.length) return;
      yield bodyBuffer;
    }
  };
  return req;
}
__name(buildNodeLikeRequest, "buildNodeLikeRequest");
function createNodeLikeResponse() {
  const headers = new Headers(COMMON_HEADERS);
  let statusCode = 200;
  let body = "";
  const res = {
    headersSent: false,
    statusCode,
    setHeader(key, value) {
      headers.set(String(key), String(value));
      return this;
    },
    getHeader(key) {
      return headers.get(String(key));
    },
    status(code) {
      statusCode = Number(code || 200) || 200;
      this.statusCode = statusCode;
      return this;
    },
    json(payload) {
      headers.set("content-type", "application/json; charset=utf-8");
      body = JSON.stringify(payload);
      this.headersSent = true;
      return this;
    },
    send(payload) {
      if (payload === void 0 || payload === null) {
        body = "";
      } else if (typeof payload === "string") {
        body = payload;
      } else if (payload instanceof Uint8Array) {
        body = payload;
      } else {
        headers.set("content-type", "application/json; charset=utf-8");
        body = JSON.stringify(payload);
      }
      this.headersSent = true;
      return this;
    },
    end(payload = "") {
      body = payload;
      this.headersSent = true;
      return this;
    }
  };
  return {
    res,
    toResponse() {
      return new Response(body, {
        status: statusCode,
        headers
      });
    }
  };
}
__name(createNodeLikeResponse, "createNodeLikeResponse");
function bindEnvToProcess(env2) {
  if (!globalThis.process) globalThis.process = { env: {} };
  if (!globalThis.process.env) globalThis.process.env = {};
  Object.entries(env2 || {}).forEach(([key, value]) => {
    if (value === void 0 || value === null) return;
    globalThis.process.env[key] = typeof value === "string" ? value : String(value);
  });
}
__name(bindEnvToProcess, "bindEnvToProcess");
function isWriteMethod(method) {
  const upper = String(method || "").toUpperCase();
  return upper === "POST" || upper === "PUT" || upper === "PATCH" || upper === "DELETE";
}
__name(isWriteMethod, "isWriteMethod");
function parseHost(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  try {
    return new URL(raw).host.toLowerCase();
  } catch (_error) {
    return raw.replace(/^https?:\/\//i, "").split("/")[0].toLowerCase();
  }
}
__name(parseHost, "parseHost");
function getClientIp2(headers = {}) {
  const forwarded = String(headers["cf-connecting-ip"] || headers["x-forwarded-for"] || "").trim();
  return forwarded.split(",")[0].trim() || "unknown";
}
__name(getClientIp2, "getClientIp2");
function isLikelyBotWrite(headers = {}, cf = {}) {
  if (cf?.botManagement?.verifiedBot) return true;
  const botScore = Number(cf?.botManagement?.score || 0);
  if (botScore > 0 && botScore <= 10) return true;
  const ua = String(headers["user-agent"] || "").trim();
  if (!ua) return true;
  return BOT_UA_PATTERNS.some((pattern) => pattern.test(ua));
}
__name(isLikelyBotWrite, "isLikelyBotWrite");
function hasAllowedWriteOrigin(request, headers = {}) {
  const requestHost = parseHost(request.url);
  const allowedHosts = /* @__PURE__ */ new Set([
    requestHost,
    "zo2y.com",
    "www.zo2y.com",
    "zo2y.pages.dev"
  ]);
  const originHost = parseHost(headers.origin);
  const refererHost = parseHost(headers.referer);
  if (originHost && allowedHosts.has(originHost)) return true;
  if (refererHost && allowedHosts.has(refererHost)) return true;
  return false;
}
__name(hasAllowedWriteOrigin, "hasAllowedWriteOrigin");
function enforceWriteRateLimit(section, headers = {}) {
  const ip = getClientIp2(headers);
  const now = Date.now();
  const key = `${section}:${ip}`;
  const current = WRITE_RATE_BUCKETS.get(key);
  const config2 = section === "analytics" ? { windowMs: 6e4, max: 120 } : { windowMs: 10 * 6e4, max: 24 };
  if (!current || now - current.startedAt > config2.windowMs) {
    WRITE_RATE_BUCKETS.set(key, { startedAt: now, count: 1 });
    return null;
  }
  current.count += 1;
  if (current.count > config2.max) {
    const retryAfter = Math.max(1, Math.ceil((config2.windowMs - (now - current.startedAt)) / 1e3));
    return {
      retryAfter,
      remaining: 0,
      limit: config2.max
    };
  }
  if (WRITE_RATE_BUCKETS.size > 4e3) {
    const oldest = WRITE_RATE_BUCKETS.keys().next().value;
    if (oldest) WRITE_RATE_BUCKETS.delete(oldest);
  }
  return {
    remaining: Math.max(0, config2.max - current.count),
    limit: config2.max
  };
}
__name(enforceWriteRateLimit, "enforceWriteRateLimit");
function buildJsonResponse(body, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...COMMON_HEADERS,
      "content-type": "application/json; charset=utf-8",
      ...extraHeaders
    }
  });
}
__name(buildJsonResponse, "buildJsonResponse");
function getRouteTarget(pathParts = []) {
  const [section, ...rest] = Array.isArray(pathParts) ? pathParts : [];
  const handler14 = ROUTE_HANDLERS.get(String(section || "").toLowerCase()) || null;
  if (!handler14) return null;
  return {
    handler: handler14,
    queryPath: rest.join("/")
  };
}
__name(getRouteTarget, "getRouteTarget");
async function onRequest(context2) {
  bindEnvToProcess(context2.env);
  const pathParts = Array.isArray(context2.params?.path) ? context2.params.path.filter(Boolean) : String(context2.params?.path || "").split("/").filter(Boolean);
  const route = getRouteTarget(pathParts);
  if (!route) {
    return buildJsonResponse({ message: "Not found" }, 404);
  }
  const section = String(pathParts[0] || "").toLowerCase();
  const headers = getLowerCaseHeaders(context2.request);
  if (WRITE_ROUTE_PREFIXES.has(section) && isWriteMethod(context2.request.method)) {
    if (!hasAllowedWriteOrigin(context2.request, headers)) {
      return buildJsonResponse({
        message: "Write requests must come from Zo2y."
      }, 403, { "Cache-Control": "no-store" });
    }
    if (isLikelyBotWrite(headers, context2.request.cf || {})) {
      return buildJsonResponse({
        message: "Automated write traffic is blocked."
      }, 403, { "Cache-Control": "no-store" });
    }
    const rateLimit = enforceWriteRateLimit(section, headers);
    if (rateLimit?.retryAfter) {
      return buildJsonResponse({
        message: "Too many requests. Try again shortly."
      }, 429, {
        "Retry-After": String(rateLimit.retryAfter),
        "Cache-Control": "no-store"
      });
    }
  }
  const req = await buildNodeLikeRequest(context2.request, context2.env);
  if (route.queryPath) req.query.path = route.queryPath;
  const { res, toResponse } = createNodeLikeResponse();
  if (WRITE_ROUTE_PREFIXES.has(section) && isWriteMethod(context2.request.method)) {
    res.setHeader("Cache-Control", "no-store");
  }
  await route.handler(req, res);
  return toResponse();
}
__name(onRequest, "onRequest");
var COMMON_HEADERS;
var ROUTE_HANDLERS;
var WRITE_ROUTE_PREFIXES;
var WRITE_RATE_BUCKETS;
var BOT_UA_PATTERNS;
var init_path = __esm({
  "api/[[path]].js"() {
    init_functionsRoutes_0_04524570753253654();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_analytics_handler();
    init_auth_handler();
    init_books_handler();
    init_emails_handler();
    init_health();
    init_home_feed();
    init_igdb_handler();
    init_logo();
    init_music_handler();
    init_openlibrary_handler();
    init_sportsdb_handler();
    init_support_handler();
    init_tmdb_handler();
    COMMON_HEADERS = {
      "X-Robots-Tag": "max-image-preview:none, noimageindex",
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "DENY",
      "X-Permitted-Cross-Domain-Policies": "none",
      "Referrer-Policy": "strict-origin-when-cross-origin",
      "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
      "Cross-Origin-Opener-Policy": "same-origin-allow-popups",
      "Cross-Origin-Resource-Policy": "same-site",
      "Strict-Transport-Security": "max-age=31536000; includeSubDomains; preload",
      "Content-Security-Policy": "default-src 'self'; base-uri 'self'; form-action 'self' https:; frame-ancestors 'none'; object-src 'none'; img-src 'self' data: https:; media-src 'self' https:; script-src 'self' 'unsafe-inline' 'unsafe-eval' https:; style-src 'self' 'unsafe-inline' https:; font-src 'self' data: https:; connect-src 'self' https: wss:; frame-src https:; worker-src 'self' blob:; upgrade-insecure-requests",
      "Origin-Agent-Cluster": "?1"
    };
    ROUTE_HANDLERS = /* @__PURE__ */ new Map([
      ["analytics", handler],
      ["auth", handler2],
      ["books", handler3],
      ["emails", handler4],
      ["health", handler5],
      ["home-feed", handler6],
      ["igdb", handler7],
      ["logo", handler8],
      ["music", handler9],
      ["openlibrary", handler10],
      ["sportsdb", handler11],
      ["support", handler12],
      ["tmdb", handler13]
    ]);
    WRITE_ROUTE_PREFIXES = /* @__PURE__ */ new Set(["analytics", "auth", "emails", "support"]);
    WRITE_RATE_BUCKETS = /* @__PURE__ */ new Map();
    BOT_UA_PATTERNS = [
      /bot/i,
      /crawler/i,
      /spider/i,
      /headless/i,
      /phantom/i,
      /playwright/i,
      /selenium/i,
      /python-requests/i,
      /python/i,
      /curl/i,
      /wget/i,
      /go-http-client/i,
      /postman/i,
      /insomnia/i,
      /okhttp/i,
      /axios/i,
      /node-fetch/i,
      /libwww/i,
      /scrap/i
    ];
    __name2(getLowerCaseHeaders, "getLowerCaseHeaders");
    __name2(buildNodeLikeRequest, "buildNodeLikeRequest");
    __name2(createNodeLikeResponse, "createNodeLikeResponse");
    __name2(bindEnvToProcess, "bindEnvToProcess");
    __name2(isWriteMethod, "isWriteMethod");
    __name2(parseHost, "parseHost");
    __name2(getClientIp2, "getClientIp");
    __name2(isLikelyBotWrite, "isLikelyBotWrite");
    __name2(hasAllowedWriteOrigin, "hasAllowedWriteOrigin");
    __name2(enforceWriteRateLimit, "enforceWriteRateLimit");
    __name2(buildJsonResponse, "buildJsonResponse");
    __name2(getRouteTarget, "getRouteTarget");
    __name2(onRequest, "onRequest");
  }
});
async function onRequest2(context2) {
  const url = new URL(context2.request.url);
  if (url.hostname === WWW_HOST) {
    url.hostname = PRIMARY_HOST;
    url.protocol = "https:";
    return Response.redirect(url.toString(), 301);
  }
  return context2.next();
}
__name(onRequest2, "onRequest2");
var PRIMARY_HOST;
var WWW_HOST;
var init_middleware = __esm({
  "_middleware.js"() {
    init_functionsRoutes_0_04524570753253654();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    PRIMARY_HOST = "zo2y.com";
    WWW_HOST = "www.zo2y.com";
    __name2(onRequest2, "onRequest");
  }
});
var routes;
var init_functionsRoutes_0_04524570753253654 = __esm({
  "../.wrangler/tmp/pages-nKy1Vn/functionsRoutes-0.04524570753253654.mjs"() {
    init_path();
    init_middleware();
    routes = [
      {
        routePath: "/api/:path*",
        mountPath: "/api",
        method: "",
        middlewares: [],
        modules: [onRequest]
      },
      {
        routePath: "/",
        mountPath: "/",
        method: "",
        middlewares: [onRequest2],
        modules: []
      }
    ];
  }
});
init_functionsRoutes_0_04524570753253654();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
init_functionsRoutes_0_04524570753253654();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
init_functionsRoutes_0_04524570753253654();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
init_functionsRoutes_0_04524570753253654();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
function lexer(str) {
  var tokens = [];
  var i = 0;
  while (i < str.length) {
    var char = str[i];
    if (char === "*" || char === "+" || char === "?") {
      tokens.push({ type: "MODIFIER", index: i, value: str[i++] });
      continue;
    }
    if (char === "\\") {
      tokens.push({ type: "ESCAPED_CHAR", index: i++, value: str[i++] });
      continue;
    }
    if (char === "{") {
      tokens.push({ type: "OPEN", index: i, value: str[i++] });
      continue;
    }
    if (char === "}") {
      tokens.push({ type: "CLOSE", index: i, value: str[i++] });
      continue;
    }
    if (char === ":") {
      var name = "";
      var j = i + 1;
      while (j < str.length) {
        var code = str.charCodeAt(j);
        if (
          // `0-9`
          code >= 48 && code <= 57 || // `A-Z`
          code >= 65 && code <= 90 || // `a-z`
          code >= 97 && code <= 122 || // `_`
          code === 95
        ) {
          name += str[j++];
          continue;
        }
        break;
      }
      if (!name)
        throw new TypeError("Missing parameter name at ".concat(i));
      tokens.push({ type: "NAME", index: i, value: name });
      i = j;
      continue;
    }
    if (char === "(") {
      var count3 = 1;
      var pattern = "";
      var j = i + 1;
      if (str[j] === "?") {
        throw new TypeError('Pattern cannot start with "?" at '.concat(j));
      }
      while (j < str.length) {
        if (str[j] === "\\") {
          pattern += str[j++] + str[j++];
          continue;
        }
        if (str[j] === ")") {
          count3--;
          if (count3 === 0) {
            j++;
            break;
          }
        } else if (str[j] === "(") {
          count3++;
          if (str[j + 1] !== "?") {
            throw new TypeError("Capturing groups are not allowed at ".concat(j));
          }
        }
        pattern += str[j++];
      }
      if (count3)
        throw new TypeError("Unbalanced pattern at ".concat(i));
      if (!pattern)
        throw new TypeError("Missing pattern at ".concat(i));
      tokens.push({ type: "PATTERN", index: i, value: pattern });
      i = j;
      continue;
    }
    tokens.push({ type: "CHAR", index: i, value: str[i++] });
  }
  tokens.push({ type: "END", index: i, value: "" });
  return tokens;
}
__name(lexer, "lexer");
__name2(lexer, "lexer");
function parse(str, options) {
  if (options === void 0) {
    options = {};
  }
  var tokens = lexer(str);
  var _a2 = options.prefixes, prefixes = _a2 === void 0 ? "./" : _a2, _b = options.delimiter, delimiter = _b === void 0 ? "/#?" : _b;
  var result = [];
  var key = 0;
  var i = 0;
  var path = "";
  var tryConsume = /* @__PURE__ */ __name2(function(type2) {
    if (i < tokens.length && tokens[i].type === type2)
      return tokens[i++].value;
  }, "tryConsume");
  var mustConsume = /* @__PURE__ */ __name2(function(type2) {
    var value2 = tryConsume(type2);
    if (value2 !== void 0)
      return value2;
    var _a3 = tokens[i], nextType = _a3.type, index2 = _a3.index;
    throw new TypeError("Unexpected ".concat(nextType, " at ").concat(index2, ", expected ").concat(type2));
  }, "mustConsume");
  var consumeText = /* @__PURE__ */ __name2(function() {
    var result2 = "";
    var value2;
    while (value2 = tryConsume("CHAR") || tryConsume("ESCAPED_CHAR")) {
      result2 += value2;
    }
    return result2;
  }, "consumeText");
  var isSafe = /* @__PURE__ */ __name2(function(value2) {
    for (var _i = 0, delimiter_1 = delimiter; _i < delimiter_1.length; _i++) {
      var char2 = delimiter_1[_i];
      if (value2.indexOf(char2) > -1)
        return true;
    }
    return false;
  }, "isSafe");
  var safePattern = /* @__PURE__ */ __name2(function(prefix2) {
    var prev = result[result.length - 1];
    var prevText = prefix2 || (prev && typeof prev === "string" ? prev : "");
    if (prev && !prevText) {
      throw new TypeError('Must have text between two parameters, missing text after "'.concat(prev.name, '"'));
    }
    if (!prevText || isSafe(prevText))
      return "[^".concat(escapeString(delimiter), "]+?");
    return "(?:(?!".concat(escapeString(prevText), ")[^").concat(escapeString(delimiter), "])+?");
  }, "safePattern");
  while (i < tokens.length) {
    var char = tryConsume("CHAR");
    var name = tryConsume("NAME");
    var pattern = tryConsume("PATTERN");
    if (name || pattern) {
      var prefix = char || "";
      if (prefixes.indexOf(prefix) === -1) {
        path += prefix;
        prefix = "";
      }
      if (path) {
        result.push(path);
        path = "";
      }
      result.push({
        name: name || key++,
        prefix,
        suffix: "",
        pattern: pattern || safePattern(prefix),
        modifier: tryConsume("MODIFIER") || ""
      });
      continue;
    }
    var value = char || tryConsume("ESCAPED_CHAR");
    if (value) {
      path += value;
      continue;
    }
    if (path) {
      result.push(path);
      path = "";
    }
    var open3 = tryConsume("OPEN");
    if (open3) {
      var prefix = consumeText();
      var name_1 = tryConsume("NAME") || "";
      var pattern_1 = tryConsume("PATTERN") || "";
      var suffix = consumeText();
      mustConsume("CLOSE");
      result.push({
        name: name_1 || (pattern_1 ? key++ : ""),
        pattern: name_1 && !pattern_1 ? safePattern(prefix) : pattern_1,
        prefix,
        suffix,
        modifier: tryConsume("MODIFIER") || ""
      });
      continue;
    }
    mustConsume("END");
  }
  return result;
}
__name(parse, "parse");
__name2(parse, "parse");
function match(str, options) {
  var keys = [];
  var re = pathToRegexp(str, keys, options);
  return regexpToFunction(re, keys, options);
}
__name(match, "match");
__name2(match, "match");
function regexpToFunction(re, keys, options) {
  if (options === void 0) {
    options = {};
  }
  var _a2 = options.decode, decode = _a2 === void 0 ? function(x) {
    return x;
  } : _a2;
  return function(pathname) {
    var m = re.exec(pathname);
    if (!m)
      return false;
    var path = m[0], index2 = m.index;
    var params = /* @__PURE__ */ Object.create(null);
    var _loop_1 = /* @__PURE__ */ __name2(function(i2) {
      if (m[i2] === void 0)
        return "continue";
      var key = keys[i2 - 1];
      if (key.modifier === "*" || key.modifier === "+") {
        params[key.name] = m[i2].split(key.prefix + key.suffix).map(function(value) {
          return decode(value, key);
        });
      } else {
        params[key.name] = decode(m[i2], key);
      }
    }, "_loop_1");
    for (var i = 1; i < m.length; i++) {
      _loop_1(i);
    }
    return { path, index: index2, params };
  };
}
__name(regexpToFunction, "regexpToFunction");
__name2(regexpToFunction, "regexpToFunction");
function escapeString(str) {
  return str.replace(/([.+*?=^!:${}()[\]|/\\])/g, "\\$1");
}
__name(escapeString, "escapeString");
__name2(escapeString, "escapeString");
function flags(options) {
  return options && options.sensitive ? "" : "i";
}
__name(flags, "flags");
__name2(flags, "flags");
function regexpToRegexp(path, keys) {
  if (!keys)
    return path;
  var groupsRegex = /\((?:\?<(.*?)>)?(?!\?)/g;
  var index2 = 0;
  var execResult = groupsRegex.exec(path.source);
  while (execResult) {
    keys.push({
      // Use parenthesized substring match if available, index otherwise
      name: execResult[1] || index2++,
      prefix: "",
      suffix: "",
      modifier: "",
      pattern: ""
    });
    execResult = groupsRegex.exec(path.source);
  }
  return path;
}
__name(regexpToRegexp, "regexpToRegexp");
__name2(regexpToRegexp, "regexpToRegexp");
function arrayToRegexp(paths, keys, options) {
  var parts = paths.map(function(path) {
    return pathToRegexp(path, keys, options).source;
  });
  return new RegExp("(?:".concat(parts.join("|"), ")"), flags(options));
}
__name(arrayToRegexp, "arrayToRegexp");
__name2(arrayToRegexp, "arrayToRegexp");
function stringToRegexp(path, keys, options) {
  return tokensToRegexp(parse(path, options), keys, options);
}
__name(stringToRegexp, "stringToRegexp");
__name2(stringToRegexp, "stringToRegexp");
function tokensToRegexp(tokens, keys, options) {
  if (options === void 0) {
    options = {};
  }
  var _a2 = options.strict, strict = _a2 === void 0 ? false : _a2, _b = options.start, start = _b === void 0 ? true : _b, _c = options.end, end = _c === void 0 ? true : _c, _d = options.encode, encode = _d === void 0 ? function(x) {
    return x;
  } : _d, _e = options.delimiter, delimiter = _e === void 0 ? "/#?" : _e, _f = options.endsWith, endsWith = _f === void 0 ? "" : _f;
  var endsWithRe = "[".concat(escapeString(endsWith), "]|$");
  var delimiterRe = "[".concat(escapeString(delimiter), "]");
  var route = start ? "^" : "";
  for (var _i = 0, tokens_1 = tokens; _i < tokens_1.length; _i++) {
    var token = tokens_1[_i];
    if (typeof token === "string") {
      route += escapeString(encode(token));
    } else {
      var prefix = escapeString(encode(token.prefix));
      var suffix = escapeString(encode(token.suffix));
      if (token.pattern) {
        if (keys)
          keys.push(token);
        if (prefix || suffix) {
          if (token.modifier === "+" || token.modifier === "*") {
            var mod = token.modifier === "*" ? "?" : "";
            route += "(?:".concat(prefix, "((?:").concat(token.pattern, ")(?:").concat(suffix).concat(prefix, "(?:").concat(token.pattern, "))*)").concat(suffix, ")").concat(mod);
          } else {
            route += "(?:".concat(prefix, "(").concat(token.pattern, ")").concat(suffix, ")").concat(token.modifier);
          }
        } else {
          if (token.modifier === "+" || token.modifier === "*") {
            throw new TypeError('Can not repeat "'.concat(token.name, '" without a prefix and suffix'));
          }
          route += "(".concat(token.pattern, ")").concat(token.modifier);
        }
      } else {
        route += "(?:".concat(prefix).concat(suffix, ")").concat(token.modifier);
      }
    }
  }
  if (end) {
    if (!strict)
      route += "".concat(delimiterRe, "?");
    route += !options.endsWith ? "$" : "(?=".concat(endsWithRe, ")");
  } else {
    var endToken = tokens[tokens.length - 1];
    var isEndDelimited = typeof endToken === "string" ? delimiterRe.indexOf(endToken[endToken.length - 1]) > -1 : endToken === void 0;
    if (!strict) {
      route += "(?:".concat(delimiterRe, "(?=").concat(endsWithRe, "))?");
    }
    if (!isEndDelimited) {
      route += "(?=".concat(delimiterRe, "|").concat(endsWithRe, ")");
    }
  }
  return new RegExp(route, flags(options));
}
__name(tokensToRegexp, "tokensToRegexp");
__name2(tokensToRegexp, "tokensToRegexp");
function pathToRegexp(path, keys, options) {
  if (path instanceof RegExp)
    return regexpToRegexp(path, keys);
  if (Array.isArray(path))
    return arrayToRegexp(path, keys, options);
  return stringToRegexp(path, keys, options);
}
__name(pathToRegexp, "pathToRegexp");
__name2(pathToRegexp, "pathToRegexp");
var escapeRegex2 = /[.+?^${}()|[\]\\]/g;
function* executeRequest(request) {
  const requestPath = new URL(request.url).pathname;
  for (const route of [...routes].reverse()) {
    if (route.method && route.method !== request.method) {
      continue;
    }
    const routeMatcher = match(route.routePath.replace(escapeRegex2, "\\$&"), {
      end: false
    });
    const mountMatcher = match(route.mountPath.replace(escapeRegex2, "\\$&"), {
      end: false
    });
    const matchResult = routeMatcher(requestPath);
    const mountMatchResult = mountMatcher(requestPath);
    if (matchResult && mountMatchResult) {
      for (const handler14 of route.middlewares.flat()) {
        yield {
          handler: handler14,
          params: matchResult.params,
          path: mountMatchResult.path
        };
      }
    }
  }
  for (const route of routes) {
    if (route.method && route.method !== request.method) {
      continue;
    }
    const routeMatcher = match(route.routePath.replace(escapeRegex2, "\\$&"), {
      end: true
    });
    const mountMatcher = match(route.mountPath.replace(escapeRegex2, "\\$&"), {
      end: false
    });
    const matchResult = routeMatcher(requestPath);
    const mountMatchResult = mountMatcher(requestPath);
    if (matchResult && mountMatchResult && route.modules.length) {
      for (const handler14 of route.modules.flat()) {
        yield {
          handler: handler14,
          params: matchResult.params,
          path: matchResult.path
        };
      }
      break;
    }
  }
}
__name(executeRequest, "executeRequest");
__name2(executeRequest, "executeRequest");
var pages_template_worker_default = {
  async fetch(originalRequest, env2, workerContext) {
    let request = originalRequest;
    const handlerIterator = executeRequest(request);
    let data = {};
    let isFailOpen = false;
    const next = /* @__PURE__ */ __name2(async (input, init) => {
      if (input !== void 0) {
        let url = input;
        if (typeof input === "string") {
          url = new URL(input, request.url).toString();
        }
        request = new Request(url, init);
      }
      const result = handlerIterator.next();
      if (result.done === false) {
        const { handler: handler14, params, path } = result.value;
        const context2 = {
          request: new Request(request.clone()),
          functionPath: path,
          next,
          params,
          get data() {
            return data;
          },
          set data(value) {
            if (typeof value !== "object" || value === null) {
              throw new Error("context.data must be an object");
            }
            data = value;
          },
          env: env2,
          waitUntil: workerContext.waitUntil.bind(workerContext),
          passThroughOnException: /* @__PURE__ */ __name2(() => {
            isFailOpen = true;
          }, "passThroughOnException")
        };
        const response = await handler14(context2);
        if (!(response instanceof Response)) {
          throw new Error("Your Pages function should return a Response");
        }
        return cloneResponse(response);
      } else if ("ASSETS") {
        const response = await env2["ASSETS"].fetch(request);
        return cloneResponse(response);
      } else {
        const response = await fetch(request);
        return cloneResponse(response);
      }
    }, "next");
    try {
      return await next();
    } catch (error3) {
      if (isFailOpen) {
        const response = await env2["ASSETS"].fetch(request);
        return cloneResponse(response);
      }
      throw error3;
    }
  }
};
var cloneResponse = /* @__PURE__ */ __name2((response) => (
  // https://fetch.spec.whatwg.org/#null-body-status
  new Response(
    [101, 204, 205, 304].includes(response.status) ? null : response.body,
    response
  )
), "cloneResponse");
init_functionsRoutes_0_04524570753253654();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
var drainBody = /* @__PURE__ */ __name2(async (request, env2, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env2);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;
init_functionsRoutes_0_04524570753253654();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
__name2(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name2(async (request, env2, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env2);
  } catch (e) {
    const error3 = reduceError(e);
    return Response.json(error3, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = pages_template_worker_default;
init_functionsRoutes_0_04524570753253654();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
__name2(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env2, ctx, dispatch, middlewareChain) {
  const [head2, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head2(request, env2, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
__name2(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env2, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env2, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");
__name2(__facade_invoke__, "__facade_invoke__");
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  static {
    __name(this, "___Facade_ScheduledController__");
  }
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  static {
    __name2(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name2(function(request, env2, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env2, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env2, ctx) {
      const dispatcher = /* @__PURE__ */ __name2(function(type2, init) {
        if (type2 === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env2, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env2, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
__name2(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name2((request, env2, ctx) => {
      this.env = env2;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name2((type2, init) => {
      if (type2 === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
__name2(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;

// ../../../AppData/Roaming/npm/node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody2 = /* @__PURE__ */ __name(async (request, env2, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env2);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default2 = drainBody2;

// ../../../AppData/Roaming/npm/node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError2(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError2(e.cause)
  };
}
__name(reduceError2, "reduceError");
var jsonError2 = /* @__PURE__ */ __name(async (request, env2, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env2);
  } catch (e) {
    const error3 = reduceError2(e);
    return Response.json(error3, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default2 = jsonError2;

// .wrangler/tmp/bundle-P5Uva5/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__2 = [
  middleware_ensure_req_body_drained_default2,
  middleware_miniflare3_json_error_default2
];
var middleware_insertion_facade_default2 = middleware_loader_entry_default;

// ../../../AppData/Roaming/npm/node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__2 = [];
function __facade_register__2(...args) {
  __facade_middleware__2.push(...args.flat());
}
__name(__facade_register__2, "__facade_register__");
function __facade_invokeChain__2(request, env2, ctx, dispatch, middlewareChain) {
  const [head2, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__2(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head2(request, env2, ctx, middlewareCtx);
}
__name(__facade_invokeChain__2, "__facade_invokeChain__");
function __facade_invoke__2(request, env2, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__2(request, env2, ctx, dispatch, [
    ...__facade_middleware__2,
    finalMiddleware
  ]);
}
__name(__facade_invoke__2, "__facade_invoke__");

// .wrangler/tmp/bundle-P5Uva5/middleware-loader.entry.ts
var __Facade_ScheduledController__2 = class ___Facade_ScheduledController__2 {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  static {
    __name(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__2)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler2(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__2 === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__2.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__2) {
    __facade_register__2(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env2, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env2, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env2, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type2, init) {
        if (type2 === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__2(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env2, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__2(request, env2, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler2, "wrapExportedHandler");
function wrapWorkerEntrypoint2(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__2 === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__2.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__2) {
    __facade_register__2(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name((request, env2, ctx) => {
      this.env = env2;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name((type2, init) => {
      if (type2 === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__2(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__2(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint2, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY2;
if (typeof middleware_insertion_facade_default2 === "object") {
  WRAPPED_ENTRY2 = wrapExportedHandler2(middleware_insertion_facade_default2);
} else if (typeof middleware_insertion_facade_default2 === "function") {
  WRAPPED_ENTRY2 = wrapWorkerEntrypoint2(middleware_insertion_facade_default2);
}
var middleware_loader_entry_default2 = WRAPPED_ENTRY2;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__2 as __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default2 as default
};
//# sourceMappingURL=functionsWorker-0.0793399831427255.js.map
