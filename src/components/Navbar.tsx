"use client";
import Link from "next/link";
import React, { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export function Navbar() {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [user, setUser] = useState<any>(null);
    const [notifications, setNotifications] = useState<any[]>([]);
    const [isNotifOpen, setIsNotifOpen] = useState(false);
    const notifRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    useEffect(() => {
        // Check current session
        const fetchSession = async () => {
            const { data } = await supabase.auth.getSession();
            setUser(data.session?.user || null);
        };
        fetchSession();

        // Listen for auth changes
        const { data: authListener } = supabase.auth.onAuthStateChange(
            (event, session) => {
                setUser(session?.user || null);
            }
        );

        return () => {
            authListener.subscription.unsubscribe();
        };
    }, []);

    useEffect(() => {
        if (!user) return;

        // Fetch notifications
        const fetchNotifications = async () => {
            const { data } = await supabase
                .from('notifications')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(5);

            if (data) {
                setNotifications(data);
            }
        };
        fetchNotifications();

        // Optional realtime subscription for new notifications
        const notifSubscription = supabase
            .channel('public:notifications')
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'notifications',
                filter: `user_id=eq.${user.id}`
            }, (payload) => {
                setNotifications(prev => [payload.new, ...prev].slice(0, 5));
            })
            .subscribe();

        return () => {
            supabase.removeChannel(notifSubscription);
        };
    }, [user]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
                setIsNotifOpen(false);
            }
        };

        if (isNotifOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isNotifOpen]);

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        router.push("/");
    };

    const markAsRead = async (id: string, url?: string) => {
        // Optimistic update
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));

        await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('id', id);

        if (url) {
            setIsNotifOpen(false);
            router.push(url);
        }
    };

    const markAllRead = async () => {
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('user_id', user.id)
            .eq('is_read', false);
    };

    const unreadCount = notifications.filter(n => !n.is_read).length;

    return (
        <>
            <div className="fixed top-4 left-0 right-0 z-50 flex justify-center px-6">
                <header className="glass-pill flex h-14 w-full max-w-4xl items-center justify-between px-2 rounded-full relative">
                    <div className="flex items-center gap-3 pl-4">
                        <Link href="/" className="flex items-center gap-3">
                            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-900 text-white shadow-sm">
                                <svg
                                    className="h-4 w-4"
                                    fill="none"
                                    viewBox="0 0 48 48"
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    <path
                                        d="M4 4H17.3334V17.3334H30.6666V30.6666H44V44H4V4Z"
                                        fill="currentColor"
                                    ></path>
                                </svg>
                            </div>
                            <span className="text-sm font-bold tracking-tight text-slate-900 uppercase">
                                Ad2Go
                            </span>
                        </Link>
                    </div>
                    <nav className="hidden md:flex items-center gap-10">
                        <Link
                            className="text-[12px] font-medium tracking-wide text-slate-500 hover:text-slate-900 transition-colors"
                            href="/analysis"
                        >
                            Analyze
                        </Link>
                        <Link
                            className="text-[12px] font-medium tracking-wide text-slate-500 hover:text-slate-900 transition-colors"
                            href="/solutions"
                        >
                            Solutions
                        </Link>
                        <Link
                            className="text-[12px] font-medium tracking-wide text-slate-500 hover:text-slate-900 transition-colors"
                            href="/pricing"
                        >
                            Pricing
                        </Link>
                        <Link
                            className="text-[12px] font-medium tracking-wide text-slate-500 hover:text-slate-900 transition-colors"
                            href="/about"
                        >
                            About
                        </Link>
                        <Link
                            className="text-[12px] font-medium tracking-wide text-slate-500 hover:text-slate-900 transition-colors"
                            href="/contact"
                        >
                            Contact
                        </Link>
                    </nav>
                    <div className="hidden md:flex items-center gap-1">
                        {!user ? (
                            <>
                                <Link
                                    href="/login"
                                    className="text-[12px] font-semibold text-slate-600 px-5 py-2 hover:text-slate-900 transition-all"
                                >
                                    Login
                                </Link>
                                <Link
                                    href="/register"
                                    className="bg-white/80 hover:bg-white text-slate-900 text-[12px] font-bold px-6 py-2.5 rounded-full transition-all border border-white/40 shadow-sm"
                                >
                                    Get Started
                                </Link>
                            </>
                        ) : (
                            <div className="flex items-center gap-2 relative">
                                {/* Notifications Dropdown */}
                                <div className="relative" ref={notifRef}>
                                    <button
                                        onClick={() => setIsNotifOpen(!isNotifOpen)}
                                        className="relative p-2 text-slate-500 hover:text-slate-900 transition-colors rounded-full hover:bg-slate-100"
                                    >
                                        <span className="material-symbols-outlined text-[20px]">notifications</span>
                                        {unreadCount > 0 && (
                                            <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
                                        )}
                                    </button>

                                    {isNotifOpen && (
                                        <div className="absolute right-0 mt-3 w-80 liquid-glass-card rounded-[24px] shadow-lg overflow-hidden z-50 border border-white/40">
                                            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                                                <h3 className="font-semibold text-sm text-slate-800">Notifications</h3>
                                                {unreadCount > 0 && (
                                                    <button onClick={markAllRead} className="text-[10px] text-blue-500 hover:text-blue-600 font-medium">Mark all read</button>
                                                )}
                                            </div>
                                            <div className="max-h-80 overflow-y-auto">
                                                {notifications.length === 0 ? (
                                                    <div className="p-8 text-center text-slate-500 text-sm">No notifications yet</div>
                                                ) : (
                                                    notifications.map(notif => (
                                                        <div
                                                            key={notif.id}
                                                            onClick={() => markAsRead(notif.id, notif.action_url)}
                                                            className={`p-4 border-b border-slate-50 flex gap-3 cursor-pointer hover:bg-white/60 transition-colors ${!notif.is_read ? 'bg-blue-50/30' : ''}`}
                                                        >
                                                            <div className={`mt-0.5 w-2 h-2 rounded-full shrink-0 ${!notif.is_read ? 'bg-blue-500' : 'bg-transparent'}`}></div>
                                                            <div>
                                                                <h4 className={`text-sm ${!notif.is_read ? 'font-semibold text-slate-800' : 'font-medium text-slate-600'}`}>{notif.title}</h4>
                                                                <p className="text-xs text-slate-500 mt-1 leading-snug">{notif.message}</p>
                                                                <span className="text-[10px] text-slate-400 mt-2 block">{new Date(notif.created_at).toLocaleDateString()}</span>
                                                            </div>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <Link
                                    href="/dashboard"
                                    className="text-[12px] font-semibold text-slate-600 px-5 py-2 hover:text-slate-900 transition-all"
                                >
                                    Dashboard
                                </Link>
                                <button
                                    onClick={handleSignOut}
                                    className="bg-white/80 hover:bg-white text-slate-900 text-[12px] font-bold px-6 py-2.5 rounded-full transition-all border border-white/40 shadow-sm"
                                >
                                    Sign Out
                                </button>
                            </div>
                        )}
                    </div>
                    {/* Mobile Menu Button */}
                    <button
                        className="md:hidden p-2 mr-2 flex items-center gap-3"
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    >
                        {user && unreadCount > 0 && !isMobileMenuOpen && (
                            <span className="w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
                        )}
                        <span className="material-symbols-outlined text-slate-700">
                            {isMobileMenuOpen ? 'close' : 'menu'}
                        </span>
                    </button>
                </header>
            </div>

            {/* Mobile Menu Overlay */}
            {isMobileMenuOpen && (
                <div className="fixed inset-0 z-40 md:hidden">
                    <div
                        className="absolute inset-0 bg-black/20 backdrop-blur-sm"
                        onClick={() => setIsMobileMenuOpen(false)}
                    />
                    <div className="absolute top-20 left-4 right-4 liquid-glass-card rounded-[24px] p-6">
                        <nav className="flex flex-col gap-4 relative z-10">
                            {user && notifications.length > 0 && (
                                <div className="mb-2 pb-4 border-b border-slate-100">
                                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Recent Alerts</h3>
                                    {notifications.slice(0, 2).map(notif => (
                                        <div
                                            key={notif.id}
                                            onClick={() => markAsRead(notif.id, notif.action_url)}
                                            className="py-2 flex gap-3 cursor-pointer"
                                        >
                                            <div className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${!notif.is_read ? 'bg-blue-500' : 'bg-transparent'}`}></div>
                                            <div>
                                                <h4 className="text-sm font-medium text-slate-800">{notif.title}</h4>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <Link
                                className="text-base font-medium text-slate-700 hover:text-slate-900 transition-colors py-2 border-b border-slate-100"
                                href="/analysis"
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                Analyze
                            </Link>
                            <Link
                                className="text-base font-medium text-slate-700 hover:text-slate-900 transition-colors py-2 border-b border-slate-100"
                                href="/solutions"
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                Solutions
                            </Link>
                            <Link
                                className="text-base font-medium text-slate-700 hover:text-slate-900 transition-colors py-2 border-b border-slate-100"
                                href="/pricing"
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                Pricing
                            </Link>
                            <Link
                                className="text-base font-medium text-slate-700 hover:text-slate-900 transition-colors py-2 border-b border-slate-100"
                                href="/about"
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                About
                            </Link>
                            <Link
                                className="text-base font-medium text-slate-700 hover:text-slate-900 transition-colors py-2 border-b border-slate-100"
                                href="/contact"
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                Contact
                            </Link>
                            <Link
                                className="text-base font-medium text-slate-700 hover:text-slate-900 transition-colors py-2 border-b border-slate-100"
                                href="/blog"
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                Blog
                            </Link>
                            <div className="flex flex-col gap-3 pt-4">
                                {!user ? (
                                    <>
                                        <Link
                                            href="/login"
                                            className="text-center text-sm font-semibold text-slate-600 py-3 px-4 hover:text-slate-900 transition-all liquid-glass-button rounded-xl"
                                            onClick={() => setIsMobileMenuOpen(false)}
                                        >
                                            Login
                                        </Link>
                                        <Link
                                            href="/register"
                                            className="text-center bg-slate-900 text-white text-sm font-bold py-3 px-4 rounded-xl transition-all"
                                            onClick={() => setIsMobileMenuOpen(false)}
                                        >
                                            Get Started
                                        </Link>
                                    </>
                                ) : (
                                    <>
                                        <Link
                                            href="/dashboard"
                                            className="text-center text-sm font-semibold text-slate-600 py-3 px-4 hover:text-slate-900 transition-all liquid-glass-button rounded-xl"
                                            onClick={() => setIsMobileMenuOpen(false)}
                                        >
                                            Dashboard
                                        </Link>
                                        <button
                                            onClick={() => {
                                                setIsMobileMenuOpen(false);
                                                handleSignOut();
                                            }}
                                            className="text-center bg-slate-900 text-white text-sm font-bold py-3 px-4 rounded-xl transition-all"
                                        >
                                            Sign Out
                                        </button>
                                    </>
                                )}
                            </div>
                        </nav>
                    </div>
                </div>
            )}
        </>
    );
}
