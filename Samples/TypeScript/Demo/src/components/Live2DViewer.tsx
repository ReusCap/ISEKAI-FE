import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import JSZip from 'jszip';
import { useLive2D } from '../hooks/useLive2D';
import { useLive2DAudio } from '../hooks/useLive2DAudio'; // 추가
import { LAppDelegate } from '../live2d-library/lappdelegate'; // 추가
import { Live2DModelConfig } from '../live2d-library/lapplive2dmanager';

interface Live2DViewerProps {
  modelUrl: string;
  modelConfig?: Live2DModelConfig;
  webSocketUrl?: string;
}

const Live2DViewer = ({ modelUrl, modelConfig, webSocketUrl }: Live2DViewerProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [resources, setResources] = useState<Map<string, ArrayBuffer> | undefined>(undefined);
  const [modelInfo, setModelInfo] = useState<{ path: string; fileName: string } | null>(null);

  // 1. WebSocket 및 오디오 초기화
  const { isConnected, getCurrentRms } = useLive2DAudio(webSocketUrl || '');

  // 2. ZIP 파일 로드 (기존 로직 동일)
  useEffect(() => {
    const fetchZip = async () => {
      if (!modelUrl) return;
      try {
        const response = await axios.get(modelUrl, { responseType: 'arraybuffer' });
        const zip = await JSZip.loadAsync(response.data);
        const resMap = new Map<string, ArrayBuffer>();
        let fullModel3Path = '';

        for (const filePath of Object.keys(zip.files)) {
          if (zip.files[filePath].dir) continue;
          const content = await zip.files[filePath].async('arraybuffer');
          resMap.set(filePath, content);
          if (filePath.endsWith('.model3.json')) fullModel3Path = filePath;
        }

        let rootDir = '';
        let fileName = fullModel3Path;
        const parts = fullModel3Path.split('/');
        if (parts.length > 1) {
          rootDir = parts.slice(0, parts.length - 1).join('/') + '/';
          fileName = parts[parts.length - 1];
        }

        setResources(resMap);
        setModelInfo({ path: rootDir, fileName: fileName });
      } catch (error) {
        console.error('[Live2DViewer] Failed to load zip:', error);
      }
    };
    fetchZip();
  }, [modelUrl]);

  // 3. Live2D 매니저 초기화
  const { manager } = useLive2D({
    containerRef,
    modelConfig,
    modelPath: modelInfo?.path || '',
    modelFileName: modelInfo?.fileName || '',
    resources: resources
  });

  // 4. 실시간 립싱크 적용
  useEffect(() => {
    if (!manager || !isConnected) return;

    const updateLipSync = () => {
      const rms = getCurrentRms(); // 실시간 볼륨 값
      LAppDelegate.getInstance().setLipSyncValue(rms); // 모델 입 모양 업데이트
      requestAnimationFrame(updateLipSync);
    };

    const requestId = requestAnimationFrame(updateLipSync);
    return () => cancelAnimationFrame(requestId);
  }, [manager, isConnected, getCurrentRms]);

  return <div ref={containerRef} style={{ width: '100%', height: '100%', position: 'relative' }} />;
};

export default Live2DViewer;