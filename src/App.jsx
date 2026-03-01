import React, { useState, useEffect, useCallback } from 'react';
import { listProjects, saveProject, deleteProject } from './storage';
import { uid } from './constants';
import ProjectList from './components/ProjectList';
import ProjectView from './components/ProjectView';
import RoomEditor from './components/RoomEditor';
import FloorPlanEditor from './components/FloorPlanEditor';
import ScopeView from './components/ScopeView';
import PrintView from './components/PrintView';
import { DeleteConfirm, Toast } from './components/ui';

export default function App() {
  const [projects, setProjects] = useState([]);
  const [proj, setProj] = useState(null);
  const [room, setRoom] = useState(null);
  const [view, setView] = useState('projects');
  const [toast, setToast] = useState('');
  const [delTarget, setDelTarget] = useState(null);

  useEffect(() => {
    setProjects(listProjects());
  }, []);

  const flash = useCallback((msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2200);
  }, []);

  const refreshProjects = useCallback(() => {
    setProjects(listProjects());
  }, []);

  const updateProj = useCallback((updated) => {
    saveProject(updated);
    setProj(updated);
    refreshProjects();
  }, [refreshProjects]);

  const updateRoom = useCallback((updated) => {
    if (!proj) return;
    const rooms = proj.rooms.map(r => r.id === updated.id ? updated : r);
    const newProj = { ...proj, rooms };
    updateProj(newProj);
    setRoom(updated);
  }, [proj, updateProj]);

  const handleBack = () => {
    if (view === 'canvas') {
      setView('room');
    } else if (view === 'room') {
      setView('project');
    } else if (view === 'project' || view === 'scope' || view === 'print') {
      setView('projects');
      setProj(null);
      setRoom(null);
    }
  };

  const handleDeleteConfirm = () => {
    if (!delTarget) return;
    if (delTarget.type === 'project') {
      deleteProject(delTarget.id);
      refreshProjects();
      if (proj && proj.id === delTarget.id) {
        setProj(null);
        setRoom(null);
        setView('projects');
      }
      flash('Project deleted');
    } else if (delTarget.type === 'room' && proj) {
      const rooms = proj.rooms.filter(r => r.id !== delTarget.id);
      const newProj = { ...proj, rooms };
      updateProj(newProj);
      if (room && room.id === delTarget.id) {
        setRoom(null);
        setView('project');
      }
      flash('Room deleted');
    }
    setDelTarget(null);
  };

  const viewTitle = () => {
    switch (view) {
      case 'projects': return null;
      case 'project': return proj?.name;
      case 'room': return room?.name;
      case 'canvas': return room?.name + ' - Floor Plan';
      case 'scope': return 'Scope of Work';
      case 'print': return 'Print Preview';
      default: return null;
    }
  };

  const showBack = view !== 'projects';

  return (
    <div className="app">
      <header className="header no-print">
        <div className="header-inner">
          <div className="header-left">
            {showBack && (
              <button className="back-btn" onClick={handleBack}>
                &larr;
              </button>
            )}
            <div className="logo" onClick={() => { setView('projects'); setProj(null); setRoom(null); }}>
              <span className="logo-text">ElectraScope</span>
              <span className="logo-sub">Electrical Planning</span>
            </div>
          </div>
          {viewTitle() && <div className="header-title">{viewTitle()}</div>}
        </div>
      </header>

      <main className="main">
        {view === 'projects' && (
          <ProjectList
            projects={projects}
            onSelect={(p) => { setProj(p); setView('project'); }}
            onCreated={(p) => {
              saveProject(p);
              refreshProjects();
              setProj(p);
              setView('project');
              flash('Project created');
            }}
            onDelete={(id) => setDelTarget({ type: 'project', id, name: projects.find(p => p.id === id)?.name })}
            onImport={(p) => {
              const imported = { ...p, id: uid(), imported: true };
              saveProject(imported);
              refreshProjects();
              flash('Project imported');
            }}
            flash={flash}
          />
        )}

        {view === 'project' && proj && (
          <ProjectView
            project={proj}
            onUpdate={updateProj}
            onSelectRoom={(r) => { setRoom(r); setView('room'); }}
            onDeleteRoom={(id) => setDelTarget({ type: 'room', id, name: proj.rooms.find(r => r.id === id)?.name })}
            onScope={() => setView('scope')}
            onPrint={() => setView('print')}
            flash={flash}
          />
        )}

        {view === 'room' && room && (
          <RoomEditor
            room={room}
            onUpdate={updateRoom}
            onCanvas={() => setView('canvas')}
            flash={flash}
          />
        )}

        {view === 'canvas' && room && (
          <FloorPlanEditor
            room={room}
            onUpdate={updateRoom}
            flash={flash}
          />
        )}

        {view === 'scope' && proj && (
          <ScopeView
            project={proj}
            onPrint={() => setView('print')}
          />
        )}

        {view === 'print' && proj && (
          <PrintView
            project={proj}
            onClose={() => setView('scope')}
          />
        )}
      </main>

      <Toast message={toast} />

      {delTarget && (
        <DeleteConfirm
          name={delTarget.name || 'this item'}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDelTarget(null)}
        />
      )}
    </div>
  );
}
