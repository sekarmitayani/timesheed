import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { profileService, UpdateProfilePayload, ChangePasswordPayload } from "@/lib/services/profile-service";
import { useAuthStore } from "@/store/useAuthStore";
import { toast } from "sonner";
import { User } from "@/lib/types";

export function useProfileData() {
    const queryClient = useQueryClient();
    const { user: authUser, impersonate } = useAuthStore(); // impersonate is a hacky way to update user in zustand store since there is no updateUser method
    
    // Use authUser as initial data if query is still loading to avoid flicker
    const { data: profile, isLoading } = useQuery({
        queryKey: ["profile"],
        queryFn: profileService.getProfile,
        initialData: authUser || undefined,
    });

    const updateProfileMutation = useMutation({
        mutationFn: (payload: UpdateProfilePayload) => profileService.updateProfile(payload),
        onMutate: async (newProfile) => {
            await queryClient.cancelQueries({ queryKey: ["profile"] });
            const previousProfile = queryClient.getQueryData<User>(["profile"]);
            
            // Optimistically update
            if (previousProfile) {
                queryClient.setQueryData<User>(["profile"], {
                    ...previousProfile,
                    ...newProfile,
                });
            }
            
            return { previousProfile };
        },
        onError: (err: any, _, context) => {
            if (context?.previousProfile) {
                queryClient.setQueryData(["profile"], context.previousProfile);
            }
            toast.error(err.message || "Failed to update profile");
        },
        onSettled: (data) => {
            queryClient.invalidateQueries({ queryKey: ["profile"] });
            if (data && typeof window !== "undefined") {
                // Update local storage and auth store
                const token = localStorage.getItem("token");
                if (token) {
                     // small hack to update user in authStore
                     // using existing login behavior might be hard, so we just manually update localStorage
                     const userToStore = {
                        ...data,
                        name: data.full_name,
                        username: data.email.split("@")[0],
                        password: "",
                        avatar: data.avatar || "",
                        department: data.department || "General",
                        position: data.position || "Staff",
                        hourlyRate: data.hourlyRate || 0,
                        joinDate: data.joinDate || new Date().toISOString().split("T")[0],
                        status: data.status || "active",
                     }
                     localStorage.setItem("user", JSON.stringify(userToStore));
                     // It would be better to have an `updateUser` action in useAuthStore, 
                     // but we can refresh to apply it across the app, or rely on other components reading from local storage on reload
                }
            }
        },
        onSuccess: () => {
            toast.success("Profile updated successfully");
        }
    });

    const changePasswordMutation = useMutation({
        mutationFn: (payload: ChangePasswordPayload) => profileService.changePassword(payload),
        onError: (err: any) => {
            toast.error(err.message || "Failed to change password");
        },
        onSuccess: () => {
            toast.success("Password changed successfully");
        }
    });

    return {
        profile,
        isLoading,
        updateProfile: updateProfileMutation.mutateAsync,
        isUpdatingProfile: updateProfileMutation.isPending,
        changePassword: changePasswordMutation.mutateAsync,
        isChangingPassword: changePasswordMutation.isPending,
    };
}
