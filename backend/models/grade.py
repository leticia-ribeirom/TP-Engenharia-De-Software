from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from bson import ObjectId

class Grade(BaseModel):
    id: Optional[str] = Field(default_factory=lambda: str(ObjectId()))  # Gerar id automaticamente
    user_id: str  # O id do usuário
    disciplina_id: str  # O id da disciplina
    valor: float  # Valor da nota
    tipo: str  # Tipo de nota (por exemplo, "Prova", "Trabalho")
    data_adicao: Optional[datetime] = datetime.utcnow()  # Agora é opcional e terá valor padrão

    class Config:
        # Para aceitar dados em formato de string como ObjectId, como é o caso no MongoDB
        json_encoders = {
            ObjectId: str
        }

    # A função para garantir que o id seja tratado corretamente quando convertido para dict
    def dict(self, *args, **kwargs):
        d = super().dict(*args, **kwargs)
        d["id"] = str(d["id"])  # Garantir que o id seja sempre uma string
        return d
    
class GradeUpdate(BaseModel):
    valor: Optional[float]  # Somente campos que podem ser atualizados
    tipo: Optional[str]  # Somente campos que podem ser atualizados