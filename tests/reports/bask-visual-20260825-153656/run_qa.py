import re
import subprocess
import sys

import qa_agent


_original = qa_agent.execute_checklist_item


def _at_viewport(executor, item, state, provider, model, messages):
    match = re.search(r"at (\d+)px", item.description)
    width = int(match.group(1)) if match else 1280
    executor.set_viewport(width, 900)
    _original(executor, item, state, provider, model, messages)
    if item.screenshot:
        subprocess.run(
            [
                "/home/danman60/tg-dm.sh",
                "--file",
                item.screenshot,
                f"Bask visual sweep capture: {item.description} ({item.status.upper()}).",
            ],
            check=False,
        )
    if width == 1440:
        route = item.description.split(" at ", 1)[0]
        subprocess.run(
            [
                "/home/danman60/tg-dm.sh",
                f"Bask route complete: {route}. Inspected widths queued: 320, 360, 390, 768, 900, 1024, 1280, 1440.",
            ],
            check=False,
        )


qa_agent.execute_checklist_item = _at_viewport
qa_agent.main()
