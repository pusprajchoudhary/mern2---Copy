import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const validateForm = () => {
    if (!username || !password) {
      setError('Please fill in all fields');
      return false;
    }
    if (!username.includes('@')) {
      setError('Please enter a valid email address');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!validateForm()) return;

    setIsLoading(true);
    try {
      // Simulating API call - Replace with your actual login API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // For demonstration - replace with actual login logic
      if (username === 'admin@example.com' && password === 'admin123') {
        setSuccess('Login successful! Redirecting...');
        setTimeout(() => {
          navigate('/admin/dashboard');
        }, 1500);
      } else {
        setError('Invalid credentials. Please try again.');
      }
    } catch (err) {
      setError('An error occurred. Please try again later.');
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
          {success && <SuccessMessage>{success}</SuccessMessage>}
          <Input
            type="email"
            placeholder="Email Address"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={isLoading}
            required
          />
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
            required
          />
          <RememberMeContainer>
            <input
              type="checkbox"
              id="rememberMe"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              disabled={isLoading}
            />
            <label htmlFor="rememberMe" style={{ marginLeft: '8px' }}>
              Remember me
            </label>
          </RememberMeContainer>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Logging in...' : 'Login'}
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