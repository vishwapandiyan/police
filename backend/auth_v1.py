"""PRISM-PY v1 Authentication and RBAC.

Implements:
- User login/logout with session tokens
- Role-based access control
- Permission checks
- Demo users seeded at startup
"""

from __future__ import annotations

import hashlib
import hmac
import secrets
import uuid
from datetime import datetime, timedelta, timezone
from functools import wraps
from typing import Optional

from fastapi import Depends, Header, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from .database import get_db
from .models_v1 import AuditEvent, Session as UserSession, User
from .settings import get_settings

# ---------------------------------------------------------------------------
# Roles and permissions
# ---------------------------------------------------------------------------

ROLES = {
    "INITIATOR": [
        "proposal:create", "proposal:view", "proposal:edit", "proposal:submit",
        "precedent:view", "policy:view", "procurement:view", "document:upload",
    ],
    "REVIEWER": [
        "proposal:create", "proposal:view", "proposal:edit", "proposal:submit",
        "proposal:return", "precedent:view", "policy:view", "procurement:view",
        "document:upload", "decision:view",
    ],
    "APPROVING_AUTHORITY": [
        "proposal:view", "proposal:approve", "proposal:return", "proposal:reject",
        "precedent:view", "policy:view", "procurement:view", "procurement:create",
        "decision:create", "decision:view",
    ],
    "PROCUREMENT_OFFICER": [
        "proposal:view", "procurement:view", "procurement:create",
        "gem:view", "gem:search", "implementation:view", "implementation:update",
    ],
    "IMPLEMENTATION_OFFICER": [
        "proposal:view", "implementation:view", "implementation:update",
        "outcome:create",
    ],
    "ADMIN": [
        "proposal:create", "proposal:view", "proposal:edit", "proposal:submit",
        "proposal:approve", "proposal:return", "proposal:reject",
        "precedent:view", "policy:view", "procurement:view", "procurement:create",
        "decision:create", "decision:view", "implementation:view", "implementation:update",
        "outcome:create", "audit:view", "admin:manage_users", "admin:manage_roles",
        "document:upload", "gem:view", "gem:search",
    ],
    "AUDITOR": [
        "proposal:view", "precedent:view", "policy:view", "audit:view",
        "decision:view", "implementation:view", "outcome:view",
    ],
}

# ---------------------------------------------------------------------------
# Password hashing (SHA-256 HMAC, suitable for demo)
# ---------------------------------------------------------------------------

def _hash_password(password: str) -> str:
    settings = get_settings()
    secret = (settings.api_bearer_token or "prism-demo-secret").encode()
    return hmac.new(secret, password.encode(), hashlib.sha256).hexdigest()


def verify_password(plain: str, hashed: str) -> bool:
    return hmac.compare_digest(_hash_password(plain), hashed)


# ---------------------------------------------------------------------------
# Session management
# ---------------------------------------------------------------------------

SESSION_TTL_HOURS = 8


def create_session(db: Session, user: User) -> str:
    token = secrets.token_urlsafe(48)
    session = UserSession(
        id=str(uuid.uuid4()),
        user_id=user.id,
        token=token,
        created_at=datetime.now(timezone.utc),
        expires_at=datetime.now(timezone.utc) + timedelta(hours=SESSION_TTL_HOURS),
        is_active=True,
    )
    db.add(session)
    user.last_login = datetime.now(timezone.utc)
    db.flush()
    return token


def invalidate_session(db: Session, token: str) -> None:
    row = db.scalar(select(UserSession).where(UserSession.token == token))
    if row:
        row.is_active = False
        db.flush()


def resolve_session(db: Session, token: str) -> Optional[User]:
    now = datetime.now(timezone.utc)
    row = db.scalar(
        select(UserSession).where(
            UserSession.token == token,
            UserSession.is_active == True,
            UserSession.expires_at > now,
        )
    )
    if not row:
        return None
    return db.get(User, row.user_id)


# ---------------------------------------------------------------------------
# FastAPI dependency
# ---------------------------------------------------------------------------

def get_current_user(
    authorization: Optional[str] = Header(default=None),
    db: Session = Depends(get_db),
) -> User:
    """Extract bearer token and resolve to User. Raises 401 if invalid."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing authentication token")
    token = authorization[7:].strip()

    # Check session token first
    user = resolve_session(db, token)
    if user:
        return user

    # Fallback: check static bearer token (for Streamlit compatibility)
    settings = get_settings()
    if token == (settings.api_bearer_token or "").strip():
        # Return a virtual admin user for the legacy bearer token
        admin = db.scalar(select(User).where(User.username == "admin"))
        if admin:
            return admin

    raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")


def get_current_user_optional(
    authorization: Optional[str] = Header(default=None),
    db: Session = Depends(get_db),
) -> Optional[User]:
    """Like get_current_user but returns None instead of raising."""
    try:
        return get_current_user(authorization=authorization, db=db)
    except HTTPException:
        return None


def require_permission(permission: str):
    """Factory that returns a dependency checking for a specific permission."""
    def _check(user: User = Depends(get_current_user)) -> User:
        perms = ROLES.get(user.role, [])
        if permission not in perms:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Permission '{permission}' required. Your role: {user.role}",
            )
        return user
    return _check


def has_permission(user: User, permission: str) -> bool:
    return permission in ROLES.get(user.role, [])


# ---------------------------------------------------------------------------
# Audit helper
# ---------------------------------------------------------------------------

def audit(
    db: Session,
    action: str,
    actor: Optional[User] = None,
    object_type: Optional[str] = None,
    object_id: Optional[str] = None,
    detail: Optional[str] = None,
    old_value: Optional[dict] = None,
    new_value: Optional[dict] = None,
    result: str = "SUCCESS",
) -> None:
    event = AuditEvent(
        id=str(uuid.uuid4()),
        actor_id=actor.id if actor else None,
        actor_name=actor.display_name if actor else "system",
        action=action,
        object_type=object_type,
        object_id=object_id,
        detail=detail,
        old_value=old_value,
        new_value=new_value,
        result=result,
    )
    db.add(event)
    # Don't flush here — caller controls transaction


# ---------------------------------------------------------------------------
# Demo user seed
# ---------------------------------------------------------------------------

DEMO_USERS = [
    {
        "id": "user-admin-001",
        "username": "admin",
        "display_name": "System Administrator",
        "email": "admin@prism.demo",
        "password": "admin123",
        "role": "ADMIN",
        "department": "Administration",
    },
    {
        "id": "user-sp-001",
        "username": "sp_puducherry",
        "display_name": "SP Puducherry (Demo)",
        "email": "sp@prism.demo",
        "password": "demo123",
        "role": "APPROVING_AUTHORITY",
        "department": "Puducherry District",
    },
    {
        "id": "user-dsp-001",
        "username": "dsp_north",
        "display_name": "DSP North (Demo)",
        "email": "dsp.north@prism.demo",
        "password": "demo123",
        "role": "REVIEWER",
        "department": "North Division",
    },
    {
        "id": "user-si-001",
        "username": "si_central",
        "display_name": "SI Central Station (Demo)",
        "email": "si.central@prism.demo",
        "password": "demo123",
        "role": "INITIATOR",
        "department": "Central Station",
        "unit": "Law & Order",
    },
    {
        "id": "user-proc-001",
        "username": "procurement_officer",
        "display_name": "Procurement Officer (Demo)",
        "email": "proc@prism.demo",
        "password": "demo123",
        "role": "PROCUREMENT_OFFICER",
        "department": "Stores & Finance",
    },
    {
        "id": "user-impl-001",
        "username": "implementation_officer",
        "display_name": "Implementation Officer (Demo)",
        "email": "impl@prism.demo",
        "password": "demo123",
        "role": "IMPLEMENTATION_OFFICER",
        "department": "Technical Wing",
    },
    {
        "id": "user-audit-001",
        "username": "auditor",
        "display_name": "Audit Officer (Demo)",
        "email": "audit@prism.demo",
        "password": "demo123",
        "role": "AUDITOR",
        "department": "Internal Audit",
    },
]


def seed_demo_users(db: Session) -> None:
    """Idempotent seed of demo users."""
    existing = db.scalar(select(User.id).limit(1))
    if existing:
        return
    for u in DEMO_USERS:
        user = User(
            id=u["id"],
            username=u["username"],
            display_name=u["display_name"],
            email=u.get("email"),
            hashed_password=_hash_password(u["password"]),
            role=u["role"],
            department=u.get("department"),
            unit=u.get("unit"),
        )
        db.add(user)
    db.flush()
