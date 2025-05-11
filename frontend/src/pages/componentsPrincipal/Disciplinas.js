import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function Disciplinas() {
    const [disciplinas, setDisciplinas] = useState([]);
    const [disciplinaSelecionada, setDisciplinaSelecionada] = useState(null);
    const [mostrarModalDisciplina, setMostrarModalDisciplina] = useState(false);
    const [mostrarModalAtividade, setMostrarModalAtividade] = useState(false);

    // Inputs para nova disciplina
    const [novaDisciplinaNome, setNovaDisciplinaNome] = useState("");
    const [novaDisciplinaSemestre, setNovaDisciplinaSemestre] = useState("");

    // Inputs para nova atividade
    const [novaAtividadeNome, setNovaAtividadeNome] = useState("");
    const [novaAtividadeNota, setNovaAtividadeNota] = useState("");

    // States para edição
    const [modoEdicaoDisciplina, setModoEdicaoDisciplina] = useState(false);
    const [disciplinaEdicaoId, setDisciplinaEdicaoId] = useState(null);

    const [modoEdicaoAtividade, setModoEdicaoAtividade] = useState(false);
    const [atividadeEdicaoId, setAtividadeEdicaoId] = useState(null);

    const navigate = useNavigate();

    const userData = JSON.parse(localStorage.getItem('userData'));
    if (!userData || !userData.email) {
        navigate('/login');
        return null;
    }
    const userEmail = userData.email;

    const buscarDisciplinas = async () => {
        try {
            const response = await axios.get(`http://localhost:8000/disciplinas`, {
                params: { user_id: userEmail }
            });
            setDisciplinas(response.data);
        } catch (error) {
            console.error("Erro ao buscar disciplinas:", error);
        }
    };

    useEffect(() => {
        buscarDisciplinas();
    }, []);

    const adicionarDisciplina = async () => {
        if (!novaDisciplinaNome.trim()) return;
        
        try {
            await axios.post("http://localhost:8000/disciplinas", {
                nome: novaDisciplinaNome,
                semestre: novaDisciplinaSemestre,
                user_id: userEmail,
                data_criacao: new Date().toISOString(),
                notas: [],
            });
            setNovaDisciplinaNome("");
            setNovaDisciplinaSemestre("");
            setMostrarModalDisciplina(false);
            buscarDisciplinas();
        } catch (error) {
            console.error("Erro ao adicionar disciplina:", error);
        }
    };

    const editarDisciplina = (disciplina) => {
        setNovaDisciplinaNome(disciplina.nome);
        setNovaDisciplinaSemestre(disciplina.semestre);
        setDisciplinaEdicaoId(disciplina._id);
        setModoEdicaoDisciplina(true);
        setMostrarModalDisciplina(true);
    };

    const salvarEdicaoDisciplina = async () => {
        if (!novaDisciplinaNome.trim()) return;

        try {
            await axios.put(`http://localhost:8000/disciplinas/${disciplinaEdicaoId}`, {
                nome: novaDisciplinaNome,
                semestre: novaDisciplinaSemestre,
            });
            setNovaDisciplinaNome("");
            setNovaDisciplinaSemestre("");
            setMostrarModalDisciplina(false);
            setModoEdicaoDisciplina(false);
            setDisciplinaEdicaoId(null);
            buscarDisciplinas();
        } catch (error) {
            console.error("Erro ao salvar disciplina:", error);
        }
    };

    const removerDisciplina = async (id) => {
        try {
            await axios.delete(`http://localhost:8000/disciplinas/${id}`);
            buscarDisciplinas();
            if (disciplinaSelecionada !== null && disciplinas[disciplinaSelecionada]._id === id) {
                setDisciplinaSelecionada(null);
            }
        } catch (error) {
            console.error("Erro ao deletar disciplina:", error);
        }
    };

    const adicionarAtividade = async () => {
        if (!novaAtividadeNome.trim()) return;

        try {
            await axios.post("http://localhost:8000/grades", {
                user_id: userEmail,
                disciplina_id: disciplinas[disciplinaSelecionada]._id,
                valor: parseFloat(novaAtividadeNota),
                tipo: novaAtividadeNome,
            });
            setNovaAtividadeNome("");
            setNovaAtividadeNota("");
            setMostrarModalAtividade(false);
            buscarDisciplinas();
        } catch (error) {
            console.error("Erro ao adicionar nota:", error);
        }
    };

    const editarAtividade = (atividade) => {
        setNovaAtividadeNome(atividade.tipo);
        setNovaAtividadeNota(atividade.valor.toString());
        setAtividadeEdicaoId(atividade._id);
        setModoEdicaoAtividade(true);
        setMostrarModalAtividade(true);
    };

    const salvarEdicaoAtividade = async () => {
        if (!novaAtividadeNome.trim()) return;

        try {
            await axios.put(`http://localhost:8000/grades/${atividadeEdicaoId}`, {
                valor: parseFloat(novaAtividadeNota),
                tipo: novaAtividadeNome,
            });
            setNovaAtividadeNome("");
            setNovaAtividadeNota("");
            setMostrarModalAtividade(false);
            setModoEdicaoAtividade(false);
            setAtividadeEdicaoId(null);
            buscarDisciplinas();
        } catch (error) {
            console.error("Erro ao salvar atividade:", error);
        }
    };

    const removerAtividade = async (atividadeId) => {
        try {
            await axios.delete(`http://localhost:8000/grades/${disciplinas[disciplinaSelecionada]._id}/nota/${atividadeId}`);
            buscarDisciplinas();
        } catch (error) {
            console.error("Erro ao deletar nota:", error);
        }
    };

    const totalNota = disciplinaSelecionada !== null
        ? disciplinas[disciplinaSelecionada]?.notas?.reduce((soma, nota) => soma + parseFloat(nota.valor), 0) || 0
        : 0;

    return (
        <div className="relative flex flex-col h-full">
            <div className="flex justify-between items-center p-4 border-b border-gray-200">
    <h3 className="font-medium text-gray-700">Minhas Disciplinas</h3>
    <button
        className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full transition-all transform hover:scale-105"
        onClick={() => {
            setNovaDisciplinaNome("");
            setNovaDisciplinaSemestre("");
            setModoEdicaoDisciplina(false);
            setMostrarModalDisciplina(true);
        }}
    >
        <span className="material-symbols-outlined text-sm">add</span>
    </button>
</div>

            //Lista de Disciplinas
            {disciplinaSelecionada === null ? (
                <div className="flex-1 overflow-auto p-2">
                    {disciplinas.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-[200px]">
                            <span className="material-symbols-outlined text-gray-400 text-4xl mb-2">menu_book</span>
                            <p className="text-gray-500 text-center">
                                Nenhuma disciplina cadastrada. Clique no botão + para adicionar.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {disciplinas.map((disc, idx) => (
                                <div
                                    key={disc._id}
                                    className="bg-white p-3 rounded-md shadow-sm border hover:shadow-md transition-all cursor-pointer flex justify-between items-center"
                                >
                                    <div onClick={() => setDisciplinaSelecionada(idx)} className="w-full">
                                        <h4 className="font-medium">{disc.nome}</h4>
                                        {disc.semestre && (
                                            <span className="text-xs bg-blue-100 text-blue-700 py-1 px-2 rounded-full">
                                                {disc.semestre}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex space-x-2">
                                        <button
                                            className="text-red-500 hover:text-red-700"
                                            onClick={() => removerDisciplina(disc._id)}
                                        >
                                            <span className="material-symbols-outlined">delete</span>
                                        </button>
                                        <button
                                            className="text-blue-600 hover:text-blue-700"
                                            onClick={() => editarDisciplina(disc)}
                                        >
                                            <span className="material-symbols-outlined">edit</span>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ) : (
                // Painel de Atividades
                <div className="flex-1 flex flex-col">
                    <div className="p-3 border-b flex justify-between items-center">
    <div className="flex items-center gap-2">
        <button
            className="text-gray-600 hover:text-gray-800"
            onClick={() => setDisciplinaSelecionada(null)}
        >
            <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h3 className="font-medium text-gray-700">
            {disciplinas[disciplinaSelecionada]?.nome}
        </h3>
    </div>
    <button
        className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full"
        onClick={() => {
            setNovaAtividadeNome("");
            setNovaAtividadeNota("");
            setModoEdicaoAtividade(false);
            setMostrarModalAtividade(true);
        }}
    >
        <span className="material-symbols-outlined text-sm">add</span>
    </button>
</div>
                    <div className="flex-1 overflow-auto p-3 space-y-3">
                        {disciplinas[disciplinaSelecionada]?.notas?.length > 0 ? (
                            disciplinas[disciplinaSelecionada].notas.map((nota, idx) => (
                                <div key={nota._id} className="bg-white p-3 rounded-md border">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <h4 className="font-medium">{nota.tipo}</h4>
                                            <span className="text-sm text-gray-600">{nota.valor}/10</span>
                                        </div>
                                        <div className="flex space-x-2">
                                            <button
                                                className="text-red-500 hover:text-red-700"
                                                onClick={() => removerAtividade(nota._id)}
                                            >
                                                <span className="material-symbols-outlined">delete</span>
                                            </button>
                                            <button
                                                className="text-blue-600 hover:text-blue-700"
                                                onClick={() => editarAtividade(nota)}
                                            >
                                                <span className="material-symbols-outlined">edit</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="flex flex-col items-center justify-center h-[200px]">
                                <span className="material-symbols-outlined text-gray-400 text-4xl mb-2">assignment</span>
                                <p className="text-gray-500 text-center">
                                    Nenhuma atividade cadastrada. Clique no botão + para adicionar.
                                </p>
                            </div>
                        )}
                    </div>

                    <div className="p-3 border-t bg-gray-50 flex justify-between">
                        <p className="font-medium text-gray-700">Total</p>
                        <p className="font-bold text-lg">{totalNota.toFixed(1)}/10</p>
                    </div>
                </div>
            )}

            //Modal Disciplina 
            {mostrarModalDisciplina && (
                <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center z-10">
                    <div className="bg-white rounded-lg shadow-xl border w-[300px]">
                        <div className="p-4 border-b border-gray-200">
                            <h3 className="font-medium">{modoEdicaoDisciplina ? "Editar Disciplina" : "Adicionar Disciplina"}</h3>
                        </div>
                        <div className="p-4 space-y-4">
                            <div>
                                <label className="block text-sm text-gray-600 mb-1">Nome da Disciplina</label>
                                <input
                                    type="text"
                                    value={novaDisciplinaNome}
                                    onChange={(e) => setNovaDisciplinaNome(e.target.value)}
                                    className="w-full p-2 border rounded-md"
                                    placeholder="Ex: Matemática"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-600 mb-1">Semestre (opcional)</label>
                                <input
                                    type="text"
                                    value={novaDisciplinaSemestre}
                                    onChange={(e) => setNovaDisciplinaSemestre(e.target.value)}
                                    className="w-full p-2 border rounded-md"
                                    placeholder="Ex: 2024/1 ou 2º semestre"
                                />
                            </div>
                        </div>
                        <div className="p-4 border-t flex justify-end gap-2">
                            <button
                                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md"
                                onClick={() => {
                                    setMostrarModalDisciplina(false);
                                    setModoEdicaoDisciplina(false);
                                    setDisciplinaEdicaoId(null);
                                }}
                            >
                                Cancelar
                            </button>
                            <button
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
                                onClick={modoEdicaoDisciplina ? salvarEdicaoDisciplina : adicionarDisciplina}
                            >
                                {modoEdicaoDisciplina ? "Atualizar" : "Salvar"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            // Modal Atividade 
            {mostrarModalAtividade && (
                <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center z-10">
                    <div className="bg-white rounded-lg shadow-xl border w-[300px]">
                        <div className="p-4 border-b">
                            <h3 className="font-medium">{modoEdicaoAtividade ? "Editar Atividade" : "Adicionar Atividade"}</h3>
                        </div>
                        <div className="p-4 space-y-4">
                            <div>
                                <label className="block text-sm text-gray-600 mb-1">Nome da Atividade</label>
                                <input
                                    type="text"
                                    value={novaAtividadeNome}
                                    onChange={(e) => setNovaAtividadeNome(e.target.value)}
                                    className="w-full p-2 border rounded-md"
                                    placeholder="Ex: Prova Final"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-600 mb-1">Nota (0-10)</label>
                                <input
                                    type="number"
                                    value={novaAtividadeNota}
                                    onChange={(e) => setNovaAtividadeNota(e.target.value)}
                                    className="w-full p-2 border rounded-md"
                                    placeholder="Ex: 8.5"
                                    min="0"
                                    max="10"
                                    step="0.1"
                                />
                            </div>
                        </div>
                        <div className="p-4 border-t flex justify-end gap-2">
                            <button
                                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md"
                                onClick={() => {
                                    setMostrarModalAtividade(false);
                                    setModoEdicaoAtividade(false);
                                    setAtividadeEdicaoId(null);
                                }}
                            >
                                Cancelar
                            </button>
                            <button 
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md" 
                                onClick={modoEdicaoAtividade ? salvarEdicaoAtividade : adicionarAtividade}
                            >
                                {modoEdicaoAtividade ? "Atualizar" : "Salvar"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Disciplinas;

/*
import React, { useState, useEffect } from 'react';

function Disciplinas() {
    const [disciplinas, setDisciplinas] = useState([]);
    const [disciplinaSelecionada, setDisciplinaSelecionada] = useState(null);
    const [mostrarModalDisciplina, setMostrarModalDisciplina] = useState(false);
    const [mostrarModalAtividade, setMostrarModalAtividade] = useState(false);

    // Inputs para nova disciplina
    const [novaDisciplinaNome, setNovaDisciplinaNome] = useState("");
    const [novaDisciplinaSemestre, setNovaDisciplinaSemestre] = useState("");

    // Inputs para nova atividade
    const [novaAtividadeNome, setNovaAtividadeNome] = useState("");
    const [novaAtividadeNota, setNovaAtividadeNota] = useState("");

    // States para edição
    const [modoEdicaoDisciplina, setModoEdicaoDisciplina] = useState(false);
    const [indiceDisciplinaEdicao, setIndiceDisciplinaEdicao] = useState(null);

    const [modoEdicaoAtividade, setModoEdicaoAtividade] = useState(false);
    const [indiceAtividadeEdicao, setIndiceAtividadeEdicao] = useState(null);

    const userId = localStorage.getItem("user_id");

    useEffect(() => {
        if (!userId) return;

        const fetchDisciplinas = async () => {
            try {
                const response = await fetch(`http://localhost:8000/disciplinas/${userId}`);
                const data = await response.json();

                if (response.ok) {
                    setDisciplinas(data);
                } else {
                    console.error("Erro ao carregar disciplinas:", data.detail);
                }
            } catch (error) {
                console.error("Erro na requisição de disciplinas:", error);
            }
        };

        fetchDisciplinas();
    }, [userId]);

    const adicionarDisciplina = async () => {
        if (!novaDisciplinaNome.trim()) return;
        try {
            const response = await fetch("http://localhost:8000/disciplinas", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    user_id: userId,
                    nome: novaDisciplinaNome,
                    semestre: novaDisciplinaSemestre                    
                })
            });

            const data = await response.json();

            if (response.ok) {
                setDisciplinas([...disciplinas, {
                    _id: data.id,
                    nome: novaDisciplinaNome,
                    semestre: novaDisciplinaSemestre,
                    atividades: [],
                }]);

                setNovaDisciplinaNome("");
                setNovaDisciplinaSemestre("");
                setMostrarModalDisciplina(false);
            } else {
                alert(data.detail || "Erro ao adicionar disciplina.");
            }
        } catch (error) {
            console.error("Erro ao adicionar disciplina:", error);
        }
    };

    const editarDisciplina = (index) => {
        const disc = disciplinas[index];
        setNovaDisciplinaNome(disc.nome);
        setNovaDisciplinaSemestre(disc.semestre);
        setIndiceDisciplinaEdicao(index);
        setModoEdicaoDisciplina(true);
        setMostrarModalDisciplina(true);
    };

    const selecionarDisciplina = (index) => {
        setDisciplinaSelecionada(index);
    };

    const adicionarAtividade = () => {
        if (!novaAtividadeNome.trim()) return;

        const novaLista = [...disciplinas];
        novaLista[disciplinaSelecionada].atividades.push({
            nome: novaAtividadeNome,
            nota: Number(novaAtividadeNota),
        });

        setDisciplinas(novaLista);
        setNovaAtividadeNome("");
        setNovaAtividadeNota("");
        setMostrarModalAtividade(false);
    };

    const editarAtividade = (index) => {
        const atv = disciplinas[disciplinaSelecionada].atividades[index];
        setNovaAtividadeNome(atv.nome);
        setNovaAtividadeNota(atv.nota);
        setIndiceAtividadeEdicao(index);
        setModoEdicaoAtividade(true);
        setMostrarModalAtividade(true);
    };

    const salvarAtividade = () => {
        if (!novaAtividadeNome.trim()) return;

        const novaLista = [...disciplinas];
        const atividades = novaLista[disciplinaSelecionada].atividades;

        if (modoEdicaoAtividade && indiceAtividadeEdicao !== null) {
            atividades[indiceAtividadeEdicao] = {
                nome: novaAtividadeNome,
                nota: Number(novaAtividadeNota)
            };
        } else {
            atividades.push({
                nome: novaAtividadeNome,
                nota: Number(novaAtividadeNota),
            });
        }

        setDisciplinas(novaLista);
        setNovaAtividadeNome("");
        setNovaAtividadeNota("");
        setMostrarModalAtividade(false);
    };

    const removerAtividade = (atividadeIndex) => {
        const novaLista = [...disciplinas];
        novaLista[disciplinaSelecionada].atividades.splice(atividadeIndex, 1);
        setDisciplinas(novaLista);
    };

    const removerDisciplina = async (index) => {
        const disciplinaId = disciplinas[index]._id;

        try {
            const response = await fetch(`http://localhost:8000/disciplinas/${disciplinaId}`, {
                method: "DELETE",
            });

            if (response.ok) {
                const novaLista = [...disciplinas];
                novaLista.splice(index, 1);
                setDisciplinas(novaLista);

                if (disciplinaSelecionada === index) setDisciplinaSelecionada(null);
            } else {
                const data = await response.json();
                alert(data.detail || "Erro ao remover disciplina.");
            }
        } catch (error) {
            console.error("Erro ao remover disciplina:", error);
        }
    };

    const editarDisciplinaNoBanco = async () => {
        const disciplinaId = disciplinas[indiceDisciplinaEdicao]._id;
        const dadosAtualizados = {
            nome: novaDisciplinaNome,
            semestre: novaDisciplinaSemestre,
        };

        try {
            const response = await fetch(`http://localhost:8000/disciplinas/${disciplinaId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(dadosAtualizados)
            });

            const data = await response.json();

            if (response.ok) {
                const novaLista = [...disciplinas];
                novaLista[indiceDisciplinaEdicao] = {
                    ...novaLista[indiceDisciplinaEdicao],
                    ...dadosAtualizados
                };
                setDisciplinas(novaLista);
                setMostrarModalDisciplina(false);
            } else {
                alert(data.detail || "Erro ao atualizar disciplina.");
            }
        } catch (error) {
            console.error("Erro ao atualizar disciplina:", error);
        }
    };

    const totalNota = disciplinaSelecionada !== null
        ? disciplinas[disciplinaSelecionada].atividades.reduce((soma, atv) => soma + atv.nota, 0)
        : 0;

    return (
        <div className="relative flex flex-col min-h-screen">
            <div className="flex justify-between items-center p-4 border-b border-gray-200">
                <h3 className="font-medium text-gray-700">Minhas Disciplinas</h3>
                <button
                    className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full transition-all transform hover:scale-105"
                    onClick={() => setMostrarModalDisciplina(true)}
                >
                    <span className="material-symbols-outlined text-sm"
                        style={{ color: '#fff', paddingTop: '5px', fontSize: '25px', fontVariationSettings: "'wght' 200"}}
                    >add</span>
                </button>
            </div>

            // Lista de Disciplinas 
            {disciplinaSelecionada === null ? (
                <div className="flex-1 overflow-auto p-2">
                    {disciplinas.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-[200px]">
                            <span className="material-symbols-outlined text-gray-400 text-4xl mb-2">menu_book</span>
                            <p className="text-gray-500 text-center">
                                Nenhuma disciplina cadastrada. Clique no botão + para adicionar.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {disciplinas.map((disc, idx) => (
                                <div
                                    key={idx}
                                    className="bg-white p-3 rounded-md shadow-sm border hover:shadow-md transition-all cursor-pointer flex justify-between items-center"
                                >
                                    <div onClick={() => selecionarDisciplina(idx)} className="w-full">
                                        <h4 className="font-medium">{disc.nome}</h4>
                                        {disc.semestre && (
                                            <span className="text-xs bg-blue-100 text-blue-700 py-1 px-2 rounded-full">
                                                {disc.semestre}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex space-x-2">
                                        <button
                                            onClick={() => removerDisciplina(idx)}
                                            style={{
                                                backgroundColor: '#cd191c',
                                                borderRadius: '10px',
                                                padding: '1px',
                                                cursor: 'pointer',
                                            }}
                                        >
                                            <span
                                                className="material-symbols-outlined"
                                                style={{ color: '#fff', paddingTop: '4px', fontSize: '25px', fontVariationSettings: "'wght' 200"}}
                                            >
                                                delete
                                            </span>
                                        </button>
                                        <button
                                            onClick={() => editarDisciplina(idx)}
                                            style={{
                                                backgroundColor: '#19cd2b',
                                                borderRadius: '10px',
                                                padding: '1px',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            <span
                                                className="material-symbols-outlined"
                                                style={{ color: '#fff', paddingTop: '4px', fontSize: '25px', fontVariationSettings: "'wght' 200" }}
                                            >
                                                edit
                                            </span>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ) : (
                // Painel de Atividades
                <div className="flex-1 flex flex-col">
                    <div className="p-3 border-b flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <button
                                className="text-gray-600 hover:text-gray-800"
                                onClick={() => setDisciplinaSelecionada(null)}
                            >
                                <span className="material-symbols-outlined">arrow_back</span>
                            </button>
                            <h3 className="font-medium text-gray-700">
                                {disciplinas[disciplinaSelecionada].nome}
                            </h3>
                        </div>
                        <button
                            className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full"
                            onClick={() => setMostrarModalAtividade(true)}
                        >
                            <span className="material-symbols-outlined text-sm">add</span>
                        </button>
                    </div>

                    <div className="flex-1 overflow-auto p-3 space-y-3">
                        {disciplinas[disciplinaSelecionada].atividades.map((atv, idx) => (
                            <div key={idx} className="bg-white p-3 rounded-md border">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <h4 className="font-medium">{atv.nome}</h4>
                                        <span className="text-sm text-gray-600">{atv.nota}/100</span>
                                    </div>
                                    <div className="flex space-x-2">
                                        <button
                                            className="text-red-500 hover:text-red-700"
                                            onClick={() => removerAtividade(idx)}
                                        >
                                            <span className="material-symbols-outlined">delete</span>
                                        </button>
                                        <button
                                            className="text-blue-600 hover:text-blue-700"
                                            onClick={() => editarAtividade(idx)}
                                        >
                                            <span className="material-symbols-outlined">edit</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="p-3 border-t bg-gray-50 flex justify-between">
                        <p className="font-medium text-gray-700">Total</p>
                        <p className="font-bold text-lg">{totalNota}/100</p>
                    </div>
                </div>
            )}

            //Modal Disciplina
            {mostrarModalDisciplina && (
                <div className="fixed inset-0 bg-black bg-opacity-20 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl border w-[300px]">
                        <div className="p-4 border-b border-gray-200">
                            <h3 className="font-medium">{modoEdicaoDisciplina ? "Editar Disciplina" : "Adicionar Disciplina"}</h3>
                        </div>
                        <div className="p-4 space-y-4">
                            <div>
                                <label className="block text-sm text-gray-600 mb-1">Nome da Disciplina</label>
                            <input
                                type="text"
                                className="border border-gray-300 rounded-md p-2 w-full"
                                value={novaDisciplinaNome}
                                onChange={(e) => setNovaDisciplinaNome(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-600 mb-1">Semestre</label>
                            <input
                                type="text"
                                className="border border-gray-300 rounded-md p-2 w-full"
                                value={novaDisciplinaSemestre}
                                onChange={(e) => setNovaDisciplinaSemestre(e.target.value)}
                            />
                        </div>
                        <div className="flex justify-between mt-4">
                            <button
                                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md"
                                onClick={() => {
                                    setMostrarModalDisciplina(false);
                                    setModoEdicaoDisciplina(false);
                                    setIndiceDisciplinaEdicao(null);
                                    setNovaDisciplinaNome("");
                                    setNovaDisciplinaSemestre("");
                                }}
                                >
                                Cancelar
                            </button>
                            <button
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
                                onClick={modoEdicaoDisciplina ? editarDisciplinaNoBanco : adicionarDisciplina}
                                >
                                {modoEdicaoDisciplina ? "Salvar" : "Adicionar"}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )}
        // Modal Atividade
        {mostrarModalAtividade && (
            <div className="fixed inset-0 bg-black bg-opacity-20 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg shadow-xl border w-[300px]">
                    <div className="p-4 border-b border-gray-200">
                        <h3 className="font-medium">{modoEdicaoAtividade ? "Editar Atividade" : "Adicionar Atividade"}</h3>
                    </div>
                    <div className="p-4 space-y-4">
                        <div>
                            <label className="block text-sm text-gray-600 mb-1">Nome da Atividade</label>
                            <input
                                type="text"
                                className="border border-gray-300 rounded-md p-2 w-full"
                                value={novaAtividadeNome}
                                onChange={(e) => setNovaAtividadeNome(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-600 mb-1">Nota</label>
                            <input
                                type="number"
                                className="border border-gray-300 rounded-md p-2 w-full"
                                value={novaAtividadeNota}
                                onChange={(e) => setNovaAtividadeNota(e.target.value)}
                            />
                        </div>
                        <div className="flex justify-between mt-4">
                            <button
                                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md"
                                onClick={() => {
                                    setMostrarModalAtividade(false);
                                    setModoEdicaoAtividade(false);
                                    setIndiceAtividadeEdicao(null);
                                    setNovaAtividadeNome("");
                                    setNovaAtividadeNota("");
                                }}
                            >
                                Cancelar
                            </button>
                            <button
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
                                onClick={salvarAtividade}
                            >
                                {modoEdicaoAtividade ? "Salvar" : "Adicionar"}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )}
    </div>
    );
}

export default Disciplinas; */