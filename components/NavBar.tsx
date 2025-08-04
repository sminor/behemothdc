'use client';
import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { FaMapMarkerAlt, FaUsers, FaChartBar, FaBullseye } from 'react-icons/fa';
import Button from '@/components/Button';

interface NavBarProps {
  currentPage: string;
  hideButtons?: boolean;
}

const NavBar: React.FC<NavBarProps> = ({ currentPage, hideButtons = false }) => {
  const navLinks = [
    { href: '/locations', label: 'Locations', icon: FaMapMarkerAlt },
    { href: '/events', label: 'Events', icon: FaBullseye },
    { href: '/leagues', label: 'Leagues', icon: FaUsers },
    { href: '/stats', label: 'Stats', icon: FaChartBar },
  ];

  return (
    <div className="w-full">
      {!hideButtons && (
        <nav className="bg-[var(--background-navbar)] p-2">
          <div className="container max-w-screen-xl mx-auto flex justify-center gap-2 px-0">
            {navLinks.map(({ href, label, icon: Icon }) => {
              const isCurrentPage = label.toLowerCase() === currentPage.toLowerCase();

              return (
                <div key={label} className="flex-1">
                  {isCurrentPage ? (
                    <Button
                      icon={<Icon size={20} />}
                      className="w-[calc(100%-4px)] h-[calc(100%-4px)] py-2 mx-auto flex-1 border-2 border-[var(--button-text-inverted)] text-[var(--button-text-inverted)] bg-[var(--button-background-inverted)] hover:opacity-100"
                    >
                      {label}
                    </Button>
                  ) : (
                    <Link href={href} passHref className="flex-1">
                      <Button
                        icon={<Icon size={20} />}
                        className="w-full py-2 flex-1"
                      >
                        {label}
                      </Button>
                    </Link>
                  )}
                </div>
              );
            })}
          </div>
        </nav>
      )}
      <div className="bg-[var(--background-main)] p-2">
        <div className="container max-w-screen-xl mx-auto">
          <Link href="/" className="block">
            <div className="relative h-48 w-48 mx-auto md:h-72 md:w-72 lg:h-96 lg:w-96 xl:h-[30rem] xl:w-[30rem]">
              <Image
                src="/bdc-logo.png"
                alt="Behemoth Darts Club official logo"
                fill
                className="object-contain"
                priority
                sizes="(max-width: 767px) 192px, (max-width: 1023px) 288px, (max-width: 1279px) 384px, 480px"
              />
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NavBar;