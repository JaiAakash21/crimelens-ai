import time
from collections import defaultdict
from threading import Lock


_window: dict[str, list[float]] = defaultdict(list)
_lock = Lock()


def check_rate_limit(
    key: str,
    requests: int = 10,
    window_seconds: int = 60,
) -> tuple[bool, int]:
    now = time.time()
    cutoff = now - window_seconds

    with _lock:
        timestamps = _window[key]
        timestamps[:] = [t for t in timestamps if t > cutoff]

        if len(timestamps) >= requests:
            retry_after = int(timestamps[0] + window_seconds - now) + 1
            return False, retry_after

        timestamps.append(now)
        return True, 0
