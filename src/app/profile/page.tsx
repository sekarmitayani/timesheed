"use client";

import { useProfileData } from "./hooks/useProfileData";
import { ProfileSidebar } from "./components/ProfileSidebar";
import { PersonalInfoCard } from "./components/PersonalInfoCard";
import { AccountDetailsCard } from "./components/AccountDetailsCard";
import { SecurityCard } from "./components/SecurityCard";
import { PageHeader } from "@/components/ai/ai-components";
import { Loader2 } from "lucide-react";

export default function ProfilePage() {
    const { profile, isLoading, updateProfile, isUpdatingProfile, changePassword, isChangingPassword } = useProfileData();

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-[calc(100vh-200px)]">
                <Loader2 className="h-8 w-8 animate-spin text-[#2568C1]" />
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-4 animate-in fade-in duration-500">
            <PageHeader 
                title="User Profile" 
                description="Manage your personal information and security settings." 
            />

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 lg:gap-6 pt-1">
                {/* Left Column - Sidebar profile & Account metadata */}
                <div className="sm:col-span-5 lg:col-span-4 flex flex-col gap-4">
                    <ProfileSidebar profile={profile} />
                    <AccountDetailsCard profile={profile} />
                </div>

                {/* Right Column - Details & Security */}
                <div className="sm:col-span-7 lg:col-span-8 flex flex-col gap-4">
                    <PersonalInfoCard 
                        profile={profile} 
                        onSave={updateProfile}
                        isSaving={isUpdatingProfile}
                    />
                    
                    <SecurityCard 
                        onChangePassword={changePassword}
                        isChangingPassword={isChangingPassword}
                    />
                </div>
            </div>
        </div>
    );
}
