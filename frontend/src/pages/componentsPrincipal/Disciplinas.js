import React, { useEffect, useState } from "react";
import axios from "axios";

const Disciplinas = () => {
  const [disciplinas, setDisciplinas] = useState([]);
  const [novaDisciplina, setNovaDisciplina] = useState({ nome: "", descricao: "" });
  const [novasNotas, setNovasNotas] = useState({});
  const [editandoDisciplina, setEditandoDisciplina] = useState(null); // Nova linha

  const userEmail = "exemplo@email.com"; // Simulação de login

  const buscarDisciplinas = async () => {
    try {
      const response = await axios.get(`http://localhost:8000/disciplinas?user_id=${userEmail}`);
      setDisciplinas(response.data);
    } catch (error) {
      console.error("Erro ao buscar disciplinas:", error);
    }
  };

  const adicionarDisciplina = async () => {
    if (!novaDisciplina.nome.trim()) return;

    try {
      await axios.post("http://localhost:8000/disciplinas", {
        ...novaDisciplina,
        user_id: userEmail,
        data_criacao: new Date().toISOString(),
        notas: [],
      });
      setNovaDisciplina({ nome: "", descricao: "" });
      buscarDisciplinas();
    } catch (error) {
      console.error("Erro ao adicionar disciplina:", error);
    }
  };

  const deletarDisciplina = async (id) => {
    try {
      await axios.delete(`http://localhost:8000/disciplinas/${id}`);
      buscarDisciplinas();
    } catch (error) {
      console.error("Erro ao deletar disciplina:", error);
    }
  };

  const editarDisciplina = (disciplina) => {
    setEditandoDisciplina({ ...disciplina }); // Começa edição
  };

  const salvarEdicaoDisciplina = async () => {
    try {
      await axios.put(`http://localhost:8000/disciplinas/${editandoDisciplina._id}`, {
        nome: editandoDisciplina.nome,
        descricao: editandoDisciplina.descricao,
      });
      setEditandoDisciplina(null);
      buscarDisciplinas();
    } catch (error) {
      console.error("Erro ao salvar disciplina:", error);
    }
  };

  const adicionarNota = async (disciplinaId) => {
    const novaNota = novasNotas[disciplinaId];
    if (!novaNota || !novaNota.valor || !novaNota.tipo) return;

    try {
      await axios.post("http://localhost:8000/grades", {
        user_id: userEmail,
        disciplina_id: disciplinaId,
        valor: parseFloat(novaNota.valor),
        tipo: novaNota.tipo,
      });

      setNovasNotas((prev) => ({ ...prev, [disciplinaId]: { valor: "", tipo: "" } }));
      buscarDisciplinas();
    } catch (error) {
      console.error("Erro ao adicionar nota:", error);
    }
  };

  const deletarNota = async (disciplinaId, notaId) => {
    try {
      await axios.delete(`http://localhost:8000/grades/${disciplinaId}/nota/${notaId}`);
      buscarDisciplinas();
    } catch (error) {
      console.error("Erro ao deletar nota:", error);
      alert("Não foi possível excluir a nota.");
    }
  };

  useEffect(() => {
    buscarDisciplinas();
  }, []);

  return (
    <div style={{ padding: "20px" }}>
      <h2>Minhas Disciplinas</h2>

      <div>
        <input
          type="text"
          placeholder="Nome da disciplina"
          value={novaDisciplina.nome}
          onChange={(e) => setNovaDisciplina({ ...novaDisciplina, nome: e.target.value })}
        />
        <input
          type="text"
          placeholder="Descrição (opcional)"
          value={novaDisciplina.descricao}
          onChange={(e) => setNovaDisciplina({ ...novaDisciplina, descricao: e.target.value })}
        />
        <button onClick={adicionarDisciplina}>Adicionar</button>
      </div>

      <ul>
        {disciplinas.map((disciplina) => (
          <li key={disciplina._id} style={{ marginBottom: "20px" }}>
            {editandoDisciplina?._id === disciplina._id ? (
              <>
                <input
                  type="text"
                  value={editandoDisciplina.nome}
                  onChange={(e) =>
                    setEditandoDisciplina({ ...editandoDisciplina, nome: e.target.value })
                  }
                />
                <input
                  type="text"
                  value={editandoDisciplina.descricao}
                  onChange={(e) =>
                    setEditandoDisciplina({ ...editandoDisciplina, descricao: e.target.value })
                  }
                />
                <button onClick={salvarEdicaoDisciplina}>Salvar</button>
                <button onClick={() => setEditandoDisciplina(null)}>Cancelar</button>
              </>
            ) : (
              <>
                <strong>{disciplina.nome}</strong> — {disciplina.descricao}
                <button onClick={() => editarDisciplina(disciplina)}>✏️ Editar</button>
                <button onClick={() => deletarDisciplina(disciplina._id)}>🗑 Excluir</button>
              </>
            )}

            {/* Lista de notas */}
            <ul>
              {disciplina.notas?.length > 0 ? (
                disciplina.notas.map((nota) => (
                  <li key={nota._id || nota.id}>
                    {nota.tipo || "Sem tipo"} — Nota: {nota.valor}
                    <button onClick={() => deletarNota(disciplina._id, nota._id || nota.id)}>🗑</button>
                  </li>
                ))
              ) : (
                <li>Nenhuma nota ainda.</li>
              )}
            </ul>

            {/* Formulário de nova nota */}
            <div>
              <input
                type="number"
                placeholder="Valor da nota"
                value={novasNotas[disciplina._id]?.valor || ""}
                onChange={(e) =>
                  setNovasNotas((prev) => ({
                    ...prev,
                    [disciplina._id]: {
                      ...prev[disciplina._id],
                      valor: e.target.value,
                    },
                  }))
                }
              />
              <input
                type="text"
                placeholder="Tipo (Ex: Prova, Trabalho)"
                value={novasNotas[disciplina._id]?.tipo || ""}
                onChange={(e) =>
                  setNovasNotas((prev) => ({
                    ...prev,
                    [disciplina._id]: {
                      ...prev[disciplina._id],
                      tipo: e.target.value,
                    },
                  }))
                }
              />
              <button onClick={() => adicionarNota(disciplina._id)}>Adicionar Nota</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Disciplinas;
