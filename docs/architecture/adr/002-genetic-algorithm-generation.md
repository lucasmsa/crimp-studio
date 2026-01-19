# ADR-002: Genetic Algorithm for Route Generation

## Status
Accepted

## Context

Need to choose an algorithm for procedural boulder generation that:
1. Generates complete boulders (holds + route + grade)
2. Produces diverse, interesting results
3. Creates climbable routes (not random garbage)
4. Can be tuned via fitness function
5. Provides learning value

### Alternatives Considered

| Algorithm | Pros | Cons |
|-----------|------|------|
| Random + heuristics | Simple, fast | Poor quality, no diversity |
| Simulated Annealing | Fast, simple | Single solution, gets stuck |
| Wave Function Collapse | Fast, constraint-safe | Needs predefined rules, binary valid/invalid |
| Genetic Algorithm | Diverse, multi-solution, tunable | Slower, more complex |
| Hybrid GA + WFC | Best of both | Most complex |

## Decision

**Use Genetic Algorithm for V0**, with option to add WFC hybrid in V1.

### Rationale

1. **Multi-modal problem**: Many valid "good" routes exist. GA naturally explores this space.

2. **Diversity needed**: Users want multiple route options, not one "optimal" route.

3. **Fitness function flexibility**: Easy to tune what makes a route "good":
   - Reachability (human proportions)
   - Flow (natural movement)
   - Difficulty consistency
   - Hold type variety

4. **Learning value**: GA is a valuable algorithm to understand deeply.

5. **Research supports it**: Studies show GA effective for game level generation, and hybrid GA-WFC achieves 73% fewer unplayable levels.

### Implementation Sketch

```
1. Initialize population of N random boulder configurations
2. For each generation:
   a. Evaluate fitness of each individual
   b. Select parents (tournament/roulette)
   c. Crossover to create children
   d. Mutate children
   e. Replace worst individuals
3. Return top M diverse solutions
```

### Fitness Function (Initial)

```typescript
fitness = (
  reachabilityScore * 0.3 +    // All moves within human reach
  flowScore * 0.25 +            // Natural movement sequence
  consistencyScore * 0.2 +      // No random difficulty spikes
  varietyScore * 0.15 +         // Mix of hold types
  targetGradeScore * 0.1        // Close to requested difficulty
)
```

## Consequences

### Positive
- High quality, diverse route generation
- Tunable via fitness weights
- Can evolve fitness function with user feedback (V1)
- Solid foundation for hybrid approach later

### Negative
- More complex than simple heuristics
- Needs parameter tuning (population size, mutation rate)
- Slower than WFC (acceptable for non-realtime use)

### Future
- V1: Add user feedback loop to improve fitness function
- V1+: Consider GA-WFC hybrid for constraint handling
