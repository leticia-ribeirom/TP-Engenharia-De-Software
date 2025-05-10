from fastapi import HTTPException
from models.grade import Grade
from database import get_db
from bson import ObjectId

async def adicionar_grade(grade: Grade):
    db = get_db()
    if db is None:
        raise HTTPException(status_code=500, detail="Erro ao conectar com o banco de dados.")

    disciplinas_collection = db['disciplinas']
    disciplina = await disciplinas_collection.find_one({"_id": ObjectId(grade.disciplina_id)})

    if not disciplina:
        raise HTTPException(status_code=404, detail="Disciplina não encontrada.")

    # Adicionar a nota à lista de notas da disciplina
    update_result = await disciplinas_collection.update_one(
        {"_id": ObjectId(grade.disciplina_id)},
        {"$push": {"notas": grade.dict()}}  # Adiciona a nota à lista de notas
    )

    if update_result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Erro ao adicionar a nota na disciplina.")

    return {"msg": "Nota adicionada com sucesso."}

async def remover_grade(disciplina_id: str, nota_id: str):
    db = get_db()
    if db is None:
        raise HTTPException(status_code=500, detail="Erro ao conectar com o banco de dados.")

    disciplinas_collection = db['disciplinas']

    resultado = await disciplinas_collection.update_one(
        {"_id": ObjectId(disciplina_id)},
        {"$pull": {"notas": {"id": nota_id}}}
    )

    if resultado.modified_count == 0:
        raise HTTPException(status_code=404, detail="Nota não encontrada ou já removida.")

    return {"msg": "Nota removida com sucesso."}