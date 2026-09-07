"""Read/create/update schemas mirroring the MVP models (frontend-spec.md §15)."""

import re
from datetime import date, datetime

from pydantic import BaseModel, field_validator

# Supported UI language codes (must stay in sync with frontend LANGUAGES).
_SUPPORTED_LANGUAGES = {"en", "ur", "ur-Latn"}

# Basic email pattern — authoritative verification happens later via OTP.
_EMAIL_RE = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")


class UserRead(BaseModel):
    id: int
    name: str | None = None
    email: str | None = None
    language: str
    district: str | None = None
    preferences: dict | None = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class UserUpdate(BaseModel):
    """Partial update — only supplied fields are applied."""

    name: str | None = None
    email: str | None = None
    language: str | None = None
    district: str | None = None
    preferences: dict | None = None

    @field_validator("name")
    @classmethod
    def _validate_name(cls, v: str | None) -> str | None:
        if v is None:
            return v
        stripped = v.strip()
        if not stripped:
            raise ValueError("name must not be blank")
        if len(stripped) > 120:
            raise ValueError("name must be at most 120 characters")
        return stripped

    @field_validator("email")
    @classmethod
    def _validate_email(cls, v: str | None) -> str | None:
        if v is None:
            return v
        stripped = v.strip()
        if len(stripped) > 255:
            raise ValueError("email must be at most 255 characters")
        if not _EMAIL_RE.match(stripped):
            raise ValueError("email format is invalid")
        return stripped

    @field_validator("language")
    @classmethod
    def _validate_language(cls, v: str | None) -> str | None:
        if v is not None and v not in _SUPPORTED_LANGUAGES:
            raise ValueError(
                f"language must be one of {sorted(_SUPPORTED_LANGUAGES)}"
            )
        return v

    @field_validator("preferences")
    @classmethod
    def _validate_preferences(cls, v: dict | None) -> dict | None:
        # Pydantic already rejects non-dict for `dict` type, but be explicit.
        if v is not None and not isinstance(v, dict):
            raise ValueError("preferences must be a JSON object")
        return v


class FieldCreate(BaseModel):
    name: str
    location: str = ""
    crop: str
    area_ha: float
    sowing_date: date | None = None
    harvest_date: date | None = None
    irrigation_method: str = ""
    notes: str = ""


class FieldRead(FieldCreate):
    id: int
    user_id: int
    status: str
    growth_stage: str
    soil: dict[str, str]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class FieldUpdate(BaseModel):
    name: str | None = None
    location: str | None = None
    crop: str | None = None
    area_ha: float | None = None
    sowing_date: date | None = None
    harvest_date: date | None = None
    irrigation_method: str | None = None
    notes: str | None = None
    status: str | None = None
    growth_stage: str | None = None
    soil: dict[str, str] | None = None


class MessageCreate(BaseModel):
    role: str
    content: str
    sources: list | None = None
    follow_ups: list | None = None


class MessageRead(BaseModel):
    id: str
    role: str
    content: str
    sources: list | None = None
    follow_ups: list | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class ConversationCreate(BaseModel):
    title: str | None = None


class ConversationRead(BaseModel):
    id: str
    title: str | None = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class DiagnosisScanCreate(BaseModel):
    crop: str | None = None
    notes: str | None = None
    language: str = "en"
    status: str = "uncertain"
    disease_id: str | None = None
    disease_name: str | None = None
    confidence: float | None = None
    severity: str | None = None
    symptoms: list | None = None
    treatment_steps: list | None = None
    prevention: list | None = None
    care_tips: list | None = None
    image_url: str | None = None


class DiagnosisScanRead(BaseModel):
    id: str
    status: str
    crop: str | None = None
    notes: str | None = None
    language: str
    disease_id: str | None = None
    disease_name: str | None = None
    confidence: float | None = None
    severity: str | None = None
    symptoms: list | None = None
    treatment_steps: list | None = None
    prevention: list | None = None
    care_tips: list | None = None
    image_url: str | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class RecommendationCreate(BaseModel):
    category: str
    priority: str = "medium"
    status: str = "pending"
    title: str
    summary: str | None = None
    details: str | None = None
    crop: str | None = None
    field_name: str | None = None
    recommendation_date: date | None = None
    why: str | None = None
    timing: str | None = None
    notes: str | None = None


class RecommendationUpdate(BaseModel):
    status: str | None = None
    priority: str | None = None


class RecommendationRead(BaseModel):
    id: int
    category: str
    priority: str
    status: str
    title: str
    summary: str | None = None
    details: str | None = None
    crop: str | None = None
    field_name: str | None = None
    recommendation_date: date | None = None
    why: str | None = None
    timing: str | None = None
    notes: str | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class NotificationRead(BaseModel):
    id: int
    type: str
    title: str
    body: str
    read: bool
    deep_link: str | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class ActivityHistoryRead(BaseModel):
    id: int
    event_type: str
    title: str
    description: str | None = None
    full_description: str | None = None
    related_entity_type: str | None = None
    related_entity_id: str | None = None
    field_name: str | None = None
    crop: str | None = None
    status: str
    metadata_json: dict | None = None
    occurred_at: datetime
    created_at: datetime

    model_config = {"from_attributes": True}


class DiseaseRead(BaseModel):
    id: int
    slug: str
    name: str
    crop: str
    type: str
    severity: str
    description: str
    symptoms: list[str]
    causes: list[str]
    prevention: list[str]
    recommended_actions: list[str]
    commonness: int

    model_config = {"from_attributes": True}

    @classmethod
    def _parse_json_field(cls, value: str | list) -> list[str]:
        """Decode a JSON-encoded list field when reading from the ORM."""
        if isinstance(value, list):
            return value
        import json
        try:
            return json.loads(value)
        except (json.JSONDecodeError, TypeError):
            return []

    @classmethod
    def from_orm_disease(cls, disease) -> "DiseaseRead":
        """Build a DiseaseRead from a Disease ORM instance, decoding JSON fields."""
        return cls(
            id=disease.id,
            slug=disease.slug,
            name=disease.name,
            crop=disease.crop,
            type=disease.disease_type,
            severity=disease.severity,
            description=disease.description,
            symptoms=cls._parse_json_field(disease.symptoms),
            causes=cls._parse_json_field(disease.causes),
            prevention=cls._parse_json_field(disease.prevention),
            recommended_actions=cls._parse_json_field(disease.recommended_actions),
            commonness=disease.commonness,
        )
