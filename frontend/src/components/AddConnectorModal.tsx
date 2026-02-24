// src/components/AddConnectorModal.tsx
import React, { useState, useEffect } from 'react';
import { X, Database, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { createConnector, ConnectorCreateRequest } from '../services/api';

interface AddConnectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const AddConnectorModal: React.FC<AddConnectorModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    type: 'postgres' as 'postgres' | 'mysql',
    host: '',
    port: 5432,
    username: '',
    password: '',
    database: '',
    ssl: false,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: '',
        type: 'postgres',
        host: '',
        port: 5432,
        username: '',
        password: '',
        database: '',
        ssl: false,
      });
      setError(null);
      setSuccess(false);
    }
  }, [isOpen]);

  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      port: prev.type === 'postgres' ? 5432 : 3306,
    }));
  }, [formData.type]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === 'number'
          ? parseInt(value) || 0
          : type === 'checkbox'
          ? (e.target as HTMLInputElement).checked
          : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!formData.name.trim()) throw new Error('Connector name is required');
      if (!formData.host.trim()) throw new Error('Host is required');
      if (!formData.username.trim()) throw new Error('Username is required');
      if (!formData.password.trim()) throw new Error('Password is required');
      if (!formData.database.trim()) throw new Error('Database name is required');
      if (formData.port < 1 || formData.port > 65535)
        throw new Error('Port must be between 1 and 65535');

      const payload: ConnectorCreateRequest = {
        name: formData.name.trim(),
        type: formData.type,
        config: {
          host: formData.host.trim(),
          port: formData.port,
          username: formData.username.trim(),
          password: formData.password,
          database: formData.database.trim(),
          ssl: formData.ssl,
        },
      };

      await createConnector(payload);
      setSuccess(true);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1200);
    } catch (err: any) {
      setError(
        err.response?.data?.detail || err.message || 'Failed to create connector'
      );
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Surface */}
      <div className="relative bg-[#131B2C] border border-[#1E293B] rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#1E293B]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <Database className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-white font-bold text-lg">
                Add New Connector
              </h2>
              <p className="text-slate-400 text-xs mt-0.5">
                Connect to a PostgreSQL or MySQL database
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors p-1.5 hover:bg-[#1E293B] rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-6 space-y-5">

          {/* Error */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex items-start gap-3 shadow-lg shadow-red-500/10">
              <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
              <p className="text-red-300 text-sm font-medium">{error}</p>
            </div>
          )}

          {/* Success */}
          {success && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4 flex items-center gap-3 shadow-lg shadow-emerald-500/10">
              <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
              <p className="text-emerald-300 text-sm font-semibold">
                Connector created successfully!
              </p>
            </div>
          )}

          {/* Connector Name */}
          <div>
            <label className="block text-slate-400 text-sm font-semibold mb-2">
              Connector Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="e.g., Production PostgreSQL"
              className="w-full px-4 py-3 bg-[#0F172A] border border-[#1E293B] rounded-lg text-white text-sm placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
              required
            />
          </div>

          {/* Database Type */}
          <div>
            <label className="block text-slate-400 text-sm font-semibold mb-2">
              Database Type <span className="text-red-500">*</span>
            </label>
            <select
              name="type"
              value={formData.type}
              onChange={handleInputChange}
              className="w-full px-4 py-3 bg-[#0F172A] border border-[#1E293B] rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
            >
              <option value="postgres">PostgreSQL</option>
              <option value="mysql">MySQL</option>
            </select>
          </div>

          {/* Host + Port */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="block text-slate-400 text-sm font-semibold mb-2">
                Host <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="host"
                value={formData.host}
                onChange={handleInputChange}
                placeholder="localhost"
                className="w-full px-4 py-3 bg-[#0F172A] border border-[#1E293B] rounded-lg text-white text-sm placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                required
              />
            </div>
            <div>
              <label className="block text-slate-400 text-sm font-semibold mb-2">
                Port <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="port"
                value={formData.port}
                onChange={handleInputChange}
                min="1"
                max="65535"
                className="w-full px-4 py-3 bg-[#0F172A] border border-[#1E293B] rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                required
              />
            </div>
          </div>

          {/* Database Name */}
          <div>
            <label className="block text-slate-400 text-sm font-semibold mb-2">
              Database Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="database"
              value={formData.database}
              onChange={handleInputChange}
              placeholder="e.g., production_db"
              className="w-full px-4 py-3 bg-[#0F172A] border border-[#1E293B] rounded-lg text-white text-sm placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
              required
            />
          </div>

          {/* Username + Password */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 text-sm font-semibold mb-2">
                Username <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                placeholder="db_user"
                className="w-full px-4 py-3 bg-[#0F172A] border border-[#1E293B] rounded-lg text-white text-sm placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                required
              />
            </div>
            <div>
              <label className="block text-slate-400 text-sm font-semibold mb-2">
                Password <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="••••••••"
                className="w-full px-4 py-3 bg-[#0F172A] border border-[#1E293B] rounded-lg text-white text-sm placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                required
              />
            </div>
          </div>

          {/* SSL Toggle */}
          <div className="flex items-center gap-3 py-4 px-4 bg-[#0F172A] border border-[#1E293B] rounded-lg">
            <input
              type="checkbox"
              name="ssl"
              id="ssl"
              checked={formData.ssl}
              onChange={handleInputChange}
              className="w-4 h-4 accent-indigo-500 cursor-pointer rounded"
            />
            <label
              htmlFor="ssl"
              className="text-slate-300 text-sm font-medium cursor-pointer select-none"
            >
              Enable SSL/TLS encrypted connection
            </label>
          </div>

          {/* Footer Buttons */}
          <div className="flex gap-3 pt-3 border-t border-[#1E293B]">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-3 bg-transparent border border-[#1E293B] hover:border-[#2E3D4B] text-slate-400 hover:text-white rounded-lg text-sm font-semibold transition-all disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || success}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 disabled:opacity-50 text-white rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/30"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating...
                </>
              ) : success ? (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Created!
                </>
              ) : (
                'Create Connector'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddConnectorModal;
