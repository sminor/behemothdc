import React, { useState, useRef, useEffect } from 'react';
import Button from '@/components/Button';
import { FaArrowLeft, FaArrowRight } from 'react-icons/fa';

export interface Content {
  id: string;
  title: string;
  content: React.ReactNode;
}

interface TableOfContentsProps {
  items: Content[];
}

export const TableOfContents: React.FC<TableOfContentsProps> = ({ items }) => {
  const [currentTOCIndex, setCurrentTOCIndex] = useState<number>(0);
  const tocRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    const selectedTOC = items[currentTOCIndex];
    const targetElement = tocRefs.current[selectedTOC.id];
    if (targetElement) {
      targetElement.scrollIntoView({ behavior: "smooth", block: "start" });
      targetElement.focus();
    }
  }, [currentTOCIndex, items]);

  return (
    <div className="p-4">
      <ul className=''>
        {items.map((toc, index) => (
          <li key={toc.id}>
            <button
              className={`text-[var(--text-link)] text-left hover:underline ${currentTOCIndex === index ? "font-bold underline" : ""}`}
              onClick={() => setCurrentTOCIndex(index)}
              aria-current={currentTOCIndex === index ? "true" : undefined}
            >
              {toc.title}
            </button>
          </li>
        ))}
      </ul>
      <hr />
      <div
        key={items[currentTOCIndex].id}
        ref={(el) => {
          tocRefs.current[items[currentTOCIndex].id] = el; // No return value
        }}
      >
        <h3 id={items[currentTOCIndex].id} tabIndex={-1} className="text-lg font-semibold">
          {items[currentTOCIndex].title}
        </h3>
        <div>{items[currentTOCIndex].content}</div>
      </div>
      <div className="flex justify-center gap-4 mt-4">
        <Button
          onClick={() => setCurrentTOCIndex((prev) => Math.max(prev - 1, 0))}
          className="p-2 rounded w-10 h-10 flex items-center justify-center disabled:opacity-50"
          disabled={currentTOCIndex === 0}
        >
          <FaArrowLeft />
        </Button>
        <Button
          onClick={() => setCurrentTOCIndex((prev) => Math.min(prev + 1, items.length - 1))}
          className="p-2 rounded w-10 h-10 flex items-center justify-center disabled:opacity-50"
          disabled={currentTOCIndex === items.length - 1}
        >
          <FaArrowRight />
        </Button>
      </div>
    </div>
  );
};