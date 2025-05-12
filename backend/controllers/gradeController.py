from fastapi import HTTPException
from models.grade import Grade, GradeUpdate
from database import get_db
from bson import ObjectId

# Função para adicionar nota
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

    return {"msg": "Nota adicionada com sucesso.", "grade_id": str(grade.id)}

# Função para remover nota
async def remover_grade(disciplina_id: str, nota_id: str):
    db = get_db()
    if db is None:
        raise HTTPException(status_code=500, detail="Erro ao conectar com o banco de dados.")

    disciplinas_collection = db['disciplinas']

    resultado = await disciplinas_collection.update_one(
        {"_id": ObjectId(disciplina_id)},
        {"$pull": {"notas": {"id": nota_id}}}  # Remover nota com id correspondente
    )

    if resultado.modified_count == 0:
        raise HTTPException(status_code=404, detail="Nota não encontrada ou já removida.")

    return {"msg": "Nota removida com sucesso."}

# Função para modificar nota
async def modificar_grade(disciplina_id: str, nota_id: str, grade_update: GradeUpdate):
    db = get_db()
    if db is None:
        raise HTTPException(status_code=500, detail="Erro ao conectar com o banco de dados.")

    disciplinas_collection = db['disciplinas']

    # Buscar a disciplina
    disciplina = await disciplinas_collection.find_one({"_id": ObjectId(disciplina_id)})

    if not disciplina:
        raise HTTPException(status_code=404, detail="Disciplina não encontrada.")

    # Verificar se a nota existe
    nota_index = None
    for i, nota in enumerate(disciplina.get("notas", [])):
        if nota["id"] == nota_id:
            nota_index = i
            break

    if nota_index is None:
        raise HTTPException(status_code=404, detail="Nota não encontrada.")

    # Modificar a nota apenas com os campos fornecidos no corpo da requisição
    if grade_update.valor is not None:
        disciplina["notas"][nota_index]["valor"] = grade_update.valor
    if grade_update.tipo is not None:
        disciplina["notas"][nota_index]["tipo"] = grade_update.tipo

    # Atualizar a disciplina com a nota modificada
    resultado = await disciplinas_collection.update_one(
        {"_id": ObjectId(disciplina_id)},
        {"$set": {"notas": disciplina["notas"]}}  # Substitui toda a lista de notas
    )

    if resultado.modified_count == 0:
        raise HTTPException(status_code=404, detail="Erro ao atualizar a nota.")

    return {"msg": "Nota modificada com sucesso."}

# Função para listar as notas de uma disciplina de um usuário
async def listar_notas_por_disciplina(user_id: str, disciplina_id: str):
    db = get_db()
    if db is None:
        raise HTTPException(status_code=500, detail="Erro ao conectar com o banco de dados.")

    disciplinas_collection = db['disciplinas']

    disciplina = await disciplinas_collection.find_one({
        "_id": ObjectId(disciplina_id),
        "user_id": user_id
    })

    if not disciplina:
        raise HTTPException(status_code=404, detail="Disciplina não encontrada.")

    return disciplina.get("notas", [])