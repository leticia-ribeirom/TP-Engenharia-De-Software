from fastapi import APIRouter
from models.grade import Grade
from controllers.gradeController import adicionar_grade, remover_grade

router = APIRouter(
    prefix="/grades",
    tags=["grades"]
)

@router.post("/")
async def criar_grade(grade: Grade):
    return await adicionar_grade(grade)

@router.delete("/{disciplina_id}/nota/{nota_id}")
async def deletar_nota(disciplina_id: str, nota_id: str):
    return await remover_grade(disciplina_id, nota_id)