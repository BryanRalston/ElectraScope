import React, { useRef } from 'react';
import { saveModel, deleteModel } from '../storage';

export default function ModelImport({ room, onUpdate, flash }) {
  const fileRef = useRef(null);

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const buffer = await file.arrayBuffer();
      const blobKey = 'model_' + room.id;
      await saveModel(blobKey, buffer);

      const model = {
        blobKey,
        fileName: file.name,
        format: file.name.split('.').pop().toLowerCase(),
        fileSize: file.size,
        importedAt: new Date().toISOString()
      };

      onUpdate({ ...room, model });
      flash('3D model imported');
    } catch (err) {
      flash('Failed to import model: ' + err.message);
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
      <button className="btn-outline" onClick={() => fileRef.current.click()}>
        🏗 Import 3D Model
      </button>
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
