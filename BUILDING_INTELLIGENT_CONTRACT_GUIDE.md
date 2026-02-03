# Building Your First AI-Powered Game on the Blockchain: A Complete Beginner's Guide

*No blockchain experience? No problem. Let's build something amazing together.*

---

## What Are We Building (And Why Is It Cool)?

Imagine a game where you and your friends submit funny captions for images, and an **AI judge** picks the winner — but here's the twist: that AI doesn't run on any single company's server. Instead, it runs across a decentralized network where multiple computers must **agree** on the winner.

This is **Caption This**, and by the end of this tutorial, you'll understand how to build it.

But first, let's break down some concepts you'll need.

---

## Part 1: Understanding the Basics

### What Is a Smart Contract?

Think of a smart contract as a **vending machine for code**.

With a regular vending machine:
1. You put in money
2. You press a button
3. The machine follows its programming and gives you a snack

A smart contract works the same way:
1. You send a transaction (like putting in a coin)
2. You call a function (like pressing a button)
3. The contract executes code and updates its state

The key difference? Smart contracts run on a **blockchain** — a network of thousands of computers that all agree on what happened. No single person controls it, and nobody can cheat.

### What Makes GenLayer Different?

Traditional smart contracts can only do math and store data. They can't "think."

GenLayer introduces **Intelligent Contracts** — smart contracts that can:
- Call AI models (like ChatGPT) as part of their logic
- Make subjective decisions ("Which caption is funnier?")
- Reach consensus even when the answer isn't purely mathematical

This opens up entirely new possibilities. Our caption game would be **impossible** on traditional blockchains.

### The Equivalence Principle (Don't Worry, It's Simpler Than It Sounds)

Here's a problem: if we ask an AI "which caption is funnier?", different AI calls might give different answers. How do multiple computers agree?

GenLayer solves this with the **Equivalence Principle**:

1. Multiple validators (computers) each run the AI independently
2. They compare their answers
3. If the answers are "equivalent" (similar enough), they reach consensus
4. If not, they discuss and resolve the disagreement

Think of it like a jury trial. Each juror forms their own opinion, but they must ultimately agree on a verdict.

---

## Part 2: Setting Up Our Contract

### The Basic Structure

Every GenLayer contract is a Python file. Here's the skeleton:

```python
# Import GenLayer's tools
from genlayer import *
from genlayer.gl.vm import UserError
from dataclasses import dataclass
import json

# Define our contract
class CaptionThis(gl.Contract):
    # Storage goes here (like the contract's "memory")

    def __init__(self):
        # Initialization code (runs once when contract is deployed)
        pass

    # Methods go here (functions users can call)
```

Let's break this down:

| Line | What It Does |
|------|--------------|
| `from genlayer import *` | Imports all GenLayer tools (types, decorators, etc.) |
| `from genlayer.gl.vm import UserError` | Lets us show friendly error messages |
| `from dataclasses import dataclass` | Python feature for creating structured data |
| `class CaptionThis(gl.Contract)` | Declares our contract (must extend `gl.Contract`) |
| `def __init__(self)` | Constructor — runs once when deployed |

### Understanding Storage: The Contract's Memory

A contract needs to remember things between function calls. This is called **storage**.

Think of storage like a database that lives on the blockchain. Once you write something there, it stays forever (unless you explicitly delete it).

GenLayer gives us special types for storage:

```python
class CaptionThis(gl.Contract):
    # A counter (single number)
    round_counter: u256

    # A dictionary/map (key -> value)
    rounds: TreeMap[str, Round]

    # A list that can grow
    player_list: DynArray[Address]
```

Let me explain each type:

#### `u256` — Big Numbers

```python
round_counter: u256
```

`u256` means "unsigned 256-bit integer." That's a fancy way of saying:
- **Unsigned**: Only positive numbers (no negatives)
- **256-bit**: Can store incredibly large numbers (up to 2²⁵⁶)

Why so big? Blockchain uses large numbers for precision. Don't worry about the details — just know that when you need a number, use `u256`.

```python
# Creating a u256
self.round_counter = u256(0)      # Start at zero
self.round_counter = u256(42)     # Set to 42

# Math works normally
self.round_counter = self.round_counter + u256(1)  # Add 1
```

#### `Address` — Wallet Identifiers

```python
creator: Address
```

Every user on the blockchain has an **address** — a unique identifier like `0x742d35Cc6634C0532925a3b844Bc9e7595f...`.

The `Address` type stores these.

```python
# Get the address of whoever called this function
sender: Address = gl.message.sender_address

# Store it
self.creator = sender

# Compare addresses
if gl.message.sender_address == self.creator:
    print("You're the creator!")
```

#### `TreeMap` — Key-Value Storage

```python
rounds: TreeMap[str, Round]
```

A `TreeMap` is like a Python dictionary. You store values with keys and retrieve them later.

```python
# Store a round with ID "round_1"
self.rounds["round_1"] = some_round_object

# Retrieve it later
my_round = self.rounds["round_1"]

# Check if a key exists
if "round_1" in self.rounds:
    print("Found it!")

# Delete an entry
del self.rounds["round_1"]
```

#### `DynArray` — Growing Lists

```python
player_list: DynArray[Address]
```

A `DynArray` (dynamic array) is a list that can grow. Use it when you need to iterate over all items.

```python
# Add a player
self.player_list.append(player_address)

# Loop through all players
for player in self.player_list:
    print(player)
```

### Creating Custom Data Structures

Sometimes you need to group related data together. Python's `dataclass` helps, but you must add GenLayer's `@allow_storage` decorator:

```python
@allow_storage
@dataclass
class Round:
    """Stores all information about a single game round"""
    round_id: str           # Unique identifier like "round_1"
    image_url: str          # The image players caption
    category: str           # "Funniest", "Most Accurate", etc.
    creator: Address        # Who created this round
    created_at: u256        # When it was created (timestamp)
    submission_deadline: u256   # When submissions close
    resolved: bool          # Has a winner been chosen?
```

Think of this like defining a form. Each `Round` has these fields, and you can create many rounds, each with different values.

```python
# Create a new round
new_round = Round(
    round_id="round_1",
    image_url="https://example.com/funny-cat.jpg",
    category="Funniest",
    creator=gl.message.sender_address,
    created_at=u256(1234567890),
    submission_deadline=u256(1234568190),
    resolved=False
)

# Store it
self.rounds["round_1"] = new_round

# Access fields later
print(self.rounds["round_1"].category)  # "Funniest"
```

---

## Part 3: Building the Game Logic

Now let's build the actual game! We'll create methods that users can call.

### Method Types: Read vs Write

GenLayer has two types of public methods:

| Decorator | What It Does | Costs Gas? |
|-----------|--------------|------------|
| `@gl.public.write` | Changes storage (creates, updates, deletes data) | Yes |
| `@gl.public.view` | Only reads data, doesn't change anything | No |

**Gas** is like a transaction fee — you pay a small amount to run code that changes the blockchain.

### Creating a Round

Let's build the function that creates a new game round:

```python
@gl.public.write  # This changes storage, so it's a "write" method
def create_round(self, round_id: str, image_url: str, category: str):
    """
    Create a new caption round.

    This function is called by a user who wants to start a new game.
    They provide an image URL and choose a category for judging.
    """

    # ===== STEP 1: Validate the inputs =====

    # Check if this round_id already exists
    # (We don't want duplicate rounds!)
    if round_id in self.rounds:
        raise UserError("Round ID already exists")

    # Check if the URL is secure (HTTPS)
    # This prevents users from linking to sketchy sites
    if not image_url.startswith("https://"):
        raise UserError("Invalid image URL: must be HTTPS")

    # Check if the category is one we support
    valid_categories = ["Funniest", "Most Accurate"]
    if category not in valid_categories:
        raise UserError(f"Invalid category. Choose from: {valid_categories}")

    # ===== STEP 2: Get current context =====

    # Who is creating this round?
    creator_address: Address = gl.message.sender_address

    # What time is it? (as a Unix timestamp)
    current_time = u256(get_current_timestamp())

    # When should submissions close? (5 minutes from now)
    submission_duration = u256(300)  # 300 seconds = 5 minutes
    deadline = current_time + submission_duration

    # ===== STEP 3: Create and store the round =====

    new_round = Round(
        round_id=round_id,
        image_url=image_url,
        category=category,
        creator=creator_address,
        created_at=current_time,
        submission_deadline=deadline,
        resolved=False
    )

    # Save to storage
    self.rounds[round_id] = new_round

    # Increment our counter (useful for tracking)
    self.round_counter = self.round_counter + u256(1)
```

#### What's `UserError`?

When something goes wrong, we want to:
1. Stop the function from continuing
2. Tell the user what went wrong
3. **Revert** any changes (nothing gets saved)

`UserError` does all of this:

```python
raise UserError("Round ID already exists")
```

This stops execution immediately and shows "Round ID already exists" to the user.

#### What's `gl.message.sender_address`?

Every time someone calls your contract, GenLayer provides information about that call in the `gl.message` object:

```python
gl.message.sender_address  # The wallet address that called this function
```

This is how you know **who** is interacting with your contract. It's like caller ID for the blockchain.

### Submitting a Caption

Now let's handle caption submissions:

```python
@gl.public.write
def submit_caption(self, round_id: str, caption: str):
    """
    Submit a caption for a round.

    Players call this function to enter the contest.
    Each player can only submit once per round.
    """

    # ===== VALIDATION =====

    # Does this round exist?
    if round_id not in self.rounds:
        raise UserError("Round not found")

    # Get the round data
    round_data = self.rounds[round_id]

    # Is the submission window still open?
    current_time = u256(get_current_timestamp())
    if current_time > round_data.submission_deadline:
        raise UserError("Submission deadline has passed")

    # Has this person already submitted?
    sender = gl.message.sender_address

    # We use a "composite key" to track submissions
    # Format: "round_id:wallet_address"
    # Example: "round_1:0x742d35Cc..."
    caption_key = f"{round_id}:{str(sender)}"

    if caption_key in self.round_captions:
        raise UserError("You have already submitted a caption")

    # Is the caption valid?
    if len(caption) == 0:
        raise UserError("Caption cannot be empty")
    if len(caption) > 280:
        raise UserError("Caption too long (max 280 characters)")

    # ===== STORE THE CAPTION =====

    new_caption = Caption(
        author=sender,
        text=caption,
        submitted_at=current_time
    )

    self.round_captions[caption_key] = new_caption

    # ===== TRACK THE PARTICIPANT =====

    # We need to know all participants later (for AI evaluation)
    # Since we can't iterate over TreeMap keys, we track them separately

    # How many participants so far?
    current_count = self.round_participant_counts.get(round_id, u256(0))

    # Store this participant's address at index [current_count]
    participant_key = f"{round_id}:{int(current_count)}"
    self.round_participant_addresses[participant_key] = sender

    # Increment the count
    self.round_participant_counts[round_id] = current_count + u256(1)
```

#### Why Composite Keys?

Here's a gotcha: GenLayer doesn't support nested mappings. You **can't** do this:

```python
# THIS DOESN'T WORK
captions: TreeMap[str, TreeMap[Address, Caption]]  # ❌ Not supported
```

The workaround is **composite keys** — combining multiple values into one string:

```python
# THIS WORKS
captions: TreeMap[str, Caption]  # ✅ Flat mapping

# Key format: "round_id:address"
key = f"{round_id}:{str(sender)}"
self.captions[key] = caption
```

It's like naming files: instead of nested folders `rounds/round_1/captions/alice.txt`, you use `round_1_alice.txt`.

---

## Part 4: The AI Resolution (The Exciting Part!)

This is where GenLayer's magic happens. When it's time to pick winners, we ask an AI to judge the captions.

### Building the AI Prompt

First, we need to tell the AI what to do. This is called a **prompt**:

```python
def _build_evaluation_prompt(self, image_url: str, category: str,
                              captions: list) -> str:
    """
    Creates the instructions we'll send to the AI.

    A good prompt is:
    - Clear and specific
    - Includes all necessary context
    - Specifies the exact output format we expect
    """

    # Different categories need different judging criteria
    criteria_map = {
        "Funniest": """
- Humor and comedic value
- Clever wordplay or puns
- Unexpected or surprising elements
- How hard it would make someone laugh""",

        "Most Accurate": """
- Literal accuracy to what's shown in the image
- Descriptive precision
- Truthfulness to the scene"""
    }

    criteria = criteria_map.get(category, criteria_map["Funniest"])

    # Format captions with letter IDs (A, B, C...)
    # We use letters instead of addresses for anonymity
    captions_text = "\n".join([
        f'Caption {caption_id}: "{text}"'
        for caption_id, text in captions
    ])

    # Build the full prompt
    prompt = f"""You are a judge for a caption contest.
Your task is to select the TOP 2 captions for the "{category}" category.

IMAGE: {image_url}

CAPTIONS TO EVALUATE:
{captions_text}

JUDGING CRITERIA FOR "{category.upper()}":
{criteria}

INSTRUCTIONS:
1. Look at the image
2. Read all captions
3. Evaluate each caption against the criteria
4. Select the BEST caption as Winner
5. Select the SECOND BEST caption as Runner-up

RESPOND IN THIS EXACT JSON FORMAT:
{{"winner": "<caption_id>", "runner_up": "<caption_id>"}}

Example response: {{"winner": "B", "runner_up": "A"}}

IMPORTANT: Return ONLY the JSON object, no other text."""

    return prompt
```

#### Why JSON Output?

We need the AI's response in a format our code can understand. JSON (JavaScript Object Notation) is perfect:

```json
{"winner": "B", "runner_up": "A"}
```

We can parse this in Python:

```python
result = json.loads('{"winner": "B", "runner_up": "A"}')
print(result["winner"])    # "B"
print(result["runner_up"]) # "A"
```

### Calling the AI with Consensus

Now the key part — calling the AI in a way that multiple validators can agree on:

```python
@gl.public.write
def resolve_round(self, round_id: str):
    """
    Trigger AI resolution to determine winners.

    This is where the magic happens:
    1. We gather all captions
    2. We ask AI to judge them
    3. Multiple validators run the AI independently
    4. They reach consensus on the winner
    """

    # ... validation code (checking round exists, etc.) ...

    # ===== GATHER CAPTIONS =====

    participant_count = int(self.round_participant_counts.get(round_id, u256(0)))

    if participant_count < 2:
        raise UserError("Need at least 2 participants")

    captions_for_eval = []
    id_to_address = {}  # Maps "A" -> actual address, "B" -> actual address, etc.

    for i in range(participant_count):
        # Get participant address
        participant_key = f"{round_id}:{i}"
        addr = self.round_participant_addresses[participant_key]

        # Assign letter ID (A, B, C, ...)
        caption_id = chr(65 + i)  # 65 is ASCII for 'A'

        # Get their caption text
        caption_key = f"{round_id}:{str(addr)}"
        caption_text = self.round_captions[caption_key].text

        # Store for evaluation
        captions_for_eval.append((caption_id, caption_text))
        id_to_address[caption_id] = addr

    # ===== BUILD THE PROMPT =====

    round_data = self.rounds[round_id]
    prompt = self._build_evaluation_prompt(
        round_data.image_url,
        round_data.category,
        captions_for_eval
    )

    # ===== CALL AI WITH CONSENSUS =====

    # Step 1: Define a function that calls the AI
    def evaluate_captions() -> str:
        result = gl.nondet.exec_prompt(prompt)
        return result.strip()

    # Step 2: Define what makes a valid response
    validation_criteria = f"""
The AI response must:
1. Be valid JSON with "winner" and "runner_up" keys
2. Contain valid caption IDs ({', '.join([c[0] for c in captions_for_eval])})
3. Have different values for winner and runner_up
4. Select captions that reasonably fit the "{round_data.category}" category
"""

    # Step 3: Run with equivalence principle
    result_json = gl.eq_principle.prompt_non_comparative(
        evaluate_captions,
        task=f"Select top 2 captions for {round_data.category} category",
        criteria=validation_criteria
    )
```

#### Breaking Down the AI Call

Let's understand each piece:

**`gl.nondet.exec_prompt(prompt)`**

This calls the AI with your prompt. `nondet` means "non-deterministic" — the AI might give slightly different answers each time.

```python
result = gl.nondet.exec_prompt("What is 2+2?")
# result might be "4" or "The answer is 4" or "2+2=4"
```

**`gl.eq_principle.prompt_non_comparative(...)`**

This wraps the AI call in consensus logic. Here's what happens:

1. Multiple validators each run `evaluate_captions()` independently
2. Each gets an AI response
3. They check if responses are "equivalent" based on `validation_criteria`
4. If validators agree, the result is accepted
5. If they disagree, they resolve the conflict

Think of it like this:

```
Validator 1 asks AI → gets {"winner": "B", "runner_up": "A"}
Validator 2 asks AI → gets {"winner": "B", "runner_up": "A"}
Validator 3 asks AI → gets {"winner": "B", "runner_up": "C"}

Consensus: 2 out of 3 agree on winner "B", so "B" wins
```

### Parsing the AI Response

AI responses can be messy. We need to handle edge cases:

```python
# ===== PARSE THE RESULT =====

# Check if we got anything
if not result_json or result_json.strip() == "":
    raise UserError("AI returned empty response")

# Clean up the response
json_str = result_json.strip()

# Sometimes AI adds extra text like "Here's the result: {...}"
# We need to extract just the JSON part
if not json_str.startswith("{"):
    # Find where the JSON object starts and ends
    start = json_str.find("{")
    end = json_str.rfind("}") + 1

    if start != -1 and end > start:
        json_str = json_str[start:end]
    else:
        raise UserError(f"AI response not valid JSON: {result_json[:100]}")

# Parse the JSON
try:
    result = json.loads(json_str)
except json.JSONDecodeError as e:
    raise UserError(f"Failed to parse AI response: {str(e)}")

# Validate the structure
if "winner" not in result or "runner_up" not in result:
    raise UserError("AI response missing winner or runner_up")

# Get the winner and runner-up IDs
winner_id = result["winner"]      # e.g., "B"
runner_up_id = result["runner_up"]  # e.g., "A"

# Convert IDs back to addresses
winner_addr = id_to_address[winner_id]
runner_up_addr = id_to_address[runner_up_id]
```

### Distributing Rewards

Finally, we give out XP points:

```python
# ===== DISTRIBUTE XP =====

# Constants
XP_WINNER = 15
XP_RUNNER_UP = 8
XP_PARTICIPATION = 3

# Everyone who participated gets 3 XP
for addr in participants:
    self._award_xp(addr, XP_PARTICIPATION)

# Winner gets bonus (15 - 3 = 12 additional)
self._award_xp(winner_addr, XP_WINNER - XP_PARTICIPATION)

# Runner-up gets bonus (8 - 3 = 5 additional)
self._award_xp(runner_up_addr, XP_RUNNER_UP - XP_PARTICIPATION)

# ===== STORE THE RESULT =====

round_result = RoundResult(
    winner=winner_addr,
    runner_up=runner_up_addr,
    winner_caption=self.round_captions[f"{round_id}:{str(winner_addr)}"].text,
    runner_up_caption=self.round_captions[f"{round_id}:{str(runner_up_addr)}"].text,
    resolved_at=u256(get_current_timestamp()),
    solo_score=u256(0)
)
self.round_results[round_id] = round_result

# Mark round as resolved
round_data.resolved = True
self.rounds[round_id] = round_data
```

The helper function `_award_xp`:

```python
def _award_xp(self, player: Address, amount: int) -> None:
    """
    Award XP to a player.

    If this is their first time earning XP, add them to the player list.
    """
    # Check if player is new
    if player not in self.xp_scores:
        self.xp_scores[player] = u256(0)
        self.player_list.append(player)  # Track for leaderboard

    # Add XP
    current_xp = self.xp_scores[player]
    self.xp_scores[player] = current_xp + u256(amount)
```

---

## Part 5: Reading Data (View Methods)

Users need to see game state — rounds, captions, leaderboards. These are "view" methods that don't change storage:

### Getting Round Details

```python
@gl.public.view  # Read-only, no gas cost
def get_round(self, round_id: str) -> dict:
    """
    Get all details about a round.

    Note: Captions are HIDDEN until the deadline passes.
    This prevents players from copying each other!
    """

    # Check if round exists
    if round_id not in self.rounds:
        raise UserError("Round not found")

    round_data = self.rounds[round_id]
    current_time = u256(get_current_timestamp())

    # Should we show captions?
    # Only reveal after deadline OR if already resolved
    captions_visible = (
        current_time > round_data.submission_deadline or
        round_data.resolved
    )

    # Build captions list
    captions_response = []
    participant_count = int(self.round_participant_counts.get(round_id, u256(0)))

    for i in range(participant_count):
        participant_key = f"{round_id}:{i}"
        addr = self.round_participant_addresses[participant_key]
        caption_key = f"{round_id}:{str(addr)}"
        caption = self.round_captions[caption_key]

        captions_response.append({
            "author": str(addr),
            # Show actual text OR hide it
            "text": caption.text if captions_visible else "[Hidden]",
            "submitted_at": int(caption.submitted_at)
        })

    # Return everything as a dictionary
    return {
        "round_id": round_data.round_id,
        "image_url": round_data.image_url,
        "category": round_data.category,
        "creator": str(round_data.creator),
        "created_at": int(round_data.created_at),
        "submission_deadline": int(round_data.submission_deadline),
        "resolved": round_data.resolved,
        "captions": captions_response,
        "participant_count": len(captions_response)
    }
```

#### Why Convert to `int` and `str`?

When returning data, we convert GenLayer types to Python natives:

```python
"created_at": int(round_data.created_at)  # u256 → int
"creator": str(round_data.creator)         # Address → str
```

This makes the data easier to work with in frontends (JavaScript, etc.).

### The Leaderboard

```python
@gl.public.view
def get_leaderboard(self) -> list:
    """
    Get the global XP leaderboard, sorted highest first.

    Returns a list like:
    [
        {"address": "0x123...", "xp": 150},
        {"address": "0x456...", "xp": 75},
        {"address": "0x789...", "xp": 30}
    ]
    """

    # Build list of all players and their XP
    scores = []

    for addr in self.player_list:
        xp = int(self.xp_scores.get(addr, u256(0)))
        scores.append({
            "address": str(addr),
            "xp": xp
        })

    # Sort by XP, highest first
    # (Using bubble sort for simplicity — fine for small lists)
    n = len(scores)
    for i in range(n):
        for j in range(i + 1, n):
            if scores[j]["xp"] > scores[i]["xp"]:
                # Swap
                scores[i], scores[j] = scores[j], scores[i]

    return scores
```

---

## Part 6: Handling Time

Blockchain contracts need to know the current time. GenLayer provides this through `gl.message_raw`:

```python
def get_current_timestamp() -> int:
    """
    Get the current time as a Unix timestamp.

    Unix timestamp = seconds since January 1, 1970
    Example: 1704067200 = January 1, 2024 at midnight
    """

    # GenLayer gives us the datetime as a string
    dt_str: str = gl.message_raw["datetime"]
    # Example: "2026-01-11T10:54:11.538326+00:00"

    # Parse it (simplified version)
    date_part, time_part = dt_str.split("T")
    year = int(date_part[0:4])
    month = int(date_part[5:7])
    day = int(date_part[8:10])

    # ... more parsing logic ...

    # Convert to Unix timestamp
    return calculated_timestamp
```

We use timestamps to:
- Record when rounds are created
- Enforce submission deadlines
- Track when winners are determined

---

## Part 7: Common Patterns and Best Practices

### 1. Always Validate Input First

Never trust user input. Check everything before making changes:

```python
@gl.public.write
def submit_caption(self, round_id: str, caption: str):
    # Validate FIRST, before any storage changes
    if round_id not in self.rounds:
        raise UserError("Round not found")

    if len(caption) == 0:
        raise UserError("Caption cannot be empty")

    if len(caption) > 280:
        raise UserError("Caption too long")

    # Now it's safe to proceed...
```

### 2. Use Descriptive Error Messages

Help users understand what went wrong:

```python
# Bad
raise UserError("Error")

# Good
raise UserError("Submission deadline has passed. The round closed 5 minutes ago.")
```

### 3. Design Prompts for Reliability

AI can be unpredictable. Make your prompts very specific:

```python
# Bad - Too vague
prompt = "Pick the best caption"

# Good - Specific format, clear instructions
prompt = """
Select the top 2 captions for the "Funniest" category.

RESPOND IN THIS EXACT JSON FORMAT:
{"winner": "<id>", "runner_up": "<id>"}

IMPORTANT: Return ONLY the JSON, no other text.
"""
```

### 4. Handle AI Response Edge Cases

AI might return unexpected formats:

```python
# AI might say: "Here's my answer: {"winner": "A", "runner_up": "B"}"
# We need to extract just the JSON part

json_str = result.strip()
if not json_str.startswith("{"):
    start = json_str.find("{")
    end = json_str.rfind("}") + 1
    if start != -1 and end > start:
        json_str = json_str[start:end]
```

### 5. Keep Storage Flat

Remember: no nested mappings. Use composite keys:

```python
# Instead of: rounds[round_id].captions[address]
# Use: round_captions[f"{round_id}:{address}"]
```

---

## Putting It All Together

Here's the complete flow of our game:

```
1. HOST CREATES ROUND
   └── create_round("round_1", "https://...", "Funniest")
       └── Stores: Round object with 5-minute deadline

2. PLAYERS SUBMIT CAPTIONS (within 5 minutes)
   └── submit_caption("round_1", "When you realize it's Monday")
       └── Stores: Caption + tracks participant

3. DEADLINE PASSES
   └── Captions become visible in get_round()

4. ANYONE TRIGGERS RESOLUTION
   └── resolve_round("round_1")
       ├── Gathers all captions
       ├── Builds AI prompt
       ├── Calls AI with consensus
       ├── Parses winner + runner-up
       ├── Distributes XP
       └── Stores results

5. ANYONE CAN VIEW RESULTS
   └── get_round("round_1") → shows winners
   └── get_leaderboard() → global rankings
```

---

## What's Next?

You've just learned how to build an Intelligent Contract that:

- Manages game state on the blockchain
- Enforces rules (deadlines, one submission per player)
- Uses AI for subjective judging
- Reaches decentralized consensus on AI outputs
- Tracks scores on a persistent leaderboard

This opens up endless possibilities:
- **AI-judged art contests**
- **Decentralized essay competitions**
- **Prediction markets with AI resolution**
- **Content moderation DAOs**

The key insight: GenLayer lets you build apps where AI makes decisions, but no single party controls that AI.

---

## Resources

- [GenLayer Documentation](https://docs.genlayer.com) — Official docs
- [GenLayer Studio](https://studio.genlayer.com) — Test contracts in your browser

---

*Questions? Comments? Drop them below! I'd love to hear what you build with GenLayer.*
