def paginate(page: int, per_page: int, total: int | None) -> dict:
    safe_total = total or 0
    return {
        "page": page,
        "per_page": per_page,
        "total": safe_total,
        "has_next": page * per_page < safe_total,
    }
