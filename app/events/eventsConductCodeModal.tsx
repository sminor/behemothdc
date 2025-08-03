import React from 'react';
import { TableOfContents, Content } from '@/components/TableOfContents'; // Adjust import path as needed

const conductCodeInfo: Content[] = [
  {
    id: "introduction",
    title: "Introduction",
    content: (
      <p>
        At Jaymar Darts, we are committed to fostering a welcoming, inclusive, and enjoyable environment for all players. Our Code of Conduct sets the expectations for behavior, sportsmanship, and respect at all our events.
      </p>
    ),
  },
  {
    id: "respect-inclusion",
    title: "Respect and Inclusion",
    content: (
      <p>
        We expect all participants to treat each other with respect, regardless of skill level, gender, race, religion, or any other personal characteristic. Discriminatory, harassing, or offensive behavior will not be tolerated. Our tournament operators are dedicated volunteers—please show them the same respect you would expect in return.
      </p>
    ),
  },
  {
    id: "sportsmanship-fair-play",
    title: "Sportsmanship and Fair Play",
    content: (
      <p>
        Good sportsmanship is fundamental to our community. Play by the rules, demonstrate grace in both victory and defeat, and always show respect to your teammates and opponents. Cheating or any attempt to gain an unfair advantage is strictly prohibited and may result in disqualification.
      </p>
    ),
  },
  {
    id: "rule-compliance",
    title: "Rule Compliance",
    content: (
      <p>
        All players are responsible for understanding and adhering to the official rules of play. If you have any questions, please ask a tournament operator. Our tournament operators will make decisions in the spirit of fair play, and their decisions are final, intended to keep the tournament fair and fun for everyone.
      </p>
    ),
  },
  {
    id: "conflict-resolution",
    title: "Conflict Resolution",
    content: (
      <p>
        If any concerns or issues arise during the event, please bring them to the attention of a tournament operator. We are here to help resolve matters quickly and fairly to ensure the best experience for all.
      </p>
    ),
  },
  {
    id: "enjoy-the-game",
    title: "Enjoy the Game",
    content: (
      <>
        <p>
          Most importantly, remember that we are all here to have fun and enjoy the game of darts. A positive attitude and good sportsmanship help create a great experience for everyone!
        </p>
        <p>
          By participating in Jaymar Darts events, you agree to abide by this Code of Conduct. We appreciate your cooperation in making our tournaments safe, respectful, and enjoyable for all.
        </p>
      </>
    ),
  },
];

export const ConductCodeModal: React.FC = () => {
  return <TableOfContents items={conductCodeInfo} />;
};

export default ConductCodeModal;