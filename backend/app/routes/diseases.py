"""Disease library endpoints — shared agricultural knowledge (not user-scoped)."""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import error_response
from app.models.disease import Disease
from app.schemas.entities import DiseaseRead

router = APIRouter()


@router.get("/diseases", response_model=list[DiseaseRead])
def list_diseases(
    crop: str | None = None,
    search: str | None = None,
    type: str | None = None,
    severity: str | None = None,
    db: Session = Depends(get_db),
):
    query = db.query(Disease)

    if crop:
        query = query.filter(Disease.crop.ilike(f"%{crop}%"))
    if type:
        query = query.filter(Disease.disease_type == type)
    if severity:
        query = query.filter(Disease.severity == severity)
    if search:
        pattern = f"%{search}%"
        query = query.filter(
            Disease.name.ilike(pattern)
            | Disease.crop.ilike(pattern)
            | Disease.description.ilike(pattern)
        )

    diseases = query.order_by(Disease.commonness.desc()).all()
    return [DiseaseRead.from_orm_disease(d) for d in diseases]


@router.get("/diseases/{disease_id}", response_model=DiseaseRead)
def get_disease(
    disease_id: int,
    db: Session = Depends(get_db),
):
    disease = db.query(Disease).filter(Disease.id == disease_id).first()
    if not disease:
        return error_response(404, "not_found", "Disease entry not found")
    return DiseaseRead.from_orm_disease(disease)


@router.get("/diseases/by-slug/{slug}", response_model=DiseaseRead)
def get_disease_by_slug(
    slug: str,
    db: Session = Depends(get_db),
):
    disease = db.query(Disease).filter(Disease.slug == slug).first()
    if not disease:
        return error_response(404, "not_found", "Disease entry not found")
    return DiseaseRead.from_orm_disease(disease)
