import Link from "next/link";

export default function Footer() {
  return (
    <footer className="flex flex-col sm:flex-row justify-between items-center p-8 text-center border-t border-gray-300 mt-8 space-y-4 sm:space-y-0">
      <p className="text-gray-500 text-sm font-medium">
        Built by{' '}
        <a 
          href="https://maheshpaul.is-a.dev/" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="hover:text-[#3b82f6] transition-colors font-bold text-gray-700"
        >
          Mahesh Paul
        </a>
      </p>
      
      <div className="flex items-center gap-6">
        <a 
          href="https://github.com/maheshpaulj/KillTime" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="text-gray-500 text-sm font-medium hover:text-[#3b82f6] hover:underline transition-colors"
        >
          GitHub
        </a>
        <Link 
          href="/credits" 
          className="text-gray-500 text-sm font-medium hover:text-[#3b82f6] hover:underline transition-colors"
        >
          Credits
        </Link>
      </div>
    </footer>
  );
}