import React from 'react';

interface RoundedButtonProps {
  onClick?: () => void;
  href?: string;
  target?: string;
  rel?: string;
  children: React.ReactNode;
  className?: string;
}

export default function RoundedButton({ onClick, href, target, rel, children, className = '' }: RoundedButtonProps) {
  const base = `bg-white text-black rounded-full px-8 py-4 text-[16px] cursor-pointer transform inline-flex items-center justify-center gap-2
    hover:-translate-y-1.5 hover:[box-shadow:0_6px_0_0_rgba(255_255_255_/_40%)] hover:opacity-90
    active:-translate-y-1 active:[box-shadow:0_4px_0_0_rgba(255_255_255_/_40%)] active:opacity-95
    transition focus:outline-none focus-visible:outline-[#006BFF] ${className}`;

  if (href) {
    return (
      <a href={href} target={target} rel={rel} className={base}>
        {children}
      </a>
    );
  }

  return (
    <button onClick={onClick} className={base}>
      {children}
    </button>
  );
}
