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
    
    // Use dynamic redirect URL based on environment
    const redirectUrl = typeof window !== 'undefined' 
      ? `${window.location.origin}/auth/callback`
      : process.env.NEXT_PUBLIC_APP_URL 
        ? `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`
        : 'https://proofai-app.vercel.app/auth/callback';
    
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl
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
            emailRedirectTo: typeof window !== 'undefined' 
            ? `${window.location.origin}/auth/callback`
            : 'https://proofai-app.vercel.app/auth/callback',
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
    <div className="flex flex-col items-center space-y-6 w-full max-w-md p-6 bg-white rounded-xl shadow-md">
      <h2 className="text-2xl font-bold text-gray-800 mb-2">
        {isSignUp ? 'Create an Account' : 'Sign In to ProofAI'}
      </h2>
      
      {/* Google Sign In - Primary CTA */}
      <button
        onClick={handleGoogleSignIn}
        disabled={loading}
        className="w-full flex items-center justify-center gap-3 border border-gray-300 rounded-lg px-4 py-2.5 text-sm font-medium bg-white hover:bg-gray-50 transition disabled:bg-gray-100 disabled:cursor-not-allowed"
      >
        <svg width="18" height="18" viewBox="0 0 48 48">
          <path fill="#EA4335" d="M24 9.5c3.1 0 5.9 1.1 8.1 2.9l6-6C34.3 2.4 29.5 0 24 0 14.6 0 6.6 5.4 2.7 13.2l7.2 5.6C12 13.1 17.5 9.5 24 9.5z"/>
          <path fill="#4285F4" d="M46.1 24.6c0-1.6-.1-2.8-.4-4.1H24v7.7h12.6c-.6 3.1-2.4 5.7-5.1 7.4l7.8 6c4.6-4.2 7.8-10.4 7.8-17z"/>
          <path fill="#FBBC05" d="M9.9 28.8c-1-3.1-1-6.4 0-9.5l-7.2-5.6c-3.1 6.2-3.1 14.4 0 20.6l7.2-5.5z"/>
          <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.8-6c-2.2 1.5-5 2.4-8.1 2.4-6.5 0-12-3.6-14.1-8.9l-7.2 5.5C6.6 42.6 14.6 48 24 48z"/>
        </svg>
        Continue with Google
      </button>

      {/* Divider */}
      <div className="my-4 text-center text-xs text-gray-500">or</div>
      
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
