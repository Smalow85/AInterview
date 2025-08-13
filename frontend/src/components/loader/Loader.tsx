import React from 'react';
import './Loader.scss'; // Assuming you have a Loader.scss file

const Loader: React.FC = () => {
  return (
    <div className="loader-container">
      <div className="loader"></div>
    </div>
  );
};

export default Loader;