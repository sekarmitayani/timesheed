import { useQuery } from '@tanstack/react-query';
import { fetchApi } from '@/lib/api';

export interface SearchResponse {
    projects: {
        id: number;
        name: string;
        status: string;
    }[];
    users: {
        id: number;
        full_name: string;
        email: string;
        role: string;
    }[];
    tasks: {
        id: number;
        title: string;
        project_name: string;
        status: string;
        project_id: number;
    }[];
    contracts: {
        id: number;
        user_full_name: string;
        contract_type: string;
    }[];
    resource_requests: {
        id: number;
        role: string;
        status: string;
        project_name: string;
    }[];
    timesheets: {
        id: number;
        description: string;
        status: string;
    }[];
    payroll: {
        id: number;
        user_full_name: string;
        status: string;
    }[];
    audit_logs: {
        id: number;
        action: string;
        entity: string;
    }[];
}

export function useGlobalSearch(query: string) {
    return useQuery({
        queryKey: ['globalSearch', query],
        queryFn: async () => {
            if (!query || query.trim() === '') {
                return { projects: [], users: [], tasks: [], contracts: [], resource_requests: [], timesheets: [], payroll: [], audit_logs: [] } as SearchResponse;
            }
            const response = await fetchApi(`/search?q=${encodeURIComponent(query)}`);
            return response.data as SearchResponse;
        },
        enabled: query.trim().length > 0,
        staleTime: 60 * 1000,
    });
}
