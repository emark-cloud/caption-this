# { "Depends": "py-genlayer:test" }
from genlayer import *
from genlayer.gl.vm import UserError
from dataclasses import dataclass
import json

# ============================================================
# HELPERS
# ============================================================
def _is_leap_year(year: int) -> bool:
    return year % 4 == 0 and (year % 100 != 0 or year % 400 == 0)


def _days_in_year(year: int) -> int:
    return 366 if _is_leap_year(year) else 365


def _days_in_month(year: int, month: int) -> int:
    days = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
    if month == 2 and _is_leap_year(year):
        return 29
    return days[month - 1]


def get_current_timestamp() -> int:
    """Get current block timestamp from message_raw datetime string."""
    dt_str: str = gl.message_raw["datetime"]

    # Parse ISO format: 2026-01-11T10:54:11.538326+00:00
    date_part, time_part = dt_str.split("T")
    year, month, day = int(date_part[0:4]), int(date_part[5:7]), int(date_part[8:10])

    # Handle timezone in time part
    if "+" in time_part:
        time_only = time_part.split("+")[0]
    elif time_part.endswith("Z"):
        time_only = time_part[:-1]
    else:
        time_only = time_part

    hour = int(time_only[0:2])
    minute = int(time_only[3:5])
    second = int(float(time_only[6:]))

    # Calculate days since epoch (1970-01-01)
    days = 0
    for y in range(1970, year):
        days += _days_in_year(y)
    for m in range(1, month):
        days += _days_in_month(year, m)
    days += day - 1

    # Convert to seconds
    return days * 86400 + hour * 3600 + minute * 60 + second


# ============================================================
# CONSTANTS
# ============================================================
VALID_CATEGORIES = ["Funniest", "Most Accurate", "Most Creative", "Best Meme"]
MAX_CAPTION_LENGTH = 280
DEFAULT_SUBMISSION_DURATION = 180  # 3 minutes in seconds

# XP rewards
XP_WINNER = 15
XP_RUNNER_UP = 8
XP_PARTICIPATION = 3

# ============================================================
# STORAGE DATACLASSES
# ============================================================

@allow_storage
@dataclass
class Caption:
    """Individual caption submission"""
    author: Address
    text: str
    submitted_at: u256


@allow_storage
@dataclass
class RoundResult:
    """Resolution outcome for a round"""
    winner: Address
    runner_up: Address  # Zero address if single player
    winner_caption: str
    runner_up_caption: str  # Empty if single player
    resolved_at: u256
    solo_score: u256  # 1-10 score for single player rounds, 0 otherwise


@allow_storage
@dataclass
class Round:
    """A single game round"""
    round_id: str
    image_url: str
    category: str
    creator: Address
    created_at: u256
    submission_deadline: u256
    resolved: bool


# ============================================================
# CONTRACT
# ============================================================

class CaptionThis(gl.Contract):
    # Storage fields
    rounds: TreeMap[str, Round]
    # Flattened storage using composite keys: "round_id:address" -> Caption
    round_captions: TreeMap[str, Caption]
    # Track which addresses submitted to each round: "round_id:index" -> Address
    round_participant_addresses: TreeMap[str, Address]
    round_participant_counts: TreeMap[str, u256]  # round_id -> count
    round_results: TreeMap[str, RoundResult]      # round_id -> result

    round_counter: u256
    xp_scores: TreeMap[Address, u256]
    player_list: DynArray[Address]

    submission_duration: u256
    xp_winner: u256
    xp_runner_up: u256
    xp_participation: u256

    # Nickname storage
    nicknames: TreeMap[Address, str]

    def __init__(self):
        """Initialize the Caption This contract"""
        self.round_counter = u256(0)
        self.submission_duration = u256(DEFAULT_SUBMISSION_DURATION)
        self.xp_winner = u256(XP_WINNER)
        self.xp_runner_up = u256(XP_RUNNER_UP)
        self.xp_participation = u256(XP_PARTICIPATION)

    # ========== WRITE METHODS ==========

    @gl.public.write
    def create_round(self, round_id: str, image_url: str, category: str):
        """
        Create a new caption round.

        Args:
            round_id: Unique identifier for the round
            image_url: HTTPS URL to the image
            category: One of "Funniest", "Most Accurate", "Most Creative", "Best Meme"
        """
        # Validate round_id doesn't already exist
        if round_id in self.rounds:
            raise UserError("Round ID already exists")

        # Validate HTTPS URL
        if not image_url.startswith("https://"):
            raise UserError("Invalid image URL: must be HTTPS")

        # Validate category
        if category not in VALID_CATEGORIES:
            raise UserError(f"Invalid category: must be one of {', '.join(VALID_CATEGORIES)}")

        # Increment counter for tracking
        self.round_counter = self.round_counter + u256(1)

        # Get current timestamp and calculate deadline
        current_time = u256(get_current_timestamp())
        deadline = current_time + self.submission_duration
        creator_address: Address = gl.message.sender_address

        # Create and store the round
        new_round = Round(
            round_id=round_id,
            image_url=image_url,
            category=category,
            creator=creator_address,
            created_at=current_time,
            submission_deadline=deadline,
            resolved=False
        )
        self.rounds[round_id] = new_round

    @gl.public.write
    def submit_caption(self, round_id: str, caption: str):
        """
        Submit a caption for a round.

        Args:
            round_id: The round to submit to
            caption: The caption text (1-280 characters)
        """
        # Validate round exists
        if round_id not in self.rounds:
            raise UserError("Round not found")

        round_data = self.rounds[round_id]
        current_time = u256(get_current_timestamp())

        # Check deadline not passed
        if current_time > round_data.submission_deadline:
            raise UserError("Submission deadline has passed")

        # Check sender hasn't already submitted using composite key
        sender = gl.message.sender_address
        caption_key = f"{round_id}:{str(sender)}"
        if caption_key in self.round_captions:
            raise UserError("You have already submitted a caption")

        # Validate caption length
        if len(caption) == 0:
            raise UserError("Caption cannot be empty")
        if len(caption) > MAX_CAPTION_LENGTH:
            raise UserError(f"Caption too long: max {MAX_CAPTION_LENGTH} characters")

        # Create caption entry
        new_caption = Caption(
            author=sender,
            text=caption,
            submitted_at=current_time
        )

        # Store caption with composite key
        self.round_captions[caption_key] = new_caption

        # Track participant: get current count, add address, increment count
        current_count = self.round_participant_counts.get(round_id, u256(0))
        participant_key = f"{round_id}:{int(current_count)}"
        self.round_participant_addresses[participant_key] = sender
        self.round_participant_counts[round_id] = current_count + u256(1)

    @gl.public.write
    def set_nickname(self, nickname: str):
        """
        Set a nickname for the sender's address.

        Args:
            nickname: Display name (1-20 characters, alphanumeric and underscores only)
        """
        # Validate nickname length
        if len(nickname) == 0:
            raise UserError("Nickname cannot be empty")
        if len(nickname) > 20:
            raise UserError("Nickname too long: max 20 characters")

        # Validate nickname characters (alphanumeric and underscores)
        for char in nickname:
            if not (char.isalnum() or char == '_'):
                raise UserError("Nickname can only contain letters, numbers, and underscores")

        sender = gl.message.sender_address
        self.nicknames[sender] = nickname

    @gl.public.write
    def cancel_round(self, round_id: str):
        """
        Cancel a round. Only the creator can cancel, and only before resolution.

        Args:
            round_id: The round to cancel
        """
        # Validate round exists
        if round_id not in self.rounds:
            raise UserError("Round not found")

        round_data = self.rounds[round_id]

        # Only creator can cancel
        if gl.message.sender_address != round_data.creator:
            raise UserError("Only the round creator can cancel")

        # Can't cancel if already resolved
        if round_data.resolved:
            raise UserError("Cannot cancel a resolved round")

        # Clean up participant data
        participant_count = int(self.round_participant_counts.get(round_id, u256(0)))
        for i in range(participant_count):
            participant_key = f"{round_id}:{i}"
            addr = self.round_participant_addresses[participant_key]
            caption_key = f"{round_id}:{str(addr)}"
            if caption_key in self.round_captions:
                del self.round_captions[caption_key]
            if participant_key in self.round_participant_addresses:
                del self.round_participant_addresses[participant_key]

        # Clear participant count
        if round_id in self.round_participant_counts:
            del self.round_participant_counts[round_id]

        # Remove round
        del self.rounds[round_id]

    @gl.public.write
    def resolve_round(self, round_id: str):
        """
        Trigger AI resolution to determine winners.

        Args:
            round_id: The round to resolve
        """
        # Validate round exists
        if round_id not in self.rounds:
            raise UserError("Round not found")

        round_data = self.rounds[round_id]

        # Check not already resolved
        if round_data.resolved:
            raise UserError("Round has already been resolved")

        current_time = u256(get_current_timestamp())

        # Check minimum participants
        participant_count = int(self.round_participant_counts.get(round_id, u256(0)))
        if participant_count < 1:
            raise UserError("Cannot resolve: need at least 1 participant")

        # Build participants list from flattened storage
        participants: list[Address] = []
        for i in range(participant_count):
            participant_key = f"{round_id}:{i}"
            participants.append(self.round_participant_addresses[participant_key])

        # Handle single player vs multi-player
        if participant_count == 1:
            # Single player: AI scores the caption 1-10
            solo_addr = participants[0]
            caption_key = f"{round_id}:{str(solo_addr)}"
            caption_text = self.round_captions[caption_key].text

            score_prompt = self._build_solo_score_prompt(
                round_data.image_url,
                round_data.category,
                caption_text
            )

            def evaluate_solo() -> str:
                result = gl.nondet.exec_prompt(score_prompt)
                return result.strip()

            validation_criteria = f"""
The AI response must:
1. Be valid JSON with a "score" key
2. The score must be an integer from 1 to 10
3. The score should reasonably reflect how well the caption fits the "{round_data.category}" category
"""

            result_json = gl.eq_principle.prompt_non_comparative(
                evaluate_solo,
                task=f"Score caption for {round_data.category} category (1-10)",
                criteria=validation_criteria
            )

            # Parse result with error handling
            if not result_json or result_json.strip() == "":
                raise UserError("AI evaluation returned empty response")

            json_str = result_json.strip()
            if not json_str.startswith("{"):
                start = json_str.find("{")
                end = json_str.rfind("}") + 1
                if start != -1 and end > start:
                    json_str = json_str[start:end]
                else:
                    raise UserError(f"AI response not valid JSON: {result_json[:100]}")

            try:
                result = json.loads(json_str)
            except json.JSONDecodeError as e:
                raise UserError(f"Failed to parse AI response: {str(e)}")

            if "score" not in result:
                raise UserError(f"AI response missing score: {json_str[:100]}")

            solo_score = int(result["score"])
            if solo_score < 1 or solo_score > 10:
                solo_score = max(1, min(10, solo_score))  # Clamp to 1-10

            # Award XP based on score (participation + bonus scaled by score)
            self._award_xp(solo_addr, int(self.xp_participation))
            score_bonus = (solo_score * int(self.xp_winner)) // 10
            self._award_xp(solo_addr, score_bonus)

            # Store result
            zero_addr = Address("0x0000000000000000000000000000000000000000")
            round_result = RoundResult(
                winner=solo_addr,
                runner_up=zero_addr,
                winner_caption=caption_text,
                runner_up_caption="",
                resolved_at=current_time,
                solo_score=u256(solo_score)
            )
            self.round_results[round_id] = round_result
        else:
            # Multi-player: Normal winner/runner-up flow
            captions_for_eval = []
            id_to_address = {}

            for i, addr in enumerate(participants):
                caption_id = chr(65 + i)  # A, B, C, ...
                caption_key = f"{round_id}:{str(addr)}"
                caption_text = self.round_captions[caption_key].text
                captions_for_eval.append((caption_id, caption_text))
                id_to_address[caption_id] = addr

            # Build evaluation prompt
            prompt = self._build_evaluation_prompt(
                round_data.image_url,
                round_data.category,
                captions_for_eval
            )

            # Define evaluation function
            def evaluate_captions() -> str:
                result = gl.nondet.exec_prompt(prompt)
                return result.strip()

            # Use non-comparative equivalence for subjective evaluation
            validation_criteria = f"""
The AI response must:
1. Be valid JSON with "winner" and "runner_up" keys
2. Contain valid caption IDs from the provided list ({', '.join([c[0] for c in captions_for_eval])})
3. Have different values for winner and runner_up
4. Select captions that reasonably fit the "{round_data.category}" category criteria

The selection should be reasonable for the "{round_data.category}" category.
"""

            result_json = gl.eq_principle.prompt_non_comparative(
                evaluate_captions,
                task=f"Select top 2 captions for {round_data.category} category",
                criteria=validation_criteria
            )

            # Parse result with error handling
            if not result_json or result_json.strip() == "":
                raise UserError("AI evaluation returned empty response")

            # Try to extract JSON from response (in case there's extra text)
            json_str = result_json.strip()
            if not json_str.startswith("{"):
                # Try to find JSON object in response
                start = json_str.find("{")
                end = json_str.rfind("}") + 1
                if start != -1 and end > start:
                    json_str = json_str[start:end]
                else:
                    raise UserError(f"AI response not valid JSON: {result_json[:100]}")

            try:
                result = json.loads(json_str)
            except json.JSONDecodeError as e:
                raise UserError(f"Failed to parse AI response: {str(e)}")

            if "winner" not in result or "runner_up" not in result:
                raise UserError(f"AI response missing winner/runner_up: {json_str[:100]}")

            winner_id = result["winner"]
            runner_up_id = result["runner_up"]

            if winner_id not in id_to_address:
                raise UserError(f"Invalid winner ID: {winner_id}")
            if runner_up_id not in id_to_address:
                raise UserError(f"Invalid runner_up ID: {runner_up_id}")

            winner_addr = id_to_address[winner_id]
            runner_up_addr = id_to_address[runner_up_id]

            # Distribute XP
            self._distribute_round_xp(round_id, winner_addr, runner_up_addr, participants)

            # Get caption texts using composite keys
            winner_caption_key = f"{round_id}:{str(winner_addr)}"
            runner_up_caption_key = f"{round_id}:{str(runner_up_addr)}"
            winner_caption_text: str = self.round_captions[winner_caption_key].text
            runner_up_caption_text: str = self.round_captions[runner_up_caption_key].text

            # Store result
            round_result = RoundResult(
                winner=winner_addr,
                runner_up=runner_up_addr,
                winner_caption=winner_caption_text,
                runner_up_caption=runner_up_caption_text,
                resolved_at=current_time,
                solo_score=u256(0)
            )
            self.round_results[round_id] = round_result

        # Clean up round data to allow ID reuse (results are kept in round_results)
        # Clear captions
        for i in range(participant_count):
            participant_key = f"{round_id}:{i}"
            addr = self.round_participant_addresses[participant_key]
            caption_key = f"{round_id}:{str(addr)}"
            del self.round_captions[caption_key]
            del self.round_participant_addresses[participant_key]

        # Clear participant count
        del self.round_participant_counts[round_id]

        # Remove round (results remain in round_results for history)
        del self.rounds[round_id]

    # ========== VIEW METHODS ==========

    @gl.public.view
    def get_round(self, round_id: str) -> dict:
        """
        Get round details.
        Captions are hidden until the submission deadline passes.

        Args:
            round_id: The round to retrieve

        Returns:
            Round data with appropriate caption visibility
        """
        if round_id not in self.rounds:
            raise UserError("Round not found")

        round_data = self.rounds[round_id]
        current_time = u256(get_current_timestamp())

        # Determine if captions should be visible
        captions_visible = current_time > round_data.submission_deadline or round_data.resolved

        # Build captions response from flattened storage
        captions_response = []
        participant_count = int(self.round_participant_counts.get(round_id, u256(0)))
        for i in range(participant_count):
            participant_key = f"{round_id}:{i}"
            addr = self.round_participant_addresses[participant_key]
            caption_key = f"{round_id}:{str(addr)}"
            caption = self.round_captions[caption_key]
            captions_response.append({
                "author": str(addr),
                "text": caption.text if captions_visible else "[Hidden]",
                "submitted_at": int(caption.submitted_at)
            })

        # Build result response if resolved
        result_response = None
        if round_data.resolved and round_id in self.round_results:
            result = self.round_results[round_id]
            solo_score = int(result.solo_score)
            is_solo = solo_score > 0
            result_response = {
                "winner": str(result.winner),
                "runner_up": str(result.runner_up) if not is_solo else None,
                "winner_caption": result.winner_caption,
                "runner_up_caption": result.runner_up_caption if not is_solo else None,
                "resolved_at": int(result.resolved_at),
                "solo_score": solo_score if is_solo else None,
                "is_solo_round": is_solo
            }

        return {
            "round_id": round_data.round_id,
            "image_url": round_data.image_url,
            "category": round_data.category,
            "creator": str(round_data.creator),
            "created_at": int(round_data.created_at),
            "submission_deadline": int(round_data.submission_deadline),
            "resolved": round_data.resolved,
            "captions": captions_response,
            "participant_count": len(captions_response),
            "result": result_response
        }

    @gl.public.view
    def get_result(self, round_id: str) -> dict:
        """
        Get results for a resolved round (works even after round data is cleared).

        Args:
            round_id: The round to get results for

        Returns:
            Result data with winner, runner_up, and scores
        """
        if round_id not in self.round_results:
            raise UserError("No results found for this round")

        result = self.round_results[round_id]
        solo_score = int(result.solo_score)
        is_solo = solo_score > 0

        return {
            "round_id": round_id,
            "winner": str(result.winner),
            "runner_up": str(result.runner_up) if not is_solo else None,
            "winner_caption": result.winner_caption,
            "runner_up_caption": result.runner_up_caption if not is_solo else None,
            "resolved_at": int(result.resolved_at),
            "solo_score": solo_score if is_solo else None,
            "is_solo_round": is_solo
        }

    @gl.public.view
    def get_leaderboard(self) -> list:
        """
        Get global XP leaderboard sorted by XP descending.

        Returns:
            List of {address, xp} dictionaries, sorted highest first
        """
        scores = []
        for addr in self.player_list:
            xp = int(self.xp_scores.get(addr, u256(0)))
            scores.append({"address": str(addr), "xp": xp})

        # Sort by XP descending (bubble sort for simplicity)
        n = len(scores)
        for i in range(n):
            for j in range(i + 1, n):
                if scores[j]["xp"] > scores[i]["xp"]:
                    scores[i], scores[j] = scores[j], scores[i]

        return scores

    @gl.public.view
    def get_nickname(self, player: Address) -> str:
        """
        Get nickname for a player address.

        Args:
            player: Address to look up

        Returns:
            Nickname if set, empty string otherwise
        """
        return self.nicknames.get(player, "")

    @gl.public.view
    def get_nicknames(self, addresses: list) -> dict:
        """
        Get nicknames for multiple addresses at once.

        Args:
            addresses: List of addresses to look up

        Returns:
            Dictionary mapping address strings to nicknames
        """
        result = {}
        for addr_str in addresses:
            addr = Address(addr_str)
            nickname = self.nicknames.get(addr, "")
            result[addr_str] = nickname
        return result

    @gl.public.view
    def get_player_xp(self, player: Address) -> int:
        """
        Get XP for a specific player.

        Args:
            player: Address to look up

        Returns:
            XP amount (0 if player has never played)
        """
        return int(self.xp_scores.get(player, u256(0)))

    @gl.public.view
    def get_round_counter(self) -> int:
        """
        Get the current round counter value.

        The next created round will have id: f"round_{counter}"

        Returns:
            Current counter value
        """
        return int(self.round_counter)

    @gl.public.view
    def get_active_rounds(self) -> list:
        """
        Get list of rounds still accepting submissions.

        Returns:
            List of round_ids where deadline has not passed and not resolved
        """
        active = []
        current_time = u256(get_current_timestamp())

        # Iterate through all rounds
        for round_id in self.rounds:
            round_data = self.rounds[round_id]
            if not round_data.resolved and current_time <= round_data.submission_deadline:
                active.append(round_id)

        return active

    # ========== PRIVATE HELPERS ==========

    def _build_solo_score_prompt(self, image_url: str, category: str, caption: str) -> str:
        """Build prompt for scoring a single caption 1-10."""
        criteria_map = {
            "Funniest": "humor, comedic value, clever wordplay, and how hard it would make someone laugh",
            "Most Accurate": "literal accuracy to what's shown, descriptive precision, and truthfulness",
            "Most Creative": "originality, uniqueness, imaginative interpretation, and unconventional perspective",
            "Best Meme": "internet culture relevance, relatability, viral potential, and meme format fit"
        }

        criteria = criteria_map.get(category, criteria_map["Funniest"])

        return f"""You are a judge for a caption contest. Score this single caption on a scale of 1-10 for the "{category}" category.

IMAGE: {image_url}

CAPTION: "{caption}"

SCORING CRITERIA FOR "{category.upper()}":
Evaluate based on: {criteria}

SCORING GUIDE:
- 1-3: Poor - doesn't fit the category well
- 4-5: Below average - somewhat fits but lacks impact
- 6-7: Good - solid entry that fits the category
- 8-9: Excellent - stands out, very fitting for the category
- 10: Perfect - exceptional, couldn't be better for this category

RESPOND IN THIS EXACT JSON FORMAT:
{{"score": <integer 1-10>}}

IMPORTANT: Return ONLY the JSON object, no other text."""

    def _build_evaluation_prompt(self, image_url: str, category: str,
                                  captions: list) -> str:
        """Build the AI evaluation prompt with category-specific criteria."""

        criteria_map = {
            "Funniest": """
- Humor and comedic value
- Clever wordplay or puns
- Unexpected or surprising elements
- Timing and delivery in written form
- How hard it would make someone laugh""",

            "Most Accurate": """
- Literal accuracy to what's shown in the image
- Descriptive precision
- Relevant details captured
- Truthfulness to the scene
- How well it explains what's happening""",

            "Most Creative": """
- Originality and uniqueness
- Imaginative interpretation
- Unconventional perspective
- Artistic or poetic quality
- How different it is from obvious choices""",

            "Best Meme": """
- Internet culture relevance
- Relatability to common experiences
- Viral/shareable potential
- Proper meme format/style
- How well it fits meme conventions"""
        }

        criteria = criteria_map.get(category, criteria_map["Funniest"])

        # Format captions
        captions_text = "\n".join([
            f'Caption {cid}: "{text}"'
            for cid, text in captions
        ])

        prompt = f"""You are a judge for a caption contest. Your task is to select the TOP 2 captions for the "{category}" category.

IMAGE: {image_url}

CAPTIONS TO EVALUATE:
{captions_text}

JUDGING CRITERIA FOR "{category.upper()}":
{criteria}

INSTRUCTIONS:
1. Consider ONLY the "{category}" criteria above
2. Evaluate each caption against these specific criteria
3. Select the BEST caption as Winner
4. Select the SECOND BEST caption as Runner-up
5. Both Winner and Runner-up MUST be different captions

RESPOND IN THIS EXACT JSON FORMAT:
{{"winner": "<caption_id>", "runner_up": "<caption_id>"}}

IMPORTANT:
- Return ONLY the JSON object, no other text
- Use the exact caption IDs provided (e.g., "A", "B", "C")
- Winner and runner_up must be different"""

        return prompt

    def _award_xp(self, player: Address, amount: int) -> None:
        """Award XP to a player, adding them to leaderboard if new."""
        if player not in self.xp_scores:
            self.xp_scores[player] = u256(0)
            self.player_list.append(player)

        self.xp_scores[player] = self.xp_scores[player] + u256(amount)

    def _distribute_round_xp(self, round_id: str, winner: Address, runner_up: Address, participants: list) -> None:
        """Distribute XP after round resolution."""
        # Participation XP for all
        for addr in participants:
            self._award_xp(addr, int(self.xp_participation))

        # Bonus XP for winners (on top of participation)
        winner_bonus = int(self.xp_winner) - int(self.xp_participation)
        runner_up_bonus = int(self.xp_runner_up) - int(self.xp_participation)

        self._award_xp(winner, winner_bonus)
        self._award_xp(runner_up, runner_up_bonus)
