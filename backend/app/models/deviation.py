"""
SQLAlchemy model for a Deviation record.
"""
from datetime import datetime

from sqlalchemy import Column, Integer, String, Text, DateTime

from app.database import Base


class Deviation(Base):
    __tablename__ = "deviations"

    id = Column(Integer, primary_key=True, index=True)
    site_plant = Column(String(255), nullable=True)
    date_of_occurrence = Column(String(50), nullable=True)  # kept as string for simplicity
    title = Column(String(255), nullable=True)
    source = Column(String(255), nullable=True)
    related_product = Column(String(255), nullable=True)
    batch_number = Column(String(100), nullable=True)
    detailed_description = Column(Text, nullable=True)
    initial_impact = Column(Text, nullable=True)
    initial_severity = Column(String(20), nullable=True)  # LOW / MEDIUM / HIGH
    created_at = Column(DateTime, default=datetime.utcnow)
