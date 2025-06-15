import React from 'react';

export const MaterialIcon = ({ iconName, className = "text-primary" }) => (
  <span className={`material-icons-outlined ${className}`}>
    {iconName}
  </span>
);