# Caption This - GenLayer Edition

## Project Overview

Caption This is a fast, social mini-game built for GenLayer that demonstrates Intelligent Contracts and Optimistic Democracy. Players submit captions for shared images, and winners are determined through AI-assisted validator consensus.

## Game Flow

1. **Round Setup** - Host creates a round with an image and category (Funniest, Most Accurate, Most Creative, Best Meme)
2. **Caption Submission (2-3 min)** - Players submit one hidden caption each
3. **Community Voting (Optional)** - Players upvote captions as signals
4. **Resolution (Optimistic Democracy)** - Validators run AI evaluation to determine winners
5. **Results & XP** - Winners announced, XP distributed (Winner: +15, Runner-up: +8, Participation: +3)

## Intelligent Contract Design

### Storage State
- Rounds (image, category, timestamps, resolved status)
- Captions per round
- Winners per round
- XP per address

### Core Methods
- `create_round(image_url, category)` - Create a new round
- `submit_caption(round_id, caption)` - Submit a caption
- `resolve_round(round_id)` - Trigger AI-powered resolution
- `get_round(round_id)` - Get round details
- `get_leaderboard()` - Get XP leaderboard

### GenLayer-Specific Patterns

```python
# Storage types
from genlayer import Address, TreeMap, u256
from genlayer.gl import allow_storage

# Custom storage dataclass
@allow_storage
@dataclass
class Round:
    image_url: str
    category: str
    created_at: u256
    submission_deadline: u256
    resolved: bool

# Method decorators
@gl.public.view    # Read-only
@gl.public.write   # State-changing

# LLM integration for resolution
def evaluate_captions() -> str:
    prompt = """..."""
    return gl.nondet.exec_prompt(prompt)

outcome = gl.eq_principle.prompt_comparative(evaluate_captions, principle)

# Error handling
from genlayer.gl.vm import UserError
raise UserError("Round not found")
```

## Frontend Stack

- **Framework**: Next.js with TypeScript
- **Styling**: Tailwind CSS
- **Wallet**: MetaMask integration
- **Chain**: GenLayer StudioNet (chainId: 0xF22F / 61999)

### Key Frontend Patterns

1. **Reading**: Use `client.readContract()` for view methods
2. **Writing**: Route through consensus contract (`0x000000000000000000000000000000000000000A`)
3. **Polling**: Contract state polling every 5 seconds for live updates
4. **Latency**: 1-2 minute consensus delays - design UI accordingly
5. **BigInt**: Convert `u256` (returns as `bigint`) to `number` at consumption

## Project Structure

```
caption-this/
├── caption_this.py           # Intelligent Contract
├── app/
│   ├── page.tsx              # Home/Lobby
│   ├── round/[id]/page.tsx   # Active round view
│   └── globals.css
├── components/
│   ├── ConnectWallet.tsx
│   ├── RoundCard.tsx
│   ├── CaptionInput.tsx
│   └── Leaderboard.tsx
├── hooks/
│   ├── useRound.ts
│   ├── useLeaderboard.ts
│   └── useCountdown.ts
├── lib/
│   ├── genlayer.ts           # RPC integration
│   ├── config.ts
│   └── errors.ts
└── types/
    ├── global.d.ts
    └── round.ts
```

## XP System

| Action | XP |
|--------|-----|
| Winner | +15 |
| Runner-up | +8 |
| Participation | +3 |

## Categories

- Funniest
- Most Accurate
- Most Creative
- Best Meme

## MVP Design Decisions

1. **Access Control**: Anyone can create rounds
2. **Voting**: Skip community voting for MVP - go directly to AI resolution
3. **Timing**: On-chain deadline enforcement (180 seconds / 3 minutes default)
4. **Concurrency**: Multiple concurrent rounds with unique IDs
5. **AI Judging**: Category-based evaluation (judge based on round's category)
6. **Caption Visibility**: Hidden until submission deadline closes
7. **Winners**: Top 2 (winner +15 XP, runner-up +8 XP, all participants +3 XP)
8. **Minimum Players**: 2 players required to resolve a round
9. **Images**: URL only (HTTPS)
10. **Leaderboard**: Global all-time XP accumulation

## Key GenLayer Concepts Used

1. **Optimistic Democracy** - Validators reach consensus on subjective outcomes
2. **Equivalence Principle** - Multiple validators must agree on AI output
3. **LLM Integration** - AI proposes winners, validators verify
4. **Non-deterministic Execution** - AI calls wrapped in equivalence checks
