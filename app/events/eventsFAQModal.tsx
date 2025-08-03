import React from 'react';
import { TableOfContents, Content } from '@/components/TableOfContents'; // Adjust import path as needed

const faqInfo: Content[] = [
  {
    id: "signup-times",
    title: "What are the sign-up times?",
    content: (
      <p>Sign-up times vary by event. Be sure to check each event's details for specific times, and please arrive early, as we cannot accommodate late sign-ups.</p>
    ),
  },
  {
    id: "event-start-time",
    title: "What time does the event start?",
    content: (
      <p>We aim to start the first match 30 minutes after sign-ups close. Start times can vary depending on the number of participants, so please be patient as we set up the matches.</p>
    ),
  },
  {
    id: "how-to-register",
    title: "How do I register for events?",
    content: (
      <p>To register for an event, simply show up at the event location, give your name to the tournament operator, and pay your entry fee. Please note: We accept cash only.</p>
    ),
  },
  {
    id: "age-restrictions",
    title: "Are there age restrictions for tournaments?",
    content: (
      <p>We do not impose age restrictions for our tournaments. However, please check with the event venue directly, as many venues have age limits.</p>
    ),
  },
  {
    id: "beginners-play",
    title: "Can beginners play in tournaments?",
    content: (
      <p>Absolutely! We welcome players of all skill levels. Tournaments are a great way to learn, have fun, and meet fellow dart enthusiasts.</p>
    ),
  },
  {
    id: "what-to-bring",
    title: "What should I bring to the event?",
    content: (
      <p>Just bring your darts (if you have them), some cash for entry and board fees, and a positive attitude! Everything else you need will be provided at the event.</p>
    ),
  },
  {
    id: "cost-to-play",
    title: "How much does it cost to play?",
    content: (
      <p>Entry fees vary by event. Most events have a $10 per person entry fee. Depending on how many games you play, board fees will vary. Typically, players should budget around $25 for the entry fee and board fees combined. Check the event details for specific costs.</p>
    ),
  },
  {
    id: "bring-own-darts",
    title: "Do I need to bring my own darts?",
    content: (
      <p>You're welcome to bring your own soft-tip darts (under 20 grams). If you don't have your own, no worries! We provide house darts free of charge.</p>
    ),
  },
  {
    id: "no-partner",
    title: "What if I don't have a partner?",
    content: (
      <>
        <p>Not a problem! Most of our events allow individual sign-ups, and we'll pair you with a partner. Many events use a draw format, where lower-rated players are paired with higher-rated players to keep things fair and fun.</p>
        <p>For "Bring" events, you'll need to bring your own partner, and the team must meet the event's rating cap. For example, in a "20-point bring," the combined rating of both partners cannot exceed 20 points. Check each event's details for specific rating caps.</p>
      </>
    ),
  },
  {
    id: "tournament-types",
    title: "What types of tournaments do you offer?",
    content: (
      <ul>
        <li><strong>A/B Draw:</strong> Players are split into two skill groups, with one player from each group forming a team.</li>
        <li><strong>Blind Draw:</strong> Players are randomly paired with a partner.</li>
        <li><strong>Low Player Pick:</strong> Lower-rated players get to choose their partners.</li>
        <li><strong>Ladies Pick:</strong> Ladies have the opportunity to select their partners.</li>
        <li><strong>Partner Brings:</strong> You bring your own partner, subject to any rating caps for the event.</li>
      </ul>
    ),
  },
  {
    id: "game-types",
    title: "What are the common game types played?",
    content: (
      <ul>
        <li><strong>Cricket:</strong> A strategy game focusing on hitting specific numbers (15-20 and the bullseye) to score points.</li>
        <li><strong>x01 Games (e.g., 301, 501):</strong> Players start with a set score (e.g., 301 or 501) and work down to zero. In soft-tip tournaments, you typically do not need to double out. If a specific event requires a double or "master out", this will be noted in the event details.</li>
      </ul>
    ),
  },
  {
    id: "player-ratings",
    title: "How are player ratings handled?",
    content: (
      <p>New players usually play a few warm-up games to establish an initial rating. If you've used the Bullshooter app or played in other leagues, we can often use that data as a starting point. Our tournament software tracks performance over time to ensure ratings remain accurate and fair.</p>
    ),
  },
  {
    id: "handicap",
    title: "What is a handicap, and how does it work?",
    content: (
      <p>A handicap helps level the playing field by giving lower-rated players a slight advantage. Depending on the event, the handicap might adjust the starting score in x01 games or modify scoring rules in Cricket. Check event details for specific handicap information.</p>
    ),
  },
  {
    id: "rating-cap",
    title: "How does the rating cap work in 'Bring' events?",
    content: (
      <p>For "Bring" events, a rating cap sets the maximum combined rating for a team. For example, in a "20-point bring," the total of both players' ratings cannot exceed 20. This keeps the competition balanced and fair.</p>
    ),
  },
];

export const FAQModal: React.FC = () => {
  return <TableOfContents items={faqInfo} />;
};

export default FAQModal;