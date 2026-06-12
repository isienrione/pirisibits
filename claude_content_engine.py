#!/usr/bin/env python3
"""Generate long-form YouTube scripts and short-form trailers via the Anthropic API."""

from __future__ import annotations

import sys
from pathlib import Path

from anthropic import Anthropic, beta_tool
from anthropic.lib.tools import ToolError
from dotenv import load_dotenv

WORKSPACE_ROOT = Path(__file__).resolve().parent
TEMPLATE_PATH = WORKSPACE_ROOT / "master_prompt_template.md"
FEEDBACK_PATH = WORKSPACE_ROOT / "feedback_log.txt"
TOPIC = "How Rome Fed 1 Million People: The Ultimate Supply Chain"
LONG_FORM_PATH = WORKSPACE_ROOT / "projects/rome-supply-chain/scripts/long_form_script.md"
TRAILERS_PATH = WORKSPACE_ROOT / "projects/rome-supply-chain/shorts/trailers.md"
SONNET_MODEL = "claude-3-5-sonnet-20241022"
HAIKU_MODEL = "claude-3-5-haiku-20241022"

SYSTEM_INSTRUCTIONS = """You are the Pirisi-bits Content Production Engine: an elite YouTube documentarian,
scriptwriter, and post-production planner for a highly successful faceless history channel.

Your outputs must be deeply researched, emotionally engaging, and free of generic AI phrasing.
Write in a conversational, suspenseful tone. Avoid textbook jargon. Change visual elements every
3 to 5 seconds in all visual directives. Emphasize massive scale and human coordination.

## Tool execution (required)

You have a `write_file` tool. When asked to deliver a finished document, you MUST call `write_file`
with the complete markdown content. Do not merely describe the file — persist the full artifact to disk.

Only write to paths under `projects/`. Create parent directories automatically when needed.

## Long-form production blueprint (5 sections)

When generating a full video package, structure the markdown exactly as:

1. **SECTION 1: METADATA & PACKAGING** — 3 high-CTR titles (under 65 characters) plus a thumbnail concept.
2. **SECTION 2: THE 8-12 MINUTE CINEMATIC SCRIPT** — ~1,200–1,500 words with:
   - A jarring 30-second hook (no "Welcome back").
   - Chronological or thematic chapters.
   - An interactive safeguard halfway through (mini-quiz, map detail, etc.).
   - Bracketed visual/audio directives before every voiceover paragraph (new visual every 3–5 seconds).
3. **SECTION 3: AI MEDIA GENERATION PROMPTS** — 5 text-to-video prompts for Luma Dream Machine or Runway Gen-3.
4. **SECTION 4: REAL ARCHIVAL MEDIA SOURCING (NON-AI)** — 3–5 public-domain asset types with search terms and databases.
5. **SECTION 5: THE CLIFFHANGER OUTRO** — Bridge the climax into the next logical video topic.

## Short-form trailer rules

When generating trailers from a long-form script, produce exactly 3 distinct short-form trailers.
Each trailer should be 30–60 seconds when read aloud, with:
- A scroll-stopping hook in the first 3 seconds.
- One core tension or revelation from the long-form piece.
- Bracketed visual directives every 3–5 seconds.
- A CTA that teases the full video.

Format trailers in markdown with clear headings: `## Trailer 1`, `## Trailer 2`, `## Trailer 3`.
"""


def cached_system_blocks() -> list[dict]:
    """Return system instructions with Anthropic prompt caching enabled."""
    template = TEMPLATE_PATH.read_text(encoding="utf-8")
    return [
        {
            "type": "text",
            "text": (
                f"{SYSTEM_INSTRUCTIONS}\n\n"
                "## Master prompt template (static reference)\n\n"
                f"{template}"
            ),
            "cache_control": {"type": "ephemeral"},
        }
    ]


def load_production_prompt() -> str:
    """Read template and feedback files, substituting topic and feedback placeholders."""
    template = TEMPLATE_PATH.read_text(encoding="utf-8")
    feedback = FEEDBACK_PATH.read_text(encoding="utf-8").strip()
    return (
        template.replace("{{TOPIC}}", TOPIC).replace("{{FEEDBACK}}", feedback)
    )


def _resolve_allowed_path(path: str) -> Path:
    """Resolve and validate that a write target stays under projects/."""
    candidate = (WORKSPACE_ROOT / path).resolve()
    projects_root = (WORKSPACE_ROOT / "projects").resolve()
    if projects_root not in candidate.parents and candidate != projects_root:
        raise ToolError(f"Path must be under projects/: {path}")
    return candidate


@beta_tool
def write_file(path: str, content: str) -> str:
    """Write markdown content to a file on the local drive.

    Args:
        path: Relative path under projects/, e.g. projects/rome-supply-chain/scripts/long_form_script.md
        content: Full markdown content to persist
    Returns:
        Confirmation message with bytes written and resolved path
    """
    try:
        target = _resolve_allowed_path(path)
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(content, encoding="utf-8")
        return f"Wrote {len(content.encode('utf-8'))} bytes to {target}"
    except ToolError:
        raise
    except Exception as exc:
        raise ToolError(f"Failed to write file: {exc}") from exc


def log_cache_usage(label: str, usage) -> None:
    """Print prompt-cache telemetry from an API response."""
    if usage is None:
        return
    creation = getattr(usage, "cache_creation_input_tokens", 0) or 0
    read = getattr(usage, "cache_read_input_tokens", 0) or 0
    input_tokens = getattr(usage, "input_tokens", 0) or 0
    output_tokens = getattr(usage, "output_tokens", 0) or 0
    print(
        f"[{label}] input={input_tokens} output={output_tokens} "
        f"cache_created={creation} cache_read={read}"
    )


def generate_long_form_script(client: Anthropic, production_prompt: str) -> str:
    """Use Claude 3.5 Sonnet to generate and save the long-form script."""
    relative_path = LONG_FORM_PATH.relative_to(WORKSPACE_ROOT).as_posix()
    user_message = (
        f"{production_prompt}\n\n"
        f"After completing all 5 sections, call `write_file` exactly once with:\n"
        f"- path: `{relative_path}`\n"
        f"- content: the full markdown production blueprint"
    )

    runner = client.beta.messages.tool_runner(
        model=SONNET_MODEL,
        max_tokens=16000,
        system=cached_system_blocks(),
        tools=[write_file],
        tool_choice={"type": "any"},
        messages=[{"role": "user", "content": user_message}],
    )
    final_message = runner.until_done()
    log_cache_usage("Sonnet long-form", final_message.usage)

    if not LONG_FORM_PATH.exists():
        raise RuntimeError(
            f"Long-form script was not written to {LONG_FORM_PATH}. "
            "Claude may have failed to call write_file."
        )

    return LONG_FORM_PATH.read_text(encoding="utf-8")


def generate_trailers(client: Anthropic, long_form_script: str) -> str:
    """Use Claude 3.5 Haiku to generate and save three short-form trailers."""
    relative_path = TRAILERS_PATH.relative_to(WORKSPACE_ROOT).as_posix()
    user_message = (
        "Using the long-form production blueprint below, write exactly 3 short-form YouTube "
        "trailers optimized for vertical Shorts discovery.\n\n"
        f"Save the finished markdown by calling `write_file` with:\n"
        f"- path: `{relative_path}`\n"
        f"- content: all three trailers in one markdown document\n\n"
        "--- LONG-FORM SCRIPT ---\n"
        f"{long_form_script}\n"
        "--- END LONG-FORM SCRIPT ---"
    )

    runner = client.beta.messages.tool_runner(
        model=HAIKU_MODEL,
        max_tokens=8192,
        system=cached_system_blocks(),
        tools=[write_file],
        tool_choice={"type": "any"},
        messages=[{"role": "user", "content": user_message}],
    )
    final_message = runner.until_done()
    log_cache_usage("Haiku trailers", final_message.usage)

    if not TRAILERS_PATH.exists():
        raise RuntimeError(
            f"Trailers were not written to {TRAILERS_PATH}. "
            "Claude may have failed to call write_file."
        )

    return TRAILERS_PATH.read_text(encoding="utf-8")


def main() -> int:
    load_dotenv(WORKSPACE_ROOT / ".env")
    client = Anthropic()

    print(f"Topic: {TOPIC}")
    production_prompt = load_production_prompt()
    print("Generating long-form script with Claude 3.5 Sonnet...")
    long_form_script = generate_long_form_script(client, production_prompt)
    print(f"Saved long-form script to {LONG_FORM_PATH}")

    print("Generating short-form trailers with Claude 3.5 Haiku...")
    trailers = generate_trailers(client, long_form_script)
    print(f"Saved trailers to {TRAILERS_PATH}")
    print(f"Done. Long-form: {len(long_form_script)} chars, trailers: {len(trailers)} chars")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as exc:
        print(f"Error: {exc}", file=sys.stderr)
        raise SystemExit(1) from exc
