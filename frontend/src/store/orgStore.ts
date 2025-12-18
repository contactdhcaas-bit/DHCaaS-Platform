import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Organization } from '@/types';

interface OrgState {
  currentOrganization: Organization | null;
  organizations: Organization[];
  setCurrentOrganization: (org: Organization) => void;
  setOrganizations: (orgs: Organization[]) => void;
}

export const useOrgStore = create<OrgState>()(
  persist(
    (set) => ({
      currentOrganization: null,
      organizations: [],
      setCurrentOrganization: (org) => set({ currentOrganization: org }),
      setOrganizations: (orgs) => set({ organizations: orgs }),
    }),
    {
      name: 'dhcaas-org',
    }
  )
);
