'use client';
import Footer from '@/components/Footer';
import Announcement from '@/components/Announcement';
import NavBar from '@/components/NavBar';

const Home = () => {
  return (
    <div className="flex flex-col items-center min-h-screen">
      {/* NavBar (Full-width, outside wrapper) */}
      <NavBar currentPage="home" />

      {/* Global Page Wrapper for content */}
      <div className="w-full max-w-screen-xl mx-auto px-4">
        {/* Announcement - Always visible */}
        <section className="w-full p-4">
          <Announcement page="home" autoplayDelay={6000} />
        </section>
      </div> {/* End of Global Wrapper */}

      {/* Footer (Full-width) */}
      <Footer />
    </div>
  );
};

export default Home;