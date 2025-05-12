import React, { useState } from 'react';
import { Link,useNavigate } from 'react-router-dom';

function LoginForm({ setActiveTab }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const navigate = useNavigate();

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    try {
      const response = await fetch('http://localhost:8000/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setErrorMessage(data.detail || 'Erro ao fazer login.');
      } else {
        console.log("Resposta da API:", data);
        if (data.username && data.email) {
            localStorage.setItem('username', data.username);
            localStorage.setItem('email', data.email);
        } else {
            console.error("Erro: username ou email não retornado pela API");
        }
        navigate('/principal'); // Redireciona para a página principal
      }
    } catch (error) {
      setErrorMessage('Erro na conexão com o servidor.');
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Bem-Vindo de volta!</h2>
      <form className="space-y-5" onSubmit={handleLoginSubmit}>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email de cadastro</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
            placeholder="your@email.com"
            required
          />
        </div>
        <div>
          <div className="flex justify-between items-center mb-1">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">Senha</label>
            <button
              type="button"
              className="text-sm text-primary-600 hover:text-primary-800 hover:underline transition-all duration-200"
              onClick={() => setActiveTab('forgotPassword')}
            >
              Esqueceu sua senha?
            </button>
          </div>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
            placeholder="••••••••"
            required
          />
        </div>
        {errorMessage && <p className="text-red-500 text-sm">{errorMessage}</p>}
        <button
          type="submit"
          className="w-full bg-primary-600 text-white py-3 rounded-lg font-medium hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-all duration-200 transform hover:-translate-y-0.5"
        >
          Entrar
        </button>
      </form>
    </div>
  );
}

export default LoginForm;
