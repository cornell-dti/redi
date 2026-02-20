import Link from 'next/link';

export default function Home() {

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
            strokeWidth="2"
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
          <img
            src="/logo.png"
            alt="Redi app logo"
            className="w-20 h-20 sm:w-24 sm:h-24"
          />
          <h1 className="text-[26px] leading-9 text-center md:leading-22 md:text-7xl text-white">
            Cornell has 15,000 students.
            <br />
            Each week, find the right 3.
          </h1>
          <h2 className="text-xl md:text-3xl text-white opacity-70">
            Redi is Cornell&apos;s first dating app.
          </h2>
        </div>

        <div className="flex justify-center w-full md:w-fit md:m-auto">
          <a
            href="https://apps.apple.com/us/app/redi-love/id6754899018"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white text-black rounded-full px-8 py-4 text-[16px] md:text-[20px] cursor-pointer transform flex items-center gap-2
            hover:-translate-y-1.5 hover:[box-shadow:0_6px_0_0_rgba(255_255_255_/_40%)] hover:opacity-90
            focus-visible:-translate-y-1.5 focus-visible:[box-shadow:0_6px_0_0_rgba(255_255_255_/_40%)] focus-visible:opacity-90
            focus:outline-none
            active:-translate-y-1 active:[box-shadow:0_4px_0_0_rgba(255_255_255_/_40%)] active:opacity-95
            transition focus-visible:outline-[#006BFF]"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 814 1000" className="w-5 h-5 md:w-6 md:h-6 -translate-y-[1px]" fill="currentColor">
              <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76 0-103.7 40.8-165.9 40.8s-105-57.8-155.5-127.4C46 790.7 0 663 0 541.8c0-194.3 126.4-297.5 250.8-297.5 66.1 0 121.2 43.4 162.7 43.4 39.5 0 101.1-46 176.3-46 28.5 0 130.9 2.6 198.3 99.2zm-234-181.5c31.1-36.9 53.1-88.1 53.1-139.3 0-7.1-.6-14.3-1.9-20.1-50.6 1.9-110.8 33.7-147.1 75.8-28.5 32.4-55.1 83.6-55.1 135.5 0 7.8 1.3 15.6 1.9 18.1 3.2.6 8.4 1.3 13.6 1.3 45.4 0 102.5-30.4 135.5-71.3z" />
            </svg>
            Download on the App Store
          </a>
        </div>
      </main>
      <div className="flex flex-col gap-4 items-center">
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
              className="w-8 h-8 text-white"
            >
              <path d="M14 21v-3a2 2 0 0 0-4 0v3" />
              <path d="M18 5v16" />
              <path d="m4 6 7.106-3.79a2 2 0 0 1 1.788 0L20 6" />
              <path d="m6 11-3.52 2.147a1 1 0 0 0-.48.854V19a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-5a1 1 0 0 0-.48-.853L18 11" />
              <path d="M6 5v16" />
              <circle cx="12" cy="9" r="2" />
            </svg>

            <p className="text-[16px] md:text-[20px] text-center text-white">
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
              className="w-8 h-8 text-white"
            >
              <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
              <path d="m9 12 2 2 4-4" />
            </svg>

            <p className="text-[16px] md:text-[20px] text-center text-white">
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
              className="w-8 h-8 text-white"
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

            <p className="text-[16px] md:text-[20px] text-center text-white">
              New matches every Friday
            </p>
          </div>
        </div>

        <div className="flex gap-4 text-white text-sm md:text-base">
          <Link
            href="/terms"
            className="hover:underline opacity-80 hover:opacity-100 transition"
          >
            Terms & Conditions
          </Link>
          <span className="opacity-50">•</span>
          <Link
            href="/privacy"
            className="hover:underline opacity-80 hover:opacity-100 transition"
          >
            Privacy Policy
          </Link>
        </div>
      </div>
    </div>
  );
}
