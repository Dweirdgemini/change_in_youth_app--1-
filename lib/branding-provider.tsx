import React, { createContext, useContext, useEffect, useState } from "react";
import { trpc } from "./trpc";
import { useAuth } from "@/hooks/use-auth";

interface BrandingContextType {
  logoUrl: string | null;
  primaryColor: string;
  organizationName: string;
  loading: boolean;
}

const BrandingContext = createContext<BrandingContextType>({
  logoUrl: null,
  primaryColor: "#0a7ea4",
  organizationName: "Change In Youth",
  loading: true,
});

export function useBranding() {
  return useContext(BrandingContext);
}

export function BrandingProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const { data: organization, isLoading } = trpc.organizations.getMyOrganization.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const [branding, setBranding] = useState<BrandingContextType>({
    logoUrl: null,
    primaryColor: "#0a7ea4",
    organizationName: "Change In Youth",
    loading: true,
  });

  useEffect(() => {
    if (organization) {
      setBranding({
        logoUrl: (organization.logoUrl as string) || null,
        primaryColor: (organization.primaryColor as string) || "#0a7ea4",
        organizationName: (organization.name as string) || "Change In Youth",
        loading: false,
      });
    } else if (!isLoading) {
      setBranding({
        logoUrl: null,
        primaryColor: "#0a7ea4",
        organizationName: "Change In Youth",
        loading: false,
      });
    }
  }, [organization, isLoading]);

  return (
    <BrandingContext.Provider value={branding}>
      {children}
    </BrandingContext.Provider>
  );
}
