from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Enum as SAEnum
from sqlalchemy.orm import relationship

try:
    from backend.database import Base
except ModuleNotFoundError:
    from database import Base

# Existing models remain unchanged above this comment

# ----------------------------------------------------
# SMS Fallback Model
# ----------------------------------------------------
from enum import Enum as PyEnum

class SMSStatus(PyEnum):
    RECEIVED = "RECEIVED"
    PROCESSED = "PROCESSED"
    FAILED = "FAILED"

class SMSFallback(Base):
    """SMS fallback messages stored when primary provider fails."""
    __tablename__ = "sms_fallbacks"

    id = Column(Integer, primary_key=True, index=True)
    sender = Column(String(100), nullable=False)
    message = Column(String, nullable=False)
    received_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    status = Column(SAEnum(SMSStatus), default=SMSStatus.RECEIVED, nullable=False)

# Existing models continue below
