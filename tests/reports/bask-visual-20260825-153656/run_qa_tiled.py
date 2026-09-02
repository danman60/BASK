import re
import subprocess
import time
from pathlib import Path

import qa_agent


_original = qa_agent.execute_checklist_item


def _safe_label(description):
    return re.sub(r"[^a-z0-9-]+", "-", description.lower()).strip("-")


def _at_viewport_with_tiles(executor, item, state, provider, model, messages):
    match = re.search(r"at (\d+)px", item.description)
    width = int(match.group(1)) if match else 1280
    viewport_height = 900
    executor.set_viewport(width, viewport_height)
    _original(executor, item, state, provider, model, messages)

    page = executor.page_handle
    page.evaluate("window.scrollTo(0, 0)")
    time.sleep(0.15)
    dimensions = page.evaluate(
        "() => ({height: Math.max(document.body.scrollHeight, document.documentElement.scrollHeight), viewport: window.innerHeight})"
    )
    max_y = max(0, int(dimensions["height"]) - int(dimensions["viewport"]))
    stride = viewport_height - 80
    positions = list(range(0, max_y + 1, stride))
    if not positions or positions[-1] != max_y:
        positions.append(max_y)

    tile_dir = Path(state.report_dir) / "tiles"
    tile_dir.mkdir(exist_ok=True)
    label = _safe_label(item.description)
    for tile_number, y in enumerate(positions):
        page.evaluate("y => window.scrollTo(0, y)", y)
        time.sleep(0.15)
        tile_path = tile_dir / f"step-{int(item.step_id):03d}-{label}-tile-{tile_number:02d}-y{y}.png"
        executor.screenshot(str(tile_path))
        subprocess.run(
            [
                "/home/danman60/tg-dm.sh",
                "--file",
                str(tile_path),
                f"Bask tile {tile_number + 1}/{len(positions)}: {item.description}, y={y}px.",
            ],
            check=False,
        )

    if width == 1440:
        route = item.description.split(" at ", 1)[0]
        subprocess.run(
            [
                "/home/danman60/tg-dm.sh",
                f"Bask route tile capture complete: {route}, all 8 widths, page top through bottom. Pixel review follows.",
            ],
            check=False,
        )


qa_agent.execute_checklist_item = _at_viewport_with_tiles
qa_agent.main()
