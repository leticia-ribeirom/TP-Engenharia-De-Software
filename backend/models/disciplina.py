from pydantic import BaseModel, validator
from typing import Optional
from datetime import datetime
import re

class Disciplina(BaseModel):
    user_id: str
    nome: str
    semestre: Optional[str] = None  
    data_criacao: datetime = datetime.utcnow()

    @validator('semestre')
    def validar_semestre(cls, v):
        if v is None:
            return v
        # Verifica se está no formato aaaa/p, onde p é 1 ou 2
        if not re.match(r'^\d{4}/[1-2]$', v):
            raise ValueError('O campo "semestre" deve estar no formato aaaa/p, onde p é 1 ou 2.')
        return v