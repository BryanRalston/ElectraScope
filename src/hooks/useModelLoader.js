import { useState, useEffect } from 'react';
import { getModel } from '../storage';

export default function useModelLoader(room, onClearModel) {
  const [url, setUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const modelInfo = room?.model;

  useEffect(() => {
    if (!modelInfo?.blobKey) {
      setUrl(null);
      return;
    }

    let objectUrl = null;
    setLoading(true);
    setError(null);

    getModel(modelInfo.blobKey)
      .then(buffer => {
        if (!buffer) {
          setError('Model file not found in storage');
          setLoading(false);
          return;
        }
        const mimeType = modelInfo.format === 'obj' ? 'text/plain' : 'model/gltf-binary';
        const blob = new Blob([buffer], { type: mimeType });
        objectUrl = URL.createObjectURL(blob);
        setUrl(objectUrl);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message || 'Failed to load model');
        setLoading(false);
        // Clear bad model metadata so user isn't stuck on revisit
        if (onClearModel) onClearModel();
      });

    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [modelInfo?.blobKey]);

  return { url, loading, error, format: modelInfo?.format };
}
