from fastapi import APIRouter, HTTPException
from models.disciplina import Disciplina
from fastapi import Body
from controllers.disciplinaController import (
    adicionar_disciplina,
    remover_disciplina,
    atualizar_disciplina,
    listar_disciplinas_por_usuario
)

router = APIRouter(
    prefix="/disciplinas",
    tags=["disciplinas"]
)

# Rota para criar uma disciplina
@router.post("/")
async def criar_disciplina(disciplina: Disciplina):
    return await adicionar_disciplina(disciplina)

# Rota para remover uma disciplina
@router.delete("/{disciplina_id}")
async def deletar_disciplina(disciplina_id: str):
    return await remover_disciplina(disciplina_id)

# Rota para atualizar uma disciplina
@router.put("/{disciplina_id}")
async def editar_disciplina(disciplina_id: str, dados_atualizados: dict = Body(...)):
    return await atualizar_disciplina(disciplina_id, dados_atualizados)

# Rota para listar todas as disciplinas de um usuário
@router.get("/usuario/{user_id}")
async def get_disciplinas_por_usuario(user_id: str):
    return await listar_disciplinas_por_usuario(user_id)