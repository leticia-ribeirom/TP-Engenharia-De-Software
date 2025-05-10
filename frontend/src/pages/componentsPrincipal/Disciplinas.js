import React, { useEffect, useState } from "react";
import axios from "axios";

function Disciplinas() {
    const [disciplinas, setDisciplinas] = useState([]);
    const [disciplinaSelecionada, setDisciplinaSelecionada] = useState(null);
    const [mostrarModalDisciplina, setMostrarModalDisciplina] = useState(false);
    const [mostrarModalAtividade, setMostrarModalAtividade] = useState(false);

    const [novaDisciplinaNome, setNovaDisciplinaNome] = useState("");
    const [novaDisciplinaSemestre, setNovaDisciplinaSemestre] = useState("");

    const [novaAtividadeNome, setNovaAtividadeNome] = useState("");
    const [novaAtividadeNota, setNovaAtividadeNota] = useState("");

    const user_id = "exemplo@email.com";

    useEffect(() => {
        fetchDisciplinas();
    }, []);

    const fetchDisciplinas = async () => {
        try {
            const res = await axios.get(`http://localhost:8000/disciplinas/${user_id}`);
            setDisciplinas(res.data);
        } catch (error) {
            console.error("Erro ao buscar disciplinas:", error);
        }
    };

    const criarDisciplina = async () => {
        try {
            const res = await axios.post("http://localhost:8000/disciplinas", {
                user_id,
                nome: novaDisciplinaNome,
                semestre: novaDisciplinaSemestre,
            });

            setDisciplinas([...disciplinas, res.data]);
            setNovaDisciplinaNome("");
            setNovaDisciplinaSemestre("");
            setMostrarModalDisciplina(false);
            setDisciplinaSelecionada(res.data._id);
            setMostrarModalAtividade(true);
        } catch (error) {
            console.error("Erro ao criar disciplina:", error);
            alert(error.response?.data?.detail || "Erro ao criar disciplina.");
        }
    };

    const adicionarAtividade = async () => {
        const nota = parseFloat(novaAtividadeNota);
        if (isNaN(nota)) return alert("Digite uma nota válida.");

        try {
            const res = await axios.post("http://localhost:8000/grades", {
                user_id,
                disciplina_id: disciplinaSelecionada,
                nome: novaAtividadeNome,
                nota,
            });

            const atualizadas = disciplinas.map((disc) =>
                disc._id === disciplinaSelecionada ? res.data : disc
            );
            setDisciplinas(atualizadas);
            setNovaAtividadeNome("");
            setNovaAtividadeNota("");
            setMostrarModalAtividade(false);
        } catch (error) {
            console.error("Erro ao adicionar atividade:", error);
        }
    };

    const totalNota = () => {
        const disciplina = disciplinas.find((d) => d._id === disciplinaSelecionada);
        if (!disciplina || !disciplina.notas) return 0;
        return disciplina.notas.reduce((soma, atv) => soma + atv.nota, 0);
    };

    return (
        <div className="relative flex flex-col h-full">
            <div className="flex justify-between items-center p-4 border-b border-gray-200">
                <h3 className="font-medium text-gray-700">Minhas Disciplinas</h3>
                <button
                    className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full transition-all transform hover:scale-105"
                    onClick={() => setMostrarModalDisciplina(true)}
                >
                    <span className="material-symbols-outlined text-sm">add</span>
                </button>
            </div>

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
                            {disciplinas.map((disc) => (
                                <div
                                    key={disc._id}
                                    onClick={() => setDisciplinaSelecionada(disc._id)}
                                    className="bg-white p-3 rounded-md shadow-sm border hover:shadow-md transition-all cursor-pointer"
                                >
                                    <h4 className="font-medium">{disc.nome}</h4>
                                    {disc.semestre && (
                                        <p className="text-sm text-gray-500">Semestre: {disc.semestre}</p>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ) : (
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
                                {disciplinas.find((d) => d._id === disciplinaSelecionada)?.nome}
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
                        {(disciplinas.find((d) => d._id === disciplinaSelecionada)?.notas || []).map((atv, idx) => (
                            <div key={idx} className="bg-white p-3 rounded-md border">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <h4 className="font-medium">{atv.nome}</h4>
                                        <span className="text-sm text-gray-600">{atv.nota}/100</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="p-3 border-t bg-gray-50 flex justify-between">
                        <p className="font-medium text-gray-700">Total</p>
                        <p className="font-bold text-lg">{totalNota()}/100</p>
                    </div>
                </div>
            )}

            {/* Modal Disciplina */}
            {mostrarModalDisciplina && (
                <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center z-10">
                    <div className="bg-white rounded-lg shadow-xl border w-[300px]">
                        <div className="p-4 border-b border-gray-200">
                            <h3 className="font-medium">Adicionar Disciplina</h3>
                        </div>
                        <div className="p-4 space-y-4">
                            <div>
                                <label className="block text-sm text-gray-600 mb-1">Nome</label>
                                <input
                                    type="text"
                                    value={novaDisciplinaNome}
                                    onChange={(e) => setNovaDisciplinaNome(e.target.value)}
                                    className="w-full p-2 border rounded-md"
                                    placeholder="Ex: Matemática"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-600 mb-1">Semestre</label>
                                <input
                                    type="text"
                                    value={novaDisciplinaSemestre}
                                    onChange={(e) => setNovaDisciplinaSemestre(e.target.value)}
                                    className="w-full p-2 border rounded-md"
                                    placeholder="Ex: 2024/1"
                                />
                            </div>
                        </div>
                        <div className="p-4 border-t flex justify-end gap-2">
                            <button
                                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md"
                                onClick={() => setMostrarModalDisciplina(false)}
                            >
                                Cancelar
                            </button>
                            <button
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
                                onClick={criarDisciplina}
                            >
                                Criar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Atividade */}
            {mostrarModalAtividade && (
                <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center z-10">
                    <div className="bg-white rounded-lg shadow-xl border w-[300px]">
                        <div className="p-4 border-b">
                            <h3 className="font-medium">Adicionar Atividade</h3>
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
                                <label className="block text-sm text-gray-600 mb-1">Nota</label>
                                <input
                                    type="number"
                                    value={novaAtividadeNota}
                                    onChange={(e) => setNovaAtividadeNota(e.target.value)}
                                    className="w-full p-2 border rounded-md"
                                    placeholder="Ex: 85"
                                />
                            </div>
                        </div>
                        <div className="p-4 border-t flex justify-end gap-2">
                            <button
                                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md"
                                onClick={() => setMostrarModalAtividade(false)}
                            >
                                Cancelar
                            </button>
                            <button
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
                                onClick={adicionarAtividade}
                            >
                                Adicionar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Disciplinas;
