// "use client";

// import Link from "next/link";
// import { usePathname } from "next/navigation";

// const LINKS = [
//   { href: "/", label: "Dashboard" },
//   { href: "/live", label: "Live Inference" },
// ];

// export default function Nav() {
//   const pathname = usePathname();

//   return (
//     <nav className="sticky top-0 z-50 border-b border-slate-200 bg-white/70 backdrop-blur-md shadow-sm">
//       <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
        
//         {/* Left Side: Logo & Main Links */}
//         <div className="flex items-center gap-8">
//           <Link href="/" className="font-bold text-lg text-brand tracking-tight">
//             VisioDECT
//           </Link>
//           <div className="flex items-center gap-6">
//             {LINKS.map((link) => {
//               const active = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
//               return (
//                 <Link
//                   key={link.href}
//                   href={link.href}
//                   className={`text-sm transition-all ${
//                     active 
//                       ? "text-brand font-semibold" 
//                       : "text-slate-500 hover:text-slate-900"
//                   }`}
//                 >
//                   {link.label}
//                 </Link>
//               );
//             })}
//           </div>
//         </div>

//         {/* Right Side: Github Connection */}
//         <div className="flex items-center">
//           <a 
//             href="https://github.com/your-username/VisioDECT" 
//             target="_blank" 
//             rel="noopener noreferrer" 
//             className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors bg-slate-100 hover:bg-slate-200 px-4 py-2 rounded-lg"
//           >
//             <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
//               <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
//             </svg>
//             GitHub Repo
//           </a>
//         </div>
//       </div>
//     </nav>
//   );
// }

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Console" },
  { href: "#analytics", label: "Performance Metrics" },
  { href: "#kaggle", label: "Pipelines" },
  { href: "/live", label: "Live Deployment" },
];

export default function Nav() {
  const pathname = usePathname();

  return (
    <nav className="sticky top-4 z-50 max-w-7xl mx-auto px-4 sm:px-6">
      <div className="bg-slate-950/60 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl px-6 py-3 flex items-center justify-between">
        
        {/* Branding Node */}
        <div className="flex items-center gap-8">
          <Link href="/" className="font-black text-xl tracking-tighter bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
            VISIODECT <span className="text-xs font-mono tracking-widest text-slate-400 block sm:inline sm:ml-2">v2.1.0</span>
          </Link>
          
          {/* Subsystem Floating Links */}
          <div className="hidden md:flex items-center gap-6">
            {LINKS.map((link) => {
              const active = link.href === "/" ? pathname === "/" : pathname?.startsWith(link.href);
              return (
                <a
                  key={link.href}
                  href={link.href}
                  className={`text-xs font-semibold tracking-wide uppercase transition-all ${
                    active ? "text-blue-400" : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {link.label}
                </a>
              );
            })}
          </div>
        </div>

        {/* Global Action Nodes */}
        <div className="flex items-center gap-3">
          <a
            href="https://github.com/your-username/VisioDECT"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-xs font-bold tracking-wider uppercase text-slate-300 bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-2 rounded-xl transition-all"
          >
            <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
            </svg>
            Repository
          </a>
        </div>
      </div>
    </nav>
  );
}