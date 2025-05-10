from fastapi import APIRouter, HTTPException
from models.disciplina import Disciplina
from controllers.disciplinaController import adicionar_disciplina, remover_disciplina
from database import get_db
from bson import ObjectId

router = APIRouter(
    prefix="/disciplinas",
    tags=["disciplinas"]
)

@router.post("/")
async def criar_disciplina(disciplina: Disciplina):
    return await adicionar_disciplina(disciplina)

@router.delete("/{disciplina_id}")
async def deletar_disciplina(disciplina_id: str):
    return await remover_disciplina(disciplina_id)

# 🚀 NOVA ROTA GET para listar disciplinas do usuário
@router.get("/")
async def listar_disciplinas(user_id: str):
    db = get_db()
    if db is None:
        raise HTTPException(status_code=500, detail="Erro ao conectar com o banco de dados.")

    disciplinas_collection = db['disciplinas']
    disciplinas = await disciplinas_collection.find({"user_id": user_id}).to_list(length=100)

    for disciplina in disciplinas:
        disciplina["_id"] = str(disciplina["_id"])  # Converte o ObjectId para string

    return disciplinas
