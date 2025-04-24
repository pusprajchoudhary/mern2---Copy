import React, { useState } from 'react';
import { login } from '../services/authService';

const LoginPage = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [message, setMessage] = useState('');

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await login(formData);
    if (res.token) {
      localStorage.setItem('token', res.token);
      setMessage('Login successful');
    } else {
      setMessage(res.message || 'Login failed');
    }
  };

  return (
    <div className="p-6 max-w-md mx-auto bg-white shadow-lg rounded">
      <h2 className="text-xl font-bold mb-4">Login</h2>
      <form onSubmit={handleSubmit}>
        <input name="email" type="email" placeholder="Email" className="w-full p-2 mb-2 border" onChange={handleChange} />
        <input name="password" type="password" placeholder="Password" className="w-full p-2 mb-4 border" onChange={handleChange} />
        <button type="submit" className="w-full bg-blue-500 text-white p-2 rounded">Login</button>
      </form>
      {message && <p className="mt-4 text-red-500">{message}</p>}
    </div>
  );
};

export default LoginPage;
