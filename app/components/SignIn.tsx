'use client';

import { useState } from 'react';
import supabase from '../lib/supabase';
import Link from 'next/link';

export default function SignIn() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Handle Google OAuth sign in
  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(undefined);
    
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: 'http://localhost:3000/auth/v1/callback'
      }
    });

    if (data?.url) window.location.href = data.url;

    if (error) {
      console.error('OAuth Error:', error);
      setError(error.message);
    }
    
    setLoading(false);
  };

  // Handle email & password sign in/sign up
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(undefined);
    setSuccessMessage('');
    
    try {
      if (isSignUp) {
        // Sign up flow
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: 'http://localhost:3000/auth/v1/callback',
          }
        });
        
        if (error) throw error;
        
        if (data.user) {
          setSuccessMessage('Sign-up successful! Please check your email to verify your account.');
          // Reset form
          setEmail('');
          setPassword('');
        }
      } else {
        // Sign in flow
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        
        if (error) throw error;
      }
    } catch (err: any) {
      console.error('Auth Error:', err);
      setError(err.message || 'An error occurred during authentication');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center space-y-8 w-full max-w-md p-6 bg-white rounded-xl shadow-md">
      <h2 className="text-2xl font-bold text-gray-800 mb-2">
        {isSignUp ? 'Create an Account' : 'Sign In to ProofAI'}
      </h2>
      
      {/* Email & Password Form */}
      <form onSubmit={handleEmailSubmit} className="w-full space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            disabled={loading}
          />
        </div>
        
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            disabled={loading}
          />
        </div>
        
        <button
          type="submit"
          disabled={loading}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300 disabled:cursor-not-allowed"
        >
          {loading ? 'Processing...' : (isSignUp ? 'Sign Up' : 'Sign In')}
        </button>
      </form>

      {/* Divider */}
      <div className="w-full flex items-center my-4">
        <div className="flex-1 border-t border-gray-300"></div>
        <span className="px-4 text-sm text-gray-500">OR</span>
        <div className="flex-1 border-t border-gray-300"></div>
      </div>
      
      {/* Google Sign In */}
      <button
        onClick={handleGoogleSignIn}
        disabled={loading}
        className="w-full flex items-center justify-center space-x-2 px-6 py-2 border rounded-md shadow-sm transition-colors bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
        <span className="text-gray-900 font-medium">
          Continue with Google
        </span>
      </button>
      
      {/* Toggle between sign in and sign up */}
      <div className="text-center text-sm">
        {isSignUp ? (
          <p>
            Already have an account?{' '}
            <button 
              type="button" 
              onClick={() => setIsSignUp(false)} 
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              Sign In
            </button>
          </p>
        ) : (
          <p>
            Don't have an account?{' '}
            <button 
              type="button" 
              onClick={() => setIsSignUp(true)} 
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              Create one
            </button>
          </p>
        )}
      </div>
      
      {/* Error & Success Messages */}
      {error && (
        <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md w-full">
          {error}
        </div>
      )}
      
      {successMessage && (
        <div className="text-sm text-green-600 bg-green-50 p-3 rounded-md w-full">
          {successMessage}
        </div>
      )}
    </div>
  );
}
