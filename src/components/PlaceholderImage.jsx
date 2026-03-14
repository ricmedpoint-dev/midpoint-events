/**
 * Placeholder image component used until real images are added.
 * Renders a colored rectangle or circle with a label.
 */
export default function PlaceholderImage({ width, height, label, circle, className, style }) {
  const baseStyle = {
    width: width || '100%',
    height: height || '100%',
    borderRadius: circle ? '50%' : '12px',
    background: 'linear-gradient(135deg, #E9ECEF 0%, #DEE2E6 50%, #CED4DA 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#868E96',
    fontSize: '0.75rem',
    fontWeight: 500,
    textAlign: 'center',
    padding: '4px',
    overflow: 'hidden',
    flexShrink: 0,
    ...style,
  };

  return (
    <div className={className} style={baseStyle}>
      {label || 'Image'}
    </div>
  );
}
