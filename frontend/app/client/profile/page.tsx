"use client";

import { useAuth } from "@/lib/auth-context";
import { ProfileForm } from "@/components/profile-form";

export default function ProfilePage() {
    const { user } = useAuth();

    if (!user) return null;

    return (
        <div className="space-y-6">
            <h1 className="text-xl font-semibold">My Profile</h1>
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 shadow-sm">
                <div className="grid gap-4 text-sm sm:grid-cols-2">
                    <div>
                        <div className="text-xs uppercase text-slate-500">Name</div>
                        <div className="mt-1 font-medium text-slate-100">{user.name}</div>
                    </div>
                    <div>
                        <div className="text-xs uppercase text-slate-500">Email</div>
                        <div className="mt-1 font-medium text-slate-100">{user.email}</div>
                    </div>
                    <div>
                        <div className="text-xs uppercase text-slate-500">Role</div>
                        <div className="mt-1 font-medium text-slate-100">{user.role}</div>
                    </div>
                    {user.clientCompanyId && (
                        <div>
                            <div className="text-xs uppercase text-slate-500">Company ID</div>
                            <div className="mt-1 font-medium text-slate-100">{user.clientCompanyId}</div>
                        </div>
                    )}
                </div>
            </div>

            <ProfileForm />
        </div>
    );
}
