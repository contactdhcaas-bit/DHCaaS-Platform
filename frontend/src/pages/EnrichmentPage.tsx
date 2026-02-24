// src/pages/EnrichmentPage.tsx
import React, { useState } from 'react';
import { MapPin, Globe, CheckCircle, Navigation, Zap, TrendingUp, Clock, Search, Home, Map } from 'lucide-react';

type TabType = 'verification' | 'geocoding' | 'autocomplete';

interface VerificationResult {
  input: {
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  verified: {
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  isValid: boolean;
  confidence: number;
}

interface GeocodeResult {
  address: string;
  latitude: number;
  longitude: number;
  accuracy: string;
}

const EnrichmentPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('verification');
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const [geocodeResult, setGeocodeResult] = useState<GeocodeResult | null>(null);

  // ===== ADDRESS VERIFICATION FORM STATE =====
  const [addressForm, setAddressForm] = useState({
    street: '',
    city: '',
    state: '',
    zip: '',
    country: 'Morocco',
  });

  // ===== GEOCODING FORM STATE =====
  const [geocodeAddress, setGeocodeAddress] = useState('');

  // ===== AUTOCOMPLETE STATE =====
  const [autocompleteQuery, setAutocompleteQuery] = useState('');
  const [autocompleteSuggestions, setAutocompleteSuggestions] = useState<string[]>([]);

  // ===== MOCK VERIFICATION =====
  const handleVerifyAddress = () => {
    // Simulate API call
    setTimeout(() => {
      setVerificationResult({
        input: { ...addressForm },
        verified: {
          street: addressForm.street.toUpperCase(),
          city: addressForm.city.toUpperCase(),
          state: addressForm.state.toUpperCase(),
          zip: addressForm.zip,
          country: addressForm.country,
        },
        isValid: true,
        confidence: 98.5,
      });
    }, 800);
  };

  // ===== MOCK GEOCODING =====
  const handleGeocode = () => {
    // Simulate API call
    setTimeout(() => {
      setGeocodeResult({
        address: geocodeAddress,
        latitude: 33.5731,
        longitude: -7.5898,
        accuracy: 'Rooftop',
      });
    }, 800);
  };

  // ===== MOCK AUTOCOMPLETE =====
  const handleAutocomplete = (query: string) => {
    setAutocompleteQuery(query);
    if (query.length > 2) {
      // Simulate API suggestions
      setAutocompleteSuggestions([
        `${query}, Casablanca, Morocco`,
        `${query}, Rabat, Morocco`,
        `${query}, Kenitra, Morocco`,
        `${query}, Marrakech, Morocco`,
      ]);
    } else {
      setAutocompleteSuggestions([]);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#0B1120] p-8 transition-colors duration-300">
      <div className="max-w-7xl mx-auto">
        {/* ===== HEADER ===== */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-600 to-teal-600 rounded-xl flex items-center justify-center shadow-lg">
              <Globe className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-slate-900 dark:text-white">
                Data Enrichment Suite
              </h1>
              <p className="text-lg text-slate-600 dark:text-gray-400 mt-1">
                Powered by <span className="font-semibold text-emerald-600">Smarty</span> & <span className="font-semibold text-blue-600">Google Maps</span>
              </p>
            </div>
          </div>
        </div>

        {/* ===== STATS BAR ===== */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-gray-400">Addresses Verified</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">12,450</p>
              </div>
              <CheckCircle className="w-10 h-10 text-emerald-600" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-gray-400">Accuracy Rate</p>
                <p className="text-2xl font-bold text-emerald-600 mt-1">99.8%</p>
              </div>
              <TrendingUp className="w-10 h-10 text-emerald-600" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-gray-400">API Latency</p>
                <p className="text-2xl font-bold text-blue-600 mt-1">45ms</p>
              </div>
              <Zap className="w-10 h-10 text-blue-600" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-gray-400">Uptime</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">99.99%</p>
              </div>
              <Clock className="w-10 h-10 text-slate-600" />
            </div>
          </div>
        </div>

        {/* ===== TABS NAVIGATION ===== */}
        <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-2xl shadow-sm overflow-hidden">
          <div className="flex border-b border-slate-200 dark:border-gray-800">
            <button
              onClick={() => setActiveTab('verification')}
              className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 font-medium transition-all ${
                activeTab === 'verification'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white'
                  : 'text-slate-600 dark:text-gray-400 hover:bg-slate-100 dark:hover:bg-gray-800'
              }`}
            >
              <Home className="w-5 h-5" />
              Address Verification
            </button>
            <button
              onClick={() => setActiveTab('geocoding')}
              className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 font-medium transition-all ${
                activeTab === 'geocoding'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white'
                  : 'text-slate-600 dark:text-gray-400 hover:bg-slate-100 dark:hover:bg-gray-800'
              }`}
            >
              <MapPin className="w-5 h-5" />
              Geocoding
            </button>
            <button
              onClick={() => setActiveTab('autocomplete')}
              className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 font-medium transition-all ${
                activeTab === 'autocomplete'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white'
                  : 'text-slate-600 dark:text-gray-400 hover:bg-slate-100 dark:hover:bg-gray-800'
              }`}
            >
              <Search className="w-5 h-5" />
              Autocomplete
            </button>
          </div>

          {/* ===== TAB CONTENT ===== */}
          <div className="p-8">
            {/* ===== ADDRESS VERIFICATION TAB ===== */}
            {activeTab === 'verification' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                    Verify & Standardize Addresses
                  </h2>
                  <p className="text-slate-600 dark:text-gray-400">
                    Validate addresses using USPS, Royal Mail, and international postal databases
                  </p>
                </div>

                {/* Input Form */}
                <div className="bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">
                        Street Address
                      </label>
                      <input
                        type="text"
                        value={addressForm.street}
                        onChange={(e) => setAddressForm({ ...addressForm, street: e.target.value })}
                        placeholder="123 Main Street"
                        className="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-slate-300 dark:border-gray-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-emerald-600 outline-none transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">
                        City
                      </label>
                      <input
                        type="text"
                        value={addressForm.city}
                        onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                        placeholder="Casablanca"
                        className="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-slate-300 dark:border-gray-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-emerald-600 outline-none transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">
                        State/Province
                      </label>
                      <input
                        type="text"
                        value={addressForm.state}
                        onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                        placeholder="Grand Casablanca"
                        className="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-slate-300 dark:border-gray-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-emerald-600 outline-none transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">
                        Zip/Postal Code
                      </label>
                      <input
                        type="text"
                        value={addressForm.zip}
                        onChange={(e) => setAddressForm({ ...addressForm, zip: e.target.value })}
                        placeholder="20000"
                        className="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-slate-300 dark:border-gray-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-emerald-600 outline-none transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">
                        Country
                      </label>
                      <select
                        value={addressForm.country}
                        onChange={(e) => setAddressForm({ ...addressForm, country: e.target.value })}
                        className="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-slate-300 dark:border-gray-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-600 outline-none transition-all"
                      >
                        <option>Morocco</option>
                        <option>United States</option>
                        <option>United Kingdom</option>
                        <option>France</option>
                        <option>Canada</option>
                      </select>
                    </div>
                  </div>

                  <button
                    onClick={handleVerifyAddress}
                    className="mt-6 w-full px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-emerald-600/30 transition-all flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="w-5 h-5" />
                    Verify Address
                  </button>
                </div>

                {/* Verification Result */}
                {verificationResult && (
                  <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <CheckCircle className="w-8 h-8 text-emerald-600" />
                      <div>
                        <h3 className="text-xl font-bold text-emerald-900 dark:text-emerald-300">
                          Address Verified Successfully
                        </h3>
                        <p className="text-sm text-emerald-700 dark:text-emerald-400">
                          Confidence Score: {verificationResult.confidence}%
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Input Address */}
                      <div>
                        <h4 className="font-semibold text-slate-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                          <div className="w-2 h-2 bg-orange-600 rounded-full"></div>
                          Input Address
                        </h4>
                        <div className="space-y-1 text-sm text-slate-600 dark:text-gray-400">
                          <p>{verificationResult.input.street}</p>
                          <p>{verificationResult.input.city}, {verificationResult.input.state} {verificationResult.input.zip}</p>
                          <p>{verificationResult.input.country}</p>
                        </div>
                      </div>

                      {/* Verified Address */}
                      <div>
                        <h4 className="font-semibold text-emerald-700 dark:text-emerald-400 mb-3 flex items-center gap-2">
                          <CheckCircle className="w-4 h-4" />
                          Verified Address
                        </h4>
                        <div className="space-y-1 text-sm text-emerald-900 dark:text-emerald-300 font-medium">
                          <p>{verificationResult.verified.street}</p>
                          <p>{verificationResult.verified.city}, {verificationResult.verified.state} {verificationResult.verified.zip}</p>
                          <p>{verificationResult.verified.country}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ===== GEOCODING TAB ===== */}
            {activeTab === 'geocoding' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                    Convert Addresses to Coordinates
                  </h2>
                  <p className="text-slate-600 dark:text-gray-400">
                    Get precise latitude/longitude coordinates for any address worldwide
                  </p>
                </div>

                {/* Geocoding Input */}
                <div className="bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl p-6">
                  <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">
                    Enter Address
                  </label>
                  <input
                    type="text"
                    value={geocodeAddress}
                    onChange={(e) => setGeocodeAddress(e.target.value)}
                    placeholder="123 Boulevard Mohammed V, Casablanca, Morocco"
                    className="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-slate-300 dark:border-gray-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-emerald-600 outline-none transition-all mb-4"
                  />

                  <button
                    onClick={handleGeocode}
                    className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-blue-600/30 transition-all flex items-center justify-center gap-2"
                  >
                    <Navigation className="w-5 h-5" />
                    Get Coordinates
                  </button>
                </div>

                {/* Geocoding Result */}
                {geocodeResult && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Coordinates */}
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <MapPin className="w-8 h-8 text-blue-600" />
                        <h3 className="text-xl font-bold text-blue-900 dark:text-blue-300">
                          Coordinates Found
                        </h3>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <p className="text-sm text-slate-600 dark:text-gray-400 mb-1">Address</p>
                          <p className="text-slate-900 dark:text-white font-medium">{geocodeResult.address}</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-slate-600 dark:text-gray-400 mb-1">Latitude</p>
                            <p className="text-2xl font-bold text-blue-600">{geocodeResult.latitude}°</p>
                          </div>
                          <div>
                            <p className="text-sm text-slate-600 dark:text-gray-400 mb-1">Longitude</p>
                            <p className="text-2xl font-bold text-blue-600">{geocodeResult.longitude}°</p>
                          </div>
                        </div>

                        <div>
                          <p className="text-sm text-slate-600 dark:text-gray-400 mb-1">Accuracy</p>
                          <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-full text-sm font-medium">
                            <CheckCircle className="w-4 h-4" />
                            {geocodeResult.accuracy}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Map Placeholder */}
                    <div className="bg-slate-100 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl p-6 flex flex-col items-center justify-center">
                      <Map className="w-20 h-20 text-slate-400 mb-4" />
                      <p className="text-slate-600 dark:text-gray-400 text-center">
                        Map Preview
                      </p>
                      <p className="text-sm text-slate-500 dark:text-gray-500 text-center mt-2">
                        Integrate Google Maps API to show location
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ===== AUTOCOMPLETE TAB ===== */}
            {activeTab === 'autocomplete' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                    Address Autocomplete
                  </h2>
                  <p className="text-slate-600 dark:text-gray-400">
                    Real-time address suggestions as you type
                  </p>
                </div>

                {/* Autocomplete Input */}
                <div className="bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl p-6">
                  <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">
                    Start Typing an Address
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={autocompleteQuery}
                      onChange={(e) => handleAutocomplete(e.target.value)}
                      placeholder="Type at least 3 characters..."
                      className="w-full px-4 py-3 pr-12 bg-white dark:bg-gray-900 border border-slate-300 dark:border-gray-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-emerald-600 outline-none transition-all"
                    />
                    <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  </div>
                </div>

                {/* Suggestions */}
                {autocompleteSuggestions.length > 0 && (
                  <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl overflow-hidden shadow-lg">
                    <div className="px-4 py-3 bg-slate-100 dark:bg-gray-800 border-b border-slate-200 dark:border-gray-700">
                      <p className="text-sm font-medium text-slate-700 dark:text-gray-300">
                        {autocompleteSuggestions.length} Suggestions Found
                      </p>
                    </div>
                    <div className="divide-y divide-slate-200 dark:divide-gray-800">
                      {autocompleteSuggestions.map((suggestion, index) => (
                        <button
                          key={index}
                          onClick={() => setAutocompleteQuery(suggestion)}
                          className="w-full px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-gray-800 transition-colors flex items-center gap-3"
                        >
                          <MapPin className="w-5 h-5 text-emerald-600" />
                          <span className="text-slate-900 dark:text-white">{suggestion}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {autocompleteQuery.length > 0 && autocompleteQuery.length < 3 && (
                  <div className="text-center py-8">
                    <Search className="w-12 h-12 text-slate-300 dark:text-gray-700 mx-auto mb-3" />
                    <p className="text-slate-500 dark:text-gray-500">
                      Type at least 3 characters to see suggestions
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnrichmentPage;
