from pydantic import BaseModel, Field, validator
from typing import Optional, List
from datetime import datetime
import re

class Nota(BaseModel):
    valor: float
    descricao: Optional[str] = None

class Disciplina(BaseModel):
    user_id: str
    nome: str
    semestre: Optional[str] = None  
    data_criacao: datetime = Field(default_factory=datetime.utcnow)
    notas: List[Nota] = Field(default_factory=list)

    @validator('semestre')
    def validar_semestre(cls, v):
        if v is None:
            return v
        if not re.match(r'^\d{4}/[1-2]$', v):
            raise ValueError('O campo "semestre" deve estar no formato aaaa/p, onde p é 1 ou 2.')
        return v
