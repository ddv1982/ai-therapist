#!/usr/bin/env node

/**
 * Memory Profiling Script for Long Chat Sessions
 *
 * This script helps verify memory stability during extended usage with large message histories.
 * It simulates memory usage patterns and can be used to detect potential memory leaks.
 *
 * Usage:
 *   node scripts/memory-profile.mjs [options]
 *
 * Options:
 *   --messages <count>    Number of messages to simulate (default: 1000)
 *   --sessions <count>    Number of session switches to simulate (default: 5)
 *   --interval <ms>       Interval between measurements (default: 100)
 *   --output <file>       Output file for results (default: stdout)
 *   --verbose             Enable verbose logging
 *
 * Example:
 *   node scripts/memory-profile.mjs --messages 1000 --sessions 5 --verbose
 */

import { performance } from 'perf_hooks';

// Configuration defaults
const DEFAULT_MESSAGE_COUNT = 1000;
const DEFAULT_SESSION_COUNT = 5;
const DEFAULT_INTERVAL_MS = 100;

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const config = {
    messageCount: DEFAULT_MESSAGE_COUNT,
    sessionCount: DEFAULT_SESSION_COUNT,
    intervalMs: DEFAULT_INTERVAL_MS,
    outputFile: null,
    verbose: false,
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--messages':
        config.messageCount = parseInt(args[++i], 10);
        break;
      case '--sessions':
        config.sessionCount = parseInt(args[++i], 10);
        break;
      case '--interval':
        config.intervalMs = parseInt(args[++i], 10);
        break;
      case '--output':
        config.outputFile = args[++i];
        break;
      case '--verbose':
        config.verbose = true;
        break;
      case '--help':
        console.log(`
Memory Profiling Script for Long Chat Sessions

Usage:
  node scripts/memory-profile.mjs [options]

Options:
  --messages <count>    Number of messages to simulate (default: ${DEFAULT_MESSAGE_COUNT})
  --sessions <count>    Number of session switches to simulate (default: ${DEFAULT_SESSION_COUNT})
  --interval <ms>       Interval between measurements (default: ${DEFAULT_INTERVAL_MS})
  --output <file>       Output file for results (default: stdout)
  --verbose             Enable verbose logging
  --help                Show this help message
`);
        process.exit(0);
    }
  }

  return config;
}

// Format bytes for human readability
function formatBytes(bytes) {
  const units = ['B', 'KB', 'MB', 'GB'];
  let unitIndex = 0;
  let value = bytes;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex++;
  }

  return `${value.toFixed(2)} ${units[unitIndex]}`;
}

// Get current memory usage
function getMemoryUsage() {
  const usage = process.memoryUsage();
  return {
    heapUsed: usage.heapUsed,
    heapTotal: usage.heapTotal,
    external: usage.external,
    rss: usage.rss,
    timestamp: Date.now(),
  };
}

// Simulate a message object similar to MessageData
function createMockMessage(index, sessionId) {
  return {
    id: `msg-${sessionId}-${index}`,
    role: index % 2 === 0 ? 'user' : 'assistant',
    content: `This is message ${index} with some content. `.repeat(
      10 + Math.floor(Math.random() * 20)
    ),
    timestamp: new Date(),
    metadata: {
      step: index % 10 === 0 ? 'thoughts' : undefined,
      sessionData:
        index % 10 === 0
          ? {
              thoughtData: Array.from({ length: 3 }, (_, i) => ({
                thought: `Sample thought ${i}`,
                credibility: Math.floor(Math.random() * 10),
              })),
            }
          : undefined,
    },
    digest: `digest-${sessionId}-${index}`,
  };
}

// Simulate a chat session with messages
class MockChatSession {
  constructor(id) {
    this.id = id;
    this.messages = [];
  }

  addMessage(message) {
    this.messages.push(message);
  }

  clear() {
    this.messages = [];
  }

  get messageCount() {
    return this.messages.length;
  }
}

// Run memory profiling
async function runMemoryProfile(config) {
  const { messageCount, sessionCount, intervalMs, verbose } = config;
  const measurements = [];
  const sessions = [];

  console.log('Memory Profiling for Long Chat Sessions');
  console.log('========================================');
  console.log(`Messages per session: ${messageCount}`);
  console.log(`Number of sessions: ${sessionCount}`);
  console.log(`Measurement interval: ${intervalMs}ms`);
  console.log('');

  // Initial memory measurement
  if (global.gc) {
    global.gc();
  }
  await new Promise((resolve) => setTimeout(resolve, 100));

  const initialMemory = getMemoryUsage();
  measurements.push({
    phase: 'initial',
    session: 0,
    messages: 0,
    ...initialMemory,
  });

  if (verbose) {
    console.log(`Initial heap: ${formatBytes(initialMemory.heapUsed)}`);
  }

  // Run session simulations
  for (let sessionIndex = 0; sessionIndex < sessionCount; sessionIndex++) {
    const session = new MockChatSession(`session-${sessionIndex}`);
    sessions.push(session);

    console.log(`\nSession ${sessionIndex + 1}/${sessionCount}`);
    console.log(`Creating ${messageCount} messages...`);

    const startTime = performance.now();

    // Add messages
    for (let msgIndex = 0; msgIndex < messageCount; msgIndex++) {
      const message = createMockMessage(msgIndex, session.id);
      session.addMessage(message);

      // Take periodic measurements
      if (msgIndex % Math.floor(messageCount / 10) === 0) {
        const memory = getMemoryUsage();
        measurements.push({
          phase: 'adding',
          session: sessionIndex,
          messages: session.messageCount,
          ...memory,
        });

        if (verbose) {
          console.log(`  ${session.messageCount} messages, heap: ${formatBytes(memory.heapUsed)}`);
        }
      }
    }

    const createTime = performance.now() - startTime;
    console.log(`  Created in ${createTime.toFixed(2)}ms`);

    // Measure after full session
    const postCreateMemory = getMemoryUsage();
    measurements.push({
      phase: 'session_complete',
      session: sessionIndex,
      messages: session.messageCount,
      ...postCreateMemory,
    });

    // Simulate session switch (clear previous sessions)
    if (sessionIndex > 0) {
      console.log('  Clearing previous session...');
      sessions[sessionIndex - 1].clear();

      // Force GC if available
      if (global.gc) {
        global.gc();
      }

      await new Promise((resolve) => setTimeout(resolve, intervalMs));

      const postClearMemory = getMemoryUsage();
      measurements.push({
        phase: 'after_clear',
        session: sessionIndex,
        messages: session.messageCount,
        ...postClearMemory,
      });

      if (verbose) {
        console.log(`  After clear, heap: ${formatBytes(postClearMemory.heapUsed)}`);
      }
    }
  }

  // Final cleanup
  console.log('\nFinal cleanup...');
  sessions.forEach((s) => s.clear());

  if (global.gc) {
    global.gc();
  }

  await new Promise((resolve) => setTimeout(resolve, 500));

  const finalMemory = getMemoryUsage();
  measurements.push({
    phase: 'final',
    session: sessionCount,
    messages: 0,
    ...finalMemory,
  });

  // Generate report
  console.log('\n========================================');
  console.log('Memory Profile Results');
  console.log('========================================\n');

  const heapGrowth = finalMemory.heapUsed - initialMemory.heapUsed;
  const maxHeap = Math.max(...measurements.map((m) => m.heapUsed));
  const minHeap = Math.min(...measurements.map((m) => m.heapUsed));

  console.log('Summary:');
  console.log(`  Initial heap:     ${formatBytes(initialMemory.heapUsed)}`);
  console.log(`  Final heap:       ${formatBytes(finalMemory.heapUsed)}`);
  console.log(`  Max heap:         ${formatBytes(maxHeap)}`);
  console.log(`  Min heap:         ${formatBytes(minHeap)}`);
  console.log(
    `  Heap growth:      ${formatBytes(heapGrowth)} (${heapGrowth > 0 ? '+' : ''}${((heapGrowth / initialMemory.heapUsed) * 100).toFixed(2)}%)`
  );
  console.log('');

  // Check for potential memory leaks
  const leakThreshold = initialMemory.heapUsed * 0.2; // 20% growth threshold
  const hasLeak = heapGrowth > leakThreshold;

  if (hasLeak) {
    console.log('⚠️  WARNING: Potential memory leak detected!');
    console.log(`   Heap grew by more than 20% after cleanup.`);
    console.log(`   Consider investigating object references that may not be released.`);
  } else {
    console.log('✅ Memory usage looks stable.');
    console.log(`   Heap returned to within acceptable range after cleanup.`);
  }

  console.log('\n');

  // Performance metrics
  const sessionCompletePhases = measurements.filter((m) => m.phase === 'session_complete');
  if (sessionCompletePhases.length > 1) {
    const avgHeapPerSession =
      sessionCompletePhases.reduce((sum, m) => sum + m.heapUsed, 0) / sessionCompletePhases.length;
    console.log('Performance Metrics:');
    console.log(`  Average heap per session: ${formatBytes(avgHeapPerSession)}`);
    console.log(`  Messages processed: ${messageCount * sessionCount}`);
  }

  return {
    success: !hasLeak,
    measurements,
    summary: {
      initialHeap: initialMemory.heapUsed,
      finalHeap: finalMemory.heapUsed,
      maxHeap,
      heapGrowth,
      hasLeak,
    },
  };
}

// Main entry point
async function main() {
  const config = parseArgs();

  try {
    const result = await runMemoryProfile(config);

    if (config.outputFile) {
      const { writeFileSync } = await import('fs');
      writeFileSync(config.outputFile, JSON.stringify(result, null, 2));
      console.log(`\nResults written to ${config.outputFile}`);
    }

    process.exit(result.success ? 0 : 1);
  } catch (error) {
    console.error('Error during memory profiling:', error);
    process.exit(1);
  }
}

main();
