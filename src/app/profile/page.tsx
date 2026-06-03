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
            <div className="flex items-center justify-center h-[50vh]">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-4 animate-in fade-in duration-500 pb-6">
            <PageHeader 
                title="User Profile" 
                description="Manage your personal information and security settings." 
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-1">
                {/* Left Column - Sidebar profile */}
                <div className="lg:col-span-1">
                    <ProfileSidebar profile={profile} />
                </div>

                {/* Right Column - Details */}
                <div className="lg:col-span-2 flex flex-col gap-4">
                    <PersonalInfoCard 
                        profile={profile} 
                        onSave={updateProfile}
                        isSaving={isUpdatingProfile}
                    />
                    
                    <AccountDetailsCard profile={profile} />
                    
                    <SecurityCard 
                        onChangePassword={changePassword}
                        isChangingPassword={isChangingPassword}
                    />
                </div>
            </div>
        </div>
    );
}
