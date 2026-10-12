"""Safe SQLite column-addition migrations for PRISM-PY.

SQLite does not support ALTER TABLE DROP COLUMN or type changes,
but it does support ADD COLUMN. This module runs idempotent
ADD COLUMN statements at startup to extend existing tables
without re-creating them.
"""

from __future__ import annotations

import logging
from sqlalchemy import text
from sqlalchemy.engine import Engine

logger = logging.getLogger("prism.migrations")


def _col_exists(engine: Engine, table: str, column: str) -> bool:
    with engine.connect() as conn:
        result = conn.execute(text(f"PRAGMA table_info({table})"))
        return any(row[1] == column for row in result.fetchall())


def _add_col(engine: Engine, table: str, column: str, col_type: str, default: str | None = None) -> None:
    if _col_exists(engine, table, column):
        return
    ddl = f"ALTER TABLE {table} ADD COLUMN {column} {col_type}"
    if default is not None:
        ddl += f" DEFAULT {default}"
    with engine.begin() as conn:
        conn.execute(text(ddl))
    logger.info("Migration: added %s.%s", table, column)


def run_migrations(engine: Engine) -> None:
    """Idempotent migrations — safe to run on every startup."""

    # HistoricalTender — provenance / staleness fields
    _add_col(engine, "historical_tenders", "source_url",         "TEXT")
    _add_col(engine, "historical_tenders", "source_document",    "TEXT")
    _add_col(engine, "historical_tenders", "authority",          "TEXT")
    _add_col(engine, "historical_tenders", "ingested_at",        "TEXT")
    _add_col(engine, "historical_tenders", "last_verified_date", "TEXT")
    _add_col(engine, "historical_tenders", "valid_from",         "TEXT")
    _add_col(engine, "historical_tenders", "valid_to",           "TEXT")
    _add_col(engine, "historical_tenders", "is_current",         "INTEGER", "0")
    # 0 = historical/stale, 1 = current (verified this period)

    # PolicyRecord — provenance / versioning fields
    _add_col(engine, "policy_records", "source_url",          "TEXT")
    _add_col(engine, "policy_records", "issued_date",         "TEXT")
    _add_col(engine, "policy_records", "effective_from",      "TEXT")
    _add_col(engine, "policy_records", "effective_to",        "TEXT")
    _add_col(engine, "policy_records", "version",             "TEXT")
    _add_col(engine, "policy_records", "last_verified_date",  "TEXT")
    _add_col(engine, "policy_records", "supersedes_id",       "TEXT")

    # Proposals — financial approval routing fields
    _add_col(engine, "proposals", "approval_level",          "TEXT")
    # UNIT_LEVEL | DGP_LEVEL | DEPARTMENT_LEVEL | GOVERNMENT_LEVEL
    _add_col(engine, "proposals", "required_role",           "TEXT")
    _add_col(engine, "proposals", "government_approval_ref", "TEXT")
    _add_col(engine, "proposals", "government_approved_by",  "TEXT")
    _add_col(engine, "proposals", "government_approved_at",  "TEXT")

    # ImplementationRecord — link to PurchaseOrder
    _add_col(engine, "implementation_records", "purchase_order_id", "TEXT")
    _add_col(engine, "implementation_records", "vendor_reference",  "TEXT")

    logger.info("All migrations applied.")
