from pydantic import BaseModel, Field
from datetime import date

class DutyDrawbackClaim(BaseModel):
    claimID: int
    importerName: str
    HTSCode: str
    importDate: date
    importQuantity: int
    dutiesPaid: float
    drawbackClaimed: float
