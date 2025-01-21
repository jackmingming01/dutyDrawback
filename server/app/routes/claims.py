from fastapi import APIRouter
from app.models import DutyDrawbackClaim
from app.utils import read_data, write_data

router = APIRouter()

@router.post("/api/claims")
async def create_claim(claim: DutyDrawbackClaim):
    data = read_data()
    data.append(claim.dict())
    write_data(data)
    return {"message": "Claim saved successfully", "claim": claim}

@router.get("/api/claims")
async def get_claims():
    return read_data()
