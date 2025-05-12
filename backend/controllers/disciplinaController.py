from fastapi import HTTPException
from models.disciplina import Disciplina
from database import get_db
from bson import ObjectId

# Função para adicionar uma disciplina
async def adicionar_disciplina(disciplina: Disciplina):
    db = get_db()
    if db is None:
        raise HTTPException(status_code=500, detail="Erro ao conectar com o banco de dados.")

    disciplinas_collection = db['disciplinas']

    resultado = await disciplinas_collection.insert_one(disciplina.dict())
    return {"id": str(resultado.inserted_id)}

# Função para remover uma disciplina
async def remover_disciplina(disciplina_id: str):
    db = get_db()
    if db is None:
        raise HTTPException(status_code=500, detail="Erro ao conectar com o banco de dados.")

    disciplinas_collection = db['disciplinas']

    resultado = await disciplinas_collection.delete_one({"_id": ObjectId(disciplina_id)})

    if resultado.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Disciplina não encontrada.")

    return {"msg": "Disciplina removida com sucesso."}

from bson import ObjectId

async def atualizar_disciplina(disciplina_id: str, dados_atualizados: dict):
    db = get_db()
    if db is None:
        raise HTTPException(status_code=500, detail="Erro ao conectar com o banco de dados.")

    disciplinas_collection = db['disciplinas']
    resultado = await disciplinas_collection.update_one(
        {"_id": ObjectId(disciplina_id)},
        {"$set": dados_atualizados}
    )

    if resultado.matched_count == 0:
        raise HTTPException(status_code=404, detail="Disciplina não encontrada.")

    return {"msg": "Disciplina atualizada com sucesso."}

# Função para listar disciplinas de um usuário
async def listar_disciplinas_por_usuario(user_id: str):
    db = get_db()
    if db is None:
        raise HTTPException(status_code=500, detail="Erro ao conectar com o banco de dados.")

    disciplinas_collection = db['disciplinas']

    disciplinas_cursor = disciplinas_collection.find({"user_id": user_id})
    disciplinas = await disciplinas_cursor.to_list(length=None)

    for d in disciplinas:
        d["_id"] = str(d["_id"])  # Converter ObjectId para string

    return disciplinas