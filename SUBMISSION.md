## Caption This - GenLayer Game Submission

### Overview
**Caption This** is a social party game where players compete to write the best captions for shared images. Winners are determined through AI-assisted validator consensus using GenLayer's Optimistic Democracy.

### Live Demo
- **Frontend**: Deployed on Vercel
- **Contract**: `0x9995764bcaa4D62DaC4866F00C8fB0D9Ca9EE0af` (StudioNet)
- **Repository**: https://github.com/emark-cloud/caption-this

### GenLayer Features Used

| Feature | Implementation |
|---------|---------------|
| **Optimistic Democracy** | AI evaluates captions, validators reach consensus on winners |
| **Equivalence Principle** | `gl.eq_principle.prompt_comparative()` ensures validator agreement on subjective judging |
| **LLM Integration** | `gl.nondet.exec_prompt()` for caption evaluation with category-based criteria |
| **Storage Types** | `TreeMap`, `Address`, `u256`, `@allow_storage` dataclasses |
| **Access Control** | Round creators can cancel; deadline enforcement via on-chain timestamps |

### Game Flow
1. Host creates a round with an image and category (Funniest / Most Accurate)
2. Players submit captions within a 5-minute window
3. After deadline, anyone can trigger AI resolution
4. Validators evaluate captions and reach consensus on winner/runner-up
5. XP awarded: Winner (+15), Runner-up (+8), Participation (+3)

### Technical Stack
- **Contract**: Python Intelligent Contract (~450 lines)
- **Frontend**: Next.js 16, TypeScript, Tailwind CSS
- **Integration**: GenLayerJS for contract interaction

### Unique Aspects
- Supports both solo play (AI scores 1-10) and multiplayer (comparative ranking)
- Nickname system for player identity
- Real-time polling with optimistic UI updates during consensus delays
