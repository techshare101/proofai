import React from 'react';
import Recorder from '../components/Recorder';

const HomePage: React.FC = () => {
  return (
    <div className="container">
      <h1>ProofAI</h1>
      <Recorder />
    </div>
  );
};

export default HomePage;
