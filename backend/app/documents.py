"""Pure helpers for the documents API (no I/O), in the style of form_merge."""

from __future__ import annotations

from app.registry.models import DocumentDefinition


def derive_title(definition: DocumentDefinition, form: dict[str, str]) -> str:
    """Human-readable list title, derived (never stored) so it can't drift
    from the form: "<Document Title> — <Party 1> / <Party 2>", degrading to
    just the document title while parties are unknown."""
    names = []
    for role in definition.roles:
        name = (form.get(f"{role.id}.company") or form.get(f"{role.id}.name") or "").strip()
        if name:
            names.append(name)
    return f"{definition.title} — {' / '.join(names)}" if names else definition.title
