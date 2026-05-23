import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  deleteMaintenanceWindow,
  listMaintenanceByApp,
  type MaintenanceWindowInput,
  saveMaintenanceWindow,
} from "@/lib/api/maintenance";

export const maintenanceKeys = {
  all: ["maintenance"] as const,
  byApp: (appId: string) => [...maintenanceKeys.all, "app", appId] as const,
};

export function useMaintenanceByApp(appId: string | undefined) {
  return useQuery({
    queryKey: appId ? maintenanceKeys.byApp(appId) : ["disabled"],
    queryFn: () => listMaintenanceByApp(appId!),
    enabled: !!appId,
  });
}

export function useSaveMaintenanceWindow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: MaintenanceWindowInput) => saveMaintenanceWindow(input),
    onSuccess: (saved) => {
      qc.invalidateQueries({ queryKey: maintenanceKeys.byApp(saved.appId) });
    },
  });
}

export function useDeleteMaintenanceWindow(appId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteMaintenanceWindow(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: maintenanceKeys.byApp(appId) });
    },
  });
}
