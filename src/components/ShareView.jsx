import React from 'react';
import ScopeView from './ScopeView';

export default function ShareView({ project }) {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="app">
      <header className="header">
        <div className="header-inner">
          <div className="header-left">
            <div className="logo">
              <span className="logo-text">ElectraScope</span>
              <span className="logo-sub">Shared Project</span>
            </div>
          </div>
          <button className="btn-primary no-print" onClick={handlePrint}>Print</button>
        </div>
      </header>

      <main className="main">
        <ScopeView project={project} onPrint={null} />
        <div className="share-footer">
          <p className="meta">Shared via ElectraScope &mdash; Electrical Planning Tool</p>
        </div>
      </main>
    </div>
  );
}
