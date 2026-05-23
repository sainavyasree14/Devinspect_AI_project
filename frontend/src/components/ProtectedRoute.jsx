import React, { useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext.jsx";

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, initialLoading, currentMode, switchMode } =
    useAuth();
  const location = useLocation();

  useEffect(() => {
    if (!initialLoading && isAuthenticated && !currentMode) {
      switchMode("student");
    }
  }, [initialLoading, isAuthenticated, currentMode, switchMode]);

  if (initialLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading DevInspect AI...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Navigate to="/login" state={{ from: location }} replace />
    );
  }

  return children;
};

export default ProtectedRoute;