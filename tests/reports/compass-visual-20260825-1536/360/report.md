# QA Agent Report

**URL:** https://bask-psi.vercel.app
**Model:** minimax-m2.7:cloud (ollama)
**Duration:** 0m 16s
**Results:** 0 PASS | 0 FAIL | 5 ERROR | 0 SKIP / 5 total

## Results

| # | Section | Step | Status | Detail |
|---|---------|------|--------|--------|
| 1 | Compass production visual sweep | Open `/compass?role=uvalux_rep` and verify the com | ERROR | Circuit breaker: 5 LLM errors |
| 2 | Compass production visual sweep | Open `/compass/accounts?role=uvalux_rep` and verif | ERROR | Circuit breaker: 5 LLM errors |
| 3 | Compass production visual sweep | Open `/compass/coaching?role=uvalux_rep` and verif | ERROR | Circuit breaker: 5 LLM errors |
| 4 | Compass production visual sweep | Open `/compass/knowledge?role=uvalux_rep` and veri | ERROR | Circuit breaker: 5 LLM errors |
| 5 | Compass production visual sweep | Open `/compass/network?role=uvalux_rep` and verify | ERROR | Circuit breaker: 5 LLM errors |

## Pages Visited (2)

- https://bask-psi.vercel.app
- https://bask-psi.vercel.app/

## Failure Details

### 1. Open `/compass?role=uvalux_rep` and verify the complete visible viewport has no clipped text, edge overflow, overlap, collision, broken card radius, inconsistent padding, orphaned words, unreadable contrast, or design-language mismatch.
- **ERROR**: Circuit breaker: 5 LLM errors

### 2. Open `/compass/accounts?role=uvalux_rep` and verify the complete visible viewport has no clipped text, edge overflow, overlap, collision, broken card radius, inconsistent padding, orphaned words, unreadable contrast, or design-language mismatch.
- **ERROR**: Circuit breaker: 5 LLM errors

### 3. Open `/compass/coaching?role=uvalux_rep` and verify the complete visible viewport has no clipped text, edge overflow, overlap, collision, broken card radius, inconsistent padding, orphaned words, unreadable contrast, or design-language mismatch.
- **ERROR**: Circuit breaker: 5 LLM errors

### 4. Open `/compass/knowledge?role=uvalux_rep` and verify the complete visible viewport has no clipped text, edge overflow, overlap, collision, broken card radius, inconsistent padding, orphaned words, unreadable contrast, or design-language mismatch.
- **ERROR**: Circuit breaker: 5 LLM errors

### 5. Open `/compass/network?role=uvalux_rep` and verify the complete visible viewport has no clipped text, edge overflow, overlap, collision, broken card radius, inconsistent padding, orphaned words, unreadable contrast, or design-language mismatch.
- **ERROR**: Circuit breaker: 5 LLM errors

