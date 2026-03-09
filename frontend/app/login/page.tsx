"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

export default function LoginPage() {
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [view, setView] = useState("login")
    const [otp, setOtp] = useState("")
    const [newPassword, setNewPassword] = useState("")
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    const handleLogin = async () => {
        const formData = new URLSearchParams()
        formData.append("username", email)
        formData.append("password", password)
        formData.append("grant_type", "password")

        try {
            const res = await fetch("http://localhost:8000/token", {
                method: "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                body: formData
            })

            if (res.ok) {
                const data = await res.json()
                localStorage.setItem("token", data.access_token)
                router.push("/inventory")
            } else {
                alert("Login Failed: Invalid credentials")
            }
        } catch (error) {
            console.error("Login error:", error)
            alert("System Error: " + error)
        }
    }

    const handleForgotPassword = async () => {
        try {
            const res = await fetch("http://localhost:8000/forgot-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email })
            })
            if (res.ok) {
                setView("enter_otp")
            } else {
                const data = await res.json()
                alert(data.detail || "Request failed")
            }
        } catch (error) {
            alert("System Error: " + error)
        }
    }

    const handleResetPassword = async () => {
        try {
            const res = await fetch("http://localhost:8000/reset-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, otp, new_password: newPassword })
            })
            if (res.ok) {
                alert("Password reset successfully. Please log in.")
                setView("login")
                setPassword("")
                setOtp("")
                setNewPassword("")
            } else {
                const data = await res.json()
                alert(data.detail || "Reset failed")
            }
        } catch (error) {
            alert("System Error: " + error)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        if (view === "login") await handleLogin()
        else if (view === "forgot_password") await handleForgotPassword()
        else if (view === "enter_otp") await handleResetPassword()
        setLoading(false)
    }

    const inputStyle = "w-full px-4 py-2.5 bg-white dark:bg-slate-950 border border-gray-300 dark:border-slate-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all placeholder-gray-400";

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-950 transition-colors duration-300">
            <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-xl w-full max-w-md border border-gray-100 dark:border-slate-800">
                <div className="text-center mb-8">
                    <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                        <span className="text-white font-bold text-2xl">N</span>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
                        {view === "login" ? "Welcome back" : view === "forgot_password" ? "Reset Password" : "Enter Security Code"}
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-slate-400 mt-2">
                        {view === "login" ? "Sign in to your Nexus ERP account" : view === "forgot_password" ? "Enter your email to receive a 6-digit code" : "Check your email for the OTP"}
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* EMAIL (Always visible unless entering OTP, wait actually visible in all 3, but locked maybe? Let's just keep it editable for step 1 and 2, and readonly for step 3) */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">Email Address</label>
                        <input
                            type="email"
                            className={inputStyle}
                            placeholder="admin@nexus.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            disabled={view === "enter_otp"}
                            required
                        />
                    </div>

                    {/* LOGIN VIEW ONLY */}
                    {view === "login" && (
                        <>
                            <div>
                                <div className="flex justify-between items-center mb-1.5">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">Password</label>
                                    <button type="button" onClick={() => setView('forgot_password')} className="text-sm font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors">
                                        Forgot Password?
                                    </button>
                                </div>
                                <input
                                    type="password"
                                    className={inputStyle}
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>
                            <button type="submit" disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl shadow-sm transition-all duration-200">
                                {loading ? "Signing In..." : "Sign In"}
                            </button>
                        </>
                    )}

                    {/* FORGOT PASSWORD VIEW ONLY */}
                    {view === "forgot_password" && (
                        <>
                            <button type="submit" disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl shadow-sm transition-all duration-200">
                                {loading ? "Sending..." : "Send Reset Link"}
                            </button>
                            <button type="button" onClick={() => setView('login')} className="w-full text-center text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors">
                                Back to Login
                            </button>
                        </>
                    )}

                    {/* ENTER OTP VIEW ONLY */}
                    {view === "enter_otp" && (
                        <>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">6-Digit Code</label>
                                <input
                                    type="text"
                                    maxLength={6}
                                    className={inputStyle + " font-mono tracking-widest text-center text-lg"}
                                    placeholder="000000"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">New Password</label>
                                <input
                                    type="password"
                                    className={inputStyle}
                                    placeholder="••••••••"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    required
                                />
                            </div>
                            <button type="submit" disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl shadow-sm transition-all duration-200">
                                {loading ? "Resetting..." : "Reset Password"}
                            </button>
                            <button type="button" onClick={() => setView('login')} className="w-full text-center text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors">
                                Cancel & Back to Login
                            </button>
                        </>
                    )}

                    {view === "login" && (
                        <div className="text-center text-xs text-gray-500 dark:text-slate-500 mt-6 pt-4 border-t border-gray-100 dark:border-slate-800 space-y-3">
                            <p>
                                <Link href="/signup" className="text-sm font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors">
                                    Don't have an account? Sign Up
                                </Link>
                            </p>
                            <p>Demo Admin: admin@nexus.com / password123</p>
                        </div>
                    )}
                </form>
            </div>
        </div>
    )
}
