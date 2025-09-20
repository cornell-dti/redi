"use client"; // for using useState

import { apiAddEmail, getEmails } from "@/api/api";
import Link from "next/link";
import React, { useState } from "react";

export default function Home() {
  const [email, setEmail] = useState("");
  const [emails, setEmails] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    setError(null);
    try {
      // first check existing emails for duplicates
      const existingEmails = await getEmails();

      const emailExists = existingEmails.some(
        (existingEmail) => existingEmail.toLowerCase() === email.toLowerCase()
      );

      if (emailExists) {
        setError("This email is already registered!");
        setLoading(false);
        return;
      }

      await apiAddEmail(email);
      setEmails((prev) => [...prev, email]); // update UI optimistically
      setEmail(""); // clear input
      alert("Email added successfully!");
    } catch {
      setError("Failed to add email");
    } finally {
      setLoading(false);
    }
  };

  const fetchEmails = async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await getEmails();
      setEmails(list);
    } catch {
      setError("Failed to load emails");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-between min-h-screen p-4 md:p-8 bg-[url(/background.png)] bg-cover bg-center">
      <div className="flex justify-between w-full">
        <p className="text-[20px] md:text-[24px] text-white">
          Launching 11.11.25
        </p>

        <Link
          href="https://www.instagram.com/redi.match/"
          target="_blank"
          className="p-2 text-white"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-6 h-6"
          >
            <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
            <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
            <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
          </svg>
        </Link>
      </div>

      <main className="flex flex-col gap-8 w-full">
        <div className="flex flex-col items-center justify-center gap-4">
          <img src="/logo.svg" alt="Redi app logo" className="w-24 h-24" />
          <h1 className="text-4xl leading-14 text-center md:leading-22 md:text-7xl text-white">
            Cornell has 15,000 students.
            <br />
            Each week, find the right 3.
          </h1>
          <h2 className="text-xl md:text-3xl text-white opacity-70">
            Redi is Cornell's first dating app.
          </h2>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex relative w-full md:w-fit md:m-auto"
        >
          <input
            type="email"
            placeholder="ezra123@cornell.edu"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="rounded-full h-[64px] md:h-[70px] p-1 pl-6 bg-white w-full md:w-[600px] text-[16px] md:text-[20px] placeholder:opacity-50 placeholder:text-black focus:[box-shadow:0_0_0_5px_rgba(255_255_255_/_50%)] focus:outline-none text-black transition"
          />
          <button
            type="submit"
            className="bg-[linear-gradient(135.7deg,_#000000_0%,_#333333_100.01%)] text-white rounded-full px-6 py-4 text-[16px] md:text-[20px] absolute right-1 top-1 cursor-pointer transform 
            hover:-translate-y-1.5 hover:[box-shadow:0_6px_0_0_rgba(0_0_0_/_60%)] hover:opacity-90
            focus-visible:-translate-y-1.5 focus-visible:[box-shadow:0_6px_0_0_rgba(0_0_0_/_60%)] focus-visible:opacity-90
            focus:outline-none
            active:-translate-y-1 active:[box-shadow:0_4px_0_0_rgba(0_0_0_/_60%)] active:opacity-95
            transition focus-visible:outline-[#006BFF]"
          >
            Join waitlist
          </button>
        </form>
      </main>

      <div className="flex gap-6 justify-center md:[&>div]:w-[200px]">
        <div className="flex flex-col gap-2 items-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-8 h-8"
          >
            <path d="M14 21v-3a2 2 0 0 0-4 0v3" />
            <path d="M18 5v16" />
            <path d="m4 6 7.106-3.79a2 2 0 0 1 1.788 0L20 6" />
            <path d="m6 11-3.52 2.147a1 1 0 0 0-.48.854V19a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-5a1 1 0 0 0-.48-.853L18 11" />
            <path d="M6 5v16" />
            <circle cx="12" cy="9" r="2" />
          </svg>

          <p className="text-[16px] md:text-[20px] text-center">
            Campus-specific prompts
          </p>
        </div>

        <div className="flex flex-col gap-2 items-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-8 h-8"
          >
            <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
            <path d="m9 12 2 2 4-4" />
          </svg>

          <p className="text-[16px] md:text-[20px] text-center">
            No risk, private matches
          </p>
        </div>

        <div className="flex flex-col gap-2 items-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-8 h-8"
          >
            <path d="M8 2v4" />
            <path d="M16 2v4" />
            <rect width="18" height="18" x="3" y="4" rx="2" />
            <path d="M3 10h18" />
            <path d="M8 14h.01" />
            <path d="M12 14h.01" />
            <path d="M16 14h.01" />
            <path d="M8 18h.01" />
            <path d="M12 18h.01" />
            <path d="M16 18h.01" />
          </svg>

          <p className="text-[16px] md:text-[20px] text-center">
            New matches every Friday
          </p>
        </div>
      </div>

      {/* <button
        onClick={fetchEmails}
        disabled={loading}
        className={`mt-6 text-white rounded-md px-6 py-2 transition ${
          loading
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-blue-600 hover:bg-green-700"
        }`}
      >
        {loading ? "Loading emails..." : "Get emails"}
      </button> */}

      {/* {emails.length > 0 && (
        <p className="mt-4 max-w-md break-words">{emails.join(" ")}</p>
      )}
      {error && (
        <p className="mt-4 max-w-md break-words text-red-500">{error}</p>
      )} */}
    </div>
  );
}
