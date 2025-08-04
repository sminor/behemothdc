// src/components/Footer.tsx
import { FaEnvelope, FaFacebookSquare, FaSignOutAlt } from 'react-icons/fa';
import Link from 'next/link';

interface FooterProps {
  isAuthenticated?: boolean;
  onLogout?: () => void;
}

const Footer: React.FC<FooterProps> = ({ isAuthenticated = false, onLogout }) => {
  return (
    <footer className="p-4 bg-[var(--background-footer)] text-[var(--text-main)] text-center mt-auto w-full">
      <div className="container max-w-screen-xl mx-auto">
        <div className="flex justify-center space-x-6 mb-2 text-sm">
          {[
            { href: 'mailto:behemothdartsclub@gmail.com', icon: FaEnvelope, label: 'Contact Us' },
            { href: 'https://www.facebook.com/behemothdartsclub/', icon: FaFacebookSquare, label: 'Facebook' },
          ].map(({ href, icon: Icon, label }, index) => (
            <Link
              key={index}
              href={href}
              target="_blank"
              className="flex items-center space-x-1 hover:text-[var(--text-highlight)]"
            >
              <Icon size={14} />
              <span>{label}</span>
            </Link>
          ))}
          {isAuthenticated && onLogout && (
            <button
              onClick={onLogout}
              className="flex items-center space-x-1 hover:text-[var(--text-highlight)]"
            >
              <FaSignOutAlt size={14} />
              <span>Logout</span>
            </button>
          )}
        </div>
        © {new Date().getFullYear()} Behemoth Dart Club. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;