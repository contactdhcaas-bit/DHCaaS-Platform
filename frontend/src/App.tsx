import React from "react";
import { BrowserRouter, Routes, Route, Link, Navigate } from "react-router-dom";
import { Layout } from "./components/layout/Layout";
import { UploadPage } from "./pages/Upload";
import { JobsPage } from "./pages/Jobs";
import { JobDetailsPage } from "./pages/JobDetails";

const Home: React.FC = () => {
  return (
    <>
      <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>
        Welcome
      </h1>
      <p style={{ color: "#475569" }}>
        Local UI shell is working (Sidebar + Header + Content).
      </p>

      <div style={{ marginTop: 16 }} className="space-x-4">
        <Link to="/upload" className="text-blue-600 hover:underline">
          Go to Upload
        </Link>
        <Link to="/jobs" className="text-blue-600 hover:underline">
          Go to Jobs
        </Link>
      </div>
    </>
  );
};

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/upload" element={<UploadPage />} />
          <Route path="/jobs" element={<JobsPage />} />
          <Route path="/jobs/:jobId" element={<JobDetailsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
};

export default App;
