import React, { useEffect, useState } from 'react';
import { TableOfContents, Content } from '@/components/TableOfContents'; // Adjust import path as needed

const ClientSideLink: React.FC = () => {
  const [isClient, setIsClient] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    setIsClient(true);
    if (typeof window !== 'undefined') {
      const userAgent = navigator.userAgent;
      setIsAndroid(/android/i.test(userAgent));
      setIsIOS(/iPad|iPhone|iPod/.test(userAgent));
    }
  }, []); // Empty dependency array to run once on mount

  return (
    <>
      {isClient && // Only render this part if we are on the client side
        (isAndroid ? (
          <a href="https://play.google.com/store/apps/details?id=com.arachnid.bslive" target="_blank" rel="noopener noreferrer" className="text-[var(--text-link)]">
            Google Play Store
          </a>
        ) : isIOS ? (
          <a href="https://apps.apple.com/us/app/bullshooter-live/id717480327" target="_blank" rel="noopener noreferrer" className="text-[var(--text-link)]">
            Apple App Store
          </a>
        ) : (
          <span>Apple App Store or Google Play Store</span>
        ))}
    </>
  );
};

const newPlayerInfo: Content[] = [
  {
    id: "welcome",
    title: "Welcome!",
    content: (
      <p>
        We're so excited to have you join us! Whether you're brand new to darts or just new to our events, we want you to feel right at home. Our goal is for everyone to have a great time, no matter your skill level.
      </p>
    ),
  },
  {
    id: "when-to-arrive",
    title: "When to Arrive",
    content: (
      <p>
        To help everything run smoothly, please plan to arrive at least 30 minutes before sign-ups start. This gives you time to settle in, meet some friendly faces, and get any questions answered before the action begins.
      </p>
    ),
  },
  {
    id: "bullshooter-app",
    title: "Get the Bullshooter Live App",
    content: (
      <p>
        Before you arrive, make sure to download the Bullshooter Live app from the{' '}
        <ClientSideLink />. Once you've got it, sign up for an account—it'll make things much easier on game day!
      </p>
    ),
  },
  {
    id: "bring-darts",
    title: "Bring Your Darts (or Use Ours!)",
    content: (
      <p>
        If you have your own soft tip darts, feel free to bring them along! Just make sure they weigh 20 grams or less. No darts? No problem! We'll have house darts available for you to use.
      </p>
    ),
  },
  {
    id: "get-rated",
    title: "New to Our Tournaments? Let's Get You Rated!",
    content: (
      <>
        <p>
          If this is your first time playing in one of our tournaments, we'll need to get a rating for you. Don't worry—this is super simple! We'll usually have you play a few warm-up games with another player before the tournament starts to help us place you correctly and ensure fair and fun matches for everyone.
        </p>
        <p>
          If you've played before and already know your PPD (Points Per Dart) or MPR (Marks Per Round) numbers, let us know! We can often use that information to get you set up even faster.
        </p>
      </>
    ),
  },
  {
    id: "bullshooter-existing",
    title: "Already Using the Bullshooter App?",
    content: (
      <p>
        That's awesome! If you've been playing online matches through the Bullshooter Live app, we can often pull your rating directly from there. Just let us know, and we'll take care of the rest!
      </p>
    ),
  },
  {
    id: "no-partner",
    title: "No Partner? No Worries!",
    content: (
      <p>
        If you're worried about not having a partner or being new to the game, don't stress! We're all about having fun and making new friends. Many of our events can pair you up with a partner, and there are always people happy to help if you need tips or guidance.
      </p>
    ),
  },
  {
    id: "first-time",
    title: "First Time? Let Us Know!",
    content: (
      <p>
        If this is your first time, please let us know! We love welcoming new players, and our community is super supportive. Everyone was new once, and you'll find plenty of folks eager to show you the ropes.
      </p>
    ),
  },
  {
    id: "have-fun",
    title: "Most Important: Have Fun!",
    content: (
      <>
        <p>
          Win or lose, the main thing is to enjoy yourself. We're here to share a love of darts, connect with great people, and make sure everyone leaves with a smile.
        </p>
        <p>
          If you have any questions, don't hesitate to ask—before, during, or after the event. We can't wait to see you there!
        </p>
      </>
    ),
  },
];

export const NewPlayerModal: React.FC = () => {
  return <TableOfContents items={newPlayerInfo} />;
};

export default NewPlayerModal;