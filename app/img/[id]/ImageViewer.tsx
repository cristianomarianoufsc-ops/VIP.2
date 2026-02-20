'use client';

import { useState } from 'react';

interface ImageViewerProps {
  imageUrl: string;
  fileName: string;
}

export default function ImageViewer({ imageUrl, fileName }: ImageViewerProps) {
  const [isPressed, setIsPressed] = useState(false);

  const handlePressStart = () => setIsPressed(true);
  const handlePressEnd = () => setIsPressed(false);

  return (
    <div 
      style={{ 
        backgroundColor: 'black', 
        margin: 0, 
        padding: 0, 
        height: '100vh', 
        width: '100vw', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        overflow: 'hidden',
        position: 'fixed',
        top: 0,
        left: 0,
        userSelect: 'none',
        WebkitUserSelect: 'none',
        touchAction: 'none'
      }}
      onMouseDown={handlePressStart}
      onMouseUp={handlePressEnd}
      onMouseLeave={handlePressEnd}
      onTouchStart={handlePressStart}
      onTouchEnd={handlePressEnd}
      onContextMenu={(e) => e.preventDefault()}
    >
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', maxWidth: '100%', maxHeight: '100%' }}>
        <img 
          src={imageUrl} 
          alt={fileName} 
          style={{ 
            maxWidth: '100%', 
            maxHeight: '100%', 
            objectFit: 'contain',
            display: 'block',
            pointerEvents: 'none',
            filter: isPressed ? 'none' : 'blur(40px)',
            transition: 'filter 0.15s ease-in-out',
            transform: 'scale(1.02)'
          }}
        />
        
        {/* Marca d'água de texto permanente */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          flexWrap: 'wrap',
          alignContent: 'center',
          justifyContent: 'center',
          pointerEvents: 'none',
          zIndex: 10,
          overflow: 'hidden',
          opacity: 0.3
        }}>
          {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} style={{
              margin: '20px',
              transform: 'rotate(-45deg)',
              color: 'white',
              fontSize: '24px',
              fontWeight: 'bold',
              whiteSpace: 'nowrap',
              fontFamily: 'sans-serif',
              textTransform: 'uppercase'
            }}>
              VIP IMAGE HOST
            </div>
          ))}
        </div>
        
        {!isPressed && (
          <div style={{
            position: 'absolute',
            zIndex: 15,
            color: 'white',
            backgroundColor: 'rgba(0,0,0,0.6)',
            padding: '12px 24px',
            borderRadius: '30px',
            fontFamily: 'sans-serif',
            fontSize: '16px',
            fontWeight: 'bold',
            pointerEvents: 'none',
            textAlign: 'center',
            border: '1px solid rgba(255,255,255,0.2)',
            boxShadow: '0 4px 15px rgba(0,0,0,0.5)'
          }}>
            Pressione para visualizar
          </div>
        )}
      </div>
    </div>
  );
}
