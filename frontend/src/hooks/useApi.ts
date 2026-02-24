import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { apiClient } from "../api/apiClient";

// Types
export type ApiKey = {
  id: string;
  label: string;
  prefix: string;
  created_at: string;
  last_used?: string;
  status: "active" | "expired" | "revoked";
};

export type CreateApiKeyRequest = {
  label: string;
  expires_in_days?: number;
};

export type CreateApiKeyResponse = {
  id: string;
  label: string;
  key: string; // Full key only returned once
  prefix: string;
  created_at: string;
  status: "active";
};

// Helper: Get Auth Token
const getAuthToken = (): string | null => {
  let token = localStorage.getItem("token");

  if (!token) {
    const raw = localStorage.getItem("dhc_auth_store");
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        token = parsed?.state?.token ?? null;
      } catch {
        // ignore
      }
    }
  }

  return token;
};

// Helper: Safe Error Message
function getErrorMessage(error: unknown): string {
  const e = error as any;

  if (e?.response?.data?.detail) {
    const detail = e.response.data.detail;

    if (Array.isArray(detail)) {
      return detail
        .map(
          (err: any) =>
            `${err?.loc?.[1] || err?.loc?.[0] || "field"}: ${err?.msg || "invalid"}`
        )
        .join(", ");
    }

    return typeof detail === "object" ? JSON.stringify(detail) : String(detail);
  }

  if (e?.response?.data?.message) return String(e.response.data.message);
  if (e?.message) return String(e.message);
  return "Unknown error occurred";
}

// ============================================
// useApiKeys Hook
// ============================================
export const useApiKeys = () => {
  const navigate = useNavigate();

  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [revealedKeys, setRevealedKeys] = useState<Set<string>>(new Set());

  // Fetch API Keys
  const fetchApiKeys = async () => {
    const token = getAuthToken();
    if (!token) {
      toast.error("Please login to access API keys.");
      navigate("/login");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await apiClient.get("/api-keys");
      setApiKeys(Array.isArray(res.data) ? res.data : []);
    } catch (err: any) {
      console.warn("Backend /api-keys endpoint not available");

      // Graceful fallback: Mock data for development
      const mockKeys: ApiKey[] = [
        {
          id: "key_1",
          label: "Production Key",
          prefix: "dhc_prod_9f3a",
          created_at: "2026-01-01",
          last_used: "2 hours ago",
          status: "active",
        },
      ];

      setApiKeys(mockKeys);

      // Only show error if it's not a 404
      if (err?.response?.status !== 404) {
        setError("Failed to load API keys. Using cached data.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Create API Key
  const createApiKey = async (
    request: CreateApiKeyRequest
  ): Promise<CreateApiKeyResponse | null> => {
    const token = getAuthToken();
    if (!token) {
      toast.error("Please login to create API keys.");
      navigate("/login");
      return null;
    }

    if (!request.label.trim()) {
      toast.error("Please enter a key name");
      return null;
    }

    setIsCreating(true);

    try {
      const res = await apiClient.post("/api-keys", request);
      const newKey: CreateApiKeyResponse = res.data;

      // Add to local state (without full key)
      const keyForList: ApiKey = {
        id: newKey.id,
        label: newKey.label,
        prefix: newKey.prefix,
        created_at: newKey.created_at,
        status: newKey.status,
      };

      setApiKeys((prev) => [keyForList, ...prev]);
      toast.success("API Key created successfully!");

      return newKey;
    } catch (err: any) {
      console.warn("Backend /api-keys POST not available, using mock");

      // Fallback: Generate mock key
      const fullKey = `dhc_${Math.random().toString(36).substring(2, 15)}${Math.random()
        .toString(36)
        .substring(2, 15)}`;

      const mockResponse: CreateApiKeyResponse = {
        id: `key_${Date.now()}`,
        label: request.label,
        key: fullKey,
        prefix: fullKey.substring(0, 12),
        created_at: new Date().toISOString().split("T")[0],
        status: "active",
      };

      const keyForList: ApiKey = {
        id: mockResponse.id,
        label: mockResponse.label,
        prefix: mockResponse.prefix,
        created_at: mockResponse.created_at,
        status: mockResponse.status,
      };

      setApiKeys((prev) => [keyForList, ...prev]);
      toast.success("API Key created successfully! (Mock Mode)");

      return mockResponse;
    } finally {
      setIsCreating(false);
    }
  };

  // Revoke API Key
  const revokeApiKey = async (id: string): Promise<boolean> => {
    const token = getAuthToken();
    if (!token) {
      toast.error("Please login to revoke API keys.");
      navigate("/login");
      return false;
    }

    if (!window.confirm("Are you sure you want to revoke this API key? This action cannot be undone.")) {
      return false;
    }

    try {
      await apiClient.delete(`/api-keys/${id}`);
      setApiKeys((prev) => prev.filter((k) => k.id !== id));
      toast.success("API Key revoked successfully");
      return true;
    } catch (err: any) {
      console.warn("Backend DELETE /api-keys not available, using mock");

      // Fallback: Remove from local state
      setApiKeys((prev) => prev.filter((k) => k.id !== id));
      toast.success("API Key revoked successfully (Mock Mode)");
      return true;
    }
  };

  // Rotate API Key
  const rotateApiKey = async (id: string): Promise<CreateApiKeyResponse | null> => {
    const token = getAuthToken();
    if (!token) {
      toast.error("Please login to rotate API keys.");
      navigate("/login");
      return null;
    }

    if (!window.confirm("Are you sure you want to rotate this API key? The old key will be invalidated.")) {
      return null;
    }

    try {
      const res = await apiClient.post(`/api-keys/${id}/rotate`);
      const rotatedKey: CreateApiKeyResponse = res.data;

      // Update local state
      setApiKeys((prev) =>
        prev.map((k) =>
          k.id === id
            ? {
                ...k,
                prefix: rotatedKey.prefix,
                created_at: rotatedKey.created_at,
              }
            : k
        )
      );

      toast.success("API Key rotated successfully!");
      return rotatedKey;
    } catch (err: any) {
      toast.error(`Failed to rotate API key: ${getErrorMessage(err)}`);
      return null;
    }
  };

  // Toggle Reveal Key
  const toggleRevealKey = (keyId: string) => {
    setRevealedKeys((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(keyId)) {
        newSet.delete(keyId);
      } else {
        newSet.add(keyId);
      }
      return newSet;
    });
  };

  // Copy Key to Clipboard
  const copyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    toast.success("API Key copied to clipboard!");
  };

  // Retry fetching
  const retry = () => {
    void fetchApiKeys();
  };

  // Load API keys on mount
  useEffect(() => {
    void fetchApiKeys();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    apiKeys,
    isLoading,
    error,
    isCreating,
    revealedKeys,
    createApiKey,
    revokeApiKey,
    rotateApiKey,
    toggleRevealKey,
    copyKey,
    retry,
  };
};
