from __future__ import annotations
from dataclasses import dataclass
from datetime import date, timedelta
from pathlib import Path
from typing import Dict, Iterable, List
import matplotlib.pyplot as plt

# -----------------------------
# Inputs
# -----------------------------
ITERATION_NAME = "Iteration 1"
START_DATE = date(2026, 2, 24) # Day 0 of the iteration
ITERATION_TOTAL_DAYS = 14 # Days 0..13
DEVELOPMENT_START_DAY = 7 # Development begins after the March 3 Lab 6 meeting
OUTPUT_FILE = Path(__file__).with_name("ITERATION1_BURNDOWN.md")
PLOT_FILE = Path(__file__).with_name("ITERATION1_BURNDOWN.png")

# Data structure to represent progress on a category/task for a given day.
@dataclass(frozen=True)
class CategoryProgress:
    name: str
    total_days: float
    percent_complete: float # 0..100

# Data used to track burndown progress by day.
# Follow format <day>: [CategoryProgress(<task>, <total_days> (remains static), <percent_complete>), ...]
CATEGORY_PROGRESS_BY_DAY: Dict[int, List[CategoryProgress]] = {
    0: [
        CategoryProgress("Game Mechanics", 14, 0),
        CategoryProgress("Friends List", 4, 0),
    ],
    1: [
        CategoryProgress("Game Mechanics", 14, 0),
        CategoryProgress("Friends List", 4, 0),
    ],
    2: [
        CategoryProgress("Game Mechanics", 14, 0),
        CategoryProgress("Friends List", 4, 0),
    ],
    3: [
        CategoryProgress("Game Mechanics", 14, 0),
        CategoryProgress("Friends List", 4, 0),
    ],
    4: [
        CategoryProgress("Game Mechanics", 14, 0),
        CategoryProgress("Friends List", 4, 0),
    ],
    5: [
        CategoryProgress("Game Mechanics", 14, 0),
        CategoryProgress("Friends List", 4, 0),
    ],
    6: [
        CategoryProgress("Game Mechanics", 14, 0),
        CategoryProgress("Friends List", 4, 0),
    ],
    7: [
        CategoryProgress("Game Mechanics", 14, 0),
        CategoryProgress("Friends List", 4, 0),
    ],
    8: [
        CategoryProgress("Game Mechanics", 14, 0),
        CategoryProgress("Friends List", 4, 10),
    ],
    9: [
        CategoryProgress("Game Mechanics", 14, 20),
        CategoryProgress("Friends List", 4, 25),
    ],
    10: [
        CategoryProgress("Game Mechanics", 14, 45),
        CategoryProgress("Friends List", 4, 50),
    ],
    11: [
        CategoryProgress("Game Mechanics", 14, 30),
        CategoryProgress("Friends List", 4, 100),
    ],
    12: [
        CategoryProgress("Game Mechanics", 14, 50),
        CategoryProgress("Friends List", 4, 100),
    ],
    13: [
        CategoryProgress("Game Mechanics", 14, 100),
        CategoryProgress("Friends List", 4, 100),
    ]
}

# Note labels for the days
NOTES_BY_DAY: Dict[int, str] = {
    0: "Iteration 1 kickoff: define scope, break down tasks, and begin planning",
    1: "Task board finalized: iteration 1 tasks are identified, estimated, and assigned",
    2: "Requirements reviewed and priorities clarified for iteration 1 scope",
    3: "Repository setup completed",
    4: "Burndown tracking prepared and planning materials refined for the customer meeting",
    5: "Final planning pass: board, estimates, assignments, and repo setup ready for review",
    6: "Final pre-meeting polish: running skeleton, board, and burndown ready for customer review",
    7: "Lab 6 customer meeting: present running skeleton, task board, repository setup, and in-progress burndown",
    8: "Post-meeting development begins: start core gameplay implementation",
    9: "Friends list development in progress (add/list/delete + persistence checks)",
    10: "Statistics display wiring and persistence checks in progress",
    11: "Feature integration pass on develop with the repository audit and retrospective draft in progress",
    12: "Prepare Lab 7 assets: UML class diagram, sequence diagram, updated requirement priorities, burndown, and velocity",
    13: "Iteration 1 closeout complete; handoff ready for Iteration 2 starting March 10",
}

# -----------------------------
# Burndown calculation and generation logic
# -----------------------------

def clamp_percent(value: float) -> float:
    return max(0.0, min(100.0, value))

def calculate_remaining_days_from_categories(categories: Iterable[CategoryProgress]) -> float:
    total_remaining = 0.0
    for c in categories:
        p = clamp_percent(c.percent_complete)
        total_remaining += c.total_days * (1.0 - p / 100.0)
    return round(total_remaining, 1)

def ideal_remaining(total_effort: float, iteration_days: int, day: int) -> float:
    if iteration_days <= 1:
        return 0.0

    if day < DEVELOPMENT_START_DAY:
        return round(total_effort, 1)

    burn_days = iteration_days - DEVELOPMENT_START_DAY - 1
    if burn_days <= 0:
        return 0.0

    daily_burn = total_effort / burn_days
    remaining = total_effort - (daily_burn * (day - DEVELOPMENT_START_DAY))
    return round(max(0.0, remaining), 1)

def actual_remaining_for_day(day: int) -> float | None:
    categories = CATEGORY_PROGRESS_BY_DAY.get(day)
    if not categories:
        return None
    return calculate_remaining_days_from_categories(categories)

def compute_total_effort() -> float:
    day0 = CATEGORY_PROGRESS_BY_DAY.get(0)
    if not day0:
        raise ValueError("Day 0 category data is required in CATEGORY_PROGRESS_BY_DAY.")
    return calculate_remaining_days_from_categories(day0)

def generate_markdown() -> str:
    total_effort = compute_total_effort()
    lines: List[str] = []
    ideal_values: List[float] = []
    actual_values: List[float] = []
    date_labels: List[str] = []

    lines.append(f"# {ITERATION_NAME} Burndown")
    lines.append("")
    lines.append(f"Start date: **{START_DATE.isoformat()}**") 
    lines.append("")
    lines.append(f"Iteration 1 length: **{ITERATION_TOTAL_DAYS}d**")
    lines.append("| Effort unit: **developer days**")
    lines.append(f"| Total planned implementation effort: **{total_effort:.0f}d**")
    lines.append("")
    lines.append("| Day | Date | Ideal Remaining | Actual Remaining | Progress / Context |")
    lines.append("|---:|---|---:|---:|---|")

    for day in range(ITERATION_TOTAL_DAYS):
        day_date = START_DATE + timedelta(days=day)
        ideal = ideal_remaining(total_effort, ITERATION_TOTAL_DAYS, day)
        actual = actual_remaining_for_day(day)
        actual_cell = "-" if actual is None else f"{actual:.1f}"
        notes = NOTES_BY_DAY.get(day, "")
        lines.append(f"| {day} | {day_date.isoformat()} | {ideal:.1f} | {actual_cell} | {notes} |")
        ideal_values.append(ideal)
        actual_values.append(float("nan") if actual is None else actual)
        date_labels.append(day_date.strftime("%m-%d"))

    lines.append("")
    generate_plot(date_labels, ideal_values, actual_values)
    lines.append("The formula used to estimate the actual remaining days is `remaining_days = total_days * (1 - percent_complete / 100)`")
    lines.append("## Burndown Plot")
    lines.append("")
    lines.append("![Iteration 1 Burndown](ITERATION1_BURNDOWN.png)")
    
    return "\n".join(lines) + "\n"

def generate_plot(date_labels: List[str], ideal: List[float], actual: List[float]) -> None:
    plt.figure(figsize=(10, 5))
    plt.plot(date_labels, ideal, label="Ideal Remaining", marker="o")
    plt.plot(date_labels, actual, label="Actual Remaining", marker="o")
    plt.title(f"{ITERATION_NAME} Burndown")
    plt.xlabel("Date")
    plt.ylabel("Remaining developer days")
    plt.grid(True, linestyle="--", alpha=0.4)
    plt.legend()
    plt.tight_layout()
    plt.savefig(PLOT_FILE, dpi=140)
    plt.close()

def main() -> None:
    markdown = generate_markdown()
    OUTPUT_FILE.write_text(markdown, encoding="utf-8")
    print(f"Wrote {OUTPUT_FILE}")

if __name__ == "__main__":
    main()
