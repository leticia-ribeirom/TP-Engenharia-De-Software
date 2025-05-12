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

    const userId = localStorage.getItem("email");

    function ordenarDisciplinasPorSemestre(disciplinas) {
        return disciplinas.slice().sort((a, b) => {
            const [anoA, semA] = a.semestre.split('/').map(Number);
            const [anoB, semB] = b.semestre.split('/').map(Number);
            if (anoA !== anoB) return anoB - anoA; // ano decrescente
            return semB - semA; // semestre decrescente
        });
    }

    useEffect(() => {
        if (!userId) return;

        const fetchDisciplinasComAtividades = async () => {
            try {
                const response = await fetch(`http://localhost:8000/disciplinas/usuario/${userId}`);
                const disciplinasData = await response.json();

                if (!response.ok) {
                    console.error("Erro ao carregar disciplinas:", disciplinasData.detail);
                    return;
                }

                // Buscar atividades de cada disciplina
                const disciplinasComAtividades = await Promise.all(
                    disciplinasData.map(async (disciplina) => {
                        try {
                            const res = await fetch(`http://localhost:8000/grades/usuario/${userId}/disciplina/${disciplina._id}`);
                            const atividades = res.ok ? await res.json() : [];
                                                        
                            return {
                                ...disciplina,
                                atividades: atividades.map((a) => ({
                                    id: a.id,
                                    nome: a.tipo,
                                    nota: a.valor,
                                })), 
                            };
                        } catch (error) {
                            console.error("Erro ao buscar atividades:", error);
                            return { ...disciplina, atividades: [] };
                        }
                    })
                );

                setDisciplinas(ordenarDisciplinasPorSemestre(disciplinasComAtividades));
            } catch (error) {
                console.error("Erro na requisição de disciplinas:", error);
            }
        };

        fetchDisciplinasComAtividades();
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
                setDisciplinas(ordenarDisciplinasPorSemestre([...disciplinas, {
                    _id: data.id,
                    nome: novaDisciplinaNome,
                    semestre: novaDisciplinaSemestre,
                    atividades: [],
                }]));

                // Resetar estados
                setNovaDisciplinaNome("");
                setNovaDisciplinaSemestre("");
                setMostrarModalDisciplina(false);
                setModoEdicaoDisciplina(false);
                setIndiceDisciplinaEdicao(null);
            } else {
                alert(data.detail || "Erro ao adicionar disciplina.");
            }
        } catch (error) {
            console.error("Erro ao adicionar disciplina:", error);
        }
    };

    const editarDisciplina = (id) => {
        const disc = disciplinas.find(d => d._id === id); // Buscar pela disciplina pelo _id
        setNovaDisciplinaNome(disc.nome);
        setNovaDisciplinaSemestre(disc.semestre);
        setIndiceDisciplinaEdicao(id); // Guardar o _id para futuras referências
        setModoEdicaoDisciplina(true);
        setMostrarModalDisciplina(true);
    };

    const selecionarDisciplina = (id) => {
    if (mostrarModalDisciplina) {
        setMostrarModalDisciplina(false);
        setModoEdicaoDisciplina(false);
        setIndiceDisciplinaEdicao(null);
        setNovaDisciplinaNome("");
        setNovaDisciplinaSemestre("");
    }

    const index = disciplinas.findIndex(d => d._id === id);
        if (index !== -1) {
            setDisciplinaSelecionada(index);
        } else {
            console.warn("Disciplina com ID não encontrada:", id);
        }
    };

    const editarDisciplinaNoBanco = async () => {
        const disciplina = disciplinas.find(d => d._id === indiceDisciplinaEdicao);
        if (!disciplina) {
            console.error("Disciplina não encontrada para edição.");
            return;
        }

        const dadosAtualizados = {
            nome: novaDisciplinaNome,
            semestre: novaDisciplinaSemestre,
        };

        try {
            const response = await fetch(`http://localhost:8000/disciplinas/${disciplina._id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(dadosAtualizados)
            });

            const data = await response.json();

            if (response.ok) {
                const novaLista = disciplinas.map(d => 
                    d._id === disciplina._id ? { ...d, ...dadosAtualizados } : d
                );
                setDisciplinas(ordenarDisciplinasPorSemestre(novaLista));
                // Resetar estados
                setMostrarModalDisciplina(false);
                setModoEdicaoDisciplina(false);
                setIndiceDisciplinaEdicao(null);
                setNovaDisciplinaNome("");
                setNovaDisciplinaSemestre("");
            } else {
                alert(data.detail || "Erro ao atualizar disciplina.");
            }
        } catch (error) {
            console.error("Erro ao atualizar disciplina:", error);
        }
    };
    const removerDisciplina = async (disciplinaId) => {
        try {
            const response = await fetch(`http://localhost:8000/disciplinas/${disciplinaId}`, {
                method: "DELETE",
            });

            if (response.ok) {
                // Remover a disciplina pelo ID, não pelo índice
                const novaLista = disciplinas.filter(disc => disc._id !== disciplinaId);
                setDisciplinas(novaLista);

                if (disciplinaSelecionada && disciplinaSelecionada._id === disciplinaId) {
                    setDisciplinaSelecionada(null);
                }
            } else {
                const data = await response.json();
                alert(data.detail || "Erro ao remover disciplina.");
            }
        } catch (error) {
            console.error("Erro ao remover disciplina:", error);
        }
    };

    const adicionarAtividade = async () => {
        if (!novaAtividadeNome.trim() || !novaAtividadeNota.trim()) return;

        const disciplina = disciplinas[disciplinaSelecionada];

        try {
            const response = await fetch("http://localhost:8000/grades", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    user_id: userId,
                    disciplina_id: disciplina._id,
                    valor: Number(novaAtividadeNota),
                    tipo: novaAtividadeNome,
                }),
            });
            const data = await response.json();
            if (response.ok) {

                const novaLista = [...disciplinas];
                novaLista[disciplinaSelecionada].atividades.push({
                    id: data.grade_id,
                    nome: novaAtividadeNome,
                    nota: Number(novaAtividadeNota),
                });
                
                setDisciplinas(novaLista);
                setNovaAtividadeNome("");
                setNovaAtividadeNota("");
                setMostrarModalAtividade(false);
                setModoEdicaoAtividade(false);
                setIndiceAtividadeEdicao(null);
            } else {
                alert(data.detail || "Erro ao adicionar atividade.");
            }
        } catch (error) {
            console.error("Erro ao adicionar atividade:", error);
        }
    };

    const editarAtividade = (index) => {
        const atv = disciplinas[disciplinaSelecionada].atividades[index];
        setNovaAtividadeNome(atv.nome);
        setNovaAtividadeNota(atv.nota);
        setIndiceAtividadeEdicao(index);
        setModoEdicaoAtividade(true);
        setMostrarModalAtividade(true);
    };

    const salvarAtividade = async () => {
        if (!novaAtividadeNome.trim() || !novaAtividadeNota.trim()) return;

        const novaLista = [...disciplinas];
        const atividades = novaLista[disciplinaSelecionada].atividades;

        if (modoEdicaoAtividade && indiceAtividadeEdicao !== null) {
            const atividade = atividades[indiceAtividadeEdicao];
            const notaId = atividade.id;

            try {
                const response = await fetch(`http://localhost:8000/grades/${disciplinas[disciplinaSelecionada]._id}/${notaId}`, {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        valor: Number(novaAtividadeNota),
                        tipo: novaAtividadeNome
                    })
                });

                if (response.ok) {
                    atividades[indiceAtividadeEdicao] = {
                        ...atividade,
                        nome: novaAtividadeNome,
                        nota: Number(novaAtividadeNota)
                    };
                    setDisciplinas(novaLista);
                    setNovaAtividadeNome(""); 
                    setNovaAtividadeNota(""); 
                    setMostrarModalAtividade(false);
                    setModoEdicaoAtividade(false);
                    setIndiceAtividadeEdicao(null);  
                } else {
                    const data = await response.json();
                    alert(data.detail || "Erro ao editar atividade.");
                }
            } catch (error) {
                console.error("Erro ao editar atividade:", error);
            }
        }
    };

    const removerAtividade = async (atividadeIndex) => {
        const atividade = disciplinas[disciplinaSelecionada].atividades[atividadeIndex];
        const notaId = atividade.id;

        try {
            const response = await fetch(`http://localhost:8000/grades/${disciplinas[disciplinaSelecionada]._id}/${notaId}`, {
                method: "DELETE",
            });

            if (response.ok) {
                const novaLista = [...disciplinas];
                novaLista[disciplinaSelecionada].atividades.splice(atividadeIndex, 1);
                setDisciplinas(novaLista);
            } else {
                const data = await response.json();
                alert(data.detail || "Erro ao remover atividade.");
            }
        } catch (error) {
            console.error("Erro ao remover atividade:", error);
        }
    };

    const totalNota = disciplinaSelecionada !== null
        ? disciplinas[disciplinaSelecionada].atividades.reduce((soma, atv) => soma + atv.nota, 0)
        : 0;

    const disciplinasPorSemestre = disciplinas.reduce((acc, disc) => {
        const semestre = disc.semestre || "Sem semestre definido";
        if (!acc[semestre]) {
            acc[semestre] = [];
        }
        acc[semestre].push(disc);
        return acc;
    }, 
    {});
    return (
        <div className="relative flex flex-col min-h-screen">
            <div className="flex justify-between items-center p-4 border-b border-gray-200">
                <h3 className="font-medium text-gray-700">Minhas Disciplinas</h3>
                
            </div>

            {/* Lista de Disciplinas */}
            {disciplinaSelecionada === null ? (
                <div className="flex-1 overflow-auto p-2">
                    {disciplinas.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-[200px]">
                            <span className="material-symbols-outlined text-gray-400 text-4xl mb-2">menu_book</span>
                            <p className="text-gray-500 text-center">
                                Nenhuma disciplina cadastrada. Clique no botão Adicionar Disciplina para adicionar.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-2">
    {Object.entries(disciplinasPorSemestre).map(([semestre, lista]) => (
        <div key={semestre} className="mb-4">
            <h4 className="text-lg font-semibold mb-2 text-gray-800">{semestre}</h4>
            <div className="space-y-2">
                {lista.map((disc, idx) => (
                    <div 
                        key={disc._id}
                        className="bg-white p-3 rounded-md shadow-sm border hover:shadow-md transition-all cursor-pointer flex justify-between items-center"
                    >
                        <div onClick={() => selecionarDisciplina(disc._id)} className="w-full">
                            <h4 className="font-medium">{disc.nome}</h4>
                            {disc.semestre && (
                                <span className="text-xs bg-blue-100 text-blue-700 py-1 px-2 rounded-full">
                                    {disc.semestre}
                                </span>
                            )}
                        </div>
                        <div className="flex space-x-2">
                            <button
                                onClick={() => removerDisciplina(disc._id)}
                                style={{
                                    backgroundColor: '#cd191c',
                                    borderRadius: '10px',
                                    padding: '1px',
                                    cursor: 'pointer',
                                }}
                            >
                                <span
                                    className="material-symbols-outlined"
                                    style={{ color: '#fff', paddingTop: '4px', fontSize: '22px', fontVariationSettings: "'wght' 200" }}
                                >
                                    delete
                                </span>
                            </button>
                            <button
                                onClick={() => editarDisciplina(disc._id)}
                                style={{
                                    backgroundColor: '#19cd2b',
                                    borderRadius: '10px',
                                    padding: '1px',
                                    cursor: 'pointer'
                                }}
                            >
                                <span
                                    className="material-symbols-outlined"
                                    style={{ color: '#fff', paddingTop: '4px', fontSize: '22px', fontVariationSettings: "'wght' 200" }}
                                >
                                    edit
                                </span>
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    ))}
</div>

                    )}
                    
                    {/* Botão no final */}
                    {disciplinaSelecionada === null && (
                    <button
                        className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-1 rounded-md transition-all"
                        onClick={() => setMostrarModalDisciplina(true)}
                    >
                        Adicionar Disciplina
                    </button>
                )}
                </div>
            ) : (
                // Painel de Atividades
                <div className="flex-1 flex flex-col">
                    <div className="p-3 border-b flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <button
                                className="text-gray-600 hover:text-gray-800"
                                onClick={() => {
                                    setDisciplinaSelecionada(null)
                                    setMostrarModalAtividade(false);
                                }}
                            >
                                <span className="material-symbols-outlined">arrow_back</span>
                            </button>
                            <h3 className="font-medium text-gray-700">
                                {disciplinas[disciplinaSelecionada].nome}
                            </h3>
                        </div>
                        
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
                                            style={{
                                                backgroundColor: '#cd191c',
                                                borderRadius: '10px',
                                                padding: '1px',
                                                cursor: 'pointer',
                                            }}                                            
                                        >
                                            <span 
                                                className="material-symbols-outlined"
                                                style={{ color: '#fff', paddingTop: '4px', fontSize: '22px', fontVariationSettings: "'wght' 200"}}
                                            >
                                                delete</span>
                                        </button>
                                        <button
                                            className="text-blue-600 hover:text-blue-700"
                                            onClick={() => editarAtividade(idx)}
                                            style={{
                                                backgroundColor: '#19cd2b',
                                                borderRadius: '10px',
                                                padding: '1px',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            <span 
                                                className="material-symbols-outlined"
                                                style={{ color: '#fff', paddingTop: '4px', fontSize: '22px', fontVariationSettings: "'wght' 200" }}
                                                >
                                                    edit</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Botão ADICIONAR ATIVIDADE */}
                    <div className="p-3 flex justify-center">
                        <button
                            className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-md transition-all"
                            onClick={() => setMostrarModalAtividade(true)}
                        >
                            Adicionar Atividade
                        </button>
                    </div>

                    <div className="p-3 border-t bg-gray-50 flex justify-between">
                        <p className="font-medium text-gray-700">Total</p>
                        <p className="font-bold text-lg">{totalNota}/100</p>
                    </div>
                </div>
            )}

            {/* Modal Disciplina */}
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
                                onClick={() => {
                                        if (modoEdicaoDisciplina) {
                                            editarDisciplinaNoBanco();
                                        } else {
                                            adicionarDisciplina();
                                        }
                                    }}
                                >
                                {modoEdicaoDisciplina ? "Salvar" : "Adicionar"}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )}
        {/* Modal Atividade */}
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
                                onClick={() => {
                                    if (modoEdicaoAtividade) {
                                        salvarAtividade();  // Se estiver em modo de edição, chama salvarAtividade.
                                    } else {
                                        adicionarAtividade();  // Se não, chama adicionarAtividade.
                                    }
                                }}
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

export default Disciplinas;