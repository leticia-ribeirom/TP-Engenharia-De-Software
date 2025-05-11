# routes/estatisticasRoutes.py
from fastapi import APIRouter
from database import db  # ou a instância da sua conexão MongoDB
from bson import ObjectId

router = APIRouter(prefix="/estatisticas", tags=["estatisticas"])

@router.get("/por-usuario/{user_id}")
async def estatisticas_usuario(user_id: str):
    disciplinas = db["disciplinas"].find({"user_id": user_id})
    resultado = []

    async for disciplina in disciplinas:
        disciplina_id = str(disciplina["_id"])
        notas = await db["grades"].find({"disciplina_id": disciplina_id}).to_list(length=None)

        if notas:
            media = sum(n["valor"] for n in notas) / len(notas)
            resultado.append({
                "disciplina_id": disciplina_id,
                "nome": disciplina["nome"],
                "media": round(media, 2),
                "notas": [{"tipo": n["tipo"], "valor": n["valor"]} for n in notas]
            })

    return resultado
