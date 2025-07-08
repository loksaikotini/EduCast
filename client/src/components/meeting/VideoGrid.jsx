import React from 'react';
import Video from './Video';

const getGridCols = (count) => {
  if (count <= 1) return 'grid-cols-1';
  if (count === 2) return 'grid-cols-1 md:grid-cols-2';
  if (count <= 4) return 'grid-cols-2';
  if (count <= 6) return 'grid-cols-2 md:grid-cols-3';
  if (count <= 9) return 'grid-cols-3';
  return 'grid-cols-3 md:grid-cols-4';
};

const VideoGrid = ({ userVideoRef, peers, peersRef, localVideoState }) => {
  const { videoOff, screenSharing } = localVideoState;

  return (
    <div className={`grid gap-2 p-2 sm:gap-4 sm:p-4 flex-grow ${getGridCols(peers.length + 1)} items-center justify-center content-start`}>
      <Video ref={userVideoRef} isLocal={true} videoOff={videoOff && !screenSharing} muted={true} />
      {peers.map((peer) => {
        const pRef = peersRef.current.find(p => p.peer === peer);
        return <Video key={pRef?.peerID || Math.random()} peer={peer} />;
      })}
    </div>
  );
};

export default VideoGrid;