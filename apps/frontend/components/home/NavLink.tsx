import { ReactNode } from 'react';
import Link from 'next/link';

interface NavLinkProps {
  icon: ReactNode;
  text: string;
  active?: boolean;
  href?: string;
}

export default function NavLink({ icon, text, active = false, href = '#' }: NavLinkProps) {
  const className = `flex items-center gap-2 px-1 py-1 text-base font-semibold transition-all duration-200 group
    ${active 
      ? 'text-slate-900' 
      : 'text-slate-500 hover:text-slate-900'
    }`;
  
  const content = (
    <>
      <span className={active ? 'text-[#FF6B3D]' : 'text-slate-400 group-hover:text-slate-600'}>
        {icon}
      </span>
      <span>{text}</span>
    </>
  );

  if (href === '#') {
    return (
      <a href={href} className={className}>
        {content}
      </a>
    );
  }

  return (
    <Link href={href} className={className}>
      {content}
    </Link>
  );
}

