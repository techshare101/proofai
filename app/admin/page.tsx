'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import supabase from '@/lib/supabase';
import Footer from '@/components/Footer';
import Link from 'next/link';

interface UserProfile {
  id: string;
  email: string;
  role: string;
  plan: string;
  plan_override: boolean;
  has_court_certification: boolean;
  created_at: string;
}

interface Stats {
  totalUsers: number;
  activeSubscriptions: number;
  courtCertifications: number;
  humanitarianGrants: number;
}

export default function AdminDashboard() {
  const { session, isLoading: authLoading } = useAuth();
  const user = session?.user;
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    activeSubscriptions: 0,
    courtCertifications: 0,
    humanitarianGrants: 0,
  });
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'certifications' | 'credits' | 'impersonate'>('overview');
  
  // Form states
  const [certEmail, setCertEmail] = useState('');
  const [certReason, setCertReason] = useState('');
  const [certLoading, setCertLoading] = useState(false);
  const [certMessage, setCertMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  const [creditsEmail, setCreditsEmail] = useState('');
  const [creditsAmount, setCreditsAmount] = useState('');
  const [creditsExpiry, setCreditsExpiry] = useState('');
  const [creditsReason, setCreditsReason] = useState('');
  const [creditsLoading, setCreditsLoading] = useState(false);
  const [creditsMessage, setCreditsMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  const [impersonateEmail, setImpersonateEmail] = useState('');
  const [impersonateLoading, setImpersonateLoading] = useState(false);
  const [impersonateMessage, setImpersonateMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const getAuthToken = async () => {
    const { data } = await supabase.auth.getSession();
    return data?.session?.access_token;
  };

  const handleGrantCertification = async (e: React.FormEvent) => {
    e.preventDefault();
    setCertLoading(true);
    setCertMessage(null);
    
    try {
      const token = await getAuthToken();
      const response = await fetch('/api/admin/grant-certification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ email: certEmail, reason: certReason }),
      });
      
      if (response.ok) {
        setCertMessage({ type: 'success', text: `Court certification granted to ${certEmail}` });
        setCertEmail('');
        setCertReason('');
      } else {
        const data = await response.json();
        setCertMessage({ type: 'error', text: data.error || 'Failed to grant certification' });
      }
    } catch (error) {
      setCertMessage({ type: 'error', text: 'An error occurred' });
    } finally {
      setCertLoading(false);
    }
  };

  const handleGrantCredits = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreditsLoading(true);
    setCreditsMessage(null);
    
    try {
      const token = await getAuthToken();
      const response = await fetch('/api/admin/grant-credits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          email: creditsEmail,
          credits: creditsAmount,
          expiresInDays: creditsExpiry || null,
          reason: creditsReason,
        }),
      });
      
      if (response.ok) {
        setCreditsMessage({ type: 'success', text: `${creditsAmount} credits granted to ${creditsEmail}` });
        setCreditsEmail('');
        setCreditsAmount('');
        setCreditsExpiry('');
        setCreditsReason('');
      } else {
        const data = await response.json();
        setCreditsMessage({ type: 'error', text: data.error || 'Failed to grant credits' });
      }
    } catch (error) {
      setCreditsMessage({ type: 'error', text: 'An error occurred' });
    } finally {
      setCreditsLoading(false);
    }
  };

  const handleStartImpersonation = async (e: React.FormEvent) => {
    e.preventDefault();
    setImpersonateLoading(true);
    setImpersonateMessage(null);
    
    try {
      const token = await getAuthToken();
      const response = await fetch('/api/admin/impersonate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ email: impersonateEmail }),
      });
      
      if (response.ok) {
        const data = await response.json();
        setImpersonateMessage({ type: 'success', text: `Now viewing as ${data.email}. Session expires at ${new Date(data.expiresAt).toLocaleTimeString()}` });
        // Store impersonation in localStorage for the app to pick up
        localStorage.setItem('impersonating_user_id', data.userId);
        localStorage.setItem('impersonating_email', data.email);
      } else {
        const data = await response.json();
        setImpersonateMessage({ type: 'error', text: data.error || 'Failed to start impersonation' });
      }
    } catch (error) {
      setImpersonateMessage({ type: 'error', text: 'An error occurred' });
    } finally {
      setImpersonateLoading(false);
    }
  };

  useEffect(() => {
    async function checkAdminAndLoadData() {
      if (authLoading) return;
      
      if (!user) {
        router.push('/login');
        return;
      }

            
      // Check if user is admin
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profile?.role !== 'admin') {
        router.push('/dashboard');
        return;
      }

      setIsAdmin(true);

      // Load stats
      const [usersResult, subsResult, certsResult, creditsResult] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact' }),
        supabase.from('profiles').select('id', { count: 'exact' }).eq('has_active_subscription', true),
        supabase.from('court_certifications').select('id', { count: 'exact' }).eq('valid', true),
        supabase.from('humanitarian_credits').select('id', { count: 'exact' }),
      ]);

      setStats({
        totalUsers: usersResult.count || 0,
        activeSubscriptions: subsResult.count || 0,
        courtCertifications: certsResult.count || 0,
        humanitarianGrants: creditsResult.count || 0,
      });

      // Load users with their auth email
      const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(50);

      if (profiles) {
        // Get emails from auth.users via API
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData?.session?.access_token;
        
        if (token) {
          const response = await fetch('/api/admin/users', {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });
          if (response.ok) {
            const usersWithEmail = await response.json();
            setUsers(usersWithEmail);
          } else {
            // Fallback: show profiles without email
            setUsers(profiles.map((p: any) => ({ ...p, email: 'N/A' })));
          }
        } else {
          setUsers(profiles.map((p: any) => ({ ...p, email: 'N/A' })));
        }
      }

      setLoading(false);
    }

    checkAdminAndLoadData();
  }, [user, authLoading, router]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-700 to-blue-600 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between">
            <div>
              <Link href="/dashboard" className="text-white/80 hover:text-white text-sm mb-2 inline-block">
                ← Back to Dashboard
              </Link>
              <h1 className="text-3xl md:text-4xl font-bold">Admin Dashboard</h1>
              <p className="text-white/80 mt-1">ProofAI Governance Control Panel</p>
            </div>
            <div className="bg-purple-900/50 px-4 py-2 rounded-lg border border-purple-500/50">
              <span className="text-purple-200 text-sm">Admin</span>
              <span className="text-white font-semibold ml-2">• Lifetime Access</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <nav className="flex space-x-8">
            {[
              { id: 'overview', label: '📊 Overview', icon: '📊' },
              { id: 'users', label: '👤 Users', icon: '👤' },
              { id: 'certifications', label: '⚖️ Certifications', icon: '⚖️' },
              { id: 'credits', label: '❤️ Humanitarian', icon: '❤️' },
              { id: 'impersonate', label: '🕵️ Impersonate', icon: '🕵️' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-purple-500 text-purple-400'
                    : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-600'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          {activeTab === 'overview' && (
            <div className="space-y-8">
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                  <div className="text-3xl mb-2">👥</div>
                  <div className="text-3xl font-bold text-white">{stats.totalUsers}</div>
                  <div className="text-gray-400">Total Users</div>
                </div>
                <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                  <div className="text-3xl mb-2">💳</div>
                  <div className="text-3xl font-bold text-green-400">{stats.activeSubscriptions}</div>
                  <div className="text-gray-400">Active Subscriptions</div>
                </div>
                <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                  <div className="text-3xl mb-2">⚖️</div>
                  <div className="text-3xl font-bold text-blue-400">{stats.courtCertifications}</div>
                  <div className="text-gray-400">Court Certifications</div>
                </div>
                <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                  <div className="text-3xl mb-2">❤️</div>
                  <div className="text-3xl font-bold text-pink-400">{stats.humanitarianGrants}</div>
                  <div className="text-gray-400">Humanitarian Grants</div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <h2 className="text-xl font-semibold text-white mb-4">Quick Actions</h2>
                <div className="flex flex-wrap gap-4">
                  <button
                    onClick={() => setActiveTab('certifications')}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    Grant Court Certification
                  </button>
                  <button
                    onClick={() => setActiveTab('credits')}
                    className="bg-pink-600 hover:bg-pink-700 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    Grant Humanitarian Credits
                  </button>
                  <button
                    onClick={() => setActiveTab('impersonate')}
                    className="bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    Support Mode
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
              <div className="p-6 border-b border-gray-700">
                <h2 className="text-xl font-semibold text-white">User Management</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-750">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Role</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Plan</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Override</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Certified</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {users.map((u) => (
                      <tr key={u.id} className="hover:bg-gray-750">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{u.email}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            u.role === 'admin' ? 'bg-purple-900 text-purple-300' :
                            u.role === 'support' ? 'bg-blue-900 text-blue-300' :
                            'bg-gray-700 text-gray-300'
                          }`}>
                            {u.role || 'user'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{u.plan || 'starter'}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {u.plan_override ? (
                            <span className="text-green-400">✓</span>
                          ) : (
                            <span className="text-gray-500">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {u.has_court_certification ? (
                            <span className="text-blue-400">✓</span>
                          ) : (
                            <span className="text-gray-500">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <button className="text-purple-400 hover:text-purple-300 mr-3">View</button>
                          <button className="text-gray-400 hover:text-gray-300">Impersonate</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'certifications' && (
            <div className="space-y-6">
              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <h2 className="text-xl font-semibold text-white mb-4">Grant Court Certification</h2>
                <p className="text-gray-400 mb-6">
                  Manually grant court certification to users. This bypasses Stripe and is logged for audit.
                </p>
                {certMessage && (
                  <div className={`mb-4 p-4 rounded-lg ${certMessage.type === 'success' ? 'bg-green-900/50 border border-green-700 text-green-300' : 'bg-red-900/50 border border-red-700 text-red-300'}`}>
                    {certMessage.text}
                  </div>
                )}
                <form className="space-y-4" onSubmit={handleGrantCertification}>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">User Email</label>
                    <input
                      type="email"
                      placeholder="user@example.com"
                      value={certEmail}
                      onChange={(e) => setCertEmail(e.target.value)}
                      required
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Reason (optional)</label>
                    <textarea
                      placeholder="e.g., Journalist covering civil rights case"
                      rows={3}
                      value={certReason}
                      onChange={(e) => setCertReason(e.target.value)}
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={certLoading}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed text-white font-semibold px-6 py-2 rounded-lg transition-colors"
                  >
                    {certLoading ? 'Granting...' : 'Grant Certification'}
                  </button>
                </form>
              </div>
            </div>
          )}

          {activeTab === 'credits' && (
            <div className="space-y-6">
              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <h2 className="text-xl font-semibold text-white mb-4">Grant Humanitarian Credits</h2>
                <p className="text-gray-400 mb-6">
                  Provide mission-aligned access to users who need it. Credits can cover recordings, reports, and storage.
                </p>
                {creditsMessage && (
                  <div className={`mb-4 p-4 rounded-lg ${creditsMessage.type === 'success' ? 'bg-green-900/50 border border-green-700 text-green-300' : 'bg-red-900/50 border border-red-700 text-red-300'}`}>
                    {creditsMessage.text}
                  </div>
                )}
                <form className="space-y-4" onSubmit={handleGrantCredits}>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">User Email</label>
                    <input
                      type="email"
                      placeholder="user@example.com"
                      value={creditsEmail}
                      onChange={(e) => setCreditsEmail(e.target.value)}
                      required
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Credits Amount</label>
                      <input
                        type="number"
                        placeholder="10"
                        min="1"
                        value={creditsAmount}
                        onChange={(e) => setCreditsAmount(e.target.value)}
                        required
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Expires In (days)</label>
                      <input
                        type="number"
                        placeholder="30"
                        min="1"
                        value={creditsExpiry}
                        onChange={(e) => setCreditsExpiry(e.target.value)}
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Reason</label>
                    <textarea
                      placeholder="e.g., Community organizer, NGO referral"
                      rows={3}
                      value={creditsReason}
                      onChange={(e) => setCreditsReason(e.target.value)}
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={creditsLoading}
                    className="bg-pink-600 hover:bg-pink-700 disabled:bg-pink-800 disabled:cursor-not-allowed text-white font-semibold px-6 py-2 rounded-lg transition-colors"
                  >
                    {creditsLoading ? 'Granting...' : 'Grant Credits'}
                  </button>
                </form>
              </div>
            </div>
          )}

          {activeTab === 'impersonate' && (
            <div className="space-y-6">
              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <h2 className="text-xl font-semibold text-white mb-4">Support Impersonation Mode</h2>
                <p className="text-gray-400 mb-6">
                  View the app as a specific user to debug issues. Read-only by default. All actions are logged.
                </p>
                <div className="bg-yellow-900/30 border border-yellow-700/50 rounded-lg p-4 mb-6">
                  <div className="flex items-start">
                    <span className="text-yellow-400 mr-2">⚠️</span>
                    <p className="text-yellow-200 text-sm">
                      Impersonation sessions expire after 30 minutes. A banner will be visible at all times.
                    </p>
                  </div>
                </div>
                {impersonateMessage && (
                  <div className={`mb-4 p-4 rounded-lg ${impersonateMessage.type === 'success' ? 'bg-green-900/50 border border-green-700 text-green-300' : 'bg-red-900/50 border border-red-700 text-red-300'}`}>
                    {impersonateMessage.text}
                  </div>
                )}
                <form className="space-y-4" onSubmit={handleStartImpersonation}>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">User Email</label>
                    <input
                      type="email"
                      placeholder="user@example.com"
                      value={impersonateEmail}
                      onChange={(e) => setImpersonateEmail(e.target.value)}
                      required
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={impersonateLoading}
                    className="bg-gray-600 hover:bg-gray-500 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-semibold px-6 py-2 rounded-lg transition-colors"
                  >
                    {impersonateLoading ? 'Starting...' : 'Start Impersonation'}
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}
