"""
Police Domain Models

Domain-specific enums and models for Puducherry Police system.
"""

from enum import Enum
from typing import Optional, List
from pydantic import BaseModel, Field


class ProposalDomain(str, Enum):
    """Categories of police proposals"""
    INFRASTRUCTURE = "infrastructure"
    PROCUREMENT = "procurement"
    TECHNOLOGY = "technology"
    TRAINING = "training"
    EQUIPMENT = "equipment"
    VEHICLES = "vehicles"
    COMMUNICATION = "communication"
    SECURITY = "security"
    ADMINISTRATIVE = "administrative"
    OPERATIONAL = "operational"
    WELFARE = "welfare"
    OTHER = "other"


class ProcurementType(str, Enum):
    """Types of procurement processes"""
    TENDER = "tender"
    QUOTATION = "quotation"
    DIRECT_PURCHASE = "direct_purchase"
    EMERGENCY = "emergency"
    RATE_CONTRACT = "rate_contract"
    GEM = "gem"  # Government e-Marketplace
    OTHER = "other"


class DecisionStatus(str, Enum):
    """Status of proposal decisions"""
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    MODIFIED = "modified"
    DEFERRED = "deferred"
    WITHDRAWN = "withdrawn"
    UNKNOWN = "unknown"


class ImplementationStatus(str, Enum):
    """Status of proposal implementation"""
    NOT_STARTED = "not_started"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    DELAYED = "delayed"
    CANCELLED = "cancelled"
    ON_HOLD = "on_hold"
    UNKNOWN = "unknown"


class PoliceStation(BaseModel):
    """Police station information"""
    station_id: Optional[str] = None
    station_name: str
    station_code: Optional[str] = None
    district: Optional[str] = None
    region: Optional[str] = None
    
    class Config:
        use_enum_values = True


class Jurisdiction(BaseModel):
    """Administrative jurisdiction information"""
    jurisdiction_id: Optional[str] = None
    jurisdiction_name: str
    jurisdiction_type: str  # station, region, district, state
    parent_jurisdiction: Optional[str] = None
    neighboring_jurisdictions: List[str] = Field(default_factory=list)
    
    class Config:
        use_enum_values = True


class JurisdictionMatch(BaseModel):
    """Jurisdiction proximity match for precedent ranking"""
    source_jurisdiction: str
    matched_jurisdiction: str
    match_level: str  # same_station, neighboring, same_region, district_wide, state_wide
    proximity_score: float = Field(ge=0.0, le=1.0)
    
    class Config:
        use_enum_values = True
