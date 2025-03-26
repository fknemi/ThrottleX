"use client"
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export default function AddServicePage() {
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    baseUrl: "",
  });

  const router = useRouter();
  const { data, isPending } = authClient.useSession();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };




  useEffect(() => {
console.log(formData)
  },[formData])
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate required fields
    if (!formData.name.trim() || !formData.baseUrl.trim()) {
      setError("Name and Base URL are required fields");
      return;
    }

    // Validate URL format
    try {
      new URL(formData.baseUrl);
    } catch {
      setError("Please enter a valid URL (include http:// or https://)");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/internal/services/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create service");
      }

      router.push("/services");
    } catch (err) {
      console.error("Submission error:", err);
      setError(
        err instanceof Error ? err.message : "An unexpected error occurred"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isPending) return <div className="text-center py-8">Loading...</div>;

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6 text-center">Add New Backend Service</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4 text-center">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Service Name *
          </label>
          <input
            type="text"
            id="name"
            name="name"
            required
            minLength={2}
            value={formData.name}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label htmlFor="baseUrl" className="block text-sm font-medium text-gray-700 mb-1">
            Base URL *
          </label>
          <input
            type="url"
            id="baseUrl"
            name="baseUrl"
            required
            pattern="https?://.+"
            value={formData.baseUrl}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="https://example.com"
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className={`w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 transition-colors ${
            isSubmitting ? "opacity-50 cursor-not-allowed" : ""
          }`}
        >
          {isSubmitting ? "Creating Service..." : "Create Service"}
        </button>
      </form>
    </div>
  );
}
