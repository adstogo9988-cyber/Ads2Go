'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import {
    Globe,
    Key,
    Link as LinkIcon,
    ShieldCheck,
    Trash2,
    Plus,
    RefreshCw
} from 'lucide-react';
import Link from 'next/link';

export default function SettingsPage() {
    const [user, setUser] = useState<any>(null);
    const [integrations, setIntegrations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    useEffect(() => {
        checkUser();

        // Check URL for status messages
        const urlParams = new URLSearchParams(window.location.search);
        const err = urlParams.get('error');
        const success = urlParams.get('success');

        if (err) setError(`OAuth Error: ${err}`);
        if (success) setSuccessMsg('Successfully connected Google account!');
    }, []);

    async function checkUser() {
        try {
            const { data: { session }, error } = await supabase.auth.getSession();
            if (error || !session) {
                window.location.href = '/login';
                return;
            }
            setUser(session.user);
            fetchIntegrations(session.user.id);
        } catch (err) {
            console.error(err);
        }
    }

    async function fetchIntegrations(userId: string) {
        try {
            const { data, error } = await supabase
                .from('user_integrations')
                .select('*')
                .eq('user_id', userId);

            if (error) throw error;
            setIntegrations(data || []);
        } catch (err) {
            console.error('Failed to fetch integrations:', err);
        } finally {
            setLoading(false);
        }
    }

    async function disconnectGoogle() {
        if (!user) return;
        setLoading(true);
        try {
            const { error } = await supabase
                .from('user_integrations')
                .delete()
                .eq('user_id', user.id)
                .eq('provider', 'google');

            if (error) throw error;

            setIntegrations(integrations.filter(i => i.provider !== 'google'));
            setSuccessMsg('Google account disconnected successfully.');
        } catch (err) {
            console.error(err);
            setError('Failed to disconnect account');
        } finally {
            setLoading(false);
        }
    }

    const isGoogleConnected = integrations.some(i => i.provider === 'google');

    if (loading && !user) return <div className="p-8 text-center text-gray-400">Loading...</div>;

    return (
        <div className="max-w-4xl mx-auto space-y-8 p-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-white">Integrations & API</h1>
                    <p className="text-gray-400 mt-1">Manage external connections and API access keys.</p>
                </div>
            </div>

            {error && (
                <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-4 rounded-xl">
                    {error}
                </div>
            )}

            {successMsg && (
                <div className="bg-green-500/10 border border-green-500/50 text-green-400 p-4 rounded-xl">
                    {successMsg}
                </div>
            )}

            {/* Google Integrations */}
            <section className="bg-gray-800/40 border border-gray-700 rounded-2xl p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl -mr-20 -mt-20"></div>

                <div className="flex items-start justify-between relative z-10">
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white rounded-lg">
                                <svg viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                </svg>
                            </div>
                            <h2 className="text-xl font-bold text-white">Google Account</h2>
                        </div>

                        <p className="text-gray-400 max-w-lg">
                            Connect your Google account to enable advanced scan insights from Google Search Console and verify AdSense status automatically.
                        </p>

                        <div className="flex items-center gap-6 mt-4">
                            <div className="flex items-center gap-2 text-sm text-gray-300">
                                <ShieldCheck className="w-4 h-4 text-green-400" />
                                Read-only access
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-300">
                                <ShieldCheck className="w-4 h-4 text-green-400" />
                                Secure OAuth 2.0
                            </div>
                        </div>
                    </div>

                    <div className="relative z-10 flex flex-col gap-3">
                        {isGoogleConnected ? (
                            <div className="flex flex-col items-end gap-3">
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-500/10 text-green-400 text-sm font-medium border border-green-500/20">
                                    <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                                    Connected
                                </span>
                                <button
                                    onClick={disconnectGoogle}
                                    disabled={loading}
                                    className="px-4 py-2 text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                                >
                                    Disconnect Account
                                </button>
                            </div>
                        ) : (
                            <a
                                href="/api/auth/google"
                                className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-white hover:bg-gray-50 text-gray-900 font-medium rounded-xl transition-all shadow-lg shadow-white/5 hover:shadow-white/10"
                            >
                                Sign in with Google
                            </a>
                        )}
                    </div>
                </div>
            </section>

            {/* Webhooks & API Keys sections placeholder */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <section className="bg-gray-800/40 border border-gray-700 rounded-2xl p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2.5 bg-purple-500/10 rounded-xl">
                            <Key className="w-5 h-5 text-purple-400" />
                        </div>
                        <h2 className="text-lg font-bold text-white">Public API Keys</h2>
                    </div>
                    <p className="text-sm text-gray-400 mb-6">Create API keys to integrate Ad2Go scanning capabilities into your own applications or CI/CD pipelines.</p>
                    <button className="w-full py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm font-medium border border-gray-600 transition-colors flex items-center justify-center gap-2">
                        <Plus className="w-4 h-4" /> Generate New Key
                    </button>
                </section>

                <section className="bg-gray-800/40 border border-gray-700 rounded-2xl p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2.5 bg-pink-500/10 rounded-xl">
                            <LinkIcon className="w-5 h-5 text-pink-400" />
                        </div>
                        <h2 className="text-lg font-bold text-white">Webhooks</h2>
                    </div>
                    <p className="text-sm text-gray-400 mb-6">Register endpoints to receive real-time JSON payloads when scans complete or reports are generated.</p>
                    <button className="w-full py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm font-medium border border-gray-600 transition-colors flex items-center justify-center gap-2">
                        <Plus className="w-4 h-4" /> Add Webhook
                    </button>
                </section>
            </div>

        </div>
    );
}
