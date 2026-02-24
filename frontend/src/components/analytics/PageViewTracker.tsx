import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export default function PageViewTracker() {
  const location = useLocation();

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (typeof window.gtag !== "function") return;

    const page_path = location.pathname + location.search;

    window.gtag("event", "page_view", {
      page_path,
      page_location: window.location.href,
      page_title: document.title,
    });
  }, [location.pathname, location.search]);

  return null;
}
