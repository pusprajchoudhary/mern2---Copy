import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import styled from 'styled-components';

const LoginContainer = styled.div`
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)),
    url('https://images.unsplash.com/photo-1464618663641-bbdd760ae84a?q=80&w=2070&auto=format&fit=crop') center/cover no-repeat;
  padding: 20px;
`;

const LoginBox = styled.div`
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  padding: 2rem;
  border-radius: 15px;
  width: 100%;
  max-width: 400px;
  box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
  border: 1px solid rgba(255, 255, 255, 0.18);
  height: auto;
  max-height: 90vh;
  overflow-y: auto;
`;

const Logo = styled.img`
  width: 120px;
  height: 120px;
  margin-bottom: 1.5rem;
  display: block;
  margin-left: auto;
  margin-right: auto;
  object-fit: contain;
`;

const Title = styled.h1`
  color: white;
  text-align: center;
  margin-bottom: 1.5rem;
  font-size: 1.8rem;
`;

const Input = styled.input`
  width: 100%;
  padding: 12px;
  margin: 8px 0;
  border: none;
  border-radius: 5px;
  background: rgba(255, 255, 255, 0.9);
  color: #333;
  font-size: 1rem;

  &:focus {
    outline: none;
    box-shadow: 0 0 5px #ff0000;
  }
`;

const Button = styled.button`
  width: 100%;
  padding: 12px;
  margin: 16px 0;
  border: none;
  border-radius: 5px;
  background: #ff0000;
  color: white;
  font-size: 1rem;
  cursor: pointer;
  transition: background 0.3s ease;
  opacity: ${props => props.disabled ? 0.7 : 1};

  &:hover {
    background: ${props => props.disabled ? '#ff0000' : '#cc0000'};
  }
`;

const RememberMeContainer = styled.div`
  display: flex;
  align-items: center;
  margin: 1rem 0;
  color: white;
`;

const AdminLink = styled.a`
  color: white;
  text-decoration: none;
  text-align: right;
  display: block;
  margin-top: 1rem;
  font-size: 0.9rem;
  
  &:hover {
    text-decoration: underline;
  }
`;

const ErrorMessage = styled.div`
  color: #ff0000;
  background: rgba(255, 255, 255, 0.9);
  padding: 10px;
  border-radius: 5px;
  margin: 10px 0;
  text-align: center;
  font-size: 0.9rem;
`;

const SuccessMessage = styled(ErrorMessage)`
  color: #008000;
`;

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const { loginUser, error } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await loginUser(formData);
      if (response?.isBlocked) {
        navigate('/blocked');
      } else if (response) {
        navigate('/');
      }
    } catch (error) {
      // Error is handled by AuthContext
      console.error('Login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <LoginContainer>
      <LoginBox>
        <Logo 
          src="https://www.logodesign.net/logo/line-art-house-roof-with-circle-4485ld.png" 
          alt="Company Logo" 
        />
        <Title>Welcome Back</Title>
        <form onSubmit={handleSubmit}>
          {error && <ErrorMessage>{error}</ErrorMessage>}
          <Input
            type="email"
            placeholder="Email Address"
            name="email"
            value={formData.email}
            onChange={handleChange}
            disabled={isLoading}
            required
          />
          <Input
            type="password"
            placeholder="Password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            disabled={isLoading}
            required
          />
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Signing in...' : 'Sign in'}
          </Button>
          <AdminLink 
            href="https://wa.me/+919876543210" 
            target="_blank" 
            rel="noopener noreferrer"
          >
            Forgot password? Contact Your Admin!
          </AdminLink>
        </form>
      </LoginBox>
    </LoginContainer>
  );
};

export default Login; 