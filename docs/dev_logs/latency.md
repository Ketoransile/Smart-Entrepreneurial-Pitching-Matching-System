```markdown
# Latency Analysis and Performance Log

This document tracks latency measurements, regressions, and optimizations for the system.

## Environment Specifications
- **Hardware:** AWS c5.4xlarge (16 vCPUs, 32 GiB RAM)
- **Runtime:** Node.js v18.x / Python 3.10
- **Network:** Intra-region (us-east-1), <1ms baseline

## Log Entries

### 2023-10-24: Baseline Measurements
Initial baseline established after the migration to the new indexing service.

| Component | P50 (ms) | P90 (ms) | P99 (ms) |
| :--- | :--- | :--- | :--- |
| API Gateway | 12 | 25 | 45 |
| Authentication | 8 | 15 | 30 |
| Metadata Fetch | 45 | 110 | 250 |
| Search Index | 120 | 350 | 850 |
| Total E2E | 185 | 500 | 1175 |

**Observations:**
- Search Index P99 is significantly higher than expected.
- Metadata Fetch shows high variance, likely due to cold starts in the cache layer.

### 2023-10-25: Investigation into Search Index Tail Latency
Profiled the search indexer under heavy load.

- **Hypothesis:** GC pauses in the JVM are causing the P99 spikes.
- **Findings:**
    - GC logs show 200ms pauses every 30 seconds.
    - Heap utilization is at 85%.
- **Action:** Increased heap size from 4GB to 8GB and switched to G1GC.

### 2023-10-26: Post-GC Optimization Results

| Component | P50 (ms) | P90 (ms) | P99 (ms) |
| :--- | :--- | :--- | :--- |
| Search Index | 115 | 280 | 410 |

**Result:** P99 improved by ~50%.

### 2023-10-27: Database Connection Pooling
Noticed "Connection Timeout" errors in logs during peak hours (14:00 - 16:00 UTC).

- **Current Config:** `max_connections = 20`
- **Proposed Config:** `max_connections = 100`
- **Result:** Connection wait time reduced from 50ms to 2ms.

### 2023-10-28: Detailed Breakdown of Metadata Fetch
Instrumentation added to `fetchMetadata` function.

```python
# Latency Instrumentation Snippet
start_time = time.perf_counter()
data = cache.get(key)
if data is None:
    # Cache Miss Path
    db_start = time.perf_counter()
    data = db.query(key)
    db_end = time.perf_counter()
    logger.info(f"DB Fetch: {(db_end - db_start) * 1000:.2f}ms")
    cache.set(key, data)
else:
    # Cache Hit Path
    logger.info("Cache Hit")
end_time = time.perf_counter()
```

### 2023-10-29: Cache Eviction Policy Change
Changed eviction from LRU to LFU for the metadata service to keep hot keys longer.
- **Cache Hit Rate:** Increased from 72% to 89%.
- **Average Latency:** Reduced by 15ms.

### 2023-10-30: Network Latency Regression
Detected a spike in intra-service latency.

- **Trace ID:** `ax-789-bf`
- **Hop:** `Service A -> Service B`
- **Latency:** 150ms (Expected < 5ms)
- **Root Cause:** Misconfigured VPC Peering route causing traffic to exit and re-enter the region.
- **Fix:** Updated routing tables.

### 2023-11-01: Regression Testing for v2.1.0 Release
Pre-release benching.

| Metric | v2.0.4 | v2.1.0-rc1 | Delta |
| :--- | :--- | :--- | :--- |
| Throughput (rps) | 1200 | 1150 | -4.1% |
| P50 Latency | 180ms | 195ms | +8.3% |
| P99 Latency | 420ms | 435ms | +3.5% |

**Note:** The regression in P50 is attributed to the new encryption layer. Accepted for security compliance.

### 2023-11-02: Async Processing Implementation
Moved non-critical logging to a background worker.

```javascript
// Before
await logger.logToRemote(event);
return response;

// After
setImmediate(() => {
  logger.logToRemote(event).catch(err => console.error(err));
});
return response;
```

**Impact:** API response time P50 reduced by 10ms.

### 2023-11-03: Cold Start Analysis for Lambda Workers
- **Runtime:** Node.js 18
- **Average Cold Start:** 450ms
- **Provisioned Concurrency:** Enabled for 5 instances.
- **Result:** Cold start frequency dropped by 95%.

### 2023-11-04: Serialization Overhead
Identified JSON.stringify as a bottleneck in the telemetry pipeline.
- **Experiment:** Switched to MessagePack for internal service communication.
- **Result:** CPU usage down 12%, latency down 5ms per hop.

### 2023-11-05: Disk I/O Bottlenecks
Storage volume reached 90% IOPS limit.
- **Volume:** gp2 (300 IOPS)
- **Action:** Upgraded to gp3 (3000 IOPS).
- **Result:** Write latency stabilized at 1.2ms.

### 2023-11-06: Frontend Bundle Size Impact
Lighthouse scores dropped due to large JS bundle.
- **Bundle Size:** 1.2MB (Gzipped)
- **Action:** Implemented code splitting and lazy loading for heavy charts.
- **New Size:** 450KB (Initial Load)
- **Time to Interactive (TTI):** Reduced from 4.2s to 2.1s.

### 2023-11-07: Database Query Optimization
Query: `SELECT * FROM audits WHERE user_id = ? ORDER BY created_at DESC LIMIT 50`
- **Problem:** Full sequence scan on 10M rows.
- **Solution:** Added composite index `(user_id, created_at)`.
- **Query Time:** 850ms -> 4ms.

### 2023-11-08: HTTP/2 Multiplexing
Enabled HTTP/2 on the Load Balancer.
- **Metric:** Connection overhead per request.
- **Improvement:** 30% reduction in total page load time for assets.

### 2023-11-09: Connection Leak Detection
- **Symptom:** Memory usage gradually climbing over 24 hours.
- **Tool:** `heapdump` and `chrome-devtools`.
- **Finding:** Database connections not being released in the error handler of the `upload` endpoint.
- **Fix:** Wrapped in `try...finally` to ensure `connection.release()`.

### 2023-11-10: Summary of Latency Improvements (Weekly)

| Metric | Start of Week | End of Week | Improvement |
| :--- | :--- | :--- | :--- |
| P50 | 195ms | 165ms | 15.3% |
| P90 | 500ms | 380ms | 24.0% |
| P99 | 1175ms | 415ms | 64.6% |

### 2023-11-11: Downstream Service Degradation
Third-party Geocoding API started responding in 2s+.
- **Action:** Implemented a circuit breaker pattern with a 500ms timeout and stale-while-revalidate caching.
- **Outcome:** System remained responsive during downstream outage.

### 2023-11-12: Protocol Buffers vs JSON
Benchmarking gRPC vs REST for internal microservices.

```text
Benchmark Results:
JSON Payload (1KB): 1.2ms serialization
Protobuf Payload (1KB): 0.15ms serialization
JSON Size: 1024 bytes
Protobuf Size: 412 bytes
```

### 2023-11-13: Kernel Tuning for High Concurrency
Adjusted `sysctl` settings on the proxy nodes.
- `net.core.somaxconn`: 128 -> 4096
- `net.ipv4.tcp_max_syn_backlog`: 128 -> 4096
- `net.ipv4.ip_local_port_range`: 32768 60999 -> 1024 65535

**Result:** Eliminated "connection reset by peer" errors during load spikes.

### 2023-11-14: Read Replica Lag Investigation
- **Lag:** 5 seconds between Primary and Replica.
- **Cause:** Large batch delete operation on the primary.
- **Fix:** Refactored delete to use smaller chunks (1000 rows per batch) with 1s sleep between batches.

### 2023-11-15: Static Asset CDN Cache Hit Ratio
- **Current:** 65%
- **Action:** Increased `Cache-Control: max-age` from 1 hour to 1 year for hashed assets.
- **New Hit Ratio:** 98%.
- **Impact:** Reduced origin load by 40%.

### 2023-11-16: JIT Optimization in V8
Observed high CPU during the first 5 minutes of process start.
- **Strategy:** Added a "warm-up" phase to the CI/CD pipeline where common paths are executed before the service is added to the load balancer pool.

### 2023-11-17: Thread Pool Contention
- **Service:** Image Processor.
- **Issue:** Thread pool exhaustion on 4-core machine.
- **Action:** Limited concurrency of the image library to match CPU cores.
- **Result:** Reduced context switching overhead, overall throughput increased by 15%.

### 2023-11-18: DNS Resolution Latency
- **Issue:** Intermittent 5s delays in external API calls.
- **Cause:** DNS resolver fallback to TCP.
- **Fix:** Installed local `nscd` (Name Service Cache Daemon) on worker nodes.

### 2023-11-19: Tail Latency in Distributed Tracing
Integrated OpenTelemetry to visualize the critical path.
- **Discovery:** 40% of time spent in a serial loop fetching user permissions.
- **Optimization:** Refactored to `Promise.all()` for parallel permission checks.
- **Latency Reduction:** 80ms -> 22ms.

### 2023-11-20: Garbage Collection Strategy Review
Evaluated ZGC for the search cluster.
- **Pros:** Sub-millisecond pause times.
- **Cons:** 5-10% throughput hit.
- **Decision:** Adopted ZGC for the frontend-facing search API to prioritize latency over raw throughput.

### 2023-11-21: Memory-Mapped I/O for Large Files
Replaced standard file reads with `mmap` for reading the static GeoIP database.
- **Latency:** 5ms -> 0.1ms per lookup.

### 2023-11-22: Client-side Latency Monitoring
Implemented `PerformanceObserver` in the browser to track LCP and FID.
- **Data:** 15% of users in Asia experience >3s LCP.
- **Action:** Deploying new edge POP in Singapore.

### 2023-11-23: Redundant Data Fetching
- **Issue:** Multiple components fetching the same `currentUser` object.
- **Fix:** Implemented a request-scoped cache (Data Loader pattern).
- **Database Calls per Request:** 12 -> 4.

### 2023-11-24: Final Monthly Summary
- **P50:** 155ms (-25% from baseline)
- **P99:** 390ms (-66% from baseline)
- **Status:** Target latency goals met. Continuous monitoring enabled.

---
*End of November Latency Log*
```
```
