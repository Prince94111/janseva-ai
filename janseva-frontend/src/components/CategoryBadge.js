import React from 'react';
import './CategoryBadge.css';

const CATEGORY_STYLES = {
  'Road Damage':    { border: '#7A4500', color: '#A06020' },
  'Women Safety':   { border: '#5B1A7A', color: '#7A3AAA' },
  'Tourist Crowd':  { border: '#0A5E70', color: '#1A82A0' },
  'Pilgrimage':     { border: '#7A4500', color: '#C07020' },
  'Wild Animal':    { border: '#1A5C30', color: '#2D8A50' },
  'Encroachment':   { border: '#6B2810', color: '#A04830' },
  'Garbage':        { border: '#3A3A44', color: '#606070' },
  'Water Supply':   { border: '#1A3A7A', color: '#2A5AB0' },
};

function CategoryBadge({ category }) {
  const style = CATEGORY_STYLES[category] || { border: '#555555', color: '#888888' };

  return (
    <span
      className="category-badge"
      style={{
        borderColor: style.border,
        color: style.color,
      }}
    >
      {category}
    </span>
  );
}

export default CategoryBadge;
