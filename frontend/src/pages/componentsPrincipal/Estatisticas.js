import React, { useEffect, useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, PieChart, Pie, Cell 
} from 'recharts';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Estatisticas = () => {
    const [dadosGraficos, setDadosGraficos] = useState({
        barras: [],
        pizza: []
    });
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const carregarDados = async () => {
            try {
                const userData = JSON.parse(localStorage.getItem('userData'));
                if (!userData?.email) {
                    navigate('/login');
                    return;
                }

                // Dados mockados para teste - substitua pela sua chamada API real
                const dadosMockados = [
                    {
                        _id: "1",
                        nome: "Estatística3",
                        semestre: "2024/1",
                        notas: [
                            { valor: 20, tipo: "Prova 1" },
                            { valor: 16.7, tipo: "Prova 2" }
                        ]
                    },
                    {
                        _id: "2",
                        nome: "LP",
                        semestre: "2023/1",
                        notas: [
                            { valor: 5, tipo: "Prova" }
                        ]
                    },
                    {
                        _id: "3",
                        nome: "Engenharia de software",
                        semestre: "2021/1",
                        notas: [
                            { valor: 15, tipo: "Trabalho" },
                            { valor: 10, tipo: "Prova" }
                        ]
                    }
                ];

                // Processamento dos dados
                const dadosBarras = dadosMockados.map(disc => ({
                    nome: disc.nome,
                    media: calcularMedia(disc.notas),
                    semestre: disc.semestre
                }));

                const dadosPizza = dadosMockados.flatMap(disc => 
                    disc.notas.map(nota => ({
                        name: `${disc.nome} - ${nota.tipo}`,
                        value: nota.valor
                    }))
                );

                setDadosGraficos({
                    barras: dadosBarras,
                    pizza: dadosPizza
                });

            } catch (error) {
                console.error("Erro ao carregar dados:", error);
            } finally {
                setLoading(false);
            }
        };

        carregarDados();
    }, [navigate]);

    const calcularMedia = (notas) => {
        if (!notas || notas.length === 0) return 0;
        const soma = notas.reduce((total, nota) => total + nota.valor, 0);
        return (soma / notas.length).toFixed(2);
    };

    if (loading) {
        return <div className="p-4 text-center">Carregando estatísticas...</div>;
    }

    return (
        <div className="p-4 max-w-6xl mx-auto">
            <h1 className="text-2xl font-bold mb-6">Estatísticas Acadêmicas</h1>
            
            {/* Seção de Gráficos - VISÍVEL AGORA */}
            <div className="mb-8 p-4 bg-white rounded-lg shadow">
                <h2 className="text-xl font-semibold mb-4">Médias por Disciplina</h2>
                <div style={{ height: '400px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={dadosGraficos.barras}
                            margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis 
                                dataKey="nome" 
                                angle={-45} 
                                textAnchor="end" 
                                height={70} 
                            />
                            <YAxis domain={[0, 20]} />
                            <Tooltip />
                            <Legend />
                            <Bar 
                                dataKey="media" 
                                name="Média" 
                                fill="#8884d8" 
                                barSize={30}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Gráfico de Pizza - VISÍVEL AGORA */}
            {dadosGraficos.pizza.length > 0 && (
                <div className="mb-8 p-4 bg-white rounded-lg shadow">
                    <h2 className="text-xl font-semibold mb-4">Distribuição de Notas</h2>
                    <div style={{ height: '400px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={dadosGraficos.pizza}
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={100}
                                    innerRadius={60}
                                    paddingAngle={5}
                                    dataKey="value"
                                    nameKey="name"
                                    label={({ name, percent }) => 
                                        `${name.split(' - ')[1]}: ${(percent * 100).toFixed(0)}%`
                                    }
                                >
                                    {dadosGraficos.pizza.map((entry, index) => (
                                        <Cell 
                                            key={`cell-${index}`} 
                                            fill={[
                                                '#0088FE', 
                                                '#00C49F', 
                                                '#FFBB28', 
                                                '#FF8042'
                                            ][index % 4]} 
                                        />
                                    ))}
                                </Pie>
                                <Tooltip 
                                    formatter={(value) => [`Nota: ${value}`, '']}
                                />
                                <Legend 
                                    layout="vertical" 
                                    align="right" 
                                    verticalAlign="middle" 
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}

            {/* Tabela de Dados */}
            <div className="p-4 bg-white rounded-lg shadow overflow-x-auto">
                <h2 className="text-xl font-semibold mb-4">Detalhes por Disciplina</h2>
                <table className="min-w-full">
                    <thead>
                        <tr className="border-b">
                            <th className="text-left p-2">Disciplina</th>
                            <th className="text-left p-2">Semestre</th>
                            <th className="text-left p-2">Média</th>
                            <th className="text-left p-2">Notas</th>
                        </tr>
                    </thead>
                    <tbody>
                        {dadosGraficos.barras.map((disciplina, index) => (
                            <tr key={index} className="border-b">
                                <td className="p-2">{disciplina.nome}</td>
                                <td className="p-2">{disciplina.semestre}</td>
                                <td className="p-2">{disciplina.media}</td>
                                <td className="p-2">
                                    {dadosGraficos.pizza.filter(item => 
                                        item.name.includes(disciplina.nome)).length}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Estatisticas;