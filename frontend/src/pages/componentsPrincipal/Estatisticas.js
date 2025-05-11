import React, { useEffect, useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, PieChart, Pie, Cell, ReferenceLine, LineChart, Line 
} from 'recharts';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

const Estatisticas = () => {
    const [dadosGraficos, setDadosGraficos] = useState({
        barras: [],
        pizzasPorDisciplina: [],
        linhaSemestres: []
    });
    const [loading, setLoading] = useState(true);
    const [ultimaAtualizacao, setUltimaAtualizacao] = useState(Date.now());
    const [abaAtiva, setAbaAtiva] = useState('nsg'); // 'nsg', 'disciplinas', 'distribuicao', 'detalhes'
    const navigate = useNavigate();

    const NOTA_MINIMA_APROVACAO = 60;
    const NOTA_MINIMA_NSG = 50;
    const NOTA_MAXIMA = 100;

    const ordenarSemestres = (semestres) => {
        return semestres.sort((a, b) => {
            const [anoA, periodoA] = a.split('/');
            const [anoB, periodoB] = b.split('/');
            
            if (anoA !== anoB) return anoA - anoB;
            return periodoA - periodoB;
        });
    };

    const buscarDados = async () => {
        try {
            const userData = JSON.parse(localStorage.getItem('userData'));
            if (!userData?.email) {
                navigate('/login');
                return;
            }

            const response = await axios.get('http://localhost:8000/disciplinas', {
                params: { user_id: userData.email }
            });

            const disciplinas = response.data || [];

            // Processar dados para gráfico de linha (NSG)
            const dadosPorSemestre = {};
            
            disciplinas.forEach(disc => {
                const semestre = disc.semestre || 'Sem semestre';
                if (semestre === 'Sem semestre') return;
                
                const notasValidas = (disc.notas || []).filter(nota => parseFloat(nota.valor) >= 0);
                const somaNotas = notasValidas.reduce((total, nota) => total + (parseFloat(nota.valor) || 0), 0);
                
                if (!dadosPorSemestre[semestre]) {
                    dadosPorSemestre[semestre] = {
                        somaTotal: 0,
                        count: 0
                    };
                }
                
                dadosPorSemestre[semestre].somaTotal += somaNotas;
                dadosPorSemestre[semestre].count++;
            });

            const semestresOrdenados = ordenarSemestres(Object.keys(dadosPorSemestre));
            
            const linhaSemestres = semestresOrdenados.map(semestre => ({
                semestre: semestre,
                media: parseFloat((dadosPorSemestre[semestre].somaTotal / dadosPorSemestre[semestre].count).toFixed(2))
            }));

            // Processamento para gráfico de barras
            const dadosBarras = disciplinas.map(disc => {
                const notasValidas = (disc.notas || []).filter(nota => parseFloat(nota.valor) >= 0);
                const somaNotas = notasValidas.reduce((total, nota) => total + (parseFloat(nota.valor) || 0), 0);
                const media = calcularMedia(disc.notas);
                
                let status;
                if (somaNotas >= NOTA_MINIMA_APROVACAO) {
                    status = 'Aprovado';
                } else {
                    status = somaNotas > 0 ? 'Em andamento' : 'Sem notas';
                }

                return {
                    nome: disc.nome,
                    somaNotas: somaNotas,
                    media: media,
                    semestre: disc.semestre || 'Sem semestre',
                    id: disc._id,
                    status: status,
                    cor: status === 'Aprovado' ? '#00C49F' : 
                         status === 'Em andamento' ? '#FFBB28' : '#FF8042'
                };
            });

            // Processamento para gráficos de pizza
            const pizzasPorDisciplina = disciplinas.map(disc => {
                const notasValidas = (disc.notas || []).filter(nota => parseFloat(nota.valor) >= 0);
                const somaNotas = notasValidas.reduce((total, nota) => total + (parseFloat(nota.valor) || 0), 0);
                const media = calcularMedia(disc.notas);
                
                let status;
                if (somaNotas >= NOTA_MINIMA_APROVACAO) {
                    status = 'Aprovado';
                } else {
                    status = somaNotas > 0 ? 'Em andamento' : 'Sem notas';
                }

                return {
                    disciplinaId: disc._id,
                    disciplinaNome: disc.nome,
                    somaNotas: somaNotas,
                    media: media,
                    status: status,
                    dados: [
                        ...notasValidas.map(nota => ({
                            name: nota.tipo || 'Sem tipo',
                            value: parseFloat(nota.valor) || 0,
                            peso: nota.peso || 1
                        })),
                        ...(somaNotas < NOTA_MAXIMA ? [{
                            name: 'Restante',
                            value: NOTA_MAXIMA - somaNotas,
                            fill: '#e0e0e0'
                        }] : [])
                    ]
                };
            });

            setDadosGraficos({
                barras: dadosBarras,
                pizzasPorDisciplina: pizzasPorDisciplina.filter(d => d.dados.length > 0),
                linhaSemestres: linhaSemestres
            });

        } catch (error) {
            console.error("Erro ao carregar dados:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        buscarDados();
        
        const intervalo = setInterval(() => {
            setUltimaAtualizacao(Date.now());
        }, 5000);

        return () => clearInterval(intervalo);
    }, [navigate, ultimaAtualizacao]);

    const calcularMedia = (notas) => {
        if (!notas || notas.length === 0) return 0;
        const soma = notas.reduce((total, nota) => total + (parseFloat(nota.valor) || 0), 0);
        return parseFloat((soma / notas.length).toFixed(2));
    };

    const handleRecarregar = () => {
        setLoading(true);
        setUltimaAtualizacao(Date.now());
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="p-4 max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Estatísticas Acadêmicas</h1>
                <button 
                    onClick={handleRecarregar}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                    </svg>
                    Atualizar
                </button>
            </div>

            {/* Navegação por abas */}
            <div className="mb-6">
                <nav className="flex space-x-4" aria-label="Tabs">
                    <button
                        onClick={() => setAbaAtiva('nsg')}
                        className={`px-3 py-2 text-sm font-medium rounded-md ${abaAtiva === 'nsg' ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        NSG
                    </button>
                    <button
                        onClick={() => setAbaAtiva('disciplinas')}
                        className={`px-3 py-2 text-sm font-medium rounded-md ${abaAtiva === 'disciplinas' ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Disciplinas
                    </button>
                    <button
                        onClick={() => setAbaAtiva('distribuicao')}
                        className={`px-3 py-2 text-sm font-medium rounded-md ${abaAtiva === 'distribuicao' ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Distribuição
                    </button>
                    <button
                        onClick={() => setAbaAtiva('detalhes')}
                        className={`px-3 py-2 text-sm font-medium rounded-md ${abaAtiva === 'detalhes' ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Detalhes
                    </button>
                </nav>
            </div>

            {/* Conteúdo das abas */}
            <div className="bg-white rounded-lg shadow p-4">
                {/* Aba NSG */}
                {abaAtiva === 'nsg' && dadosGraficos.linhaSemestres.length > 0 && (
                    <div>
                        <h2 className="text-xl font-semibold mb-4">NSG (Nota Semestral Global)</h2>
                        <div style={{ height: '400px' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart
                                    data={dadosGraficos.linhaSemestres}
                                    margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis 
                                        dataKey="semestre" 
                                        angle={-45} 
                                        textAnchor="end" 
                                        height={70} 
                                    />
                                    <YAxis domain={[0, NOTA_MAXIMA]} />
                                    <Tooltip 
                                        formatter={(value) => [`NSG: ${value}`, '']}
                                        labelFormatter={(label) => `Semestre: ${label}`}
                                    />
                                    <Legend />
                                    <ReferenceLine 
                                        y={NOTA_MINIMA_NSG} 
                                        label={{ value: `Mínimo NSG: ${NOTA_MINIMA_NSG}`, position: 'insideTopRight' }} 
                                        stroke="red" 
                                        strokeDasharray="3 3" 
                                    />
                                    <Line 
                                        type="monotone" 
                                        dataKey="media" 
                                        name="NSG" 
                                        stroke="#8884d8" 
                                        strokeWidth={2}
                                        activeDot={{ r: 8 }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}

                {/* Aba Disciplinas */}
                {abaAtiva === 'disciplinas' && dadosGraficos.barras.length > 0 && (
                    <div>
                        <h2 className="text-xl font-semibold mb-4">Total de Notas por Disciplina</h2>
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
                                    <YAxis domain={[0, NOTA_MAXIMA]} />
                                    <Tooltip 
                                        formatter={(value, name, props) => [
                                            `Total: ${value}/${NOTA_MAXIMA}`,
                                            `Status: ${props.payload.status}`,
                                            `Média: ${props.payload.media}`
                                        ]}
                                        labelFormatter={(label) => `Disciplina: ${label}`}
                                    />
                                    <Legend />
                                    <ReferenceLine 
                                        y={NOTA_MINIMA_APROVACAO} 
                                        label={{ value: `Mínimo ${NOTA_MINIMA_APROVACAO}`, position: 'insideTopRight' }} 
                                        stroke="red" 
                                        strokeDasharray="3 3" 
                                    />
                                    <Bar 
                                        dataKey="somaNotas" 
                                        name="Total" 
                                        barSize={30}
                                    >
                                        {dadosGraficos.barras.map((entry, index) => (
                                            <Cell 
                                                key={`cell-${index}`} 
                                                fill={entry.cor}
                                            />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}

                {/* Aba Distribuição */}
                {abaAtiva === 'distribuicao' && dadosGraficos.pizzasPorDisciplina.length > 0 && (
                    <div>
                        <h2 className="text-xl font-semibold mb-4">Distribuição de Notas por Disciplina</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {dadosGraficos.pizzasPorDisciplina.map((disciplina, index) => (
                                <div key={disciplina.disciplinaId} className="space-y-4">
                                    <h3 className="text-lg font-medium">
                                        {disciplina.disciplinaNome} 
                                        <span className="ml-2 text-sm font-semibold">
                                            (Total: {disciplina.somaNotas}/{NOTA_MAXIMA})
                                        </span>
                                        <span className={`ml-2 text-sm font-semibold ${
                                            disciplina.status === 'Aprovado' ? 'text-green-600' :
                                            disciplina.status === 'Em andamento' ? 'text-yellow-600' : 'text-red-600'
                                        }`}>
                                            {disciplina.status}
                                        </span>
                                    </h3>
                                    <div style={{ height: '300px' }}>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={disciplina.dados}
                                                    cx="50%"
                                                    cy="50%"
                                                    outerRadius={80}
                                                    innerRadius={40}
                                                    paddingAngle={5}
                                                    dataKey="value"
                                                    nameKey="name"
                                                    label={({ name, value }) => 
                                                        `${name}: ${value}`
                                                    }
                                                >
                                                    {disciplina.dados.map((entry, index) => (
                                                        <Cell 
                                                            key={`cell-${index}`} 
                                                            fill={entry.fill || COLORS[index % COLORS.length]} 
                                                        />
                                                    ))}
                                                </Pie>
                                                <Tooltip 
                                                    formatter={(value, name, props) => {
                                                        const peso = props.payload.peso;
                                                        return [
                                                            `Nota: ${value}`,
                                                            peso ? `Peso: ${peso}` : '',
                                                            `Total: ${value * (peso || 1)}`
                                                        ];
                                                    }}
                                                />
                                                <Legend />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Aba Detalhes */}
                {abaAtiva === 'detalhes' && (
                    <div>
                        <h2 className="text-xl font-semibold mb-4">Detalhes por Disciplina</h2>
                        <div className="overflow-x-auto">
                            <table className="min-w-full">
                                <thead>
                                    <tr className="border-b">
                                        <th className="text-left p-2">Semestre</th>
                                        <th className="text-left p-2">Disciplina</th>
                                        <th className="text-left p-2">Média</th>
                                        <th className="text-left p-2">Total</th>
                                        <th className="text-left p-2">Status</th>
                                        <th className="text-left p-2">Notas</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {dadosGraficos.barras.length > 0 ? (
                                        Object.entries(
                                            dadosGraficos.barras.reduce((acc, disciplina) => {
                                                const semestre = disciplina.semestre;
                                                if (!acc[semestre]) {
                                                    acc[semestre] = [];
                                                }
                                                acc[semestre].push(disciplina);
                                                return acc;
                                            }, {})
                                        )
                                        .sort(([semestreA], [semestreB]) => {
                                            if (semestreA === 'Sem semestre') return 1;
                                            if (semestreB === 'Sem semestre') return -1;
                                            
                                            const [anoA, periodoA] = semestreA.split('/');
                                            const [anoB, periodoB] = semestreB.split('/');
                                            
                                            if (anoB !== anoA) return anoB - anoA;
                                            return periodoB - periodoA;
                                        })
                                        .flatMap(([semestre, disciplinas]) => [
                                            <tr key={`header-${semestre}`} className="bg-gray-50">
                                                <td colSpan="6" className="p-2 font-semibold">
                                                    {semestre}
                                                </td>
                                            </tr>,
                                            ...disciplinas.map((disciplina, index) => (
                                                <tr key={disciplina.id} className="border-b">
                                                    <td className="p-2"></td>
                                                    <td className="p-2">{disciplina.nome}</td>
                                                    <td className="p-2">{disciplina.media}</td>
                                                    <td className="p-2">{disciplina.somaNotas}/{NOTA_MAXIMA}</td>
                                                    <td className="p-2">
                                                        <span className={`font-semibold ${
                                                            disciplina.status === 'Aprovado' ? 'text-green-600' :
                                                            disciplina.status === 'Em andamento' ? 'text-yellow-600' : 'text-red-600'
                                                        }`}>
                                                            {disciplina.status}
                                                        </span>
                                                    </td>
                                                    <td className="p-2">
                                                        {dadosGraficos.pizzasPorDisciplina
                                                            .find(d => d.disciplinaId === disciplina.id)?.dados.length || 0}
                                                    </td>
                                                </tr>
                                            ))
                                        ])
                                    ) : (
                                        <tr>
                                            <td colSpan="6" className="p-4 text-center text-gray-500">
                                                Nenhuma disciplina cadastrada
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Estatisticas;