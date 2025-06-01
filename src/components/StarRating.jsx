import React from 'react';
import { Star } from 'lucide-react'; // Ensure lucide-react is installed

const StarRating = ({ average, votes }) => {
  const filledStars = Math.round(average); // Assuming average is out of 5

  return (
    <div className="flex items-center">
      {[...Array(5)].map((_, index) => (
        <Star
          key={index}
          className={`h-4 w-4 ${index < filledStars ? 'text-yellow-500' : 'text-gray-300'
            }`}
          fill={index < filledStars ? 'yellow' : 'none'}
        />
      ))}
      {votes !== undefined && (
        <span className="ml-2 text-sm text-muted-foreground">
          ({votes} {votes === 1 ? 'vote' : 'votes'})
        </span>
      )}
    </div>
  );
};

export default StarRating;

// Ensure lucide-react is installed: npm install lucide-react
// Or: yarn add lucide-react