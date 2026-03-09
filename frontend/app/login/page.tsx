"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

export default function LoginPage() {
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const router = useRouter()

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()

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

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-950 transition-colors duration-300">
            <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-xl w-full max-w-md border border-gray-100 dark:border-slate-800">
                <div className="text-center mb-8">
                    <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                        <span className="text-white font-bold text-2xl">N</span>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
                        Welcome back
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-slate-400 mt-2">
                        Sign in to your Nexus ERP account
                    </p>
                </div>

                <form onSubmit={handleLogin} className="space-y-5">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">Email Address</label>
                        <input
                            type="email"
                            className="w-full px-4 py-2.5 bg-white dark:bg-slate-950 border border-gray-300 dark:border-slate-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all placeholder-gray-400"
                            placeholder="admin@nexus.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">Password</label>
                        <input
                            type="password"
                            className="w-full px-4 py-2.5 bg-white dark:bg-slate-950 border border-gray-300 dark:border-slate-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all placeholder-gray-400"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 rounded-xl shadow-sm transition-all duration-200">
                        Sign In
                    </button>

                    <div className="text-center text-xs text-gray-500 dark:text-slate-500 mt-6 pt-4 border-t border-gray-100 dark:border-slate-800 space-y-3">
                        <p>
                            <Link href="/signup" className="text-sm font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors">
                                Don't have an account? Sign Up
                            </Link>
                        </p>
                        <p>Demo Admin: admin@nexus.com / password123</p>
                    </div>
                </form>
            </div>
        </div>
    )
}
