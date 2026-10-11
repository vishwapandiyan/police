"""Bearer-token gate. Token comes from API_BEARER_TOKEN, not from source comments."""

from __future__ import annotations

from fastapi import Header, HTTPException, status

from .settings import get_settings


def require_bearer(authorization: str | None = Header(default=None)) -> str:
    settings = get_settings()
    expected = (settings.api_bearer_token or "").strip()
    if not expected:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="API_BEARER_TOKEN is not configured",
        )
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing Bearer token")
    token = authorization.replace("Bearer ", "", 1).strip()
    if token != expected:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    return token
