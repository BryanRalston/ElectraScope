import React, { useRef, useState } from 'react';
import { saveModel, deleteModel } from '../storage';

export default function ModelImport({ room, onUpdate, flash }) {
  const fileRef = useRef(null);
  const [importing, setImporting] = useState(false);

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const MAX_SIZE = 50 * 1024 * 1024; // 50MB
    if (file.size > MAX_SIZE) {
      flash(`Model too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Maximum is 50MB.`);
      e.target.value = '';
      return;
    }

    const ext = file.name.split('.').pop().toLowerCase();
    if (!['glb', 'gltf', 'obj'].includes(ext)) {
      flash('Unsupported format. Use GLB, GLTF, or OBJ files.');
      e.target.value = '';
      return;
    }

    setImporting(true);
    try {
      const buffer = await file.arrayBuffer();
      const blobKey = 'model_' + room.id;
      await saveModel(blobKey, buffer);

      const model = {
        blobKey,
        fileName: file.name,
        format: ext,
        fileSize: file.size,
        importedAt: new Date().toISOString()
      };

      onUpdate({ ...room, model });
      flash('3D model imported');
    } catch (err) {
      // Clean up partial state
      try { await deleteModel('model_' + room.id); } catch (_) {}
      flash('Failed to import model: ' + err.message);
    } finally {
      setImporting(false);
    }

    // Reset input so the same file can be re-selected
    e.target.value = '';
  };

  const handleRemove = async () => {
    try {
      await deleteModel(room.model.blobKey);
      onUpdate({ ...room, model: null });
      flash('3D model removed');
    } catch (err) {
      flash('Failed to remove model: ' + err.message);
    }
  };

  if (room.model) {
    return (
      <div className="model-import-status">
        <span className="model-filename">{room.model.fileName}</span>
        <button className="btn-small" onClick={handleRemove}>Remove</button>
      </div>
    );
  }

  return (
    <>
      <button className="btn-outline" onClick={() => fileRef.current.click()} disabled={importing}>
        {importing ? 'Importing...' : 'Import 3D Model'}
      </button>
      <span className="meta" style={{ fontSize: 11, marginLeft: 8 }}>GLB/GLTF recommended</span>
      <input
        ref={fileRef}
        type="file"
        accept=".glb,.gltf,.obj"
        style={{ display: 'none' }}
        onChange={handleFile}
      />
    </>
  );
}
